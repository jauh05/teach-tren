interface RoadLoaderProps {
  message: string
  // A second line for things that take a while, for example why the wait can be long.
  detail?: string
}

// A loading state drawn as a road: the dashed center line keeps moving while the server works.
export function RoadLoader({ message, detail }: RoadLoaderProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 p-6">
      <svg viewBox="0 0 240 40" className="h-10 w-60 max-w-full" aria-hidden="true">
        <path
          d="M4 20 C 50 4, 80 36, 120 20 S 190 4, 236 20"
          fill="none"
          stroke="#1F2937"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d="M4 20 C 50 4, 80 36, 120 20 S 190 4, 236 20"
          className="road-dash"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1.8}
          strokeDasharray="6 8"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm text-ink">{message}</p>
      {detail && <p className="text-xs text-muted">{detail}</p>}
    </div>
  )
}
