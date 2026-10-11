import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import type { TopicStatus } from '../../domain/topicStatus'
import type { Point } from './canvasMath'
import { TOPIC_VISUALS } from './topicVisual'
import { pushOutOfRect, useTopicLayout, type LayoutLinkInput, type LayoutNodeInput, type LayoutRect } from './useTopicLayout'

// Sample circles on an empty canvas, in the colors and with the icons of the legend. They use the same layout as the
// real canvas: dragging one moves the circles linked to it, the others move out of the way, and the layout settles
// after the drag (docs/role.md 4.1). Nothing is saved, and clicking does nothing else. They are an example, not data.
interface SampleSpec {
  id: string
  status: TopicStatus
  score?: number
  // Starting place, as a fraction of the canvas width and height.
  seed: Point
}

interface SampleLink {
  source: string
  target: string
  suggested: boolean
}

const SAMPLES: SampleSpec[] = [
  { id: 'kosong', status: 'BARU', seed: { x: 0.2, y: 0.6 } },
  { id: 'dikuasai', status: 'DIKUASAI', seed: { x: 0.42, y: 0.48 } },
  { id: 'sedang', status: 'SEDANG', score: 72, seed: { x: 0.7, y: 0.58 } },
  { id: 'perlu', status: 'PERLU_DIULANG', seed: { x: 0.3, y: 0.86 } },
  { id: 'belum', status: 'BELUM_DIBUKA', seed: { x: 0.58, y: 0.86 } },
  { id: 'saran', status: 'SARAN', seed: { x: 0.82, y: 0.8 } },
]

const SAMPLE_LINKS: SampleLink[] = [
  { source: 'kosong', target: 'dikuasai', suggested: false },
  { source: 'dikuasai', target: 'sedang', suggested: false },
  { source: 'kosong', target: 'perlu', suggested: false },
  { source: 'dikuasai', target: 'belum', suggested: false },
  { source: 'belum', target: 'saran', suggested: true },
  { source: 'sedang', target: 'saran', suggested: true },
]

// The sample is smaller than the real circles, so several fit on a phone.
const SAMPLE_SCALE = 0.7

function radiusOf(status: TopicStatus): number {
  return TOPIC_VISUALS[status].radius * SAMPLE_SCALE
}

const LAYOUT_LINKS: LayoutLinkInput[] = SAMPLE_LINKS.map((link) => ({ source: link.source, target: link.target }))
const NO_NODES: LayoutNodeInput[] = []
const NO_LINKS: LayoutLinkInput[] = []

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// Measures the canvas, so the sample can use its real size. Updates when the window or the layout changes.
function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}

// Starting positions in pixels, from the fractions above. A circle always starts inside the canvas.
function seedNodes(width: number, height: number): LayoutNodeInput[] {
  return SAMPLES.map((sample) => {
    const radius = radiusOf(sample.status)
    return {
      id: sample.id,
      name: '',
      radius,
      x: clamp(sample.seed.x * width, radius + 4, width - radius - 4),
      y: clamp(sample.seed.y * height, radius + 4, height - radius - 4),
    }
  })
}

// Controls of the board and the add circle, measured in the sample's own coordinates. Marked with data-canvas-obstacle.
function measureObstacles(container: HTMLElement): LayoutRect[] {
  const board = container.closest<HTMLElement>('[data-canvas-board]')
  if (!board) {
    return []
  }
  const origin = container.getBoundingClientRect()
  return Array.from(board.querySelectorAll<HTMLElement>('[data-canvas-obstacle]')).map((element) => {
    const box = element.getBoundingClientRect()
    return {
      left: box.left - origin.left,
      top: box.top - origin.top,
      right: box.right - origin.left,
      bottom: box.bottom - origin.top,
    }
  })
}

export function EmptyCanvasIllustration() {
  const containerRef = useRef<HTMLDivElement>(null)
  const size = useElementSize(containerRef)
  const ready = size.width > 0 && size.height > 0
  const [obstacles, setObstacles] = useState<LayoutRect[]>([])
  // Measured again whenever the board changes size, for example when it is enlarged or made smaller.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (container) {
      setObstacles(measureObstacles(container))
    }
  }, [size.width, size.height])
  const nodes = useMemo(() => (ready ? seedNodes(size.width, size.height) : NO_NODES), [ready, size.width, size.height])
  const links = ready ? LAYOUT_LINKS : NO_LINKS
  const center = useMemo(() => ({ x: size.width / 2, y: size.height * 0.6 }), [size.width, size.height])
  const bounds = useMemo(() => ({ width: size.width, height: size.height, obstacles }), [size.width, size.height, obstacles])
  const { positions, startDrag, dragTo, endDrag } = useTopicLayout(nodes, links, center, bounds)
  const [dragId, setDragId] = useState<string | null>(null)

  // Pointer position inside the canvas, in pixels.
  function localPoint(event: ReactPointerEvent<SVGGElement>): Point {
    const rect = containerRef.current?.getBoundingClientRect()
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) }
  }

  function beginDrag(id: string, event: ReactPointerEvent<SVGGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragId(id)
    startDrag(id)
  }

  // The circle follows the pointer anywhere on the board, except over a control or the add circle.
  function moveDrag(id: string, radius: number, event: ReactPointerEvent<SVGGElement>) {
    if (dragId !== id) {
      return
    }
    let target = localPoint(event)
    target = {
      x: clamp(target.x, radius, size.width - radius),
      y: clamp(target.y, radius, size.height - radius),
    }
    for (const rect of obstacles) {
      target = pushOutOfRect(target, radius, rect, { width: size.width, height: size.height })
    }
    dragTo(id, {
      x: clamp(target.x, radius, size.width - radius),
      y: clamp(target.y, radius, size.height - radius),
    })
  }

  function finishDrag(id: string, event: ReactPointerEvent<SVGGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragId(null)
    endDrag(id)
  }

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {ready && (
        <svg width={size.width} height={size.height} className="absolute inset-0 block touch-none select-none" focusable="false">
          {SAMPLE_LINKS.map((link) => {
            const from = positions[link.source]
            const to = positions[link.target]
            if (!from || !to) {
              return null
            }
            return (
              <line
                key={`${link.source}-${link.target}`}
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
          {SAMPLES.map((sample, index) => {
            const point = positions[sample.id]
            if (!point) {
              return null
            }
            const visual = TOPIC_VISUALS[sample.status]
            const radius = radiusOf(sample.status)
            return (
              <g
                key={sample.id}
                data-sample={sample.status}
                style={{ pointerEvents: 'auto', cursor: dragId === sample.id ? 'grabbing' : 'grab' }}
                onPointerDown={(event) => beginDrag(sample.id, event)}
                onPointerMove={(event) => moveDrag(sample.id, radius, event)}
                onPointerUp={(event) => finishDrag(sample.id, event)}
                onPointerCancel={(event) => finishDrag(sample.id, event)}
              >
                <g transform={`translate(${point.x} ${point.y})`}>
                  <g
                    className={dragId === null ? 'topic-idle' : undefined}
                    style={dragId === null ? { animationDelay: `${index * 0.6}s`, animationDuration: `${5 + index * 0.7}s` } : undefined}
                  >
                    <circle
                      r={radius}
                      fill={visual.fill}
                      stroke={visual.stroke}
                      strokeWidth={visual.strokeWidth}
                      strokeDasharray={visual.dashed ? '4 3' : undefined}
                    />
                    <Icon status={sample.status} radius={radius} score={sample.score} />
                  </g>
                </g>
              </g>
            )
          })}
        </svg>
      )}
    </div>
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
      return <path d="M20 6 9 17l-5-5" transform={transform} stroke="#FFFFFF" strokeWidth={2.6} {...common} />
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
