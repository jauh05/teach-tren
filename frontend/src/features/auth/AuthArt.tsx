import { colors } from '../../theme/tokens'

// Decoration for the sign-in and sign-up pages, drawn after docs/design/acuan-masuk-daftar.png with the main palette:
// mint green, dark green, black, and white. Everything is inline SVG, and it is hidden from screen readers
// because the page headings carry the meaning.

const TORSO = 'M44 220 C44 170 52 138 78 128 Q100 136 122 128 C148 138 156 170 156 220 Z'

// One person holding a phone, in the flat line style of the reference. Drawn in a 200 x 220 box, so it can be placed with a transform.
function PersonFigure() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="auth-person-dots" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.3" fill={colors.ink} />
          <circle cx="7" cy="7" r="1.3" fill={colors.ink} />
        </pattern>
      </defs>
      {/* Neck and ears, behind the head */}
      <path d="M92 100 L92 124 M108 100 L108 124" fill="none" stroke={colors.ink} strokeWidth="3" />
      <path d="M74 70 C67 68 66 82 74 86 M126 70 C133 68 134 82 126 86" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
      {/* Head and short curly hair */}
      <path
        d="M74 70 C74 46 86 40 100 40 C114 40 126 46 126 70 C126 90 116 102 100 102 C84 102 74 90 74 70 Z"
        fill="#FFFFFF"
        stroke={colors.ink}
        strokeWidth="3"
      />
      <path d="M72 66 C68 44 82 34 100 34 C118 34 132 44 128 66 C124 54 116 50 100 50 C88 50 78 54 72 66 Z" fill={colors.ink} />
      <circle cx="86" cy="38" r="6" fill={colors.ink} />
      <circle cx="100" cy="34" r="6" fill={colors.ink} />
      <circle cx="114" cy="38" r="6" fill={colors.ink} />
      {/* Face */}
      <circle cx="88" cy="74" r="3" fill={colors.ink} />
      <circle cx="112" cy="74" r="3" fill={colors.ink} />
      <path d="M99 80 Q96 87 101 88" fill="none" stroke={colors.ink} strokeWidth="2.4" />
      <path d="M90 93 Q100 101 110 93" fill="none" stroke={colors.ink} strokeWidth="2.6" />
      {/* Torso with a dotted sweater and a collar */}
      <path d={TORSO} fill="#FFFFFF" />
      <path d={TORSO} fill="url(#auth-person-dots)" />
      <path d="M86 124 L100 140 L114 124" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
      <path d={TORSO} fill="none" stroke={colors.ink} strokeWidth="3" />
      {/* Left arm bent up to the chest */}
      <path
        d="M56 140 C42 152 38 184 46 202 C50 212 62 212 68 204 L86 180 C90 172 88 162 80 156 C74 152 66 146 62 140 Z"
        fill="#FFFFFF"
        stroke={colors.ink}
        strokeWidth="3"
      />
      {/* Phone with a small chart on the screen */}
      <g transform="rotate(-10 100 168)">
        <rect x="84" y="142" width="32" height="54" rx="6" fill={colors.ink} />
        <rect x="88" y="148" width="24" height="42" rx="2.5" fill={colors.brand.DEFAULT} />
        <path d="M92 180 L98 170 L103 175 L110 162" fill="none" stroke="#FFFFFF" strokeWidth="2.4" />
      </g>
      {/* Hand holding the phone */}
      <ellipse cx="84" cy="176" rx="9" ry="8" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" transform="rotate(-20 84 176)" />
      {/* Right arm hanging at the side */}
      <path d="M144 140 C160 158 162 190 158 214 C156 224 144 226 140 218 C138 202 136 178 130 162 Z" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
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
