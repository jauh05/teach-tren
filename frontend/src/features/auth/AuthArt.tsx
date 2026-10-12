import { colors } from '../../theme/tokens'

// Decoration for the sign-in and sign-up pages, drawn after docs/design/acuan-masuk-daftar.png with the main palette:
// mint green, dark green, black, and white. Everything is inline SVG, and it is hidden from screen readers
// because the page headings carry the meaning.

const SWEATER = 'M28 222 C28 172 38 144 64 132 L82 124 Q100 130 118 124 L136 132 C162 144 172 172 172 222 Z'

// A cartoon man in a sweater, looking down at a phone held at the chest. Drawn in a 200 x 230 box, so it can be placed with a transform.
function PersonFigure() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="auth-person-dots" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="4" r="1.6" fill={colors.ink} />
          <circle cx="10" cy="10.5" r="1.6" fill={colors.ink} />
        </pattern>
      </defs>

      {/* Neck, hidden behind the sweater collar */}
      <path d="M88 100 L88 126 M112 100 L112 126" fill="none" stroke={colors.ink} strokeWidth="3" />

      {/* Sweater with a dotted pattern and two fold lines */}
      <path d={SWEATER} fill="#FFFFFF" />
      <path d={SWEATER} fill="url(#auth-person-dots)" />
      <path d={SWEATER} fill="none" stroke={colors.ink} strokeWidth="3.5" />
      <path d="M52 186 Q60 198 56 212 M148 186 Q140 198 144 212" fill="none" stroke={colors.ink} strokeWidth="2.2" />

      {/* Turtleneck band across the collar */}
      <path d="M82 118 Q100 134 118 118 L120 132 Q100 148 80 132 Z" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3.5" />

      {/* Head, tilted toward the phone */}
      <g transform="rotate(-6 100 100)">
        {/* Right ear, behind the face */}
        <path d="M132 70 C141 68 143 84 132 90" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3.5" />
        {/* Face */}
        <path
          d="M68 72 C68 46 82 34 100 34 C118 34 132 46 132 72 C132 92 124 108 110 112 Q100 116 90 112 C76 108 68 92 68 72 Z"
          fill="#FFFFFF"
          stroke={colors.ink}
          strokeWidth="3.5"
        />
        {/* Voluminous hair with light strands */}
        <path d="M64 76 C56 46 74 22 102 22 C126 22 142 40 138 68 C134 58 128 50 118 46 C108 52 96 44 86 38 C78 46 70 58 64 76 Z" fill={colors.ink} />
        <path d="M92 30 Q98 36 96 44 M108 28 Q116 34 116 42" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
        {/* Brows, eyes with highlights, nose, smile, and cheeks */}
        <path d="M82 64 Q88 60 95 63 M108 63 Q115 60 121 64" fill="none" stroke={colors.ink} strokeWidth="3" />
        <ellipse cx="88" cy="75" rx="4.2" ry="5.2" fill={colors.ink} />
        <ellipse cx="114" cy="75" rx="4.2" ry="5.2" fill={colors.ink} />
        <circle cx="89.5" cy="73.5" r="1.5" fill="#FFFFFF" />
        <circle cx="115.5" cy="73.5" r="1.5" fill="#FFFFFF" />
        <path d="M102 80 Q99 88 104 89" fill="none" stroke={colors.ink} strokeWidth="2.2" />
        <path d="M90 96 Q101 107 112 96" fill="none" stroke={colors.ink} strokeWidth="2.8" />
        <circle cx="80" cy="91" r="4.5" fill={colors.brand.DEFAULT} fillOpacity="0.55" />
        <circle cx="120" cy="91" r="4.5" fill={colors.brand.DEFAULT} fillOpacity="0.55" />
      </g>

      {/* Left arm bent up, forearm holding the phone */}
      <path
        d="M46 140 C30 156 24 186 30 210 C36 220 50 218 56 208 L76 180 C82 172 84 164 80 156 C74 148 64 142 46 140 Z"
        fill="#FFFFFF"
        stroke={colors.ink}
        strokeWidth="3.5"
      />

      {/* Phone tilted toward the face, with a small chart on the screen */}
      <g transform="rotate(-12 96 158)">
        <rect x="70" y="126" width="30" height="52" rx="6" fill={colors.ink} />
        <rect x="74" y="132" width="22" height="40" rx="2.5" fill={colors.brand.DEFAULT} />
        <path d="M78 160 L83 152 L87 156 L94 146" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
      </g>
      {/* Hand around the phone */}
      <ellipse cx="78" cy="168" rx="10" ry="9" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3.5" transform="rotate(-20 78 168)" />

      {/* Right arm hanging at the side, with a hand */}
      <path d="M154 140 C170 160 174 190 170 222 L150 224 C152 200 148 180 142 162 Z" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3.5" />
      <ellipse cx="160" cy="226" rx="9" ry="8" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3.5" />
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
