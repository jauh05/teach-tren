import { colors } from '../../theme/tokens'

// A young man in a crew-neck sweater, looking down at a phone held at the chest. He looks at the screen, so we see the back of the phone.
// Used by the sign-in pages and the learning-plan wizard. Drawn in a 200 x 230 box, so it can be placed with a transform.

const SWEATER = 'M36 224 C36 178 42 150 64 138 Q84 128 100 128 Q116 128 136 138 C158 150 164 178 164 224 Z'

export function PersonFigure() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="person-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3.5" r="1.3" fill={colors.ink} />
          <circle cx="9" cy="9" r="1.3" fill={colors.ink} />
        </pattern>
      </defs>

      {/* Neck, behind the sweater collar */}
      <path d="M90 98 L90 120 M110 98 L110 120" fill="none" stroke={colors.ink} strokeWidth="3" />

      {/* Sweater with a light dotted pattern and soft fold lines */}
      <path d={SWEATER} fill="#FFFFFF" />
      <path d={SWEATER} fill="url(#person-dots)" />
      <path d={SWEATER} fill="none" stroke={colors.ink} strokeWidth="3.2" />
      <path d="M72 188 Q78 202 74 218 M128 188 Q122 202 126 218" fill="none" stroke={colors.ink} strokeWidth="1.8" />

      {/* Crew neck collar */}
      <path d="M84 118 Q100 134 116 118" fill="none" stroke={colors.ink} strokeWidth="3" />

      {/* Head, tilted a little down toward the phone */}
      <g transform="rotate(-4 100 96)">
        {/* Right ear, behind the face */}
        <path d="M126 64 C132 62 134 76 126 80" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3" />
        {/* Face */}
        <path
          d="M74 68 C74 46 86 38 100 38 C114 38 126 46 126 68 C126 86 118 100 106 104 Q100 107 94 104 C82 100 74 86 74 68 Z"
          fill="#FFFFFF"
          stroke={colors.ink}
          strokeWidth="3.2"
        />
        {/* Short hair, swept to one side */}
        <path d="M72 64 C68 46 80 34 100 34 C118 34 130 44 128 62 C124 54 116 48 106 46 C96 50 84 48 78 54 C75 57 73 60 72 64 Z" fill={colors.ink} />
        {/* Brows, eyes, nose, and a calm smile */}
        <path d="M84 62 Q88 59 93 61 M107 61 Q112 59 116 62" fill="none" stroke={colors.ink} strokeWidth="2.2" />
        <ellipse cx="88.5" cy="70" rx="2.4" ry="2.9" fill={colors.ink} />
        <ellipse cx="111.5" cy="70" rx="2.4" ry="2.9" fill={colors.ink} />
        <path d="M101 74 Q98 80 102 81" fill="none" stroke={colors.ink} strokeWidth="1.9" />
        <path d="M93 89 Q100 93 107 89" fill="none" stroke={colors.ink} strokeWidth="2.2" />
      </g>

      {/* Left arm bent up, the forearm bringing the phone to the chest */}
      <path
        d="M62 142 C48 154 42 180 46 204 C48 214 62 214 68 206 L84 186 C92 176 94 164 88 156 C82 150 72 146 62 142 Z"
        fill="#FFFFFF"
        stroke={colors.ink}
        strokeWidth="3.2"
      />

      {/* Back of the phone, with a camera module */}
      <g transform="rotate(-10 92 158)">
        <rect x="78" y="128" width="28" height="50" rx="6" fill={colors.ink} />
        <rect x="83" y="133" width="10" height="10" rx="2.5" fill="#FFFFFF" />
        <circle cx="86" cy="137" r="1.6" fill={colors.ink} />
        <circle cx="90" cy="141" r="1.6" fill={colors.ink} />
      </g>
      {/* Hand around the lower part of the phone, with the thumb on the edge */}
      <ellipse cx="88" cy="172" rx="10" ry="8.5" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3.2" transform="rotate(-14 88 172)" />
      <ellipse cx="79" cy="164" rx="4" ry="3" fill="#FFFFFF" stroke={colors.ink} strokeWidth="2.4" transform="rotate(-20 79 164)" />

      {/* Right arm hanging at the side, relaxed */}
      <path d="M152 142 C166 158 170 188 166 224 L146 226 C148 202 144 180 138 162 Z" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3.2" />
      <ellipse cx="156" cy="228" rx="8" ry="7.5" fill="#FFFFFF" stroke={colors.ink} strokeWidth="3.2" />
    </g>
  )
}
