import { cardPalette, colors } from '../../theme/tokens'
import { wrapLabel } from '../learning/wrapLabel'
import { ROAD_VIEW, roadPath, stopsOf } from './roadPath'

// The layout follows the roadmap reference (docs/design/acuan-roadmap.png). The colors follow the app palette: ink for
// the road, the line color for its edge, and the card colors for the numbered circles.
const LABEL_RIGHT_X = 248
const LABEL_LEFT_X = 112
const LABEL_CHARS = 13
const DETAIL_CHARS = 18
const LINE_HEIGHT = 15

export interface RoadStep {
  id: string
  title: string
  // Short text under the title, for example the status of the topic.
  detail: string
}

interface RoadmapCardProps {
  steps: RoadStep[]
}

// A winding road with one numbered stop per step. Each step's name sits beside the road, alternating sides.
export function RoadmapCard({ steps }: RoadmapCardProps) {
  const stops = stopsOf(steps.length)
  const path = roadPath()

  return (
    <svg viewBox={`0 0 ${ROAD_VIEW.width} ${ROAD_VIEW.height}`} className="h-full w-full" role="img" aria-label={`Roadmap, ${steps.length} langkah`} focusable="false">
      <path d={path} fill="none" stroke={colors.line} strokeWidth={60} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={colors.ink} strokeWidth={52} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="10 12" strokeLinecap="round" />

      {stops.map((stop, index) => {
        const step = steps[index]
        const anchor = stop.side === 'right' ? 'start' : 'end'
        const cardColor = cardPalette[index % cardPalette.length]
        const labelX = stop.side === 'right' ? LABEL_RIGHT_X : LABEL_LEFT_X
        // Title lines, then detail lines. The whole block is centered on the stop.
        const titleLines = wrapLabel(step.title, LABEL_CHARS)
        const detailLines = wrapLabel(step.detail, DETAIL_CHARS)
        const blockTop = stop.y - ((titleLines.length + detailLines.length - 1) * LINE_HEIGHT) / 2
        return (
          <g key={step.id}>
            <circle cx={stop.x} cy={stop.y} r={16} fill={cardColor.fill} stroke="#FFFFFF" strokeWidth={3} />
            <text x={stop.x} y={stop.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={cardColor.text}>
              {index + 1}
            </text>
            <text textAnchor={anchor} fontSize={13} fontWeight={700} fill={colors.ink}>
              {titleLines.map((line, lineIndex) => (
                <tspan key={`t${lineIndex}`} x={labelX} y={blockTop + lineIndex * LINE_HEIGHT}>
                  {line}
                </tspan>
              ))}
              {detailLines.map((line, lineIndex) => (
                <tspan
                  key={`d${lineIndex}`}
                  x={labelX}
                  y={blockTop + (titleLines.length + lineIndex) * LINE_HEIGHT}
                  fontSize={11}
                  fontWeight={400}
                  fill={colors.muted}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
