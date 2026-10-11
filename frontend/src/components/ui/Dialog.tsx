import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  title: string
  description?: string
  size?: 'sm' | 'lg'
  onClose: () => void
  children: ReactNode
  // Optional row fixed at the bottom of the dialog, outside the scrolling body.
  footer?: ReactNode
}

// Modal dialog. Closes with Escape, the close button, or a click on the backdrop.
// On phones it opens as a bottom sheet. On larger screens it opens centered.
export function Dialog({ open, title, description, size = 'sm', onClose, children, footer }: DialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center md:p-4"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(
          'flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[18px] bg-white shadow-xl outline-none md:rounded-[18px]',
          size === 'lg' ? 'md:max-w-[720px]' : 'md:max-w-[440px]',
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-50 hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-line">{footer}</div>}
      </div>
    </div>
  )
}
