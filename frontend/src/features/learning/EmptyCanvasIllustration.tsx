import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { TopicStatus } from '../../domain/topicStatus'
import { TOPIC_VISUALS } from './topicVisual'

// Sample circles on an empty canvas, in the colors and with the icons of the legend. They have no text.
// Dragging any circle moves the whole sample together, so the links and the layout stay as they are.
// Nothing is saved and clicking does nothing else. They are an example, not data.
interface SampleNode {
  status: TopicStatus
  x: number
  y: number
  radius: number
  score?: number
}

const WIDTH = 340
const HEIGHT = 220
// Space kept between the sample and its edges.
const PAD = 4

// Positions are uneven on purpose, so the sample looks like a hand-arranged canvas.
const NODES: SampleNode[] = [
  { status: 'BARU', x: 58, y: 58, radius: 24 },
  { status: 'DIKUASAI', x: 168, y: 46, radius: 26 },
  { status: 'SEDANG', x: 282, y: 70, radius: 30, score: 72 },
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

interface DragSession {
  pointer: Point
  start: Point[]
}

// Moves the whole sample by (dx, dy), but only as far as every circle stays inside the sample.
function clampMove(points: Point[], dx: number, dy: number): Point {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  points.forEach((point, index) => {
    const radius = NODES[index].radius
    minX = Math.min(minX, point.x - radius)
    maxX = Math.max(maxX, point.x + radius)
    minY = Math.min(minY, point.y - radius)
    maxY = Math.max(maxY, point.y + radius)
  })
  return {
    x: Math.min(WIDTH - PAD - maxX, Math.max(PAD - minX, dx)),
    y: Math.min(HEIGHT - PAD - maxY, Math.max(PAD - minY, dy)),
  }
}

export function EmptyCanvasIllustration() {
  const svgRef = useRef<SVGSVGElement>(null)
  const sessionRef = useRef<DragSession | null>(null)
  const [points, setPoints] = useState<Point[]>(() => NODES.map((node) => ({ x: node.x, y: node.y })))
  const [dragging, setDragging] = useState(false)

  // Converts the pointer position to sample units, so the sample follows the pointer at any size.
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

  function startDrag(event: ReactPointerEvent<SVGGElement>) {
    const pointer = toSamplePoint(event)
    if (!pointer) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    sessionRef.current = { pointer, start: points }
    setDragging(true)
  }

  function moveDrag(event: ReactPointerEvent<SVGGElement>) {
    const session = sessionRef.current
    const pointer = toSamplePoint(event)
    if (!session || !pointer) {
      return
    }
    const move = clampMove(session.start, pointer.x - session.pointer.x, pointer.y - session.pointer.y)
    setPoints(session.start.map((point) => ({ x: point.x + move.x, y: point.y + move.y })))
  }

  function endDrag(event: ReactPointerEvent<SVGGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    sessionRef.current = null
    setDragging(false)
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
        return (
          <g
            key={node.status}
            data-sample={node.status}
            style={{ pointerEvents: 'auto', cursor: dragging ? 'grabbing' : 'grab' }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <g
              className={dragging ? undefined : 'topic-idle'}
              style={dragging ? undefined : { animationDelay: `${index * 0.6}s`, animationDuration: `${5 + index * 0.7}s` }}
            >
              <g transform={`translate(${point.x} ${point.y})`}>
                <circle
                  r={node.radius}
                  fill={visual.fill}
                  stroke={visual.stroke}
                  strokeWidth={visual.strokeWidth}
                  strokeDasharray={visual.dashed ? '4 3' : undefined}
                />
                <Icon status={node.status} radius={node.radius} score={node.score} />
              </g>
            </g>
          </g>
        )
      })}
    </svg>
  )
}

interface IconProps {
  status: TopicStatus
  radius: number
  score?: number
}

// Icons follow the lucide style (24 unit grid, round line ends) and are sized to about half the circle.
function Icon({ status, radius, score }: IconProps) {
  const scale = radius / 22
  const transform = `translate(${-12 * scale} ${-12 * scale}) scale(${scale})`
  const common = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (status) {
    case 'BARU':
      return (
        <g transform={transform} stroke="#64748B" strokeWidth={2} {...common}>
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </g>
      )
    case 'DIKUASAI':
      return (
        <path d="M20 6 9 17l-5-5" transform={transform} stroke="#FFFFFF" strokeWidth={2.6} {...common} />
      )
    case 'SEDANG': {
      // A progress ring for the score, with the number in the middle.
      const ring = radius * 0.7
      const angle = ((score ?? 0) / 100) * 2 * Math.PI
      const endX = ring * Math.sin(angle)
      const endY = -ring * Math.cos(angle)
      const largeArc = angle > Math.PI ? 1 : 0
      return (
        <g>
          <circle r={ring} fill="none" stroke="#FDE68A" strokeWidth={3} />
          <path d={`M 0 ${-ring} A ${ring} ${ring} 0 ${largeArc} 1 ${endX} ${endY}`} fill="none" stroke="#D97706" strokeWidth={3} strokeLinecap="round" />
          <text y={4.5} textAnchor="middle" fontSize={radius * 0.5} fontWeight={700} fill="#92400E">
            {score}
          </text>
        </g>
      )
    }
    case 'PERLU_DIULANG':
      return (
        <g transform={transform} stroke="#DC2626" strokeWidth={2.2} {...common}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </g>
      )
    case 'BELUM_DIBUKA':
      return (
        <g transform={transform} stroke="#64748B" strokeWidth={2} {...common}>
          <rect x={5} y={11} width={14} height={10} rx={2} />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </g>
      )
    case 'SARAN':
      return (
        <g transform={transform} stroke="#7C3AED" strokeWidth={2} {...common}>
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </g>
      )
    default:
      return null
  }
}
