export interface Point {
  x: number
  y: number
}

// View transform: screen = world * k + (x, y).
export interface View {
  k: number
  x: number
  y: number
}

// Zoom limits from docs/role.md section 4.1.
export const MIN_ZOOM = 0.4
export const MAX_ZOOM = 2
export const ZOOM_STEP = 1.25

// Center of the seed layout in world units.
export const WORLD_CENTER: Point = { x: 284, y: 179 }

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

export function screenToWorld(view: View, point: Point): Point {
  return { x: (point.x - view.x) / view.k, y: (point.y - view.y) / view.k }
}

// Zooms around an anchor point so that the world point under the anchor stays under it.
export function zoomAt(view: View, anchor: Point, nextZoom: number): View {
  const k = clampZoom(nextZoom)
  const world = screenToWorld(view, anchor)
  return { k, x: anchor.x - world.x * k, y: anchor.y - world.y * k }
}

// View that places the target world point at the center of a canvas of the given size.
export function centerView(width: number, height: number, target: Point = WORLD_CENTER, k = 1): View {
  return { k, x: width / 2 - target.x * k, y: height / 2 - target.y * k }
}

// View that shows all the points. It zooms out only when they do not fit, and never zooms in past 100%.
// The margin keeps the outer circles and their labels inside the canvas.
export function fitView(width: number, height: number, points: Point[], margin = 90): View {
  if (points.length === 0) {
    return centerView(width, height)
  }
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs) - margin
  const maxX = Math.max(...xs) + margin
  const minY = Math.min(...ys) - margin
  // A little more room at the bottom, for the zoom controls.
  const maxY = Math.max(...ys) + margin + 50
  const fit = Math.min(1, width / (maxX - minX), height / (maxY - minY))
  const target = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  return centerView(width, height, target, clampZoom(fit))
}

export function zoomPercent(k: number): number {
  return Math.round(k * 100)
}

export type Direction = 'up' | 'down' | 'left' | 'right'

// Picks the nearest topic in a direction, favouring topics that are straight ahead.
export function neighborInDirection(
  fromId: string,
  direction: Direction,
  positions: Record<string, Point>,
): string | null {
  const origin = positions[fromId]
  if (!origin) {
    return null
  }
  const horizontal = direction === 'left' || direction === 'right'
  const sign = direction === 'left' || direction === 'up' ? -1 : 1

  let best: string | null = null
  let bestScore = Infinity
  for (const [id, point] of Object.entries(positions)) {
    if (id === fromId) {
      continue
    }
    const dx = point.x - origin.x
    const dy = point.y - origin.y
    const along = (horizontal ? dx : dy) * sign
    if (along <= 0) {
      continue
    }
    const across = horizontal ? Math.abs(dy) : Math.abs(dx)
    const score = along + across * 2
    if (score < bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}
