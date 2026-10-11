import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/db.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()
const PDF_BYTES = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF')
const ZIP_BYTES = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(64)])

// Waits until the material has finished processing. Processing is quick in tests.
async function waitUntilReady(agent: ReturnType<typeof request.agent>, id: string) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const list = await agent.get('/api/materi')
    const material = list.body.materials.find((item: { id: string }) => item.id === id)
    if (material?.status !== 'MEMPROSES') {
      return material
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error('Materi tidak selesai diproses dalam waktu yang wajar.')
}

describe('materi', () => {
  beforeEach(resetDatabase)

  it('unggah PDF membuat materi yang berubah menjadi Siap dengan ringkasan', async () => {
    const agent = await registerAgent(app)
    const uploaded = await agent.post('/api/materi').attach('berkas', PDF_BYTES, 'modul-persamaan.pdf')
    expect(uploaded.status).toBe(201)
    expect(uploaded.body.material.status).toBe('MEMPROSES')
    expect(uploaded.body.material.title).toBe('modul-persamaan')

    const ready = await waitUntilReady(agent, uploaded.body.material.id)
    expect(ready.status).toBe('SIAP')
    expect(ready.summary).toHaveLength(4)
    expect(ready.suggestedTopics).toContain('Pengantar modul-persamaan')
  })

  it('teks dengan ekstensi pdf ditolak dengan status 422', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/materi').attach('berkas', Buffer.from('Ini teks biasa'), 'catatan.pdf')
    expect(response.status).toBe(422)
    expect(response.body.pesan).toBe('Isi berkas tidak sesuai dengan jenisnya.')
  })

  it('berkas di atas 20 MB ditolak', async () => {
    const agent = await registerAgent(app)
    const big = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(20 * 1024 * 1024)])
    const response = await agent.post('/api/materi').attach('berkas', big, 'besar.pdf')
    expect(response.status).toBe(400)
    expect(response.body.pesan).toBe('Ukuran berkas maksimal 20 MB.')
  })

  it('format yang tidak didukung dan unggahan tanpa berkas ditolak', async () => {
    const agent = await registerAgent(app)
    const wrongFormat = await agent.post('/api/materi').attach('berkas', PDF_BYTES, 'gambar.png')
    expect(wrongFormat.body.pesan).toBe('Format berkas harus PDF, DOCX, atau PPTX.')
    const empty = await agent.post('/api/materi')
    expect(empty.status).toBe(400)
    expect(empty.body.pesan).toBe('Pilih berkas terlebih dahulu.')
  })

  it('batas 50 materi ditegakkan di server', async () => {
    const agent = await registerAgent(app)
    const user = await agent.get('/api/auth/me')
    await prisma.material.createMany({
      data: Array.from({ length: 50 }, (_, index) => ({
        userId: user.body.user.id,
        title: `materi-${index}`,
        type: 'PDF' as const,
        sizeBytes: 100,
        status: 'SIAP' as const,
      })),
    })
    const response = await agent.post('/api/materi').attach('berkas', PDF_BYTES, 'tambahan.pdf')
    expect(response.status).toBe(400)
    expect(response.body.pesan).toBe('Batas 50 materi sudah tercapai.')
  })

  it('materi dikaitkan ke bulat dan tampil di daftar bulat', async () => {
    const agent = await registerAgent(app)
    const uploaded = await agent.post('/api/materi').attach('berkas', ZIP_BYTES, 'catatan-fungsi.docx')
    const id = uploaded.body.material.id
    await waitUntilReady(agent, id)

    const linked = await agent.post(`/api/materi/${id}/link`).send({ topicId: 'fungsi-kuadrat' })
    expect(linked.status).toBe(200)
    expect(linked.body.material.linkedTopicId).toBe('fungsi-kuadrat')

    const topics = await agent.get('/api/topics')
    const topic = topics.body.topics.find((item: { id: string }) => item.id === 'fungsi-kuadrat')
    expect(topic.materials).toEqual(['catatan-fungsi'])
  })

  it('bulat milik orang lain tidak bisa dipakai untuk mengaitkan materi', async () => {
    const owner = await registerAgent(app, 'pemilik@contoh.id')
    const created = await owner.post('/api/topics').send({ name: 'Rahasia' })
    const other = await registerAgent(app, 'lain@contoh.id')
    const uploaded = await other.post('/api/materi').attach('berkas', PDF_BYTES, 'modul.pdf')

    const response = await other.post(`/api/materi/${uploaded.body.material.id}/link`).send({ topicId: created.body.topic.id })
    expect(response.status).toBe(404)
    expect(response.body.pesan).toBe('Bulat tidak ditemukan.')
  })

  it('materi milik orang lain tidak bisa dilihat atau dikaitkan', async () => {
    const owner = await registerAgent(app, 'pemilik@contoh.id')
    const uploaded = await owner.post('/api/materi').attach('berkas', PDF_BYTES, 'modul.pdf')
    const other = await registerAgent(app, 'lain@contoh.id')

    const list = await other.get('/api/materi')
    expect(list.body.materials).toHaveLength(0)
    const link = await other.post(`/api/materi/${uploaded.body.material.id}/link`).send({ topicId: 'bilangan' })
    expect(link.status).toBe(404)
  })

  it('tanpa sesi, materi ditolak', async () => {
    const response = await request(app).post('/api/materi').attach('berkas', PDF_BYTES, 'modul.pdf')
    expect(response.status).toBe(401)
  })
})
