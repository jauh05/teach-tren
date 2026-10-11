import { useState } from 'react'
import { colors } from '../../theme/tokens'
import { TOPIC_STATUS_LABEL, type TopicStatus } from '../../domain/topicStatus'

const LEGEND_ITEMS: ReadonlyArray<{ status: TopicStatus; hint: string; color: string }> = [
  { status: 'DIKUASAI', hint: 'Skor 80 ke atas', color: colors.status.kuasai },
  { status: 'SEDANG', hint: 'Skor 50 sampai 79', color: colors.status.sedang },
  { status: 'PERLU_DIULANG', hint: 'Skor di bawah 50', color: colors.status.ulang },
  { status: 'BARU', hint: 'Dari chat atau materi', color: colors.status.baru },
  { status: 'BELUM_DIBUKA', hint: 'Pelajari prasyaratnya', color: colors.status.belum },
  { status: 'SARAN', hint: 'Dari topik yang terkait', color: colors.status.saran },
]

// Collapsible color key in the top-right corner of the canvas. Closed by default to leave room for topics.
export function TopicLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="min-h-[36px] rounded-xl border border-line bg-white px-3 text-micro font-semibold text-ink shadow-sm hover:bg-slate-50 md:min-h-[32px]"
      >
        {open ? 'Sembunyikan keterangan' : 'Lihat keterangan'}
      </button>
      {open && (
        <section
          aria-label="Keterangan status bulat"
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
