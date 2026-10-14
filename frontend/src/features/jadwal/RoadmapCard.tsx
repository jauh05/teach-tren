import type { KeyboardEvent } from 'react'
import { colors, roadPalette } from '../../theme/tokens'
import { wrapLabel } from '../learning/wrapLabel'
import { DRAWING_HEIGHT, drawingWidthOf, labelTopOf, roadPathOf, roadPointsOf, stopPoints } from './roadPath'

// The layout follows the roadmap reference (docs/design/acuan-roadmap-2.png): a winding road, a pin above every stop,
// and the step's name and description below the road. The roadmap scrolls sideways and downward when it is larger
// than its box.
const PIN_HALO = 34
const PIN_RADIUS = 24
const PIN_GAP = 84
const LABEL_OFFSET = 26
const NUMBER_RADIUS = 13
const TITLE_CHARS = 20
const TITLE_LINES = 2
const DETAIL_CHARS = 28
const DETAIL_LINES = 3
const TITLE_LINE_HEIGHT = 17
const DETAIL_LINE_HEIGHT = 15

export interface RoadStep {
  id: string
  title: string
  // Short text under the title, for example the status of the topic.
  detail: string
}

interface RoadmapCardProps {
  steps: RoadStep[]
  // Called with the step's id when its pin or label is clicked or opened with the keyboard. Without it the steps are only shown.
  onSelect?: (id: string) => void
}

export function RoadmapCard({ steps, onSelect }: RoadmapCardProps) {
  const stops = stopPoints(steps.length)
  const width = drawingWidthOf(steps.length)
  const path = roadPathOf(roadPointsOf(steps.length))
  const labelTop = labelTopOf()
  const interactive = onSelect !== undefined

  return (
    <div className="h-full w-full overflow-auto">
      <svg
        width={width}
        height={DRAWING_HEIGHT}
        viewBox={`0 0 ${width} ${DRAWING_HEIGHT}`}
        className="block"
        role="img"
        aria-label={`Roadmap, ${steps.length} langkah. Geser untuk melihat semua langkah.`}
        focusable="false"
      >
        <path d={path} fill="none" stroke={colors.ink} strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeDasharray="8 10" strokeLinecap="round" opacity={0.85} />

        {stops.map((stop, index) => {
          const step = steps[index]
          const color = roadPalette[index % roadPalette.length]
          const pinY = stop.y - PIN_GAP
          const titleLines = wrapLabel(step.title, TITLE_CHARS).slice(0, TITLE_LINES)
          const detailLines = wrapLabel(step.detail, DETAIL_CHARS).slice(0, DETAIL_LINES)
          const labelX = stop.x - LABEL_OFFSET
          const titleY = labelTop + NUMBER_RADIUS * 2 + 22

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
              {/* The stick joins the pin to its dot on the road. The dot is the stop itself. */}
              <line x1={stop.x} y1={pinY + PIN_RADIUS} x2={stop.x} y2={stop.y} stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" />
              <circle cx={stop.x} cy={pinY} r={PIN_HALO} fill={color} opacity={0.35} />
              <circle cx={stop.x} cy={pinY} r={PIN_RADIUS} fill={color} />
              <text x={stop.x} y={pinY + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill={colors.ink}>
                {index + 1}
              </text>
              <circle cx={stop.x} cy={stop.y} r={7} fill="#FFFFFF" stroke={color} strokeWidth={4} />

              <circle cx={labelX + NUMBER_RADIUS} cy={labelTop + NUMBER_RADIUS} r={NUMBER_RADIUS} fill={color} />
              <text x={labelX + NUMBER_RADIUS} y={labelTop + NUMBER_RADIUS + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={colors.ink}>
                {String(index + 1).padStart(2, '0')}
              </text>
              <text fontSize={14} fontWeight={700} fill={colors.ink}>
                {titleLines.map((line, lineIndex) => (
                  <tspan key={`t${lineIndex}`} x={labelX} y={titleY + lineIndex * TITLE_LINE_HEIGHT}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text fontSize={12} fill={colors.muted}>
                {detailLines.map((line, lineIndex) => (
                  <tspan
                    key={`d${lineIndex}`}
                    x={labelX}
                    y={titleY + titleLines.length * TITLE_LINE_HEIGHT + 6 + lineIndex * DETAIL_LINE_HEIGHT}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function handleKey(event: KeyboardEvent<SVGGElement>, select: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    select()
  }
}
