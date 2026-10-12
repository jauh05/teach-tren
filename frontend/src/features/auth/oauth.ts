import { apiUrl } from '../../api/http'
import { importGuestHistory } from '../../api/conversations'
import { importGuestTopics } from '../../api/topics'
import { importGuestQuizzes } from '../../api/quizzes'
import { useSessionStore } from '../../stores/sessionStore'

// Sign-in with Google, Facebook, and TikTok. The server starts the flow and returns the user to /masuk or /chat.
export type SocialProvider = 'google' | 'facebook' | 'tiktok'

export const SOCIAL_PROVIDER_NAMES: Record<SocialProvider, string> = { google: 'Google', facebook: 'Facebook', tiktok: 'TikTok' }

// Set before the browser leaves for the provider. After the sign-in comes back, the guest's history moves to the account.
const PENDING_KEY = 'teach-tren-oauth-pending'

function setPending(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(PENDING_KEY, '1')
    } else {
      localStorage.removeItem(PENDING_KEY)
    }
  } catch {
    // Storage can be blocked (private windows). The guest's history then stays on the device, which is safe.
  }
}

function isPending(): boolean {
  try {
    return localStorage.getItem(PENDING_KEY) === '1'
  } catch {
    return false
  }
}

export function startSocialSignIn(provider: SocialProvider): void {
  setPending(true)
  window.location.assign(apiUrl(`/api/auth/oauth/${provider}/start`))
}

// A sign-in that failed or was cancelled comes back to /masuk with a reason, so nothing is pending any more.
export function clearPendingSocialSignIn(): void {
  setPending(false)
}

// Runs once the session is known. A signed-in account that came from a provider takes the guest's history with it.
export async function finishSocialSignIn(): Promise<void> {
  const pending = isPending()
  setPending(false)
  if (!pending || useSessionStore.getState().mode !== 'signedIn') {
    return
  }
  const guestId = useSessionStore.getState().guestId
  await importGuestHistory().catch(() => undefined)
  await importGuestTopics().catch(() => undefined)
  await importGuestQuizzes(guestId).catch(() => undefined)
}

// The message for a reason the server sends back on /masuk. Null when there is no reason.
export function socialSignInMessage(reason: string | null, provider: string | null): string | null {
  if (!reason) {
    return null
  }
  const name = provider && provider in SOCIAL_PROVIDER_NAMES ? SOCIAL_PROVIDER_NAMES[provider as SocialProvider] : 'penyedia'
  switch (reason) {
    case 'belum-tersedia':
      return `Masuk dengan ${name} belum tersedia. Masuk dengan email atau lanjut sebagai tamu.`
    case 'dibatalkan':
      return `Masuk dengan ${name} dibatalkan.`
    case 'email-dipakai':
      return 'Email ini sudah dipakai akun lain. Masuk dengan email dan kata sandi.'
    case 'gagal':
      return `Masuk dengan ${name} gagal. Coba lagi.`
    default:
      return null
  }
}
