import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initialsOf } from '../../lib/format'
import { useSessionStore } from '../../stores/sessionStore'
import { Button } from '../ui/Button'

interface MenuAction {
  label: string
  run: () => void
}

// Avatar menu: Profil, Tentang, and Keluar for signed-in users; Masuk and Daftar for guests.
export function AvatarMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const mode = useSessionStore((state) => state.mode)
  const account = useSessionStore((state) => state.account)
  const signOut = useSessionStore((state) => state.signOut)

  useEffect(() => {
    if (!open) {
      return
    }
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function go(path: string) {
    setOpen(false)
    navigate(path)
  }

  const actions: MenuAction[] =
    mode === 'signedIn'
      ? [
          { label: 'Profil', run: () => go('/pengaturan') },
          { label: 'Tentang', run: () => go('/tentang') },
          {
            label: 'Keluar',
            run: () => {
              // Navigate first: a signed-in page would redirect to sign-in once the session changes.
              go('/chat')
              signOut()
            },
          },
        ]
      : [
          { label: 'Masuk', run: () => go('/masuk') },
          { label: 'Daftar', run: () => go('/daftar') },
          { label: 'Tentang', run: () => go('/tentang') },
        ]

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="secondary"
        aria-label="Menu akun"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="min-h-[36px] min-w-[36px] px-0 md:min-h-[36px] md:min-w-[36px]"
      >
        {mode === 'signedIn' ? initialsOf(account.name) : '?'}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-line bg-white p-1 shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              onClick={action.run}
              className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-slate-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
