interface CapsuleLoaderProps {
  message: string
  // A second line for things that take a while, for example why the wait can be long.
  detail?: string
}

// A loading state drawn as a capsule that fills up. It is not a timer: it fills slowly, and the content replaces it
// when the answer arrives. The chat around it stays where it is.
export function CapsuleLoader({ message, detail }: CapsuleLoaderProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 p-4">
      <div className="h-4 w-full max-w-[280px] overflow-hidden rounded-full border border-line bg-brand-soft">
        <div className="capsule-fill h-full w-full rounded-full bg-brand" />
      </div>
      <p className="text-sm text-ink">{message}</p>
      {detail && <p className="text-xs text-muted">{detail}</p>}
    </div>
  )
}
