import { colors } from '../../theme/tokens'
import { PersonFigure } from './PersonFigure'

// Illustrations for the welcome page and the tour, in the same line-art style as the person.
// They use only the main palette: mint, dark green, black, and white. The art is decorative, so it is hidden from screen readers.

// The first screen: the person with a roadmap path of branches behind him.
export function WelcomeHero() {
  return (
    <svg viewBox="0 0 360 300" className="h-full w-full" aria-hidden="true" focusable="false">
      <path
        d="M34 150 C30 62 118 22 194 34 C276 46 336 104 330 186 C324 264 254 292 180 286 C104 280 40 246 34 150 Z"
        fill={colors.brand.DEFAULT}
      />
      <path d="M30 246 C86 190 118 258 178 212 S278 148 332 84" fill="none" stroke={colors.ink} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      <circle cx="58" cy="246" r="18" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
      <circle cx="178" cy="212" r="22" fill={colors.brand.dark} stroke={colors.ink} strokeWidth="3" />
      <circle cx="332" cy="84" r="18" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
      <g transform="translate(92 26) scale(0.92)">
        <PersonFigure />
      </g>
      <g>
        <rect x="236" y="30" width="98" height="50" rx="22" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
        <circle cx="260" cy="55" r="5" fill={colors.ink} />
        <circle cx="282" cy="55" r="5" fill={colors.ink} />
        <circle cx="304" cy="55" r="5" fill={colors.ink} />
      </g>
    </svg>
  )
}

// Tour scenes. One per slide, in the same order as the slides.
export function TourArt({ scene }: { scene: 'memory' | 'chat' | 'roadmap' | 'progress' }) {
  if (scene === 'memory') {
    // A neuron: the cell body, dendrites reaching out to other neurons, and an axon to a second cell.
    const dendrites: [number, number, number, number][] = [
      [142, 108, 100, 84],
      [172, 87, 164, 39],
      [218, 108, 260, 84],
      [221, 145, 266, 162],
      [165, 171, 149, 217],
      [139, 145, 94, 162],
    ]
    return (
      <svg viewBox="0 0 360 260" className="h-full w-full" aria-hidden="true" focusable="false">
        {dendrites.map(([x1, y1, x2, y2]) => (
          <g key={`${x2}-${y2}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.ink} strokeWidth="3" strokeLinecap="round" />
            <circle cx={x2} cy={y2} r="9" fill="#FFFFFF" stroke={colors.ink} strokeWidth="2.5" />
          </g>
        ))}
        <path d="M224 150 C262 172 280 200 326 200" fill="none" stroke={colors.ink} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" />
        <circle cx="326" cy="200" r="16" fill={colors.brand.dark} stroke={colors.ink} strokeWidth="3" />
        <circle cx="180" cy="130" r="44" fill={colors.brand.DEFAULT} stroke={colors.ink} strokeWidth="3" />
        <circle cx="180" cy="130" r="14" fill="#FFFFFF" stroke={colors.ink} strokeWidth="2.5" />
      </svg>
    )
  }
  if (scene === 'chat') {
    return (
      <svg viewBox="0 0 360 260" className="h-full w-full" aria-hidden="true" focusable="false">
        <g transform="translate(12 22) scale(0.86)">
          <PersonFigure />
        </g>
        <rect x="170" y="36" width="160" height="62" rx="22" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
        <path d="M184 98 L178 116 L200 100 Z" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" strokeLinejoin="round" />
        <path d="M190 58 H308 M190 76 H286" stroke={colors.ink} strokeWidth="3" strokeLinecap="round" />
        <rect x="150" y="142" width="180" height="58" rx="22" fill={colors.brand.DEFAULT} stroke={colors.ink} strokeWidth="3" />
        <circle cx="186" cy="171" r="6" fill={colors.ink} />
        <circle cx="210" cy="171" r="6" fill={colors.ink} />
        <circle cx="234" cy="171" r="6" fill={colors.ink} />
      </svg>
    )
  }
  if (scene === 'roadmap') {
    return (
      <svg viewBox="0 0 360 260" className="h-full w-full" aria-hidden="true" focusable="false">
        <path d="M40 200 C100 140 130 220 190 170 S280 90 330 120" fill="none" stroke={colors.ink} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
        <circle cx="52" cy="200" r="18" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
        <circle cx="128" cy="168" r="18" fill={colors.brand.DEFAULT} stroke={colors.ink} strokeWidth="3" />
        <circle cx="200" cy="184" r="18" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
        <circle cx="272" cy="122" r="18" fill={colors.brand.dark} stroke={colors.ink} strokeWidth="3" />
        <circle cx="326" cy="120" r="18" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
        <g transform="translate(-6 -30) scale(0.7)">
          <PersonFigure />
        </g>
      </svg>
    )
  }
  // progress: a ring that fills with the score, and the status colors of the topics.
  return (
    <svg viewBox="0 0 360 260" className="h-full w-full" aria-hidden="true" focusable="false">
      <circle cx="262" cy="128" r="66" fill="none" stroke={colors.line} strokeWidth="16" />
      <circle
        cx="262"
        cy="128"
        r="66"
        fill="none"
        stroke={colors.status.kuasai}
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray="300 415"
        transform="rotate(-90 262 128)"
      />
      <circle cx="262" cy="128" r="40" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
      <text x="262" y="137" textAnchor="middle" fontSize="22" fontWeight="700" fill={colors.ink}>
        80
      </text>
      <circle cx="170" cy="60" r="8" fill={colors.status.kuasai} />
      <circle cx="170" cy="200" r="8" fill={colors.status.sedang} />
      <circle cx="330" cy="200" r="8" fill={colors.status.ulang} />
      <circle cx="60" cy="60" r="8" fill={colors.status.baru} />
      <g transform="translate(-14 26) scale(0.78)">
        <PersonFigure />
      </g>
    </svg>
  )
}
