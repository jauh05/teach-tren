import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// 'guest' = belum login (tamu), 'signedIn' = sudah login (masuk). See docs/role.md 2.1.
export type SessionMode = 'guest' | 'signedIn'

export interface Account {
  name: string
  email: string
}

interface SessionState {
  mode: SessionMode
  guestId: string
  account: Account
  signIn: () => void
  signOut: () => void
}

// Demo account taken from the mockup. Real authentication arrives with the backend.
const DEMO_ACCOUNT: Account = { name: 'Rafi Arkan', email: 'rafi@contoh.id' }

function createGuestId(): string {
  return crypto.randomUUID()
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      mode: 'signedIn',
      guestId: createGuestId(),
      account: DEMO_ACCOUNT,
      signIn: () => set({ mode: 'signedIn' }),
      // Signing out returns to guest mode with a new guestId (docs/role.md 2.4).
      signOut: () => set({ mode: 'guest', guestId: createGuestId() }),
    }),
    {
      name: 'teach-tren-session',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
