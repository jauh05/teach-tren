import type { KeyboardEvent } from 'react'
import { cardPalette, colors } from '../../theme/tokens'
import { wrapLabel } from '../learning/wrapLabel'
import { ROAD_VIEW, roadPath, stopsOf } from './roadPath'

// The layout follows the roadmap reference: a dashed route, a pin on every stop, and a card on a short stick.
// Colors follow the app palette (ink, mint, and the card colors for the cards).
const CARD_WIDTH = 138
const CARD_HEIGHT = 66
const CARD_TITLE_CHARS = 15
const CARD_TITLE_LINES = 2
const PILL_CHARS = 24
const LEFT_CARD_X = 6
const RIGHT_CARD_X = ROAD_VIEW.width - 6 - CARD_WIDTH
const PIN_RADIUS = 11
const TITLE_LINE_HEIGHT = 14

export interface RoadStep {
  id: string
  title: string
  // Short text in the card's pill, for example the status of the topic.
  detail: string
}

interface RoadmapCardProps {
  steps: RoadStep[]
  // Called with the step's id when its card is clicked or opened with the keyboard. Without it the cards are only shown.
  onSelect?: (id: string) => void
}

// A dashed route with one pin per step, and a card on each step. Cards alternate sides of the route.
export function RoadmapCard({ steps, onSelect }: RoadmapCardProps) {
  const stops = stopsOf(steps.length)
  const path = roadPath()

  return (
    <svg
      viewBox={`0 0 ${ROAD_VIEW.width} ${ROAD_VIEW.height}`}
      className="h-full w-full"
      role="img"
      aria-label={`Roadmap, ${steps.length} langkah`}
      focusable="false"
    >
      <path d={path} fill="none" stroke={colors.brand.dark} strokeWidth={3} strokeDasharray="9 9" strokeLinecap="round" />

      {stops.map((stop, index) => {
        const step = steps[index]
        const cardColor = cardPalette[index % cardPalette.length]
        const cardX = stop.side === 'right' ? RIGHT_CARD_X : LEFT_CARD_X
        const cardY = stop.y - CARD_HEIGHT / 2
        const stickFrom = stop.side === 'right' ? stop.x + PIN_RADIUS : stop.x - PIN_RADIUS
        const stickTo = stop.side === 'right' ? cardX : cardX + CARD_WIDTH
        const titleLines = wrapLabel(step.title, CARD_TITLE_CHARS).slice(0, CARD_TITLE_LINES)
        const pillText = step.detail.length > PILL_CHARS ? `${step.detail.slice(0, PILL_CHARS - 1)}…` : step.detail
        const pillWidth = Math.min(CARD_WIDTH - 16, pillText.length * 5.4 + 14)
        const interactive = onSelect !== undefined

        return (
          <g
            key={step.id}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `${step.title}, ${step.detail}` : undefined}
            style={{ cursor: interactive ? 'pointer' : undefined }}
            onClick={interactive ? () => onSelect(step.id) : undefined}
            onKeyDown={interactive ? (event: KeyboardEvent<SVGGElement>) => handleKey(event, () => onSelect(step.id)) : undefined}
          >
            <line x1={stickFrom} y1={stop.y} x2={stickTo} y2={stop.y} stroke={colors.ink} strokeWidth={1.5} />
            <circle cx={stop.x} cy={stop.y} r={PIN_RADIUS} fill={colors.ink} stroke="#FFFFFF" strokeWidth={2} />
            <text x={stop.x} y={stop.y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF">
              {index + 1}
            </text>

            <rect x={cardX} y={cardY} width={CARD_WIDTH} height={CARD_HEIGHT} rx={14} fill={cardColor.fill} />
            <text x={cardX + 10} fontSize={12} fontWeight={700} fill={cardColor.text}>
              {titleLines.map((line, lineIndex) => (
                <tspan key={lineIndex} x={cardX + 10} y={cardY + 18 + lineIndex * TITLE_LINE_HEIGHT}>
                  {line}
                </tspan>
              ))}
            </text>
            <rect
              x={cardX + 10}
              y={cardY + CARD_HEIGHT - 24}
              width={pillWidth}
              height={16}
              rx={8}
              fill="#FFFFFF"
            />
            <text x={cardX + 17} y={cardY + CARD_HEIGHT - 12.5} fontSize={9} fontWeight={600} fill={colors.ink}>
              {pillText}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function handleKey(event: KeyboardEvent<SVGGElement>, select: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    select()
  }
}
