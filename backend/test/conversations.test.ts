import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()

const pertanyaan = { id: 'pesan-1', role: 'user', content: 'Apa itu sel?', status: 'done' }
const jawaban = { id: 'pesan-2', role: 'assistant', content: 'Sel adalah unit terkecil makhluk hidup.', status: 'done' }

describe('percakapan', () => {
  beforeEach(resetDatabase)

  it('menyimpan lalu membaca pesan dalam urutan yang sama', async () => {
    const agent = await registerAgent(app)
    await agent.put('/api/conversations/sel').send({ title: 'Apa itu sel?', messages: [pertanyaan, jawaban] }).expect(200)

    const response = await agent.get('/api/conversations/sel').expect(200)
    expect(response.body.conversation.title).toBe('Apa itu sel?')
    expect(response.body.conversation.messages.map((message: { id: string }) => message.id)).toEqual(['pesan-1', 'pesan-2'])
  })

  it('menyimpan ulang menggantikan pesan lama, tidak menambahkannya', async () => {
    const agent = await registerAgent(app)
    await agent.put('/api/conversations/sel').send({ title: 'Sel', messages: [pertanyaan, jawaban] })
    await agent.put('/api/conversations/sel').send({ title: 'Sel', messages: [pertanyaan] }).expect(200)

    const response = await agent.get('/api/conversations/sel')
    expect(response.body.conversation.messages).toHaveLength(1)
  })

  it('jawaban yang masih mengalir boleh disimpan', async () => {
    const agent = await registerAgent(app)
    const streaming = { id: 'pesan-3', role: 'assistant', content: 'Sel', status: 'streaming' }
    await agent.put('/api/conversations/sel').send({ title: 'Sel', messages: [pertanyaan, streaming] }).expect(200)
  })

  it('percakapan orang lain tidak bisa dibaca', async () => {
    const owner = await registerAgent(app, 'pemilik@contoh.id')
    await owner.put('/api/conversations/rahasia').send({ title: 'Rahasia', messages: [pertanyaan] })

    const other = await registerAgent(app, 'lain@contoh.id')
    const response = await other.get('/api/conversations/rahasia')
    expect(response.status).toBe(404)
    expect(response.body.pesan).toBe('Percakapan tidak ditemukan.')
  })

  it('daftar percakapan hanya berisi milik sendiri', async () => {
    const agent = await registerAgent(app)
    await agent.put('/api/conversations/a').send({ title: 'A', messages: [] })
    await agent.put('/api/conversations/b').send({ title: 'B', messages: [] })
    const response = await agent.get('/api/conversations')
    expect(response.body.conversations.map((item: { id: string }) => item.id).sort()).toEqual(['a', 'b'])
  })

  it('hapus menghilangkan percakapan', async () => {
    const agent = await registerAgent(app)
    await agent.put('/api/conversations/sel').send({ title: 'Sel', messages: [pertanyaan] })
    await agent.delete('/api/conversations/sel').expect(204)
    await agent.get('/api/conversations/sel').expect(404)
  })

  it('judul kosong dan pesan terlalu panjang ditolak', async () => {
    const agent = await registerAgent(app)
    const kosong = await agent.put('/api/conversations/sel').send({ title: '   ', messages: [] })
    expect(kosong.status).toBe(400)
    const panjang = await agent
      .put('/api/conversations/sel')
      .send({ title: 'Sel', messages: [{ ...pertanyaan, content: 'x'.repeat(20001) }] })
    expect(panjang.status).toBe(400)
  })
})

describe('ganti nama dan hapus riwayat', () => {
  beforeEach(resetDatabase)

  it('ganti nama mengubah judul dan membiarkan pesan', async () => {
    const agent = await registerAgent(app)
    await agent.put('/api/conversations/sel').send({ title: 'Sel', messages: [pertanyaan, jawaban] })
    const response = await agent.patch('/api/conversations/sel').send({ title: 'Sel tumbuhan' })
    expect(response.status).toBe(200)
    expect(response.body.conversation.title).toBe('Sel tumbuhan')

    const detail = await agent.get('/api/conversations/sel')
    expect(detail.body.conversation.messages).toHaveLength(2)
  })

  it('hapus semua riwayat menghapus semua percakapan milik pengguna itu saja', async () => {
    const owner = await registerAgent(app, 'pemilik@contoh.id')
    await owner.put('/api/conversations/a').send({ title: 'A', messages: [pertanyaan] })
    await owner.put('/api/conversations/b').send({ title: 'B', messages: [pertanyaan] })
    const other = await registerAgent(app, 'lain@contoh.id')
    await other.put('/api/conversations/c').send({ title: 'C', messages: [pertanyaan] })

    await owner.delete('/api/conversations').expect(204)
    const remaining = await owner.get('/api/conversations')
    expect(remaining.body.conversations).toHaveLength(0)
    const otherList = await other.get('/api/conversations')
    expect(otherList.body.conversations).toHaveLength(1)
  })
})
