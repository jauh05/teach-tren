import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { ArrowRight, CircleAlert, ClipboardCheck, Eye, EyeOff, LoaderCircle, Lock, Mail, MessageSquare, Network, User, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loginAccount, registerAccount, type AuthUser } from '../../api/auth'
import { importGuestHistory } from '../../api/conversations'
import { importGuestTopics } from '../../api/topics'
import { BrandLink } from '../../components/layout/BrandLink'
import { Button } from '../../components/ui/Button'
import { safeRedirect, signInSchema, signUpSchema, type SignInValues, type SignUpValues } from '../../domain/auth'
import { hydratePreferences } from '../../stores/preferencesStore'
import { useSessionStore } from '../../stores/sessionStore'

interface AuthPageProps {
  kind: 'masuk' | 'daftar'
}

// Sign-in and sign-up pages. The forms call the backend, which sets the session cookie.
export function AuthPage({ kind }: AuthPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const signIn = useSessionStore((state) => state.signIn)
  const isSignUp = kind === 'daftar'

  async function finish(user: AuthUser) {
    // The session cookie is already set by the server, so the carried-over history can be saved.
    await importGuestHistory().catch(() => undefined)
    await importGuestTopics().catch(() => undefined)
    signIn({ name: user.name, email: user.email })
    void hydratePreferences()
    navigate(safeRedirect(params.get('redirect')), { replace: true })
  }

  return (
    <main className="flex min-h-dvh flex-col bg-white md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,500px)]">
      <IntroPanel />

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 md:px-10">
        <div className="w-full max-w-[400px] md:hidden">
          <BrandLink />
        </div>

        <div className="w-full max-w-[400px] rounded-[18px] border border-line bg-white p-5 shadow-sm md:p-7">
          <ModeSwitch kind={kind} />
          <h1 className="mt-5 font-heading text-xl font-semibold text-ink">{isSignUp ? 'Daftar akun' : 'Masuk'}</h1>
          <p className="mt-1 text-sm text-muted">
            {isSignUp ? 'Simpan chat, kuis, dan bulat belajar kamu di satu akun.' : 'Lanjutkan belajar dari tempat terakhir kamu berhenti.'}
          </p>

          <div className="mt-5">{isSignUp ? <SignUpForm onDone={finish} /> : <SignInForm onDone={finish} />}</div>
        </div>

        <div className="w-full max-w-[400px] text-center">
          <p className="text-sm text-muted">Ingin melihat-lihat dulu?</p>
          <Button variant="secondary" className="mt-2 w-full min-h-[44px] md:min-h-[40px]" onClick={() => navigate('/chat')}>
            Lanjut sebagai tamu
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </section>
    </main>
  )
}

const POINTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: MessageSquare, title: 'Tanya apa saja di chat', text: 'Minta penjelasan, soal latihan, atau ringkasan materi.' },
  { icon: Network, title: 'Susun topik sebagai bulat', text: 'Setiap topik menjadi bulat yang bisa dihubungkan ke topik lain.' },
  { icon: ClipboardCheck, title: 'Lihat kemajuan dari kuis', text: 'Skor kuis memperbarui status setiap bulat.' },
]

// Left side on desktop. It explains what the account is for. Hidden on mobile to keep the form first.
function IntroPanel() {
  return (
    <aside className="hidden flex-col justify-between bg-soft px-12 py-12 md:flex">
      <BrandLink />
      <div className="max-w-[420px]">
        <h2 className="font-heading text-3xl font-semibold leading-tight text-ink">Belajar lewat chat, lalu lihat kemajuanmu di bulat topik.</h2>
        <ul className="mt-8 flex flex-col gap-5">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">Chat dan hasil kuis disimpan di akunmu dan bisa dibuka dari perangkat lain.</p>
    </aside>
  )
}

// Switches between the two pages and keeps the redirect target, so the user lands where they meant to go.
function ModeSwitch({ kind }: { kind: AuthPageProps['kind'] }) {
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const suffix = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
  const options = [
    { to: '/masuk', label: 'Masuk', value: 'masuk' },
    { to: '/daftar', label: 'Daftar', value: 'daftar' },
  ] as const

  return (
    <nav aria-label="Pilih masuk atau daftar" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((option) => {
        const active = option.value === kind
        return (
          <Link
            key={option.value}
            to={`${option.to}${suffix}`}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'rounded-lg py-2 text-center text-sm font-semibold transition-colors',
              active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </Link>
        )
      })}
    </nav>
  )
}

interface FormProps {
  onDone: (user: AuthUser) => void
}

function SignInForm({ onDone }: FormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function submit(values: SignInValues) {
    setServerError(null)
    try {
      onDone(await loginAccount(values))
    } catch (error) {
      setServerError(errorMessage(error))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Field id="masuk-email" label="Email" type="email" autoComplete="email" icon={Mail} error={errors.email?.message} inputProps={register('email')} />
      <PasswordField id="masuk-password" label="Kata sandi" autoComplete="current-password" error={errors.password?.message} inputProps={register('password')} />
      <ServerError message={serverError} />
      <SubmitButton pending={isSubmitting} label="Masuk" />
    </form>
  )
}

function SignUpForm({ onDone }: FormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  async function submit(values: SignUpValues) {
    setServerError(null)
    try {
      onDone(await registerAccount(values))
    } catch (error) {
      setServerError(errorMessage(error))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Field id="daftar-name" label="Nama" autoComplete="name" icon={User} error={errors.name?.message} inputProps={register('name')} />
      <Field id="daftar-email" label="Email" type="email" autoComplete="email" icon={Mail} error={errors.email?.message} inputProps={register('email')} />
      <PasswordField
        id="daftar-password"
        label="Kata sandi"
        autoComplete="new-password"
        hint="Minimal 8 karakter."
        error={errors.password?.message}
        inputProps={register('password')}
      />
      <ServerError message={serverError} />
      <SubmitButton pending={isSubmitting} label="Daftar" />
    </form>
  )
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" className="mt-1 w-full min-h-[44px] md:min-h-[40px]" disabled={pending}>
      {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
      {label}
    </Button>
  )
}

function ServerError({ message }: { message: string | null }) {
  if (!message) {
    return null
  }
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
      <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'
}

interface FieldProps {
  id: string
  label: string
  type?: string
  autoComplete?: string
  icon: LucideIcon
  hint?: string
  error?: string
  inputProps: UseFormRegisterReturn
  trailing?: ReactNode
}

function Field({ id, label, type = 'text', autoComplete, icon: Icon, hint, error, inputProps, trailing }: FieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div
        className={clsx(
          'flex items-center gap-2 rounded-lg border bg-white px-3 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
          error ? 'border-red-600' : 'border-[#CBD5E1]',
        )}
      >
        <Icon size={16} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-ink outline-none placeholder:text-slate-400 md:text-sm"
          {...inputProps}
        />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

// The password can be shown while it is typed. The button label avoids the field name, so it does not match the field in tests or screen readers.
function PasswordField({ inputProps, ...props }: Omit<FieldProps, 'type' | 'icon' | 'trailing'> & { inputProps: UseFormRegisterReturn }) {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      icon={Lock}
      inputProps={inputProps}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
          aria-pressed={visible}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-slate-100 hover:text-ink"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      }
    />
  )
}
