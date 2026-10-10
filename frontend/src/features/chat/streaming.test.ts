import { describe, expect, it } from 'vitest'
import { splitIntoChunks, streamChunks } from './streaming'

describe('splitIntoChunks', () => {
  it('menyimpan spasi di setiap potongan', () => {
    expect(splitIntoChunks('Halo dunia')).toEqual(['Halo ', 'dunia'])
  })

  it('menggabungkan kembali menjadi teks asli', () => {
    const text = 'Baris satu.\n\n1. $x = 4$  dan  $$y$$\n'
    expect(splitIntoChunks(text).join('')).toBe(text)
  })

  it('menghasilkan daftar kosong untuk teks kosong', () => {
    expect(splitIntoChunks('')).toEqual([])
  })
})

describe('streamChunks', () => {
  it('mengirim semua potongan secara berurutan', async () => {
    const received: string[] = []
    const completed = await streamChunks(['a', 'b', 'c'], {
      signal: new AbortController().signal,
      onChunk: (chunk) => received.push(chunk),
      delayMs: 0,
    })

    expect(completed).toBe(true)
    expect(received).toEqual(['a', 'b', 'c'])
  })

  it('berhenti saat dibatalkan dan melaporkan belum selesai', async () => {
    const controller = new AbortController()
    const received: string[] = []
    const completed = await streamChunks(['a', 'b', 'c'], {
      signal: controller.signal,
      onChunk: (chunk) => {
        received.push(chunk)
        if (chunk === 'b') {
          controller.abort()
        }
      },
      delayMs: 0,
    })

    expect(completed).toBe(false)
    expect(received).toEqual(['a', 'b'])
  })
})
