// Splits text into word-sized pieces, keeping the trailing whitespace so that joining them restores the original.
export function splitIntoChunks(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? []
}

interface StreamOptions {
  signal: AbortSignal
  onChunk: (chunk: string) => void
  // Delay between chunks in milliseconds. The mock uses a short delay to imitate a live answer.
  delayMs?: number
}

// Emits chunks one by one. Resolves true when every chunk was emitted, false when aborted.
export async function streamChunks(chunks: string[], options: StreamOptions): Promise<boolean> {
  const { signal, onChunk, delayMs = 18 } = options
  for (const chunk of chunks) {
    await wait(delayMs, signal)
    if (signal.aborted) {
      return false
    }
    onChunk(chunk)
  }
  return !signal.aborted
}

// Waits for the delay, or resolves early when the signal aborts.
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timer = setTimeout(finish, ms)
    signal.addEventListener('abort', finish, { once: true })
  })
}
