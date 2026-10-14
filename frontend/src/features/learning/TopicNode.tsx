import { TOPIC_STATUS_LABEL, type TopicStatus } from '../../domain/topicStatus'
import type { Topic } from '../../domain/types'
import { topicVisualOf, type SealKind } from './topicVisual'
import { wrapLabel } from './wrapLabel'

// Scalloped badge outline from the mockup (docs/design/html/02-learning-desktop.html).
const SEAL_DOTS: ReadonlyArray<readonly [number, number]> = [
  [21, 12],
  [18.36, 18.36],
  [12, 21],
  [5.64, 18.36],
  [3, 12],
  [5.64, 5.64],
  [12, 3],
  [18.36, 5.64],
]

interface TopicNodeProps {
  topic: Topic
  status: TopicStatus
  x: number
  y: number
  selected: boolean
  // Idle drift settings. Null disables the drift, for example while the topic is dragged.
  drift: { delay: number; duration: number } | null
  // Color of the subject this topic belongs to. It draws a ring around the topic.
  accent: string
}

// One topic on the canvas. Coordinates are in world units. The canvas applies zoom and pan.
export function TopicNode({ topic, status, x, y, selected, drift, accent }: TopicNodeProps) {
  const visual = topicVisualOf(status)
  const radius = visual.radius
  const score = topic.lastScore
  // A finished topic shows an explanation instead of its name. The name stays in the chat panel and in the accessible label.
  const caption = status === 'DIKUASAI' && score !== null ? `Selesai, skor ${score}` : topic.name
  const lines = wrapLabel(caption)
  const labelY = radius + 15
  const showScoreBelow = status === 'PERLU_DIULANG'
  const ariaLabel = `${topic.name}, ${TOPIC_STATUS_LABEL[status]}${score !== null ? `, skor ${score}` : ''}`

  return (
    <g transform={`translate(${x} ${y})`}>
      <g
        className={drift ? 'topic-idle' : undefined}
        style={drift ? { animationDelay: `${drift.delay}s`, animationDuration: `${drift.duration}s` } : undefined}
      >
        <g
          className="topic-node"
          role="button"
          tabIndex={0}
          data-topic-id={topic.id}
          data-node-id={topic.id}
          aria-label={ariaLabel}
          aria-pressed={selected}
        >
          {selected && <circle r={radius + 7} fill="none" stroke="#15795A" strokeWidth={1.5} />}
          {/* A faint halo and a ring in the subject's color. The status color stays on the circle itself. */}
          <circle r={radius + 10} fill={accent} opacity={0.07} />
          <circle r={radius + 4} fill="none" stroke={accent} strokeWidth={2} />
          <circle className="topic-ring" r={radius + 6} fill="none" stroke="#15795A" strokeWidth={2.5} />
          <circle
            r={radius}
            fill={visual.fill}
            stroke={visual.stroke}
            strokeWidth={visual.strokeWidth}
            strokeDasharray={visual.dashed ? '4 3' : undefined}
          />
          {visual.scoreInCenter && score !== null && (
            <text y={4} textAnchor="middle" fontSize={13} fontWeight={600} fill="#92400E">
              {score}
            </text>
          )}
          {visual.seal && <Seal kind={visual.seal.kind} badgeFill={visual.seal.badgeFill} iconColor={visual.seal.iconColor} />}
          {status === 'BARU' && <EmptyIcon />}
          <text textAnchor="middle" fontSize={11} fill={visual.labelColor} fontWeight={visual.labelWeight} y={labelY}>
            {lines.map((line, index) => (
              <tspan key={index} x={0} dy={index === 0 ? 0 : 13}>
                {line}
              </tspan>
            ))}
          </text>
          {showScoreBelow && score !== null && (
            <text textAnchor="middle" fontSize={11} fill="#606563" y={labelY + lines.length * 13}>
              skor {score}
            </text>
          )}
        </g>

        {/* Plus button: starts a chat about this topic. It is a pointer target only; keyboard users press Enter on the node. */}
        <g
          data-topic-id={topic.id}
          data-node-id={topic.id}
          data-topic-action="chat"
          aria-hidden="true"
          transform={`translate(${radius * 0.72} ${-radius * 0.72})`}
        >
          <circle r={9} fill="#FFFFFF" stroke="#D3D8D6" strokeWidth={1} />
          <path d="M-4 0H4M0 -4V4" stroke="#15795A" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      </g>
    </g>
  )
}

// Book icon (lucide BookOpen) in an empty topic, so the circle does not look blank.
function EmptyIcon() {
  return (
    <g transform="translate(-9 -9) scale(0.75)" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </g>
  )
}

interface SealProps {
  kind: SealKind
  badgeFill: string
  iconColor: string
}

// Badge at the center of a topic: check (mastered), alert (needs review), or lock (not unlocked).
function Seal({ kind, badgeFill, iconColor }: SealProps) {
  return (
    <g transform="translate(-12 -12)" pointerEvents="none">
      <g fill={badgeFill}>
        <circle cx={12} cy={12} r={7.5} />
        {SEAL_DOTS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.6} />
        ))}
      </g>
      {kind === 'check' && (
        <path
          d="M8.2 12.3l2.5 2.5 5-5.2"
          fill="none"
          stroke={iconColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {kind === 'alert' && (
        <g>
          <path d="M12 7.6v5.4" stroke={iconColor} strokeWidth={2} strokeLinecap="round" />
          <circle cx={12} cy={16.4} r={1.2} fill={iconColor} />
        </g>
      )}
      {kind === 'lock' && (
        <g>
          <rect x={8.5} y={11.2} width={7} height={5.6} rx={1.3} fill={iconColor} />
          <path
            d="M9.8 11.2V9.6a2.2 2.2 0 0 1 4.4 0v1.6"
            fill="none"
            stroke={iconColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  )
}
