// Material file rules (docs/role.md 4.5 and CC-09). Pure functions, so they are tested without a database.

export const MAX_MATERIAL_BYTES = 20 * 1024 * 1024
export const MAX_MATERIALS_PER_USER = 50
// Enough bytes to recognise PDF and zip-based formats.
export const HEADER_BYTES = 8

export type MaterialType = 'PDF' | 'DOCX' | 'PPTX'

const EXTENSION_TYPES: Record<string, MaterialType> = {
  '.pdf': 'PDF',
  '.docx': 'DOCX',
  '.pptx': 'PPTX',
}

// PDF starts with "%PDF-". DOCX and PPTX are zip archives, starting with "PK\x03\x04".
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]

export interface MaterialFileCheck {
  name: string
  size: number
  header: Uint8Array
  existingCount: number
}

// Status 400 for problems with the request. Status 422 when the content does not match the file type.
export type MaterialFileResult =
  | { ok: true; type: MaterialType }
  | { ok: false; status: 400 | 422; message: string }

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value)
}

export function materialTypeOf(fileName: string): MaterialType | null {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0) {
    return null
  }
  return EXTENSION_TYPES[fileName.slice(dot).toLowerCase()] ?? null
}

// Checks the file in the order a user would fix problems: count, format, size, content.
export function validateMaterialFile(file: MaterialFileCheck): MaterialFileResult {
  if (file.existingCount >= MAX_MATERIALS_PER_USER) {
    return { ok: false, status: 400, message: `Batas ${MAX_MATERIALS_PER_USER} materi sudah tercapai.` }
  }
  const type = materialTypeOf(file.name)
  if (!type) {
    return { ok: false, status: 400, message: 'Format berkas harus PDF, DOCX, atau PPTX.' }
  }
  if (file.size > MAX_MATERIAL_BYTES) {
    return { ok: false, status: 400, message: 'Ukuran berkas maksimal 20 MB.' }
  }
  if (file.size === 0) {
    return { ok: false, status: 400, message: 'Berkas kosong.' }
  }
  const matches = type === 'PDF' ? startsWith(file.header, PDF_SIGNATURE) : startsWith(file.header, ZIP_SIGNATURE)
  if (!matches) {
    return { ok: false, status: 422, message: 'Isi berkas tidak sesuai dengan jenisnya.' }
  }
  return { ok: true, type }
}

// Title shown in the list: the file name without its extension.
export function materialTitleOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}
