// Geometry of the roadmap: a road that winds from left to right, with a pin above every stop and the step's card below.
// Coordinates are in the drawing's own units. The drawing is wider than the screen when there are many steps,
// and the roadmap scrolls sideways.

export const STEP_WIDTH = 220
export const DRAWING_HEIGHT = 430
const FIRST_X = 110
const CENTER_Y = 200
const WAVE = 46
const LEAD = 60
const LABEL_TOP = 300

export interface RoadPoint {
  x: number
  y: number
}

// The stops of the road, one per step. They alternate between the upper and lower bend.
export function stopPoints(count: number): RoadPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    x: FIRST_X + index * STEP_WIDTH,
    y: CENTER_Y + (index % 2 === 0 ? -WAVE / 2 : WAVE / 2),
  }))
}

// Width of the whole drawing for `count` stops, including a lead-in and a lead-out for the road.
export function drawingWidthOf(count: number): number {
  return FIRST_X + Math.max(count - 1, 0) * STEP_WIDTH + STEP_WIDTH / 2 + LEAD
}

// Where the label block of a stop starts, below the road.
export function labelTopOf(): number {
  return LABEL_TOP
}

// The road as an SVG path: a smooth curve through the points (Catmull-Rom turned into cubic Bezier segments).
export function roadPathOf(points: RoadPoint[]): string {
  if (points.length < 2) {
    return ''
  }
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[Math.max(index - 1, 0)]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[Math.min(index + 2, points.length - 1)]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    path += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return path
}

// The points the road passes through: a lead-in, every stop, and a lead-out.
export function roadPointsOf(count: number): RoadPoint[] {
  const stops = stopPoints(count)
  const width = drawingWidthOf(count)
  return [{ x: 0, y: CENTER_Y }, ...stops, { x: width, y: CENTER_Y }]
}
