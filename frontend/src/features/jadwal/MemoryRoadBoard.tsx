import { useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { GripHorizontal } from 'lucide-react'
import { RoadmapCard, type RoadStep } from './RoadmapCard'

type CardId = 'memori' | 'roadmap'

interface Point {
  x: number
  y: number
}

const CARD_SIZE: Record<CardId, { width: number; height: number }> = {
  memori: { width: 300, height: 360 },
  roadmap: { width: 300, height: 500 },
}
const WIDE_BOARD = 680
const WIDE_HEIGHT = 560
const NARROW_GAP = 32

// Where the two cards start. Wide screens put them side by side; phones stack them.
function startPositionsOf(width: number): Record<CardId, Point> {
  if (width >= WIDE_BOARD) {
    return {
      memori: { x: 32, y: 32 },
      roadmap: { x: width - CARD_SIZE.roadmap.width - 32, y: 32 },
    }
  }
  const x = Math.max(0, (width - CARD_SIZE.memori.width) / 2)
  return {
    memori: { x, y: 16 },
    roadmap: { x, y: 16 + CARD_SIZE.memori.height + NARROW_GAP },
  }
}

interface MemoryRoadBoardProps {
  // The Learning memory diagram, as it is shown without the roadmap.
  memory: ReactNode
  steps: RoadStep[]
}

// Learning memory and roadmap on one board. Both cards can be dragged, and a thin line keeps them connected.
export function MemoryRoadBoard({ memory, steps }: MemoryRoadBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Record<CardId, Point> | null>(null)
  const [boardWidth, setBoardWidth] = useState(0)
  const dragRef = useRef<{ id: CardId; offsetX: number; offsetY: number } | null>(null)

  // Measures the board once the page is laid out, so the cards start inside it.
  useLayoutEffect(() => {
    const width = boardRef.current?.clientWidth ?? 0
    setBoardWidth(width)
    setPositions(startPositionsOf(width))
  }, [])

  if (!positions) {
    return <div ref={boardRef} className="h-[560px] w-full" />
  }

  const boardHeight = boardWidth >= WIDE_BOARD ? WIDE_HEIGHT : positions.roadmap.y + CARD_SIZE.roadmap.height + 16

  function handlePointerDown(id: CardId, event: PointerEvent<HTMLDivElement>) {
    // Only the handle at the top of a card moves it. The rest of the card (the roadmap, for example) keeps its own gestures.
    if (!(event.target instanceof Element) || event.target.closest('[data-drag-handle]') === null) {
      return
    }
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect || !positions) {
      return
    }
    const current = positions[id]
    dragRef.current = {
      id,
      offsetX: event.clientX - rect.left - current.x,
      offsetY: event.clientY - rect.top - current.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const rect = boardRef.current?.getBoundingClientRect()
    if (!drag || !rect) {
      return
    }
    const size = CARD_SIZE[drag.id]
    const x = clamp(event.clientX - rect.left - drag.offsetX, 0, rect.width - size.width)
    const y = clamp(event.clientY - rect.top - drag.offsetY, 0, boardHeight - size.height)
    setPositions((previous) => (previous ? { ...previous, [drag.id]: { x, y } } : previous))
  }

  function endDrag() {
    dragRef.current = null
  }

  const memoryCenter = center(positions.memori, CARD_SIZE.memori)
  const roadmapCenter = center(positions.roadmap, CARD_SIZE.roadmap)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">Geser kartu untuk mengatur tata letaknya. Garis menghubungkan memori dan roadmap.</p>
      <div
        ref={boardRef}
        className="relative w-full overflow-hidden rounded-3xl bg-canvas"
        style={{ height: boardHeight }}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <line x1={memoryCenter.x} y1={memoryCenter.y} x2={roadmapCenter.x} y2={roadmapCenter.y} stroke="#141414" strokeWidth={1.5} opacity={0.35} />
          <circle cx={memoryCenter.x} cy={memoryCenter.y} r={4} fill="#141414" opacity={0.5} />
          <circle cx={roadmapCenter.x} cy={roadmapCenter.y} r={4} fill="#141414" opacity={0.5} />
        </svg>

        <DraggableCard id="memori" position={positions.memori} onPointerDown={handlePointerDown} label="Learning memory">
          {memory}
        </DraggableCard>
        <DraggableCard id="roadmap" position={positions.roadmap} onPointerDown={handlePointerDown} label="Roadmap">
          <RoadmapCard steps={steps} />
        </DraggableCard>
      </div>
    </div>
  )
}

interface DraggableCardProps {
  id: CardId
  position: Point
  label: string
  children: ReactNode
  onPointerDown: (id: CardId, event: PointerEvent<HTMLDivElement>) => void
}

function DraggableCard({ id, position, label, children, onPointerDown }: DraggableCardProps) {
  const size = CARD_SIZE[id]
  return (
    <div
      role="group"
      aria-label={label}
      onPointerDown={(event) => onPointerDown(id, event)}
      className="absolute flex touch-none select-none flex-col rounded-3xl border border-line bg-white p-3 shadow-sm"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
      <div data-drag-handle className="flex h-6 shrink-0 cursor-grab items-center justify-center text-muted active:cursor-grabbing">
        <GripHorizontal size={18} aria-label={`Geser ${label}`} />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

function center(position: Point, size: { width: number; height: number }): Point {
  return { x: position.x + size.width / 2, y: position.y + size.height / 2 }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}
