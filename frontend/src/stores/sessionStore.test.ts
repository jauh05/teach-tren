import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '../api/auth'

const { fetchCurrentUserMock, logoutAccountMock, startGuestSessionMock } = vi.hoisted(() => ({
  fetchCurrentUserMock: vi.fn(),
  logoutAccountMock: vi.fn(),
  startGuestSessionMock: vi.fn(),
}))

vi.mock('../api/auth', () => ({
  fetchCurrentUser: fetchCurrentUserMock,
  logoutAccount: logoutAccountMock,
}))

vi.mock('../api/guest', () => ({
  startGuestSession: startGuestSessionMock,
}))

import { useSessionStore } from './sessionStore'

const RAFI: AuthUser = { id: 'pengguna-1', name: 'Rafi', email: 'rafi@contoh.id' }
const GUEST_ID = '11111111-1111-4111-8111-111111111111'

describe('sessionStore', () => {
  beforeEach(() => {
    fetchCurrentUserMock.mockReset()
    logoutAccountMock.mockReset().mockResolvedValue(undefined)
    startGuestSessionMock.mockReset().mockResolvedValue(GUEST_ID)
    useSessionStore.setState({ mode: 'guest', ready: false, guestIssued: false })
  })

  it('memuat akun dari server saat sesi masih berlaku', async () => {
    fetchCurrentUserMock.mockResolvedValue(RAFI)

    await useSessionStore.getState().loadSession()

    expect(useSessionStore.getState()).toMatchObject({ mode: 'signedIn', ready: true, account: { name: 'Rafi' } })
  })

  it('tamu mendapat id dari server saat belum masuk', async () => {
    fetchCurrentUserMock.mockResolvedValue(null)

    await useSessionStore.getState().loadSession()

    expect(useSessionStore.getState()).toMatchObject({ mode: 'guest', ready: true, guestId: GUEST_ID, guestIssued: true })
  })

  it('muat sesi yang selesai setelah keluar tidak membuat pengguna masuk lagi', async () => {
    // Mirrors React StrictMode: a second load is still waiting when the user signs out.
    let answerLoad: (user: AuthUser | null) => void = () => undefined
    fetchCurrentUserMock.mockReturnValue(new Promise<AuthUser | null>((resolve) => (answerLoad = resolve)))
    useSessionStore.setState({ mode: 'signedIn', account: RAFI })

    const loading = useSessionStore.getState().loadSession()
    await useSessionStore.getState().signOut()
    answerLoad(RAFI)
    await loading

    expect(useSessionStore.getState().mode).toBe('guest')
  })

  it('muat sesi yang selesai setelah masuk tidak mengubah akun yang baru masuk', async () => {
    let answerLoad: (user: AuthUser | null) => void = () => undefined
    fetchCurrentUserMock.mockReturnValue(new Promise<AuthUser | null>((resolve) => (answerLoad = resolve)))

    const loading = useSessionStore.getState().loadSession()
    useSessionStore.getState().signIn({ name: 'Siti', email: 'siti@contoh.id' })
    answerLoad(null)
    await loading

    expect(useSessionStore.getState()).toMatchObject({ mode: 'signedIn', account: { name: 'Siti' }, ready: true })
  })
})
