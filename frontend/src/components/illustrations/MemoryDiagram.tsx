import type { TopicStatus } from '../../domain/topicStatus'
import { colors } from '../../theme/tokens'

// The Learning memory diagram: the memory is the core, and each neuron is a topic the user has studied.
// Neurons sit on a ring around the core, linked to it, and to their neighbors. Color shows the status of the topic.
// It is drawn in the same line-art style as the rest of the app, with the main palette only.

export interface MemoryNode {
  name: string
  status: TopicStatus
}

// Shown to guests, and in the tour. It is an example, so the names are not the user's own.
export const SAMPLE_MEMORY_NODES: MemoryNode[] = [
  { name: 'Bilangan', status: 'DIKUASAI' },
  { name: 'Pecahan', status: 'SEDANG' },
  { name: 'Sel tumbuhan', status: 'PERLU_DIULANG' },
  { name: 'Fotosintesis', status: 'BARU' },
  { name: 'Persamaan', status: 'BELUM_DIBUKA' },
  { name: 'Grafik fungsi', status: 'SARAN' },
  { name: 'Bangun datar', status: 'DIKUASAI' },
  { name: 'Pola', status: 'SEDANG' },
]

const NODE_FILL: Record<TopicStatus, string> = {
  DIKUASAI: colors.status.kuasai,
  SEDANG: colors.status.sedang,
  PERLU_DIULANG: colors.status.ulang,
  BARU: colors.status.baru,
  BELUM_DIBUKA: colors.status.belum,
  SARAN: colors.status.saran,
}

const MAX_NODES = 8
const CENTER = 200
const RING = 128
const NODE_RADIUS = 26
const CORE_RADIUS = 50

function shortName(name: string): string {
  return name.length > 13 ? `${name.slice(0, 12)}…` : name
}

// Width of the name pill, from the number of letters.
function labelWidth(name: string): number {
  return shortName(name).length * 7.4 + 18
}

export function MemoryDiagram({ nodes }: { nodes: MemoryNode[] }) {
  const shown = nodes.slice(0, MAX_NODES)
  const count = shown.length
  // Each neuron sits at its own angle around the core, starting at the top.
  const positions = shown.map((_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(count, 1)
    return { x: CENTER + RING * Math.cos(angle), y: CENTER + RING * Math.sin(angle) }
  })
  const label = shown.length > 0 ? `Diagram Learning memory: ${shown.map((node) => node.name).join(', ')}` : 'Diagram Learning memory'

  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label={label} focusable="false">
      <circle cx={CENTER} cy={CENTER} r="172" fill="none" stroke={colors.brand.DEFAULT} strokeWidth="2" strokeDasharray="2 8" opacity="0.6" />
      <circle cx={CENTER} cy={CENTER} r="92" fill={colors.brand.soft} stroke={colors.brand.dark} strokeWidth="2" strokeDasharray="3 7" />

      {/* Links between neighbors: the network that the memory keeps. */}
      {count >= 3 &&
        positions.map((point, index) => {
          const next = positions[(index + 1) % count]
          return (
            <line
              key={`link-${index}`}
              x1={point.x}
              y1={point.y}
              x2={next.x}
              y2={next.y}
              stroke={colors.brand.dark}
              strokeWidth="2"
              strokeDasharray="4 6"
              opacity="0.55"
            />
          )
        })}

      {/* Links from the core to each neuron, with a synapse dot in the middle. */}
      {positions.map((point, index) => {
        const midX = (CENTER + point.x) / 2
        const midY = (CENTER + point.y) / 2
        return (
          <g key={`spoke-${index}`}>
            <line x1={CENTER} y1={CENTER} x2={point.x} y2={point.y} stroke={colors.ink} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={midX} cy={midY} r="4" fill={colors.ink} />
          </g>
        )
      })}

      <circle cx={CENTER} cy={CENTER} r={CORE_RADIUS} fill={colors.brand.DEFAULT} stroke={colors.ink} strokeWidth="3" />
      <circle cx={CENTER} cy={CENTER} r="18" fill="#FFFFFF" stroke={colors.ink} strokeWidth="2.5" />

      {shown.map((node, index) => {
        const point = positions[index]
        return (
          <g key={`neuron-${node.name}-${index}`}>
            <circle cx={point.x} cy={point.y} r={NODE_RADIUS} fill={NODE_FILL[node.status]} stroke={colors.ink} strokeWidth="3" />
            <circle cx={point.x} cy={point.y} r="6" fill="#FFFFFF" />
            {/* The name sits on a white pill, so the links and rings behind it do not cut through the text. */}
            <rect
              x={point.x - labelWidth(node.name) / 2}
              y={point.y + NODE_RADIUS + 6}
              width={labelWidth(node.name)}
              height="22"
              rx="11"
              fill="#FFFFFF"
              stroke={colors.line}
              strokeWidth="1.5"
            />
            <text x={point.x} y={point.y + NODE_RADIUS + 21} textAnchor="middle" fontSize="13" fontWeight="600" fill={colors.ink}>
              {shortName(node.name)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
