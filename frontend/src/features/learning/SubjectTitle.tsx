import { tintOf } from './subjectGroups'
import { wrapLabel } from './wrapLabel'

// Radius of a subject title in world units. It is larger than any topic, so the title reads as the heading of its group.
export const SUBJECT_TITLE_RADIUS = 46

const LINE_HEIGHT = 15

interface SubjectTitleProps {
  id: string
  name: string
  color: string
  x: number
  y: number
}

// The title circle of a subject, with the subject name inside. It is dragged like a topic (data-node-id).
export function SubjectTitle({ id, name, color, x, y }: SubjectTitleProps) {
  const lines = wrapLabel(name, 10)
  // Centers the block of lines vertically on the circle.
  const firstLineY = -((lines.length - 1) * LINE_HEIGHT) / 2 + 5

  return (
    <g transform={`translate(${x} ${y})`}>
      <g data-node-id={id} role="img" aria-label={`Mapel ${name}`}>
        <circle r={SUBJECT_TITLE_RADIUS + 5} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2 6" />
        <circle r={SUBJECT_TITLE_RADIUS} fill={tintOf(color, 0.22)} stroke={color} strokeWidth={1.5} />
        <text textAnchor="middle" fontSize={13} fontWeight={700} fill="#141414">
          {lines.map((line, index) => (
            <tspan key={index} x={0} y={firstLineY + LINE_HEIGHT * index}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    </g>
  )
}
