import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ai } from '../src/ai/index.js'
import { AiUnavailableError } from '../src/ai/errors.js'
import { materiSummarySchema } from '../src/ai/materiSchemas.js'
import { materiSummaryPrompt } from '../src/ai/prompts.js'
import { prisma } from '../src/db.js'
import { processMaterial, summarizeWithAi } from '../src/materi/processing.js'
import { makePdf } from './materiFiles.js'
import { resetDatabase } from './helpers.js'

// Creates a material row the way the upload route does, so processing can be tested without the HTTP layer.
async function newMaterial(title: string): Promise<{ userId: string; id: string }> {
  const user = await prisma.user.create({
    data: { name: 'Pengguna Uji', email: `${title}@contoh.id`, passwordHash: 'tidak-dipakai' },
  })
  const material = await prisma.material.create({
    data: { userId: user.id, title, type: 'PDF', sizeBytes: 100, status: 'MEMPROSES' },
  })
  return { userId: user.id, id: material.id }
}

describe('skema ringkasan materi', () => {
  it('menerima 3 sampai 5 poin ringkasan dan 1 sampai 5 usulan topik', () => {
    const valid = { ringkasan: ['Poin satu.', 'Poin dua.', 'Poin tiga.'], usulanTopik: ['Persamaan linear'] }
    expect(materiSummarySchema.safeParse(valid).success).toBe(true)
  })

  it('menolak ringkasan kurang dari 3 poin', () => {
    const tooFew = { ringkasan: ['Poin satu.', 'Poin dua.'], usulanTopik: ['Persamaan linear'] }
    expect(materiSummarySchema.safeParse(tooFew).success).toBe(false)
  })

  it('menolak tanpa usulan topik', () => {
    const noTopic = { ringkasan: ['Poin satu.', 'Poin dua.', 'Poin tiga.'], usulanTopik: [] }
    expect(materiSummarySchema.safeParse(noTopic).success).toBe(false)
  })
})

describe('pemrosesan materi', () => {
  beforeEach(resetDatabase)

  it('teks dibaca, disimpan, lalu materi berubah menjadi SIAP dengan hasil AI', async () => {
    const { id } = await newMaterial('modul-persamaan')
    const seen: string[] = []
    await processMaterial(id, { buffer: makePdf(['Persamaan linear satu variabel adalah persamaan yang pangkat variabelnya satu.']), type: 'PDF' }, async (text) => {
      seen.push(text)
      return { ringkasan: ['Persamaan linear punya satu variabel.', 'Kedua ruas dikerjakan bersama.', 'Hasil dicek dengan substitusi.'], usulanTopik: ['Persamaan linear'] }
    })

    const row = await prisma.material.findUniqueOrThrow({ where: { id } })
    expect(seen[0]).toContain('Persamaan linear satu variabel adalah persamaan yang pangkat variabelnya satu.')
    expect(row.status).toBe('SIAP')
    expect(row.teksEkstrak).toContain('Persamaan linear satu variabel adalah persamaan yang pangkat variabelnya satu.')
    expect(row.summary).toHaveLength(3)
    expect(row.suggestedTopics).toEqual(['Persamaan linear'])
    expect(row.error).toBeNull()
  })

  it('kalau AI tidak tersedia, materi menjadi GAGAL dengan pesan untuk pengguna', async () => {
    const { id } = await newMaterial('modul-gagal')
    await processMaterial(id, { buffer: makePdf(['Teks yang cukup panjang untuk diringkas di sini.']), type: 'PDF' }, async () => {
      throw new AiUnavailableError()
    })

    const row = await prisma.material.findUniqueOrThrow({ where: { id } })
    expect(row.status).toBe('GAGAL')
    expect(row.error).toBe('Ringkasan belum bisa dibuat. Coba unggah lagi nanti.')
  })

  it('berkas tanpa teks menjadi GAGAL dan AI tidak dipanggil', async () => {
    const { id } = await newMaterial('modul-scan')
    const summarize = vi.fn()
    await processMaterial(id, { buffer: makePdf([]), type: 'PDF' }, summarize)

    const row = await prisma.material.findUniqueOrThrow({ where: { id } })
    expect(row.status).toBe('GAGAL')
    expect(row.error).toBe('Tidak ada teks yang bisa dibaca. Berkas mungkin hasil scan atau kosong.')
    expect(summarize).not.toHaveBeenCalled()
  })

  it('materi yang teksnya terlalu pendek menjadi GAGAL dan tidak diringkas', async () => {
    const { id } = await newMaterial('modul-pendek')
    const summarize = vi.fn()
    await processMaterial(id, { buffer: makePdf(['Terlalu pendek.']), type: 'PDF' }, summarize)

    const row = await prisma.material.findUniqueOrThrow({ where: { id } })
    expect(row.status).toBe('GAGAL')
    expect(row.error).toBe('Teks terlalu pendek untuk diringkas.')
    expect(summarize).not.toHaveBeenCalled()
  })

  it('AI hanya menerima teks materi dan instruksi, tanpa nama file atau data akun', async () => {
    const spy = vi.spyOn(ai, 'complete')
    try {
      await summarizeWithAi('Pecahan adalah bagian dari keseluruhan.')
      const request = spy.mock.calls[0]?.[0]
      expect(request?.task).toBe('MATERI_RINGKAS')
      expect(request?.system).toBe(materiSummaryPrompt())
      expect(request?.user).toBe('Teks materi:\n<<<\nPecahan adalah bagian dari keseluruhan.\n>>>')
      expect(request?.user).not.toContain('@')
    } finally {
      spy.mockRestore()
    }
  })
})
