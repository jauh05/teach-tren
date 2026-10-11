import { describe, expect, it } from 'vitest'
import { MAX_MATERIAL_BYTES, materialTitleOf, validateMaterialFile } from '../src/materi/validation.js'

const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])
const ZIP_HEADER = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])
const TEXT_HEADER = new TextEncoder().encode('Ini teks')

describe('validasi berkas materi', () => {
  it('menerima PDF dan DOCX dengan isi yang sesuai', () => {
    expect(validateMaterialFile({ name: 'modul.pdf', size: 1000, header: PDF_HEADER, existingCount: 0 })).toEqual({ ok: true, type: 'PDF' })
    expect(validateMaterialFile({ name: 'catatan.DOCX', size: 1000, header: ZIP_HEADER, existingCount: 0 })).toEqual({ ok: true, type: 'DOCX' })
  })

  it('menolak teks yang diberi ekstensi pdf dengan status 422', () => {
    const result = validateMaterialFile({ name: 'catatan.pdf', size: 20, header: TEXT_HEADER, existingCount: 0 })
    expect(result).toEqual({ ok: false, status: 422, message: 'Isi berkas tidak sesuai dengan jenisnya.' })
  })

  it('menolak berkas di atas 20 MB dan berkas kosong', () => {
    const tooBig = validateMaterialFile({ name: 'besar.pdf', size: MAX_MATERIAL_BYTES + 1, header: PDF_HEADER, existingCount: 0 })
    expect(tooBig).toEqual({ ok: false, status: 400, message: 'Ukuran berkas maksimal 20 MB.' })
    const empty = validateMaterialFile({ name: 'kosong.pdf', size: 0, header: PDF_HEADER, existingCount: 0 })
    expect(empty.ok).toBe(false)
  })

  it('menolak format selain PDF, DOCX, dan PPTX', () => {
    const result = validateMaterialFile({ name: 'gambar.png', size: 100, header: PDF_HEADER, existingCount: 0 })
    expect(result).toEqual({ ok: false, status: 400, message: 'Format berkas harus PDF, DOCX, atau PPTX.' })
  })

  it('batas 50 materi per pengguna dicek paling dulu', () => {
    const result = validateMaterialFile({ name: 'modul.pdf', size: 100, header: PDF_HEADER, existingCount: 50 })
    expect(result).toEqual({ ok: false, status: 400, message: 'Batas 50 materi sudah tercapai.' })
  })

  it('judul memakai nama berkas tanpa ekstensi', () => {
    expect(materialTitleOf('modul-persamaan.pdf')).toBe('modul-persamaan')
    expect(materialTitleOf('tanpa-ekstensi')).toBe('tanpa-ekstensi')
  })
})
