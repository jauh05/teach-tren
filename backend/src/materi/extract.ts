import JSZip from 'jszip'
import { extractText, getDocumentProxy } from 'unpdf'

// Text is read on the server and kept in memory only long enough to store it (docs/role.md, Materi).
export type MaterialFileType = 'PDF' | 'DOCX' | 'PPTX'

// The stored text is cut here so that one very large file cannot fill the database.
export const MAX_STORED_CHARS = 200_000

export class ExtractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExtractError'
  }
}

const NAMED_ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" }

// Turns XML escapes such as &amp; and &#233; back into text.
export function decodeXml(text: string): string {
  return text.replace(/&(?:#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (entity) => {
    if (entity.startsWith('&#x')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(3, -1), 16))
    }
    if (entity.startsWith('&#')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2, -1), 10))
    }
    return NAMED_ENTITIES[entity] ?? entity
  })
}

// Text of each paragraph in a Word document. A paragraph ends with </w:p>, and its text is in <w:t> elements.
export function docxParagraphs(xml: string): string[] {
  return xml
    .split('</w:p>')
    .map((paragraph) =>
      [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((match) => decodeXml(match[1] ?? '')).join(''),
    )
    .map((text) => text.trim())
    .filter((text) => text !== '')
}

// Text of each paragraph on one PowerPoint slide. A paragraph ends with </a:p>, and its text is in <a:t> elements.
export function pptxParagraphs(xml: string): string[] {
  return xml
    .split('</a:p>')
    .map((paragraph) =>
      [...paragraph.matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g)].map((match) => decodeXml(match[1] ?? '')).join(''),
    )
    .map((text) => text.trim())
    .filter((text) => text !== '')
}

function slideNumber(name: string): number {
  return Number.parseInt(name.replace(/^ppt\/slides\/slide(\d+)\.xml$/, '$1'), 10)
}

async function docxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)
  const document = zip.file('word/document.xml')
  if (!document) {
    throw new ExtractError('Berkas DOCX tidak punya isi dokumen.')
  }
  return docxParagraphs(await document.async('string')).join('\n')
}

async function pptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)
  const slides = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => slideNumber(a) - slideNumber(b))
  const texts: string[] = []
  for (const name of slides) {
    const file = zip.file(name)
    if (file) {
      texts.push(pptxParagraphs(await file.async('string')).join('\n'))
    }
  }
  return texts.join('\n\n')
}

async function pdfText(buffer: Buffer): Promise<string> {
  // A copy, not a view. PDF.js moves the bytes it receives, and a view would move the bytes of a shared Node buffer pool.
  const pdf = await getDocumentProxy(Uint8Array.from(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}

// Reads the text of an uploaded file. Throws ExtractError when the file cannot be read or has no text (for example a scan).
export async function extractMaterialText(buffer: Buffer, type: MaterialFileType): Promise<string> {
  let text: string
  try {
    text = type === 'PDF' ? await pdfText(buffer) : type === 'DOCX' ? await docxText(buffer) : await pptxText(buffer)
  } catch (error) {
    if (error instanceof ExtractError) {
      throw error
    }
    throw new ExtractError('Berkas tidak bisa dibaca.')
  }
  const cleaned = text.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
  if (cleaned === '') {
    throw new ExtractError('Tidak ada teks yang bisa dibaca. Berkas mungkin hasil scan atau kosong.')
  }
  return cleaned.slice(0, MAX_STORED_CHARS)
}
