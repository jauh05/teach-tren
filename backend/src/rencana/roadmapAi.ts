import { AiUnavailableError } from '../ai/errors.js'
import { ai } from '../ai/index.js'
import { roadmapSystemPrompt } from '../ai/prompts.js'
import { roadmapSchema, type Roadmap } from '../ai/schemas.js'
import { config } from '../config/index.js'
import { findSubject, type CurriculumLevel } from '../kurikulum/catalog.js'
import { logger } from '../logger.js'
import { normalizeTopicName } from '../topics/names.js'

// A roadmap has between 6 and 12 branches (cabang). One branch becomes one topic (neuron) on the canvas.
export const MIN_CABANG = 6
export const MAX_CABANG = 12

export interface Cabang {
  mapel: string
  nama: string
}

export interface GeneratedRoadmap {
  cabang: Cabang[]
  // "ai" when the model wrote the roadmap. "katalog" when it came from the curriculum list (AI off, mock mode, or a bad answer).
  sumber: 'ai' | 'katalog'
}

interface RoadmapInput {
  level: CurriculumLevel
  grade: number
  subjects: string[]
}

// Branches from the curriculum list. Subjects take turns, so each chosen subject is represented, up to MAX_CABANG.
// When the list has too few topics, practice branches are added until MIN_CABANG.
export function catalogCabang(input: RoadmapInput): Cabang[] {
  const queues = input.subjects.map((name) => ({ name, topics: findSubject(input.level, name)?.topics ?? [] }))
  const cabang: Cabang[] = []
  for (let index = 0; cabang.length < MAX_CABANG && queues.some((queue) => index < queue.topics.length); index += 1) {
    for (const queue of queues) {
      if (index < queue.topics.length && cabang.length < MAX_CABANG) {
        cabang.push({ mapel: queue.name, nama: queue.topics[index] })
      }
    }
  }
  for (let practice = 1; cabang.length < MIN_CABANG && input.subjects.length > 0; practice += 1) {
    const mapel = input.subjects[(practice - 1) % input.subjects.length]
    cabang.push({ mapel, nama: `Latihan ${mapel} ${practice}` })
  }
  return cabang
}

// Keeps only branches of the chosen subjects, drops empty and repeated names, and stops at MAX_CABANG.
export function cleanCabang(raw: Cabang[], subjects: string[]): Cabang[] {
  const allowed = new Set(subjects)
  const seen = new Set<string>()
  const cabang: Cabang[] = []
  for (const item of raw) {
    const nama = item.nama.trim().slice(0, 60)
    const key = normalizeTopicName(nama)
    if (!allowed.has(item.mapel) || nama === '' || seen.has(key)) {
      continue
    }
    seen.add(key)
    cabang.push({ mapel: item.mapel, nama })
    if (cabang.length === MAX_CABANG) {
      break
    }
  }
  return cabang
}

// Judges the model's answer. A roadmap with fewer than MIN_CABANG usable branches is replaced by the curriculum list.
export function roadmapFromAnswer(answer: Roadmap, input: RoadmapInput): GeneratedRoadmap {
  const cabang = cleanCabang(answer.cabang, input.subjects)
  if (cabang.length < MIN_CABANG) {
    return { cabang: catalogCabang(input), sumber: 'katalog' }
  }
  return { cabang, sumber: 'ai' }
}

// Writes the roadmap with the AI. In mock mode, and when the AI is unavailable, the curriculum list is used,
// so the user is never left without a roadmap. The source is returned, so the screen can say which one was used.
export async function generateRoadmap(input: RoadmapInput): Promise<GeneratedRoadmap> {
  const gradeLabel = `${input.level.gradeUnit} ${input.grade}`
  if (config.AI_MODE === 'mock') {
    return { cabang: catalogCabang(input), sumber: 'katalog' }
  }

  let answer: Roadmap
  try {
    answer = await ai.complete({
      task: 'RENCANA_ROADMAP',
      system: roadmapSystemPrompt(
        JSON.stringify({ jenjang: input.level.label, kelas: gradeLabel, mataPelajaran: input.subjects }),
      ),
      user: `Susun roadmap belajar ${input.level.label}, ${gradeLabel}, untuk ${input.subjects.join(', ')}.`,
      schema: roadmapSchema,
      mock: () => JSON.stringify({ cabang: catalogCabang(input) }),
    })
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      logger.warn({ err: error }, 'Roadmap memakai daftar kurikulum karena AI tidak tersedia')
      return { cabang: catalogCabang(input), sumber: 'katalog' }
    }
    throw error
  }

  const result = roadmapFromAnswer(answer, input)
  if (result.sumber === 'katalog') {
    logger.warn('Jawaban AI untuk roadmap tidak memenuhi aturan, memakai daftar kurikulum')
  }
  return result
}
