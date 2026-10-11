import type { QuestionKind, Style } from './types.js'

// Default share of each form, in percent (docs/role.md 4.4).
const DEFAULT_SHARE: Record<QuestionKind, number> = { PG: 50, CERITA: 25, ISIAN: 10, ESAI: 15 }

const STYLE_SHARE: Record<Style, Record<QuestionKind, number>> = {
  Campuran: DEFAULT_SHARE,
  'Pilihan ganda saja': { PG: 100, CERITA: 0, ISIAN: 0, ESAI: 0 },
  'Banyak cerita': { PG: 20, CERITA: 50, ISIAN: 10, ESAI: 20 },
}

const ORDER: QuestionKind[] = ['PG', 'CERITA', 'ISIAN', 'ESAI']

// Splits the count by share. The largest remainder method keeps the total exact.
export function compositionFor(count: number, style: Style): Record<QuestionKind, number> {
  const share = STYLE_SHARE[style]
  const exact = ORDER.map((kind) => ({ kind, value: (count * share[kind]) / 100 }))
  const result = Object.fromEntries(ORDER.map((kind) => [kind, Math.floor(count * share[kind] / 100)])) as Record<QuestionKind, number>
  let missing = count - ORDER.reduce((sum, kind) => sum + result[kind], 0)
  const byRemainder = [...exact].sort((a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)))
  for (const item of byRemainder) {
    if (missing === 0) {
      break
    }
    if (share[item.kind] > 0) {
      result[item.kind] += 1
      missing -= 1
    }
  }
  return result
}
