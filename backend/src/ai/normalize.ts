import { z } from 'zod'
import { jsonrepair } from 'jsonrepair'

// Turns the raw text of a model into a JSON value (docs/role.md CC-06, section 4 of the normalization rules).
// Steps: remove markdown fences, take the first balanced object, fix backslashes, remove trailing commas.

export function stripFences(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  return fenced ? fenced[1] : text
}

// The first object whose braces balance. Braces inside strings are ignored.
export function firstJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start < 0) {
    return null
  }
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < text.length; index++) {
    const char = text[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
    } else if (char === '{') {
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0) {
        return text.slice(start, index + 1)
      }
    }
  }
  return null
}

// LaTeX commands whose names start with a letter that is also a JSON escape (b, f, n, r, t).
// "\n" followed by a word is a newline in JSON, but "\neq" or "\times" is a formula.
const LATEX_WITH_ESCAPE_LETTER = new Set([
  'beta', 'bar', 'begin', 'binom', 'bigl', 'bigr', 'boldsymbol', 'bf',
  'frac', 'dfrac', 'tfrac', 'forall',
  'neq', 'ne', 'neg', 'nabla', 'not', 'nu', 'notin', 'nless',
  'rightarrow', 'rho', 'right', 'rangle', 'rm', 'leftarrow', 'leftrightarrow',
  'text', 'textbf', 'textit', 'times', 'tan', 'tau', 'theta', 'to', 'triangle', 'tiny',
])

// A backslash that starts a valid JSON escape is kept. Everything else is doubled, so LaTeX such as \frac,
// \times, or \neq stays as text. A word that starts with b, f, n, r, or t is a JSON escape followed by text,
// unless it is a known LaTeX command.
export function fixBackslashes(json: string): string {
  return json.replace(/\\(u[0-9a-fA-F]{4}|["\\/]|[a-zA-Z]+|[\s\S]?)/g, (match: string, token: string) => {
    if (/^u[0-9a-fA-F]{4}$/.test(token) || token === '"' || token === '\\' || token === '/') {
      return match
    }
    if (token.length === 1 && 'bfnrt'.includes(token)) {
      return match
    }
    if ('bfnrt'.includes(token.charAt(0)) && /^[a-zA-Z]+$/.test(token) && !LATEX_WITH_ESCAPE_LETTER.has(token)) {
      return match
    }
    return `\\\\${token}`
  })
}

// Trailing commas before a closing brace or bracket are removed.
export function removeTrailingCommas(json: string): string {
  return json.replace(/,\s*([}\]])/g, '$1')
}

// Parses model text into a JSON value. Throws when no valid JSON can be read.
export function normalizeModelJson(raw: string): unknown {
  const text = stripFences(raw)
  const object = firstJsonObject(text)
  if (object === null) {
    // The brackets do not balance, so the answer is cut short or broken. Repair what is there.
    const start = text.indexOf('{')
    if (start < 0) {
      throw new Error('Tidak ada objek JSON dalam keluaran.')
    }
    return JSON.parse(jsonrepair(text.slice(start))) as unknown
  }
  const fixed = removeTrailingCommas(fixBackslashes(object))
  try {
    return JSON.parse(fixed) as unknown
  } catch {
    // Last resort for small slips a model makes, such as a missing closing quote. A structure that is still wrong
    // fails the schema check afterwards, so nothing invalid is accepted.
    return JSON.parse(jsonrepair(fixed)) as unknown
  }
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

// Normalizes and then validates against the schema of the task. The error text is used for one repair attempt.
export function parseModelOutput<T>(raw: string, schema: z.ZodType<T>): ParseResult<T> {
  let json: unknown
  try {
    json = normalizeModelJson(raw)
  } catch {
    return { ok: false, error: 'Keluaran bukan JSON yang bisa dibaca.' }
  }
  const result = schema.safeParse(json)
  if (result.success) {
    return { ok: true, value: result.data }
  }
  return {
    ok: false,
    error: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
  }
}
