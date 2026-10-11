// Grading for fill-in and essay questions. Pure functions, covered by unit tests.
// Essays are graded by rubric keywords here. The AI grading arrives with the backend (CC-07).

export interface RubricResult {
  point: string
  earned: boolean
  weight: number
}

export interface EssayGrade {
  score: number
  results: RubricResult[]
  // Low confidence means the answer is too short or matches few points. It is marked for review.
  lowConfidence: boolean
}

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

export function gradeEssay(answer: string, rubric: { point: string; keywords: string[]; weight: number }[]): EssayGrade {
  const normalized = normalizeAnswer(answer)
  const results = rubric.map((item) => ({
    point: item.point,
    weight: item.weight,
    earned: item.keywords.some((keyword) => normalized.includes(normalizeAnswer(keyword))),
  }))
  const totalWeight = rubric.reduce((sum, item) => sum + item.weight, 0)
  const earnedWeight = results.filter((item) => item.earned).reduce((sum, item) => sum + item.weight, 0)
  const score = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100)
  const matched = results.filter((item) => item.earned).length
  const lowConfidence = wordCount(answer) < LOW_CONFIDENCE_WORDS || matched * 2 < results.length
  return { score, results, lowConfidence }
}
