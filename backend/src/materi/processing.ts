import { AiUnavailableError } from '../ai/errors.js'
import { ai } from '../ai/index.js'
import { materiSummarySchema, type MateriSummary } from '../ai/materiSchemas.js'
import { materiSummaryPrompt } from '../ai/prompts.js'
import { prisma } from '../db.js'
import { logger } from '../logger.js'
import { ExtractError, extractMaterialText, type MaterialFileType } from './extract.js'

// Only this much of the text goes to the AI. A longer material is summarized from its beginning.
const MAX_AI_CHARS = 12_000
// Less text than this cannot give a useful summary.
const MIN_TEXT_CHARS = 40

// Answer used in mock mode and in tests. It does not depend on the file, so no text is needed.
const MOCK_SUMMARY: MateriSummary = {
  ringkasan: [
    'Materi ini dibagi menjadi beberapa bagian utama.',
    'Setiap bagian memuat konsep, contoh, dan latihan singkat.',
    'Istilah penting dijelaskan di awal setiap bagian.',
    'Rumus dan contoh hitungan ditulis langkah demi langkah.',
  ],
  usulanTopik: ['Pengantar materi', 'Latihan materi'],
}

export type Summarizer = (text: string) => Promise<MateriSummary>

// Asks the AI for a summary. Only the text of the material is sent: no file name, author, or account data.
export async function summarizeWithAi(text: string): Promise<MateriSummary> {
  const excerpt = text.slice(0, MAX_AI_CHARS)
  const result = await ai.complete({
    task: 'MATERI_RINGKAS',
    system: materiSummaryPrompt(),
    user: `Teks materi:\n<<<\n${excerpt}\n>>>`,
    schema: materiSummarySchema,
    mock: () => JSON.stringify(MOCK_SUMMARY),
  })
  return result
}

// Starts processing in the background. The file is only held in memory until the text is read.
export function scheduleProcessing(materialId: string, file: { buffer: Buffer; type: MaterialFileType }): void {
  setImmediate(() => {
    processMaterial(materialId, file).catch((error: unknown) => {
      logger.error({ err: error, materialId }, 'Pemrosesan materi gagal')
    })
  })
}

async function markFailed(materialId: string, message: string): Promise<void> {
  await prisma.material.update({ where: { id: materialId }, data: { status: 'GAGAL', error: message } })
}

// Reads the file, stores its text, and writes the summary. Every failure ends with status GAGAL and a readable message.
export async function processMaterial(
  materialId: string,
  file: { buffer: Buffer; type: MaterialFileType },
  summarize: Summarizer = summarizeWithAi,
): Promise<void> {
  let text: string
  try {
    text = await extractMaterialText(file.buffer, file.type)
  } catch (error) {
    if (error instanceof ExtractError) {
      await markFailed(materialId, error.message)
      return
    }
    throw error
  }
  if (text.length < MIN_TEXT_CHARS) {
    await markFailed(materialId, 'Teks terlalu pendek untuk diringkas.')
    return
  }
  await prisma.material.update({ where: { id: materialId }, data: { teksEkstrak: text } })

  try {
    const result = await summarize(text)
    await prisma.material.update({
      where: { id: materialId },
      data: { status: 'SIAP', summary: result.ringkasan, suggestedTopics: result.usulanTopik, error: null },
    })
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      await markFailed(materialId, 'Ringkasan belum bisa dibuat. Coba unggah lagi nanti.')
      return
    }
    throw error
  }
}
