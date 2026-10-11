import { Plus } from 'lucide-react'

interface EmptyTopicSlotProps {
  onAdd: () => void
}

// The first circle on an empty canvas: dashed outline and a plus. Clicking it adds a pattern. Guests can add one too.
export function EmptyTopicSlot({ onAdd }: EmptyTopicSlotProps) {
  return (
    <button
      type="button"
      data-canvas-obstacle
      onClick={onAdd}
      aria-label="Tambah belajar pertama"
      className="pointer-events-auto group flex flex-col items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[#94A3B8] bg-white text-brand transition-colors group-hover:border-brand group-hover:bg-soft">
        <Plus size={26} aria-hidden="true" />
      </span>
      <span className="text-sm text-muted">Klik untuk menambahkan pola belajar</span>
    </button>
  )
}
