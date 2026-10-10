// True when the text has a LaTeX delimiter. Only then is KaTeX needed to render it.
export function containsMath(text: string): boolean {
  return text.includes('$')
}
