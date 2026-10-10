// Splits a topic name into at most two lines of about maxChars characters each (docs/role.md CC-03).
export function wrapLabel(text: string, maxChars = 14): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current === '' || candidate.length <= maxChars) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) {
    lines.push(current)
  }

  if (lines.length <= 2) {
    return lines
  }
  const rest = lines.slice(1).join(' ')
  const shortened = rest.length > maxChars ? `${rest.slice(0, maxChars - 1)}…` : rest
  return [lines[0], shortened]
}
