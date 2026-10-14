// Makes the AI's formulas readable by the markdown renderer. The model sometimes writes LaTeX without the dollar signs,
// or with \( \) and \[ \]. remark-math only reads $...$ and $$...$$, so those are converted or wrapped here.
// Code blocks are left as they are.

// A line that contains LaTeX-only syntax (a command, or ^{ } and _{ } groups) and no dollar sign yet.
const LATEX_ONLY = /\\[a-zA-Z]+|[\^_]\{/

export function normalizeMath(content: string): string {
  let inCode = false
  return content
    .split('\n')
    .map((line) => {
      if (line.trimStart().startsWith('```')) {
        inCode = !inCode
        return line
      }
      if (inCode) {
        return line
      }
      return wrapBareFormula(convertParentheses(line))
    })
    .join('\n')
}

// \( x \) becomes $x$, and \[ x \] becomes $$x$$, on the same line.
function convertParentheses(line: string): string {
  return line.replace(/\\\[(.+?)\\\]/g, (_, formula: string) => `$$${formula.trim()}$$`).replace(/\\\((.+?)\\\)/g, (_, formula: string) => `$${formula.trim()}$`)
}

// Wraps a whole line in dollar signs when it is a formula without them. Only the part after a list marker is wrapped,
// and a trailing full stop stays outside the formula.
function wrapBareFormula(line: string): string {
  if (line.includes('$') || !LATEX_ONLY.test(line)) {
    return line
  }
  const match = /^(\s*(?:[-*]|\d+\.)?\s*)(.*?)\s*$/.exec(line)
  if (!match) {
    return line
  }
  const [, prefix, body] = match
  const dot = body.endsWith('.') ? '.' : ''
  const formula = dot ? body.slice(0, -1) : body
  if (formula.length === 0) {
    return line
  }
  return `${prefix}$${formula}$${dot}`
}
