import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Gauge,
  Network,
  Rocket,
  ShieldCheck,
  MessageSquare,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/Logo'
import {
  GUIDE_FACTS,
  GUIDE_FAQ,
  GUIDE_SECTIONS,
  GUIDE_VERSION,
  QUICK_START,
  type GuideIcon,
} from '../../content/tentang'

const ICONS: Record<GuideIcon, LucideIcon> = {
  rocket: Rocket,
  user: UserRound,
  network: Network,
  calendar: CalendarDays,
  message: MessageSquare,
  quiz: ClipboardList,
  gauge: Gauge,
  shield: ShieldCheck,
  book: BookOpen,
}

// Guide page (/tentang). Visible to guests and signed-in users. Content lives in src/content/tentang.ts.
export function TentangPage() {
  const navigate = useNavigate()

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-[1040px] px-4 py-6 md:px-8 md:py-8">
        <header className="rounded-[20px] border border-line bg-white p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-soft">
                <Logo size={32} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">Panduan penggunaan</p>
                <h1 className="font-heading text-2xl font-semibold text-ink md:text-[30px]">Tentang Teach Tren</h1>
                <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-muted">
                  Belajar lewat percakapan. Teach Tren membantu kamu belajar lewat chat. Tanya langsung tanpa masuk, lalu masuk untuk menyimpan
                  chat, membuat topik, mengerjakan kuis, dan mengatur jadwal.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button onClick={() => navigate('/chat')}>Mulai chat</Button>
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Kembali
              </Button>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {GUIDE_FACTS.map((fact) => (
              <div key={fact.label} className="rounded-[14px] bg-canvas p-4">
                <dt className="sr-only">{fact.label}</dt>
                <dd className="font-heading text-2xl font-semibold text-brand-dark">{fact.value}</dd>
                <dd className="mt-0.5 text-xs text-muted">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label="Daftar isi" className="hidden md:block">
            <div className="sticky top-4 flex flex-col gap-0.5 rounded-[14px] border border-line bg-white p-3">
              <p className="px-2 pb-1 text-xs font-semibold text-muted">Daftar isi</p>
              <a href="#mulai-cepat" className="rounded-lg px-2 py-1.5 text-[13px] text-ink hover:bg-slate-50">
                Mulai cepat
              </a>
              {GUIDE_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-lg px-2 py-1.5 text-[13px] text-ink hover:bg-slate-50"
                >
                  {section.title}
                </a>
              ))}
              <a href="#faq" className="rounded-lg px-2 py-1.5 text-[13px] text-ink hover:bg-slate-50">
                Pertanyaan umum
              </a>
            </div>
          </nav>

          <div className="flex min-w-0 flex-col gap-4">
            <GuideCard id="mulai-cepat" title="Mulai cepat" icon="rocket">
              <div className="grid gap-3 md:grid-cols-3">
                {QUICK_START.map((step, index) => {
                  const Icon = ICONS[step.icon]
                  return (
                    <div key={step.title} className="flex flex-col rounded-[14px] border border-line bg-canvas p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-dark">
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span className="text-xs font-semibold text-muted">Langkah {index + 1}</span>
                      </div>
                      <h3 className="mt-3 font-heading text-base font-semibold text-ink">{step.title}</h3>
                      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{step.text}</p>
                      <Link to={step.link} className="mt-3 text-sm font-semibold text-brand-dark hover:underline">
                        {step.linkLabel} →
                      </Link>
                    </div>
                  )
                })}
              </div>
            </GuideCard>

            {GUIDE_SECTIONS.map((section) => (
              <GuideCard key={section.id} id={section.id} title={section.title} icon={section.icon}>
                <RichText content={section.body} />
              </GuideCard>
            ))}

            <GuideCard id="faq" title="Pertanyaan umum" icon="book">
              <div className="flex flex-col gap-2">
                {GUIDE_FAQ.map((item) => (
                  <details key={item.question} className="group rounded-xl border border-line px-4 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </GuideCard>

            <p className="pb-2 text-center text-xs text-muted">
              Versi {GUIDE_VERSION.number} · rilis {GUIDE_VERSION.date}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

interface GuideCardProps {
  id: string
  title: string
  icon: GuideIcon
  children: ReactNode
}

function GuideCard({ id, title, icon, children }: GuideCardProps) {
  const Icon = ICONS[icon]
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-[16px] border border-line bg-white p-5 md:p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-brand-dark">
          <Icon size={18} aria-hidden="true" />
        </span>
        <h2 id={`${id}-title`} className="font-heading text-lg font-semibold text-ink">
          {title}
        </h2>
      </div>
      <div className="tentang-body">{children}</div>
    </section>
  )
}
