import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { fetchCurrentUser, logoutAccount } from '../api/auth'
import { startGuestSession } from '../api/guest'
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
  // True once the server has issued guestId. Until then the device id is only a placeholder.
  guestIssued: boolean
  account: Account
  // Guest actions used on this device. Kept across sign-out so that signing out cannot reset the quota.
  guestActionsUsed: number
  loadSession: () => Promise<void>
  // Asks the server for a guest id when this device does not have one yet.
  ensureGuestSession: () => Promise<void>
  signIn: (account: Account) => void
  signOut: () => Promise<void>
  recordGuestAction: () => void
  markGuestLimitReached: () => void
  updateAccountName: (name: string) => void
}

function createGuestId(): string {
  return crypto.randomUUID()
}

// Cached server data belongs to one account. Clearing it on every switch keeps accounts apart.
function resetServerData(): void {
  queryClient.clear()
}

// Counts sign-in and sign-out. A session load that started before a change must not undo it.
// React StrictMode runs the load twice in development, and the second answer can arrive after a sign-out.
let sessionChanges = 0

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      mode: 'guest',
      ready: false,
      guestId: createGuestId(),
      guestIssued: false,
      account: NO_ACCOUNT,
      guestActionsUsed: 0,
      loadSession: async () => {
        const changesBefore = sessionChanges
        const user = await fetchCurrentUser().catch(() => null)
        if (changesBefore !== sessionChanges) {
          // The user signed in or out while this load was running. That newer state stays.
          set({ ready: true })
          return
        }
        if (user) {
          set({ mode: 'signedIn', account: { name: user.name, email: user.email }, ready: true })
        } else {
          // Wait for the guest id before the app renders, so a quiz is never created with a placeholder id.
          await useSessionStore.getState().ensureGuestSession()
          set({ mode: 'guest', account: NO_ACCOUNT, ready: true })
        }
      },
      ensureGuestSession: async () => {
        if (useSessionStore.getState().guestIssued) {
          return
        }
        try {
          set({ guestId: await startGuestSession(), guestIssued: true })
        } catch {
          // Without a server id, the guest can still read the example pages. Guest actions are refused until a session exists.
        }
      },
      signIn: (account) => {
        sessionChanges += 1
        resetServerData()
        set({ mode: 'signedIn', account })
      },
      // Signing out ends the session on the server and returns to guest mode with a new guestId (docs/role.md 2.4).
      // The promise resolves after the server has cleared the cookie, so the next page load starts as a guest.
      signOut: async () => {
        await logoutAccount().catch(() => undefined)
        sessionChanges += 1
        resetServerData()
        set({ mode: 'guest', guestId: createGuestId(), guestIssued: false, account: NO_ACCOUNT })
        await useSessionStore.getState().ensureGuestSession()
      },
      updateAccountName: (name) => set((state) => ({ account: { ...state.account, name } })),
      recordGuestAction: () =>
        set((state) => ({ guestActionsUsed: Math.min(state.guestActionsUsed + 1, GUEST_ACTION_LIMIT) })),
      markGuestLimitReached: () => set({ guestActionsUsed: GUEST_ACTION_LIMIT }),
    }),
    {
      name: 'teach-tren-session',
      storage: createJSONStorage(() => localStorage),
      // Only the guest's own state is kept on the device. The account comes from the server.
      partialize: (state) => ({ guestId: state.guestId, guestIssued: state.guestIssued, guestActionsUsed: state.guestActionsUsed }),
    },
  ),
)

// Entering as a guest ends an account session still left on this device. Otherwise the app would open as that account
// the next time, and a guest could be sent to the wizard.
export async function continueAsGuest(): Promise<void> {
  if (useSessionStore.getState().mode === 'signedIn') {
    await useSessionStore.getState().signOut()
  }
}

