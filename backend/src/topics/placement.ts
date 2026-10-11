// Where a new topic appears on the Learning canvas. Coordinates use the same space as the default graph (defaultGraph.ts).
const CENTER = { x: 280, y: 170 }
// Two topics closer than this would overlap, since a circle is about 60 units across.
const MIN_DISTANCE = 60
const RING_STEP = 50
const MAX_RINGS = 20

// The first free spot on rings around the middle of the canvas. Without this, every new topic would be stored
// at (0, 0) and sit on top of the others.
export function freePosition(existing: { x: number; y: number }[]): { x: number; y: number } {
  for (let ring = 0; ring < MAX_RINGS; ring++) {
    const slots = Math.max(1, ring * 6)
    for (let slot = 0; slot < slots; slot++) {
      const angle = (2 * Math.PI * slot) / slots
      const x = Math.round(CENTER.x + ring * RING_STEP * Math.cos(angle))
      const y = Math.round(CENTER.y + ring * RING_STEP * Math.sin(angle))
      if (existing.every((point) => Math.hypot(point.x - x, point.y - y) >= MIN_DISTANCE)) {
        return { x, y }
      }
    }
  }
  // Only reached with a very large number of topics. The overlap is then accepted.
  return CENTER
}
