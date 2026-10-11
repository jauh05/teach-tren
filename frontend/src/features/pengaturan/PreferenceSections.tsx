import clsx from 'clsx'
import { usePreferencesStore, type QuestionCount, type QuizLevel, type QuizStyle, type ThemeChoice } from '../../stores/preferencesStore'
import { requestReminderPermission } from '../../lib/reminder'
import { INPUT_CLASS, SECTION_CLASS, TITLE_CLASS } from './styles'

// Learning defaults used when a new quiz is created (docs/role.md 4.7).
export function LearningSection() {
  const questionCount = usePreferencesStore((state) => state.questionCount)
  const level = usePreferencesStore((state) => state.level)
  const quizStyle = usePreferencesStore((state) => state.quizStyle)
  const quickChoice = usePreferencesStore((state) => state.quickChoiceAfterMaterial)
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences)

  return (
    <section id="belajar" aria-labelledby="belajar-title" className={SECTION_CLASS}>
      <h2 id="belajar-title" className={TITLE_CLASS}>
        Belajar
      </h2>
      <ChoiceGroup<QuestionCount>
        label="Jumlah soal default"
        options={[5, 10, 15, 20]}
        value={questionCount}
        onChange={(value) => updatePreferences({ questionCount: value })}
      />
      <ChoiceGroup<QuizLevel>
        label="Tingkat default"
        options={['Mudah', 'Sedang', 'Sulit']}
        value={level}
        onChange={(value) => updatePreferences({ level: value })}
      />
      <ChoiceGroup<QuizStyle>
        label="Gaya kuis default"
        options={['Campuran', 'Pilihan ganda saja', 'Banyak cerita']}
        value={quizStyle}
        onChange={(value) => updatePreferences({ quizStyle: value })}
      />
      <SwitchRow
        label="Tampilkan pilihan cepat setelah materi"
        checked={quickChoice}
        onChange={(checked) => updatePreferences({ quickChoiceAfterMaterial: checked })}
      />
    </section>
  )
}

// Theme and reminders. Dark mode is marked as coming soon, as in the mockup.
export function DisplaySection() {
  const theme = usePreferencesStore((state) => state.theme)
  const reminderEnabled = usePreferencesStore((state) => state.reminderEnabled)
  const reminderTime = usePreferencesStore((state) => state.reminderTime)
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences)

  const themes: { value: ThemeChoice | 'dark'; label: string; disabled?: boolean }[] = [
    { value: 'light', label: 'Terang' },
    { value: 'system', label: 'Ikuti sistem' },
    { value: 'dark', label: 'Gelap (segera hadir)', disabled: true },
  ]

  return (
    <section id="tampilan" aria-labelledby="tampilan-title" className={SECTION_CLASS}>
      <h2 id="tampilan-title" className={TITLE_CLASS}>
        Tampilan dan notifikasi
      </h2>
      <div role="radiogroup" aria-label="Tema" className="flex flex-wrap gap-1.5">
        {themes.map((item) => {
          const selected = item.value === theme
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={item.disabled}
              onClick={() => {
                if (item.value !== 'dark') {
                  updatePreferences({ theme: item.value })
                }
              }}
              className={clsx(
                'min-h-[44px] rounded-full border px-3.5 text-[13px] disabled:cursor-not-allowed disabled:text-slate-400 md:min-h-[36px]',
                selected ? 'border-[#93C5FD] bg-soft font-semibold text-brand-dark' : 'border-line bg-white text-ink',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <SwitchRow
        label="Pengingat jadwal harian"
        checked={reminderEnabled}
        onChange={(checked) => {
          updatePreferences({ reminderEnabled: checked })
          if (checked) {
            void requestReminderPermission()
          }
        }}
      />
      {reminderEnabled && typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
        <p className="text-xs text-[#92400E]">Notifikasi diblokir di browser. Ubah izinnya di pengaturan browser.</p>
      )}
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="pengingat-jam" className="text-sm text-ink">
          Jam pengingat
        </label>
        <input
          id="pengingat-jam"
          type="time"
          value={reminderTime}
          disabled={!reminderEnabled}
          onChange={(event) => updatePreferences({ reminderTime: event.target.value })}
          className={clsx(INPUT_CLASS, 'disabled:text-slate-400')}
        />
      </div>
    </section>
  )
}

interface ChoiceGroupProps<T extends string | number> {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}

function ChoiceGroup<T extends string | number>({ label, options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const selected = option === value
          return (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={clsx(
                'min-h-[44px] rounded-full border px-3.5 text-[13px] md:min-h-[36px]',
                selected ? 'border-[#93C5FD] bg-soft font-semibold text-brand-dark' : 'border-line bg-white text-ink',
              )}
            >
              {String(option)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface SwitchRowProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function SwitchRow({ label, checked, onChange }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5">
      <span className="text-sm text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={clsx('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-slate-300')}
      >
        <span
          className={clsx(
            'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-[left]',
            checked ? 'left-5' : 'left-1',
          )}
        />
      </button>
    </div>
  )
}
