import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { TopicStatus } from '../../domain/topicStatus'
import { TOPIC_VISUALS } from './topicVisual'

// A small sample canvas under the add circle: connected circles in the colors and with the icons of the legend.
// The circles can be dragged, and the links follow them, the same way as the real canvas. Nothing is saved and
// clicking has no other effect. It is an example, not data.
interface SampleNode {
  status: TopicStatus
  x: number
  y: number
  // Radius of the circle, in the same units as the viewBox. It follows the sizes of the real circles.
  radius: number
  label: string
  score?: number
}

const WIDTH = 340
const HEIGHT = 220
// Keeps a circle and its label inside the sample.
const SIDE_MARGIN = 56
const TOP_MARGIN = 10
const BOTTOM_MARGIN = 34

// Positions are uneven on purpose, so the sample looks like a real, hand-arranged canvas.
const NODES: SampleNode[] = [
  { status: 'BARU', x: 66, y: 62, radius: 26, label: 'Kosong' },
  { status: 'DIKUASAI', x: 166, y: 44, radius: 28, label: 'Sudah dikuasai' },
  { status: 'SEDANG', x: 266, y: 74, radius: 32, label: 'Sedang dipelajari', score: 72 },
  { status: 'PERLU_DIULANG', x: 84, y: 150, radius: 27, label: 'Perlu diulang' },
  { status: 'BELUM_DIBUKA', x: 186, y: 152, radius: 26, label: 'Belum dibuka' },
  { status: 'SARAN', x: 262, y: 166, radius: 25, label: 'Saran berikutnya' },
]

const LINKS: { from: number; to: number; suggested: boolean }[] = [
  { from: 0, to: 1, suggested: false },
  { from: 1, to: 2, suggested: false },
  { from: 0, to: 3, suggested: false },
  { from: 1, to: 4, suggested: false },
  { from: 4, to: 5, suggested: true },
  { from: 2, to: 5, suggested: true },
]

// Icon paths are drawn on a 24 unit grid, like the lucide icons used elsewhere.
const BOOK_PATHS = ['M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z']
const SPARKLE_PATH = 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'
const ICON_SCALE = 0.85

interface Point {
  x: number
  y: number
}

function clampToSample(point: Point, radius: number): Point {
  return {
    x: Math.min(WIDTH - SIDE_MARGIN, Math.max(SIDE_MARGIN, point.x)),
    y: Math.min(HEIGHT - radius - BOTTOM_MARGIN, Math.max(radius + TOP_MARGIN, point.y)),
  }
}

// Approximate half width of a label at font size 10. Used only to keep circles off the labels of other circles.
function labelHalfWidth(label: string): number {
  return label.length * 2.7 + 2
}

// True when a circle at point p would cover another circle or its label. The label sits under each circle.
function collides(index: number, p: Point, points: Point[]): boolean {
  const radius = NODES[index].radius
  return NODES.some((other, position) => {
    if (position === index) {
      return false
    }
    const q = points[position]
    const otherRadius = other.radius
    if (Math.hypot(p.x - q.x, p.y - q.y) < radius + otherRadius + 8) {
      return true
    }
    // The other circle must not cover the label of the dragged circle, and the dragged circle must not cover the other label.
    const ownLabelTop = p.y + radius + 4
    const ownLabelBottom = p.y + radius + 18
    const ownHalf = labelHalfWidth(NODES[index].label)
    if (nearestDistanceSquared(q, p.x - ownHalf, p.x + ownHalf, ownLabelTop, ownLabelBottom) < otherRadius * otherRadius) {
      return true
    }
    const otherLabelTop = q.y + otherRadius + 4
    const otherLabelBottom = q.y + otherRadius + 18
    const otherHalf = labelHalfWidth(other.label)
    return nearestDistanceSquared(p, q.x - otherHalf, q.x + otherHalf, otherLabelTop, otherLabelBottom) < radius * radius
  })
}

// Squared distance from a point to the nearest point of a box.
function nearestDistanceSquared(point: Point, left: number, right: number, top: number, bottom: number): number {
  const nearestX = Math.max(left, Math.min(point.x, right))
  const nearestY = Math.max(top, Math.min(point.y, bottom))
  const dx = point.x - nearestX
  const dy = point.y - nearestY
  return dx * dx + dy * dy
}

// Where a circle may go: the pointer position if free, otherwise a slide along the obstacle, otherwise stay.
function freePosition(index: number, previous: Point, wanted: Point, points: Point[]): Point {
  if (!collides(index, wanted, points)) {
    return wanted
  }
  const slideX = { x: wanted.x, y: previous.y }
  if (!collides(index, slideX, points)) {
    return slideX
  }
  const slideY = { x: previous.x, y: wanted.y }
  if (!collides(index, slideY, points)) {
    return slideY
  }
  return previous
}

function iconTransform(x: number, y: number): string {
  return `translate(${x - 12 * ICON_SCALE} ${y - 12 * ICON_SCALE}) scale(${ICON_SCALE})`
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
    const point = toSamplePoint(event)
    if (point) {
      const wanted = clampToSample(point, NODES[index].radius)
      setPoints((current) => {
        const next = freePosition(index, current[index], wanted, current)
        return current.map((item, position) => (position === index ? next : item))
      })
    }
  }

  function endDrag(event: ReactPointerEvent<SVGGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(null)
  }

  return (
    <figure aria-hidden="true" className="pointer-events-none w-full max-w-[260px] rounded-2xl border border-line bg-canvas p-2 shadow-sm md:max-w-[340px]">
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full touch-none select-none" focusable="false">
        <defs>
          <filter id="sample-circle-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>
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
              style={{ pointerEvents: 'auto', cursor: dragging === index ? 'grabbing' : 'grab' }}
              onPointerDown={(event) => startDrag(index, event)}
              onPointerMove={(event) => moveDrag(index, event)}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <g
                className={dragging === index ? undefined : 'topic-idle'}
                style={dragging === index ? undefined : { animationDelay: `${index * 0.6}s`, animationDuration: `${5 + index * 0.7}s` }}
              >
                <g transform={`translate(${point.x} ${point.y})`}>
                  <circle
                    r={node.radius}
                    fill={visual.fill}
                    stroke={visual.stroke}
                    strokeWidth={visual.strokeWidth}
                    strokeDasharray={visual.dashed ? '4 3' : undefined}
                    filter="url(#sample-circle-shadow)"
                  />
                  <Glyph status={node.status} score={node.score} />
                  <text y={node.radius + 14} textAnchor="middle" fontSize={10} fill={visual.labelColor} fontWeight={visual.labelWeight}>
                    {node.label}
                  </text>
                </g>
              </g>
            </g>
          )
        })}
      </svg>
      <figcaption className="pt-1 text-center text-[11px] text-muted">Contoh tampilan kanvas. Coba geser bulatnya.</figcaption>
    </figure>
  )
}

interface GlyphProps {
  status: TopicStatus
  score?: number
}

// The same icon and color as the legend and the topic circles. Drawn around the center of its circle.
function Glyph({ status, score }: GlyphProps) {
  const transform = iconTransform(0, 0)
  switch (status) {
    case 'DIKUASAI':
      return <path d="M8.2 12.3l2.5 2.5 5-5.2" transform={transform} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    case 'SEDANG':
      return (
        <text y={4} textAnchor="middle" fontSize={13} fontWeight={600} fill="#92400E">
          {score}
        </text>
      )
    case 'PERLU_DIULANG':
      return (
        <g transform={transform} fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round">
          <path d="M12 7.6v5.4" />
          <circle cx={12} cy={16.4} r={1.2} fill="#DC2626" stroke="none" />
        </g>
      )
    case 'BARU':
      return (
        <g transform={transform} fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {BOOK_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      )
    case 'BELUM_DIBUKA':
      return (
        <g transform={transform}>
          <rect x={8.5} y={11.2} width={7} height={5.6} rx={1.3} fill="#94A3B8" />
          <path d="M9.8 11.2V9.6a2.2 2.2 0 0 1 4.4 0v1.6" fill="none" stroke="#94A3B8" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )
    case 'SARAN':
      return <path d={SPARKLE_PATH} transform={transform} fill="none" stroke="#7C3AED" strokeWidth={1.8} strokeLinejoin="round" />
    default:
      return null
  }
}
