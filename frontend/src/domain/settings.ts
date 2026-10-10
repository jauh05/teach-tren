import { z } from 'zod'

// Validation for the settings forms (docs/role.md 4.7 and CC-09).
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(60, 'Nama maksimal 60 karakter.'),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Masukkan kata sandi lama.'),
    newPassword: z.string().min(8, 'Kata sandi baru minimal 8 karakter.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak sama.',
    path: ['confirmPassword'],
  })

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Masukkan kata sandi untuk konfirmasi.'),
})

// The user must type this word to clear all history (docs/role.md CC-09).
export const CLEAR_HISTORY_KEYWORD = 'HAPUS'

export function isClearHistoryConfirmed(input: string): boolean {
  return input.trim() === CLEAR_HISTORY_KEYWORD
}
