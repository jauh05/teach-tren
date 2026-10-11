import { describe, expect, it } from 'vitest'
import { ExtractError, decodeXml, docxParagraphs, extractMaterialText, pptxParagraphs } from '../src/materi/extract.js'
import { makeDocx, makePdf, makePptx } from './materiFiles.js'

describe('membaca teks materi', () => {
  it('mengembalikan karakter XML ke bentuk biasa', () => {
    expect(decodeXml('Tanda &amp; kurung &lt;x&gt; &quot;a&quot; &#233; &#x41;')).toBe('Tanda & kurung <x> "a" é A')
  })

  it('setiap paragraf DOCX menjadi satu baris dan paragraf kosong dibuang', () => {
    const xml = '<w:p><w:r><w:t>Satu</w:t></w:r><w:r><w:t xml:space="preserve"> dua</w:t></w:r></w:p><w:p></w:p><w:p><w:r><w:t>Tiga</w:t></w:r></w:p>'
    expect(docxParagraphs(xml)).toEqual(['Satu dua', 'Tiga'])
  })

  it('setiap paragraf PPTX dibaca dari elemen a:t', () => {
    expect(pptxParagraphs('<a:p><a:r><a:t>Fotosintesis</a:t></a:r></a:p>')).toEqual(['Fotosintesis'])
  })

  it('DOCX dibaca dari isi dokumen dan entitas XML diurai', async () => {
    const text = await extractMaterialText(await makeDocx(['Persamaan linear', 'Tanda &amp; kurung']), 'DOCX')
    expect(text).toBe('Persamaan linear\nTanda & kurung')
  })

  it('PPTX dibaca slide demi slide sesuai nomornya', async () => {
    const text = await extractMaterialText(await makePptx([['Slide pertama'], ['Slide kedua', 'poin dua']]), 'PPTX')
    expect(text.indexOf('Slide pertama')).toBeLessThan(text.indexOf('Slide kedua'))
    expect(text).toContain('poin dua')
  })

  it('PDF dibaca dari teks halamannya', async () => {
    const text = await extractMaterialText(makePdf(['Persamaan linear satu variabel']), 'PDF')
    expect(text).toContain('Persamaan linear satu variabel')
  })

  it('PDF tanpa teks, misalnya hasil scan, ditolak dengan pesan yang bisa dibaca', async () => {
    await expect(extractMaterialText(makePdf([]), 'PDF')).rejects.toBeInstanceOf(ExtractError)
  })

  it('DOCX yang rusak ditolak dengan pesan yang bisa dibaca', async () => {
    await expect(extractMaterialText(Buffer.from('bukan zip'), 'DOCX')).rejects.toThrow('Berkas tidak bisa dibaca.')
  })
})
