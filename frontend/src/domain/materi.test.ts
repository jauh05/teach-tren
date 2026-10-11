import { describe, expect, it } from 'vitest'
import { MAX_MATERIAL_BYTES, materialTitleOf, validateMaterialFile } from './materi'

const PDF_HEADER = new TextEncoder().encode('%PDF-1.7\n')
const ZIP_HEADER = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00])
const TEXT_HEADER = new TextEncoder().encode('Ini teks biasa')

function check(name: string, header: Uint8Array, overrides: Partial<{ size: number; existingCount: number }> = {}) {
  return validateMaterialFile({
    name,
    size: overrides.size ?? 1024,
    header,
    existingCount: overrides.existingCount ?? 0,
  })
}

describe('validateMaterialFile', () => {
  it('menerima PDF, DOCX, dan PPTX dengan isi yang sesuai', () => {
    expect(check('modul.pdf', PDF_HEADER)).toEqual({ ok: true, type: 'PDF' })
    expect(check('catatan.docx', ZIP_HEADER)).toEqual({ ok: true, type: 'DOCX' })
    expect(check('slide.PPTX', ZIP_HEADER)).toEqual({ ok: true, type: 'PPTX' })
  })

  it('menolak teks biasa yang diberi ekstensi .pdf', () => {
    expect(check('catatan.pdf', TEXT_HEADER)).toEqual({ ok: false, message: 'Isi berkas tidak sesuai dengan jenisnya.' })
  })

  it('menolak format lain', () => {
    expect(check('gambar.png', PDF_HEADER).ok).toBe(false)
  })

  it('menolak berkas lebih dari 20 MB dan berkas kosong', () => {
    expect(check('besar.pdf', PDF_HEADER, { size: MAX_MATERIAL_BYTES + 1 })).toEqual({
      ok: false,
      message: 'Ukuran berkas maksimal 20 MB.',
    })
    expect(check('kosong.pdf', PDF_HEADER, { size: 0 }).ok).toBe(false)
  })

  it('menolak saat batas 50 materi sudah tercapai', () => {
    expect(check('baru.pdf', PDF_HEADER, { existingCount: 50 })).toEqual({
      ok: false,
      message: 'Batas 50 materi sudah tercapai.',
    })
  })
})

describe('materialTitleOf', () => {
  it('membuang ekstensi dari nama berkas', () => {
    expect(materialTitleOf('Modul Persamaan.pdf')).toBe('Modul Persamaan')
    expect(materialTitleOf('tanpa-ekstensi')).toBe('tanpa-ekstensi')
  })
})
