import { z } from 'zod'
import { ApiError, apiRequest, refreshSession } from './http'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

const userResponseSchema = z.object({ user: userSchema })

export type AuthUser = z.infer<typeof userSchema>

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export async function registerAccount(input: RegisterInput): Promise<AuthUser> {
  return userResponseSchema.parse(await apiRequest('POST', '/api/auth/register', input)).user
}

export async function loginAccount(input: { email: string; password: string }): Promise<AuthUser> {
  return userResponseSchema.parse(await apiRequest('POST', '/api/auth/login', input)).user
}

export async function logoutAccount(): Promise<void> {
  await apiRequest('POST', '/api/auth/logout')
}

// Null when no session exists. Any other error is thrown.
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    return userResponseSchema.parse(await apiRequest('GET', '/api/auth/me')).user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // The access cookie may only have expired. A refresh token can still start the session again.
      if (await refreshSession()) {
        return userResponseSchema.parse(await apiRequest('GET', '/api/auth/me')).user
      }
      return null
    }
    throw error
  }
}

export async function updateProfileName(name: string): Promise<AuthUser> {
  return userResponseSchema.parse(await apiRequest('PATCH', '/api/auth/me', { name })).user
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest('POST', '/api/auth/password', { currentPassword, newPassword })
}

export async function deleteAccount(password: string): Promise<void> {
  await apiRequest('DELETE', '/api/auth/me', { password })
}
