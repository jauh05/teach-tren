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

function LegendList() {
  return (
    <ul className="flex flex-col gap-1.5">
      {LEGEND_ITEMS.map((item) => (
        <li key={item.status} className="flex items-start gap-1.5">
          <span aria-hidden="true" className="mt-[3px] h-[9px] w-[9px] shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          <span>
            <span className="block text-micro font-semibold text-ink">{TOPIC_STATUS_LABEL[item.status]}</span>
            <span className="block text-micro text-muted">{item.hint}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// Desktop: a small card in the top-right corner. Mobile: a button that opens the same card.
export function TopicLegend() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <section
        aria-label="Keterangan status bulat"
        className="absolute right-3 top-3 hidden w-legend rounded-xl border border-line bg-white p-2.5 shadow-sm md:block"
      >
        <LegendList />
      </section>

      <div className="absolute right-3 top-3 md:hidden">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="min-h-[44px] rounded-xl border border-line bg-white px-3 text-micro font-semibold text-ink shadow-sm"
        >
          Keterangan
        </button>
        {open && (
          <section
            aria-label="Keterangan status bulat"
            className="absolute right-0 top-full mt-1.5 w-legend rounded-xl border border-line bg-white p-2.5 shadow-lg"
          >
            <LegendList />
          </section>
        )}
      </div>
    </>
  )
}
