import { z } from 'zod'

// Form rules for the sign-in and sign-up pages. They match the rules the backend checks (backend/src/auth).
export const signInSchema = z.object({
  email: z.email('Masukkan email yang valid.'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
})

export const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(60, 'Nama maksimal 60 karakter.'),
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>

// Only in-app paths are allowed, so the redirect parameter cannot send users to another site.
// Without a valid redirect, a signed-in user lands on Learning.
export function safeRedirect(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) {
    return value
  }
  return '/learning'
}
