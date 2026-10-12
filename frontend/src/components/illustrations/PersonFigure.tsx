import { colors } from '../../theme/tokens'

// A cartoon man in a sweater, looking down at a phone held at the chest. Used by the sign-in pages and the learning-plan wizard.
// Drawn in a 200 x 230 box, so it can be placed with a transform.

const SWEATER = 'M28 222 C28 172 38 144 64 132 L82 124 Q100 130 118 124 L136 132 C162 144 172 172 172 222 Z'

export function PersonFigure() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="person-dots" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="4" r="1.6" fill={colors.ink} />
          <circle cx="10" cy="10.5" r="1.6" fill={colors.ink} />
        </pattern>
      </defs>

      {/* Neck, hidden behind the sweater collar */}
      <path d="M88 100 L88 126 M112 100 L112 126" fill="none" stroke={colors.ink} strokeWidth="3" />

      {/* Sweater with a dotted pattern and two fold lines */}
      <path d={SWEATER} fill="#FFFFFF" />
      <path d={SWEATER} fill="url(#person-dots)" />
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
