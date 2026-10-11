import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { TopicStatus } from '../../domain/topicStatus'
import { TOPIC_VISUALS } from './topicVisual'

// Sample circles on an empty canvas, in the colors of the legend. They have no text and no icons.
// Every circle can be dragged, and the others move out of its way, the same as on the real canvas (docs/role.md 4.1).
// Nothing is saved and clicking does nothing else. They are an example, not data.
interface SampleNode {
  status: TopicStatus
  x: number
  y: number
  radius: number
}

const WIDTH = 340
const HEIGHT = 220
// Space kept between two circles, so they never touch.
const GAP = 10
// How many passes it takes to push circles apart. Each pass settles more of them.
const PASSES = 10

// Positions are uneven on purpose, so the sample looks like a hand-arranged canvas.
const NODES: SampleNode[] = [
  { status: 'BARU', x: 58, y: 58, radius: 24 },
  { status: 'DIKUASAI', x: 168, y: 46, radius: 26 },
  { status: 'SEDANG', x: 282, y: 70, radius: 30 },
  { status: 'PERLU_DIULANG', x: 74, y: 162, radius: 24 },
  { status: 'BELUM_DIBUKA', x: 184, y: 166, radius: 24 },
  { status: 'SARAN', x: 288, y: 172, radius: 22 },
]

const LINKS: { from: number; to: number; suggested: boolean }[] = [
  { from: 0, to: 1, suggested: false },
  { from: 1, to: 2, suggested: false },
  { from: 0, to: 3, suggested: false },
  { from: 1, to: 4, suggested: false },
  { from: 4, to: 5, suggested: true },
  { from: 2, to: 5, suggested: true },
]

interface Point {
  x: number
  y: number
}

function insideSample(point: Point, radius: number): Point {
  return {
    x: Math.min(WIDTH - radius - 4, Math.max(radius + 4, point.x)),
    y: Math.min(HEIGHT - radius - 4, Math.max(radius + 4, point.y)),
  }
}

// Places the dragged circle where the pointer is, and pushes every other circle that it overlaps.
// The dragged circle itself never moves away. Other circles stop at the edges of the sample.
function settle(points: Point[], dragged: number, pointer: Point): Point[] {
  const next = points.map((point) => ({ ...point }))
  next[dragged] = insideSample(pointer, NODES[dragged].radius)
  for (let pass = 0; pass < PASSES; pass++) {
    let pushed = false
    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        const a = next[i]
        const b = next[j]
        const minDistance = NODES[i].radius + NODES[j].radius + GAP
        let dx = b.x - a.x
        let dy = b.y - a.y
        let distance = Math.hypot(dx, dy)
        if (distance >= minDistance) {
          continue
        }
        if (distance < 0.001) {
          dx = 1
          dy = 0
          distance = 1
        }
        const ux = dx / distance
        const uy = dy / distance
        const overlap = minDistance - distance
        if (i === dragged) {
          b.x += ux * overlap
          b.y += uy * overlap
        } else if (j === dragged) {
          a.x -= ux * overlap
          a.y -= uy * overlap
        } else {
          a.x -= (ux * overlap) / 2
          a.y -= (uy * overlap) / 2
          b.x += (ux * overlap) / 2
          b.y += (uy * overlap) / 2
        }
        pushed = true
      }
    }
    for (let k = 0; k < next.length; k++) {
      if (k !== dragged) {
        next[k] = insideSample(next[k], NODES[k].radius)
      }
    }
    if (!pushed) {
      break
    }
  }
  return next
}

export function EmptyCanvasIllustration() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [points, setPoints] = useState<Point[]>(() => NODES.map((node) => ({ x: node.x, y: node.y })))
  const [dragging, setDragging] = useState<number | null>(null)

  // Converts the pointer position to sample units, so the circle follows the pointer at any size.
  function toSamplePoint(event: ReactPointerEvent<SVGGElement>): Point | null {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) {
      return null
    }
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const inSample = point.matrixTransform(matrix.inverse())
    return { x: inSample.x, y: inSample.y }
  }

  function startDrag(index: number, event: ReactPointerEvent<SVGGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(index)
  }

  function moveDrag(index: number, event: ReactPointerEvent<SVGGElement>) {
    if (dragging !== index) {
      return
    }
    const pointer = toSamplePoint(event)
    if (pointer) {
      setPoints((current) => settle(current, index, pointer))
    }
  }

  function endDrag(event: ReactPointerEvent<SVGGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(null)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full touch-none select-none"
    >
      {LINKS.map((link) => {
        const from = points[link.from]
        const to = points[link.to]
        return (
          <line
            key={`${link.from}-${link.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={link.suggested ? '#C4B5FD' : '#CBD5E1'}
            strokeWidth={1.5}
            strokeDasharray={link.suggested ? '4 3' : undefined}
          />
        )
      })}
      {NODES.map((node, index) => {
        const point = points[index]
        const visual = TOPIC_VISUALS[node.status]
        const isDragging = dragging === index
        return (
          <g
            key={node.status}
            data-sample={node.status}
            style={{ pointerEvents: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={(event) => startDrag(index, event)}
            onPointerMove={(event) => moveDrag(index, event)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <g
              className={isDragging ? undefined : 'topic-idle'}
              style={isDragging ? undefined : { animationDelay: `${index * 0.6}s`, animationDuration: `${5 + index * 0.7}s` }}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={node.radius}
                fill={visual.fill}
                stroke={visual.stroke}
                strokeWidth={visual.strokeWidth}
                strokeDasharray={visual.dashed ? '4 3' : undefined}
              />
            </g>
          </g>
        )
      })}
    </svg>
  )
}
