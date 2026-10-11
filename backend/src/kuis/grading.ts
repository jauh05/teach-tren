import type { RubricData } from './types.js'

// Grading rules shared by the server. The same rules run in the browser in the first version (domain/penilaian.ts).
const LOW_CONFIDENCE_WORDS = 6

// Lowercase, no currency prefix, no thousand separators, single spaces.
// "Rp4.000" and "4000" become the same text.
export function normalizeAnswer(text: string): string {
  return text
    .toLocaleLowerCase('id-ID')
    .replace(/\brp\.?\s*/g, '')
    .replace(/(\d)[.,](?=\d{3}\b)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// 100 when the answer matches one of the accepted answers, otherwise 0.
export function gradeFill(answer: string, acceptedAnswers: string[]): number {
  const normalized = normalizeAnswer(answer)
  if (normalized === '') {
    return 0
  }
  const accepted = acceptedAnswers.some((item) => normalizeAnswer(item).replace(/\s/g, '') === normalized.replace(/\s/g, ''))
  return accepted ? 100 : 0
}

// Essay grading by keywords. It is the fallback when the AI grader cannot be reached, so its answers are marked for review.
export function gradeEssayByKeywords(answer: string, rubric: RubricData[]): { score: number; lowConfidence: boolean } {
  const normalized = normalizeAnswer(answer)
  const earned = rubric.map((item) => item.keywords.some((keyword) => normalized.includes(normalizeAnswer(keyword))))
  const totalWeight = rubric.reduce((sum, item) => sum + item.weight, 0)
  const earnedWeight = rubric.reduce((sum, item, index) => sum + (earned[index] ? item.weight : 0), 0)
  const score = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100)
  const matched = earned.filter(Boolean).length
  const lowConfidence = wordCount(answer) < LOW_CONFIDENCE_WORDS || matched * 2 < rubric.length
  return { score, lowConfidence }
}

// Keywords for a rubric point made by the AI. Longer words of the point text are used.
export function keywordsOf(point: string): string[] {
  return point
    .toLocaleLowerCase('id-ID')
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word.length >= 4)
}
