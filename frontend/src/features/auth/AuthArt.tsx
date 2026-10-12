import { colors } from '../../theme/tokens'
import { PersonFigure } from '../../components/illustrations/PersonFigure'

// Decoration for the sign-in and sign-up pages, drawn after docs/design/acuan-masuk-daftar.png with the main palette:
// mint green, dark green, black, and white. Everything is inline SVG, and it is hidden from screen readers
// because the page headings carry the meaning.

// Sign-in art: white, with a mint circle behind the person and a few solid shapes at the corners.
export function AuthHero() {
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <circle cx="200" cy="150" r="104" fill={colors.brand.DEFAULT} />
      <circle cx="0" cy="0" r="82" fill={colors.brand.dark} />
      <rect x="326" y="-16" width="26" height="110" rx="13" transform="rotate(36 339 39)" fill={colors.ink} />
      <g transform="translate(100 30) scale(0.9)">
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
      <g transform="translate(244 78) scale(0.56)">
        <PersonFigure />
      </g>
    </svg>
  )
}
