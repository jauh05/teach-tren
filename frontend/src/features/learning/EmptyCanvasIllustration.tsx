import type { TopicStatus } from '../../domain/topicStatus'
import { TOPIC_VISUALS } from './topicVisual'

// Shown on an empty canvas, under the add circle: a few connected circles in the colors and with the icons of the
// legend. It is decoration only. It is not data and it cannot be clicked.
interface SampleNode {
  status: TopicStatus
  x: number
  y: number
  label: string
  score?: number
}

const NODES: SampleNode[] = [
  { status: 'BARU', x: 58, y: 52, label: 'Kosong' },
  { status: 'DIKUASAI', x: 170, y: 40, label: 'Sudah dikuasai' },
  { status: 'SEDANG', x: 282, y: 56, label: 'Sedang dipelajari', score: 72 },
  { status: 'PERLU_DIULANG', x: 58, y: 152, label: 'Perlu diulang' },
  { status: 'BELUM_DIBUKA', x: 172, y: 152, label: 'Belum dibuka' },
  { status: 'SARAN', x: 284, y: 152, label: 'Saran berikutnya' },
]

const LINKS: { from: number; to: number; suggested: boolean }[] = [
  { from: 0, to: 1, suggested: false },
  { from: 1, to: 2, suggested: false },
  { from: 0, to: 3, suggested: false },
  { from: 1, to: 4, suggested: false },
  { from: 4, to: 5, suggested: true },
  { from: 2, to: 5, suggested: true },
]

const RADIUS = 24
// Icon paths are drawn on a 24 unit grid, like the lucide icons used elsewhere.
const BOOK_PATHS = ['M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z']
const SPARKLE_PATH = 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'
const ICON_SCALE = 0.85

function iconTransform(x: number, y: number): string {
  return `translate(${x - 12 * ICON_SCALE} ${y - 12 * ICON_SCALE}) scale(${ICON_SCALE})`
}

export function EmptyCanvasIllustration() {
  return (
    <figure aria-hidden="true" className="pointer-events-none flex w-full max-w-[240px] flex-col items-center gap-2 md:max-w-[300px]">
      <svg viewBox="0 0 340 200" className="w-full" focusable="false">
        {LINKS.map((link) => {
          const from = NODES[link.from]
          const to = NODES[link.to]
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
        {NODES.map((node) => {
          const visual = TOPIC_VISUALS[node.status]
          return (
            <g key={node.status}>
              <circle
                cx={node.x}
                cy={node.y}
                r={RADIUS}
                fill={visual.fill}
                stroke={visual.stroke}
                strokeWidth={visual.strokeWidth}
                strokeDasharray={visual.dashed ? '4 3' : undefined}
              />
              <Glyph status={node.status} x={node.x} y={node.y} score={node.score} />
              <text x={node.x} y={node.y + RADIUS + 14} textAnchor="middle" fontSize={10} fill={visual.labelColor} fontWeight={visual.labelWeight}>
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="text-center text-xs text-muted">Contoh tampilan kanvas. Bulatmu akan muncul seperti ini.</figcaption>
    </figure>
  )
}

interface GlyphProps {
  status: TopicStatus
  x: number
  y: number
  score?: number
}

// The same icon and color as the legend and the topic circles.
function Glyph({ status, x, y, score }: GlyphProps) {
  const transform = iconTransform(x, y)
  switch (status) {
    case 'DIKUASAI':
      return <path d="M8.2 12.3l2.5 2.5 5-5.2" transform={transform} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    case 'SEDANG':
      return (
        <text x={x} y={y + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="#92400E">
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
