import { Info } from 'lucide-react'
import { useState } from 'react'
import { colors } from '../../theme/tokens'
import { TOPIC_STATUS_LABEL, type TopicStatus } from '../../domain/topicStatus'

const LEGEND_ITEMS: ReadonlyArray<{ status: TopicStatus; hint: string; color: string }> = [
  { status: 'DIKUASAI', hint: 'Skor 80 ke atas', color: colors.status.kuasai },
  { status: 'SEDANG', hint: 'Skor 50 sampai 79', color: colors.status.sedang },
  { status: 'PERLU_DIULANG', hint: 'Skor di bawah 50', color: colors.status.ulang },
  { status: 'BARU', hint: 'Belum ada latihan', color: colors.status.belum },
  { status: 'BELUM_DIBUKA', hint: 'Pelajari prasyaratnya', color: colors.status.belum },
  { status: 'SARAN', hint: 'Dari topik yang terkait', color: colors.status.saran },
]

// Collapsible color key in the top-right corner of the canvas. Closed by default to leave room for topics.
export function TopicLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div data-canvas-obstacle className="absolute bottom-3 left-3 flex flex-col-reverse items-start gap-1.5 md:bottom-auto md:left-auto md:right-3 md:top-3 md:flex-col md:items-end">
      {/* On phones the button is only an icon, so it covers less of the small canvas. The name stays the same for screen readers. */}
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Sembunyikan keterangan' : 'Lihat keterangan'}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm hover:bg-slate-50 md:h-auto md:w-auto md:rounded-xl md:px-3 md:py-1.5 md:text-micro md:font-semibold"
      >
        <Info size={16} aria-hidden="true" className="md:hidden" />
        <span className="hidden md:inline">{open ? 'Sembunyikan keterangan' : 'Lihat keterangan'}</span>
      </button>
      {open && (
        <section
          aria-label="Keterangan status neuron"
          className="w-legend rounded-xl border border-line bg-white p-2.5 shadow-lg"
        >
          <ul className="flex flex-col gap-1.5">
            {LEGEND_ITEMS.map((item) => (
              <li key={item.status} className="flex items-start gap-1.5">
                <span
                  aria-hidden="true"
                  className="mt-[3px] h-[9px] w-[9px] shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>
                  <span className="block text-micro font-semibold text-ink">{TOPIC_STATUS_LABEL[item.status]}</span>
                  <span className="block text-micro text-muted">{item.hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
