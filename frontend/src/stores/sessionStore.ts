import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { fetchCurrentUser, logoutAccount } from '../api/auth'
import { GUEST_ACTION_LIMIT } from '../domain/guestQuota'
import { queryClient } from '../lib/queryClient'

// 'guest' = belum login (tamu), 'signedIn' = sudah login (masuk). See docs/role.md 2.1.
export type SessionMode = 'guest' | 'signedIn'

export interface Account {
  name: string
  email: string
}

const NO_ACCOUNT: Account = { name: '', email: '' }

interface SessionState {
  mode: SessionMode
  // False until the server has said whether a session exists. The app waits for it before it renders pages.
  ready: boolean
  guestId: string
  account: Account
  // Guest actions used on this device. Kept across sign-out so that signing out cannot reset the quota.
  guestActionsUsed: number
  loadSession: () => Promise<void>
  signIn: (account: Account) => void
  signOut: () => void
  recordGuestAction: () => void
  updateAccountName: (name: string) => void
}

function createGuestId(): string {
  return crypto.randomUUID()
}

// Cached server data belongs to one account. Clearing it on every switch keeps accounts apart.
function resetServerData(): void {
  queryClient.clear()
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      mode: 'guest',
      ready: false,
      guestId: createGuestId(),
      account: NO_ACCOUNT,
      guestActionsUsed: 0,
      loadSession: async () => {
        const user = await fetchCurrentUser().catch(() => null)
        if (user) {
          set({ mode: 'signedIn', account: { name: user.name, email: user.email }, ready: true })
        } else {
          set({ mode: 'guest', account: NO_ACCOUNT, ready: true })
        }
      },
      signIn: (account) => {
        resetServerData()
        set({ mode: 'signedIn', account })
      },
      // Signing out ends the session on the server and returns to guest mode with a new guestId (docs/role.md 2.4).
      signOut: () => {
        void logoutAccount().catch(() => undefined)
        resetServerData()
        set({ mode: 'guest', guestId: createGuestId(), account: NO_ACCOUNT })
      },
      updateAccountName: (name) => set((state) => ({ account: { ...state.account, name } })),
      recordGuestAction: () =>
        set((state) => ({ guestActionsUsed: Math.min(state.guestActionsUsed + 1, GUEST_ACTION_LIMIT) })),
    }),
    {
      name: 'teach-tren-session',
      storage: createJSONStorage(() => localStorage),
      // Only the guest's own state is kept on the device. The account comes from the server.
      partialize: (state) => ({ guestId: state.guestId, guestActionsUsed: state.guestActionsUsed }),
    },
  ),
)
