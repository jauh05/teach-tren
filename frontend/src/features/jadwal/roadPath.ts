// Geometry of the roadmap drawing: a winding road from the top to the bottom, with numbered stops along it.
// The coordinates are in the road's own view box. Labels sit left or right of the road, alternating by stop.

export const ROAD_VIEW = { width: 360, height: 600 } as const

const ROAD_TOP = 36
const ROAD_BOTTOM = ROAD_VIEW.height - 36
const CENTER_X = ROAD_VIEW.width / 2
const BEND = 34
const BENDS = 1.5

export interface RoadPoint {
  x: number
  y: number
}

export interface RoadStop extends RoadPoint {
  // Labels go to the left or the right of the road, alternating from the top.
  side: 'left' | 'right'
}

// A point on the road's center line. t runs from 0 at the top to 1 at the bottom.
export function roadCenterAt(t: number): RoadPoint {
  return {
    x: CENTER_X + BEND * Math.sin(t * Math.PI * 2 * BENDS),
    y: ROAD_TOP + t * (ROAD_BOTTOM - ROAD_TOP),
  }
}

// The center line as an SVG path, sampled finely enough that the bends look smooth.
export function roadPath(samples = 90): string {
  const points = Array.from({ length: samples + 1 }, (_, index) => roadCenterAt(index / samples))
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
}

// Stops are spread evenly between 12% and 88% of the road, so the first and last labels fit in the view box.
export function stopsOf(count: number): RoadStop[] {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : 0.12 + (index / (count - 1)) * 0.76
    return { ...roadCenterAt(t), side: index % 2 === 0 ? 'right' : 'left' }
  })
}
