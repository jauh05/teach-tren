import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

interface NextStepsCardProps {
  conversationId: string
}

// "Langkah berikutnya" appears after an answer. AI is not called until the user picks an option (docs/role.md 4.8).
export function NextStepsCard({ conversationId }: NextStepsCardProps) {
  const navigate = useNavigate()

  const steps = [
    { label: 'Kerjakan kuis', action: 'Mulai', path: `/kuis/${conversationId}` },
    { label: 'Jadwalkan belajar', action: 'Atur', path: '/jadwal' },
    { label: 'Buat materi lanjutan (tambah bulat)', action: 'Buat', path: '/learning' },
  ]

  return (
    <section aria-label="Langkah berikutnya" className="max-w-[560px] self-start rounded-[14px] border border-line bg-white p-3.5">
      <h2 className="mb-2 text-sm font-semibold text-ink">Langkah berikutnya</h2>
      <ul className="flex flex-col gap-1.5">
        {steps.map((step) => (
          <li
            key={step.label}
            className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-slate-50 px-3 py-2 text-[13px] text-ink"
          >
            <span>{step.label}</span>
            <Button variant="secondary" className="min-h-[36px] px-3 py-1.5 text-xs md:min-h-0" onClick={() => navigate(step.path)}>
              {step.action}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
