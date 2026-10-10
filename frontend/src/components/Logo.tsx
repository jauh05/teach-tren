type LogoProps = {
  size?: number
  className?: string
}

// Logo from the mockup (docs/design/html/*.html), drawn as an inline SVG.
export function Logo({ size = 20, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="60" cy="60" r="60" fill="#2563EB" />
      <polyline
        points="30,78 50,62 64,68 90,44"
        fill="none"
        stroke="#fff"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
