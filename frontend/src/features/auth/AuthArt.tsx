import { colors } from '../../theme/tokens'

// Decoration for the sign-in and sign-up pages, drawn after docs/design/acuan-masuk-daftar.png with the main palette:
// mint green, dark green, black, and white. Everything is inline SVG, and it is hidden from screen readers
// because the page headings carry the meaning.

const SWEATER = 'M42 222 C42 176 46 148 72 134 Q100 124 128 134 C154 148 158 176 158 222 Z'

// A man in a turtleneck, looking down at a phone held at the chest. Drawn in a 200 x 220 box, so it can be placed with a transform.
function PersonFigure() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="auth-person-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="1.5" fill={colors.ink} />
          <circle cx="9" cy="10" r="1.5" fill={colors.ink} />
        </pattern>
      </defs>

      {/* Head, tilted a little toward the phone. The ear sits behind the face. */}
      <g transform="rotate(-6 100 96)">
        <path d="M128 70 C136 68 138 84 128 88" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
        <path
          d="M76 72 C76 48 88 40 102 40 C118 40 128 50 128 72 C128 90 118 106 102 106 C86 106 76 92 76 72 Z"
          fill="#FFFFFF"
          stroke={colors.ink}
          strokeWidth="3"
        />
        {/* Short hair, swept to one side */}
        <path
          d="M74 68 C68 46 80 30 100 30 C120 30 134 42 130 64 C126 56 120 50 112 48 C104 52 96 46 90 40 C84 48 78 56 74 68 Z"
          fill={colors.ink}
        />
        <circle cx="92" cy="40" r="4" fill={colors.ink} />
        <circle cx="106" cy="34" r="4" fill={colors.ink} />
        {/* Brows, eyes, nose, and a small smile */}
        <path d="M88 66 Q92 63 96 66 M108 66 Q112 63 116 66" fill="none" stroke={colors.ink} strokeWidth="2.2" />
        <circle cx="92" cy="74" r="2.7" fill={colors.ink} />
        <circle cx="112" cy="74" r="2.7" fill={colors.ink} />
        <path d="M104 78 Q101 84 106 85" fill="none" stroke={colors.ink} strokeWidth="2.2" />
        <path d="M94 94 Q103 101 112 94" fill="none" stroke={colors.ink} strokeWidth="2.6" />
      </g>

      {/* Turtleneck */}
      <path d="M86 102 L86 124 Q100 130 114 124 L114 102" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />

      {/* Sweater with sparse dots */}
      <path d={SWEATER} fill="#FFFFFF" />
      <path d={SWEATER} fill="url(#auth-person-dots)" />
      <path d={SWEATER} fill="none" stroke={colors.ink} strokeWidth="3" />
      <path d="M86 124 Q100 130 114 124" fill="none" stroke={colors.ink} strokeWidth="3" />

      {/* Left arm bent up, forearm holding the phone */}
      <path
        d="M62 142 C48 156 44 186 48 204 C56 212 66 208 72 200 L88 180 C94 172 96 164 92 156 C88 150 76 146 62 142 Z"
        fill="#FFFFFF"
        stroke={colors.ink}
        strokeWidth="3"
      />

      {/* Phone tilted toward the face, with a small chart on the screen */}
      <g transform="rotate(-14 100 160)">
        <rect x="82" y="134" width="30" height="50" rx="6" fill={colors.ink} />
        <rect x="86" y="140" width="22" height="38" rx="2.5" fill={colors.brand.DEFAULT} />
        <path d="M90 166 L95 158 L99 162 L106 152" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
      </g>
      {/* Hand around the phone */}
      <ellipse cx="88" cy="172" rx="9" ry="8" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" transform="rotate(-20 88 172)" />

      {/* Right arm hanging at the side */}
      <path d="M140 142 C156 160 160 190 156 222 L136 224 C138 200 134 178 128 160 Z" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
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
