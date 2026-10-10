import { useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSessionStore } from '../../stores/sessionStore'

// Guests who open a signed-in page are sent to sign-in, then back to the page they asked for (docs/role.md CC-01).
// The check runs once, when the page opens. Signing out from inside the page navigates away on its own,
// so the page does not redirect while it is still on screen.
export function RequireSignedIn({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [signedInWhenOpened] = useState(() => useSessionStore.getState().mode === 'signedIn')

  if (!signedInWhenOpened) {
    return <Navigate to={`/masuk?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
  return <>{children}</>
}
