import { colors } from '../../theme/tokens'

// Decoration for the sign-in and sign-up pages, drawn after docs/design/acuan-masuk-daftar.png with the main palette:
// mint green, dark green, black, and white. Everything is inline SVG, and it is hidden from screen readers
// because the page headings carry the meaning.

const TORSO = 'M46 220 C46 160 58 130 100 126 C142 130 154 160 154 220 Z'

// One person holding a phone. Drawn in a 200 x 220 box, so it can be placed with a transform.
function PersonFigure() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="auth-person-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.4" fill={colors.ink} />
          <circle cx="8" cy="8" r="1.4" fill={colors.ink} />
        </pattern>
      </defs>
      <path d="M90 102 L90 124 M110 102 L110 124" fill="none" stroke={colors.ink} strokeWidth="3" />
      <ellipse cx="100" cy="72" rx="28" ry="32" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
      <path d="M72 66 C66 38 94 28 110 34 C126 40 134 54 128 70 C122 58 114 50 100 50 C88 50 78 56 72 66 Z" fill={colors.ink} />
      <path d="M72 74 Q65 76 69 86" fill="none" stroke={colors.ink} strokeWidth="2.6" />
      <circle cx="90" cy="76" r="2.8" fill={colors.ink} />
      <circle cx="110" cy="76" r="2.8" fill={colors.ink} />
      <path d="M92 90 Q100 97 108 90" fill="none" stroke={colors.ink} strokeWidth="2.6" />
      <path d={TORSO} fill="#FFFFFF" />
      <path d={TORSO} fill="url(#auth-person-dots)" />
      <path d={TORSO} fill="none" stroke={colors.ink} strokeWidth="3" />
      <path d="M60 150 C48 166 44 190 54 206 L84 192 C80 180 82 166 92 156 Z" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
      <g transform="rotate(-12 98 172)">
        <rect x="82" y="146" width="32" height="52" rx="6" fill={colors.ink} />
        <rect x="86" y="152" width="24" height="40" rx="2.5" fill={colors.brand.DEFAULT} />
      </g>
      <path d="M140 150 C152 170 156 196 152 218" fill="none" stroke={colors.ink} strokeWidth="3" />
    </g>
  )
}

// Sign-in art: white, with a mint circle behind the person and a few solid shapes at the corners.
export function AuthHero() {
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <circle cx="200" cy="150" r="104" fill={colors.brand.DEFAULT} />
      <circle cx="0" cy="0" r="82" fill={colors.brand.dark} />
      <rect x="326" y="-16" width="26" height="110" rx="13" transform="rotate(36 339 39)" fill={colors.ink} />
      <g transform="translate(110 36) scale(0.9)">
        <PersonFigure />
      </g>
    </svg>
  )
}

// Sign-up header: mint green, with black and dark green shapes, and the person in a white circle.
export function SignUpArt() {
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <rect width="400" height="240" fill={colors.brand.DEFAULT} />
      <path d="M-16 150 A 96 96 0 0 1 80 -16" fill="none" stroke={colors.ink} strokeWidth="26" />
      <rect x="300" y="-20" width="34" height="120" rx="17" transform="rotate(-40 317 40)" fill={colors.ink} />
      <path d="M300 270 A 70 70 0 0 0 410 180" fill="none" stroke={colors.brand.dark} strokeWidth="30" />
      <circle cx="300" cy="150" r="74" fill="#FFFFFF" />
      <g transform="translate(240 76) scale(0.6)">
        <PersonFigure />
      </g>
    </svg>
  )
}
