// Returns avatar initials from a display name: first and last word, uppercased.
// A single word uses its first two letters ("Rafi" -> "RA").
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return '?'
  }
  const first = words[0]
  const second = words.length > 1 ? words[words.length - 1] : words[0].slice(1)
  return (first.charAt(0) + second.charAt(0)).toUpperCase()
}
