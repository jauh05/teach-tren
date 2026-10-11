import { prisma } from '../db.js'
import { config } from '../config/index.js'
import { logger } from '../logger.js'

// Reading the file and writing the summary with AI come later (CC-06, CC-09).
// Until then the summary is a placeholder built from the title, so the flow can be used end to end.
export function placeholderSummary(title: string): { summary: string[]; suggestedTopics: string[] } {
  return {
    summary: [
      `${title} dibagi menjadi beberapa bagian utama.`,
      'Setiap bagian memuat konsep, contoh, dan latihan singkat.',
      'Istilah penting dijelaskan di awal setiap bagian.',
      'Rumus dan contoh hitungan ditulis langkah demi langkah.',
    ],
    suggestedTopics: [`Pengantar ${title}`, `Latihan ${title}`],
  }
}

// Moves a material from "Memproses" to "Siap" after the processing delay.
export function scheduleProcessing(materialId: string): void {
  const timer = setTimeout(() => {
    finishProcessing(materialId).catch((error: unknown) => {
      logger.error({ err: error, materialId }, 'Pemrosesan materi gagal')
    })
  }, config.MATERI_PROCESSING_MS)
  // The timer must not keep the process alive, for example when a test run ends.
  timer.unref()
}

async function finishProcessing(materialId: string): Promise<void> {
  const material = await prisma.material.findUnique({ where: { id: materialId } })
  if (!material) {
    return
  }
  const ready = placeholderSummary(material.title)
  await prisma.material.update({
    where: { id: materialId },
    data: { status: 'SIAP', summary: ready.summary, suggestedTopics: ready.suggestedTopics },
  })
}
