import { Minus, Plus, RotateCcw } from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { topicStatusOf } from '../../domain/topicStatus'
import type { Topic, TopicLink } from '../../domain/types'
import {
  WORLD_CENTER,
  ZOOM_STEP,
  centerView,
  neighborInDirection,
  screenToWorld,
  zoomAt,
  zoomPercent,
  type Direction,
  type Point,
  type View,
} from './canvasMath'
import { TopicLegend } from './TopicLegend'
import { TopicNode } from './TopicNode'
import { topicVisualOf } from './topicVisual'
import { useTopicLayout } from './useTopicLayout'

// Movement below this distance (px) counts as a tap, not a drag.
const TAP_SLOP = 5
// Keyboard move step in world units for Shift + arrow keys.
const NUDGE_STEP = 12
// Wheel sensitivity. Higher values zoom faster.
const WHEEL_SENSITIVITY = 0.0015

const ARROW_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

type Gesture =
  | { kind: 'none' }
  | { kind: 'pan'; start: Point; view: View; moved: boolean }
  | { kind: 'node'; id: string; start: Point; moved: boolean }
  | { kind: 'pinch'; startDistance: number; startMid: Point; startView: View }

interface TopicCanvasProps {
  topics: Topic[]
  links: TopicLink[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  // Reports the view (pan and zoom) to the page, so the example circles on an empty canvas move with it.
  onViewChange?: (view: View) => void
}

// Pan, zoom, drag, and tap canvas for topics. Positions are not saved (docs/role.md 4.1).
export function TopicCanvas({ topics, links, selectedId, onSelect, onViewChange }: TopicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const size = useElementSize(containerRef)
  // Layout starts from the topics on mount. Later data changes (renames, statuses) keep the same positions.
  const [layoutInput] = useState(() => ({
    nodes: topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      radius: topicVisualOf(topicStatusOf(topic)).radius,
      x: topic.initialX,
      y: topic.initialY,
    })),
    links: links.map((link) => ({ source: link.source, target: link.target })),
  }))
  const { positions, startDrag, dragTo, endDrag, nudge } = useTopicLayout(
    layoutInput.nodes,
    layoutInput.links,
    WORLD_CENTER,
  )

  // null means "not moved yet": the view is centered on the seed layout (also the reset state).
  const [viewState, setViewState] = useState<View | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const pointersRef = useRef(new Map<number, Point>())
  const gestureRef = useRef<Gesture>({ kind: 'none' })

  const view = viewState ?? centerView(size.width, size.height)
  const { x: viewX, y: viewY, k: zoom } = view

  useEffect(() => {
    onViewChange?.({ x: viewX, y: viewY, k: zoom })
  }, [viewX, viewY, zoom, onViewChange])

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = node.getBoundingClientRect()
      const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      const factor = Math.exp(-event.deltaY * WHEEL_SENSITIVITY)
      setViewState((previous) => {
        const current = previous ?? centerView(size.width, size.height)
        return zoomAt(current, anchor, current.k * factor)
      })
    }
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => node.removeEventListener('wheel', handleWheel)
  }, [size.width, size.height])

  function zoomBy(factor: number) {
    setViewState((previous) => {
      const current = previous ?? centerView(size.width, size.height)
      return zoomAt(current, { x: size.width / 2, y: size.height / 2 }, current.k * factor)
    })
  }

  function toLocal(event: { clientX: number; clientY: number }): Point {
    const rect = containerRef.current?.getBoundingClientRect()
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target
    // Only gestures that start on the canvas. Zoom buttons and the legend handle their own clicks.
    if (!(target instanceof Element) || target.closest('[data-canvas]') === null) {
      return
    }
    const point = toLocal(event)
    pointersRef.current.set(event.pointerId, point)
    containerRef.current?.setPointerCapture(event.pointerId)

    if (pointersRef.current.size >= 2) {
      const [first, second] = [...pointersRef.current.values()]
      if (gestureRef.current.kind === 'node' && gestureRef.current.moved) {
        endDrag(gestureRef.current.id)
        setDraggingId(null)
      }
      gestureRef.current = {
        kind: 'pinch',
        startDistance: distance(first, second),
        startMid: midpoint(first, second),
        startView: view,
      }
      return
    }

    if (target instanceof Element) {
      const nodeElement = target.closest('[data-topic-id]')
      const id = nodeElement?.getAttribute('data-topic-id')
      if (id) {
        gestureRef.current = {
          kind: 'node',
          id,
          start: point,
          moved: false,
        }
        return
      }
    }
    gestureRef.current = { kind: 'pan', start: point, view, moved: false }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) {
      return
    }
    const point = toLocal(event)
    pointersRef.current.set(event.pointerId, point)
    const gesture = gestureRef.current

    if (gesture.kind === 'pinch') {
      const [first, second] = [...pointersRef.current.values()]
      const mid = midpoint(first, second)
      const ratio = distance(first, second) / Math.max(gesture.startDistance, 1)
      const anchored = zoomAt(gesture.startView, gesture.startMid, gesture.startView.k * ratio)
      setViewState({
        k: anchored.k,
        x: anchored.x + mid.x - gesture.startMid.x,
        y: anchored.y + mid.y - gesture.startMid.y,
      })
      return
    }

    if (gesture.kind === 'node') {
      if (!gesture.moved && distance(point, gesture.start) > TAP_SLOP) {
        gesture.moved = true
        setDraggingId(gesture.id)
        startDrag(gesture.id)
      }
      if (gesture.moved) {
        dragTo(gesture.id, screenToWorld(view, point))
      }
      return
    }

    if (gesture.kind === 'pan') {
      if (distance(point, gesture.start) > TAP_SLOP) {
        gesture.moved = true
      }
      setViewState({
        k: gesture.view.k,
        x: gesture.view.x + point.x - gesture.start.x,
        y: gesture.view.y + point.y - gesture.start.y,
      })
    }
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    pointersRef.current.delete(event.pointerId)
    const gesture = gestureRef.current

    if (gesture.kind === 'node') {
      if (gesture.moved) {
        endDrag(gesture.id)
        setDraggingId(null)
      } else if (!cancelled) {
        // Tapping a topic or its plus button opens that topic's chat.
        onSelect(gesture.id)
      }
      gestureRef.current = { kind: 'none' }
      return
    }

    if (gesture.kind === 'pan' && !gesture.moved && !cancelled) {
      // Tapping empty canvas closes the detail panel.
      onSelect(null)
    }

    if (gesture.kind === 'pinch' && pointersRef.current.size === 1) {
      const [remaining] = [...pointersRef.current.values()]
      gestureRef.current = { kind: 'pan', start: remaining, view, moved: true }
      return
    }

    if (pointersRef.current.size === 0) {
      gestureRef.current = { kind: 'none' }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }
    const id = target.closest('[data-topic-id]')?.getAttribute('data-topic-id')
    if (!id) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(id)
      return
    }
    if (event.key === 'Escape') {
      onSelect(null)
      return
    }

    const direction = ARROW_DIRECTIONS[event.key]
    if (!direction) {
      return
    }
    event.preventDefault()

    if (event.shiftKey) {
      const delta = moveDelta(direction)
      nudge(id, delta.x, delta.y)
      return
    }
    const next = neighborInDirection(id, direction, positions)
    if (next) {
      containerRef.current?.querySelector<SVGGElement>(`[data-topic-id="${next}"][role="button"]`)?.focus()
    }
  }

  const topicIndex = new Map(topics.map((topic, index) => [topic.id, index]))

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 touch-none select-none overflow-hidden bg-white"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => handlePointerEnd(event, false)}
      onPointerCancel={(event) => handlePointerEnd(event, true)}
      onKeyDown={handleKeyDown}
    >
      <svg
        data-canvas
        width={size.width}
        height={size.height}
        role="group"
        aria-label="Kanvas bulat belajar"
        className="block"
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {links.map((link) => {
            const from = positions[link.source] ?? seedPoint(topics, link.source)
            const to = positions[link.target] ?? seedPoint(topics, link.target)
            return (
              <line
                key={`${link.source}-${link.target}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={link.suggested ? '#C4B5FD' : '#D3D8D6'}
                strokeWidth={link.suggested ? 1.2 : 1.5}
                strokeDasharray={link.suggested ? '4 4' : undefined}
              />
            )
          })}
          {topics.map((topic) => {
            const index = topicIndex.get(topic.id) ?? 0
            const point = positions[topic.id] ?? { x: topic.initialX, y: topic.initialY }
            return (
              <TopicNode
                key={topic.id}
                topic={topic}
                status={topicStatusOf(topic)}
                x={point.x}
                y={point.y}
                selected={topic.id === selectedId}
                drift={draggingId === topic.id ? null : { delay: -index * 0.9, duration: 6 + (index % 4) }}
              />
            )
          })}
        </g>
      </svg>

      <TopicLegend />

      <div
        data-canvas-obstacle
        role="toolbar"
        aria-label="Kontrol zoom"
        className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-lg border border-line bg-white p-0.5 shadow-sm"
      >
        <IconButton label="Perkecil" onClick={() => zoomBy(1 / ZOOM_STEP)}>
          <Minus size={13} aria-hidden="true" />
        </IconButton>
        <span className="min-w-[36px] text-center text-[11px] text-muted" aria-live="polite">
          {zoomPercent(view.k)}%
        </span>
        <IconButton label="Perbesar" onClick={() => zoomBy(ZOOM_STEP)}>
          <Plus size={13} aria-hidden="true" />
        </IconButton>
        <IconButton label="Atur ulang zoom" onClick={() => setViewState(null)}>
          <RotateCcw size={13} aria-hidden="true" />
        </IconButton>
      </div>

      <p data-canvas-obstacle className="pointer-events-none absolute bottom-3 left-3 hidden rounded-lg border border-line bg-white px-2.5 py-1.5 text-micro text-muted md:block">
        Geser bulat · ketuk + untuk mulai chat
      </p>
    </div>
  )
}

interface IconButtonProps {
  label: string
  onClick: () => void
  children: ReactNode
}

function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md text-ink hover:bg-slate-50 md:h-6 md:w-6"
    >
      {children}
    </button>
  )
}

// Measures the canvas so the SVG fills it. Updates when the window or the layout changes size.
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

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function moveDelta(direction: Direction): Point {
  switch (direction) {
    case 'up':
      return { x: 0, y: -NUDGE_STEP }
    case 'down':
      return { x: 0, y: NUDGE_STEP }
    case 'left':
      return { x: -NUDGE_STEP, y: 0 }
    case 'right':
      return { x: NUDGE_STEP, y: 0 }
  }
}

function seedPoint(topics: Topic[], id: string): Point {
  const topic = topics.find((item) => item.id === id)
  return { x: topic?.initialX ?? 0, y: topic?.initialY ?? 0 }
}
