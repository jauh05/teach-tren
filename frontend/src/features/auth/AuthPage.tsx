import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { ArrowLeft, CircleAlert, Eye, EyeOff, LoaderCircle, Music2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loginAccount, registerAccount, type AuthUser } from '../../api/auth'
import { importGuestHistory } from '../../api/conversations'
import { importGuestTopics } from '../../api/topics'
import { importGuestQuizzes } from '../../api/quizzes'
import { BrandLink } from '../../components/layout/BrandLink'
import { Button } from '../../components/ui/Button'
import { safeRedirect, signInSchema, signUpSchema, type SignInValues, type SignUpValues } from '../../domain/auth'
import { hydratePreferences } from '../../stores/preferencesStore'
import { continueAsGuest, useSessionStore } from '../../stores/sessionStore'
import { AuthHero, SignUpArt } from './AuthArt'
import { clearPendingSocialSignIn, socialSignInMessage, startSocialSignIn, type SocialProvider } from './oauth'

interface AuthPageProps {
  kind: 'masuk' | 'daftar'
}

// Sign-in and sign-up pages, drawn after docs/design/acuan-masuk-daftar.png. The forms call the backend, which sets the session cookie.
export function AuthPage({ kind }: AuthPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const signIn = useSessionStore((state) => state.signIn)
  const isSignUp = kind === 'daftar'
  // The redirect target is kept when the user switches between the two pages.
  const redirect = params.get('redirect')
  const suffix = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
  // The provider sign-in can come back with a reason (see the server's oauth routes). It is shown above the form.
  const socialMessage = socialSignInMessage(params.get('oauth'), params.get('provider'))
  useEffect(() => {
    if (params.get('oauth')) {
      clearPendingSocialSignIn()
    }
  }, [params])

  async function finish(user: AuthUser) {
    // The session cookie is already set by the server, so the carried-over history can be saved.
    // The device's guest id is kept at sign-in, and it finds the quiz runs made on this device.
    const guestId = useSessionStore.getState().guestId
    await importGuestHistory().catch(() => undefined)
    await importGuestTopics().catch(() => undefined)
    await importGuestQuizzes(guestId).catch(() => undefined)
    signIn({ name: user.name, email: user.email })
    void hydratePreferences()
    navigate(safeRedirect(redirect), { replace: true })
  }

  async function enterAsGuest() {
    await continueAsGuest()
    navigate('/chat', { replace: true })
  }

  return (
    <main className="flex min-h-dvh justify-center bg-canvas md:px-6 md:py-10">
      <div className="flex w-full max-w-[420px] flex-col overflow-hidden bg-white md:rounded-[32px] md:shadow-[0_30px_70px_-30px_rgba(11,11,11,0.25)]">
        {isSignUp ? (
          <div className="relative h-[240px] shrink-0 overflow-hidden">
            <SignUpArt />
            <Link
              to={`/masuk${suffix}`}
              aria-label="Kembali ke halaman masuk"
              className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
            <p className="absolute bottom-16 left-6 font-heading text-3xl font-bold text-ink">Teach Tren</p>
          </div>
        ) : (
          <div className="relative h-[280px] shrink-0 overflow-hidden">
            <AuthHero />
          </div>
        )}

        {/* On the sign-up page the white sheet overlaps the blue header. */}
        <section className={clsx('flex flex-1 flex-col gap-5 px-6 pb-8', isSignUp ? '-mt-8 rounded-t-[32px] bg-white pt-14' : 'pt-6')}>
          {!isSignUp && <BrandLink />}
          <div className={clsx(isSignUp && 'text-center')}>
            <h1 className="font-heading text-[28px] font-bold leading-tight text-ink">{isSignUp ? 'Daftar akun' : 'Masuk'}</h1>
            <p className="mt-1 text-sm text-muted">
              {isSignUp ? 'Simpan chat, kuis, dan neuron belajar kamu di satu akun.' : 'Lanjutkan belajar dari tempat terakhir kamu berhenti.'}
            </p>
          </div>

          <ServerError message={socialMessage} />
          {isSignUp ? <SignUpForm onDone={finish} /> : <SignInForm onDone={finish} />}
          <SocialSignIn />

          <p className="text-center text-sm text-muted">
            {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <Link to={`${isSignUp ? '/masuk' : '/daftar'}${suffix}`} className="font-semibold text-brand-dark hover:underline">
              {isSignUp ? 'Masuk' : 'Daftar'}
            </Link>
          </p>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            atau
            <span className="h-px flex-1 bg-line" />
          </div>
          <Button variant="secondary" className="min-h-[48px] w-full rounded-full md:min-h-[44px]" onClick={enterAsGuest}>
            Lanjut sebagai tamu
          </Button>
          <p className="text-center text-xs text-muted">Tamu bisa mencoba chat dan satu neuron dari AI tanpa masuk.</p>
        </section>
      </div>
    </main>
  )
}

// Sign-in with Google, Facebook, and TikTok. Each button starts the provider's sign-in (see oauth.ts).
const PROVIDERS: { id: SocialProvider; name: string; mark: ReactNode }[] = [
  { id: 'google', name: 'Google', mark: <span className="text-base font-bold">G</span> },
  { id: 'facebook', name: 'Facebook', mark: <span className="text-lg font-bold">f</span> },
  { id: 'tiktok', name: 'TikTok', mark: <Music2 size={18} aria-hidden="true" /> },
]

function SocialSignIn() {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted">Atau masuk dengan</p>
      <div className="flex gap-3">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            aria-label={`Masuk dengan ${provider.name}`}
            onClick={() => startSocialSignIn(provider.id)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-ink hover:border-brand-dark"
          >
            {provider.mark}
          </button>
        ))}
      </div>
    </div>
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
      <Field id="masuk-email" label="Email" placeholder="Email" type="email" autoComplete="email" error={errors.email?.message} inputProps={register('email')} />
      <PasswordField
        id="masuk-password"
        label="Kata sandi"
        placeholder="Kata sandi"
        autoComplete="current-password"
        error={errors.password?.message}
        inputProps={register('password')}
      />
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
      <Field id="daftar-name" label="Nama" placeholder="Nama lengkap" autoComplete="name" error={errors.name?.message} inputProps={register('name')} />
      <Field id="daftar-email" label="Email" placeholder="Email" type="email" autoComplete="email" error={errors.email?.message} inputProps={register('email')} />
      <PasswordField
        id="daftar-password"
        label="Kata sandi"
        placeholder="Kata sandi"
        autoComplete="new-password"
        hint="Minimal 8 karakter."
        error={errors.password?.message}
        inputProps={register('password')}
      />
      <ServerError message={serverError} />
      <SubmitButton pending={isSubmitting} label="Buat akun" />
    </form>
  )
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" className="mt-1 min-h-[52px] w-full rounded-full text-[15px] md:min-h-[48px]" disabled={pending}>
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
    <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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
  placeholder: string
  type?: string
  autoComplete?: string
  hint?: string
  error?: string
  inputProps: UseFormRegisterReturn
  trailing?: ReactNode
}

// The label is visually hidden, because the placeholder shows the same name inside the pill-shaped field.
function Field({ id, label, placeholder, type = 'text', autoComplete, hint, error, inputProps, trailing }: FieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={clsx(
          'flex items-center gap-2 rounded-full border bg-white px-5 transition-colors focus-within:border-brand-dark focus-within:ring-2 focus-within:ring-brand/20',
          error ? 'border-red-600' : 'border-line',
        )}
      >
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-[15px] text-ink outline-none placeholder:text-muted md:text-sm"
          {...inputProps}
        />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="px-4 text-xs text-red-700">
          {error}
        </p>
      ) : (
        hint && <p className="px-4 text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

// The password can be shown while it is typed. The button label avoids the field name, so it does not match the field in tests or screen readers.
function PasswordField({ inputProps, ...props }: Omit<FieldProps, 'type' | 'trailing'> & { inputProps: UseFormRegisterReturn }) {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      inputProps={inputProps}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
          aria-pressed={visible}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-slate-100 hover:text-ink"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      }
    />
  )
}
