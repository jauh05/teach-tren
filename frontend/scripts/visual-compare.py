"""Compares the screenshots from e2e/visual.spec.ts with the mockups (docs/role.md CC-11).

A pixel counts as different when one of its color channels differs by more than CHANNEL_TOLERANCE.
A screen passes when at most PIXEL_TOLERANCE of its pixels are different (3 percent).

Needs Pillow:  pip install pillow
Usage:         python3 scripts/visual-compare.py [test-results/visual] [> report.json]
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

CHANNEL_TOLERANCE = 24
PIXEL_TOLERANCE = 0.03


def differing_share(app_path: Path, mockup_path: Path) -> tuple[float, tuple[int, int], tuple[int, int]]:
    app = Image.open(app_path).convert("RGB")
    mockup = Image.open(mockup_path).convert("RGB")
    sizes = (app.size, mockup.size)
    if mockup.size != app.size:
        # Both are captured at the same viewport, so this only happens if a mockup is cut differently.
        mockup = mockup.resize(app.size)
    channel_diff = ImageChops.difference(app, mockup).convert("L")
    mask = channel_diff.point(lambda value: 255 if value > CHANNEL_TOLERANCE else 0)
    changed = mask.histogram()[255]
    total = app.size[0] * app.size[1]
    return changed / total, sizes[0], sizes[1]


def main() -> None:
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else "test-results/visual")
    results = []
    for app_path in sorted(folder.glob("*.png")):
        if app_path.name.startswith("mockup-"):
            continue
        mockup_path = folder / f"mockup-{app_path.name}"
        if not mockup_path.exists():
            continue
        share, app_size, mockup_size = differing_share(app_path, mockup_path)
        results.append(
            {
                "screen": app_path.stem,
                "differingPercent": round(share * 100, 2),
                "pass": share <= PIXEL_TOLERANCE,
                "appSize": list(app_size),
                "mockupSize": list(mockup_size),
            }
        )
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
