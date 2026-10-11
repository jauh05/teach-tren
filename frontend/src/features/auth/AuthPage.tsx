import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loginAccount, registerAccount, type AuthUser } from '../../api/auth'
import { Button } from '../../components/ui/Button'
import { BrandLink } from '../../components/layout/BrandLink'
import { safeRedirect, signInSchema, signUpSchema, type SignInValues, type SignUpValues } from '../../domain/auth'
import { useSessionStore } from '../../stores/sessionStore'

interface AuthPageProps {
  kind: 'masuk' | 'daftar'
}

// Sign-in and sign-up forms. They call the backend, which sets the session cookie.
export function AuthPage({ kind }: AuthPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const signIn = useSessionStore((state) => state.signIn)
  const isSignUp = kind === 'daftar'

  function finish(user: AuthUser) {
    signIn({ name: user.name, email: user.email })
    navigate(safeRedirect(params.get('redirect')), { replace: true })
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-4 py-10">
      <BrandLink />
      <div className="w-full max-w-[380px] rounded-[18px] border border-line bg-white p-5 shadow-sm">
        <h1 className="font-heading text-xl font-semibold text-ink">{isSignUp ? 'Daftar akun' : 'Masuk'}</h1>
        <p className="mt-1 text-sm text-muted">
          {isSignUp ? 'Simpan chat dan hasil kuis kamu di akun.' : 'Lanjutkan belajar dengan akun kamu.'}
        </p>

        <div className="mt-4">{isSignUp ? <SignUpForm onDone={finish} /> : <SignInForm onDone={finish} />}</div>

        <p className="mt-4 text-center text-sm text-muted">
          {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <Link to={isSignUp ? '/masuk' : '/daftar'} className="font-semibold text-brand-dark underline">
            {isSignUp ? 'Masuk' : 'Daftar'}
          </Link>
        </p>
        <Button variant="secondary" className="mt-3 w-full" onClick={() => navigate('/chat')}>
          Lanjut sebagai tamu
        </Button>
      </div>
    </main>
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
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
      <Field id="masuk-email" label="Email" type="email" autoComplete="email" error={errors.email?.message} inputProps={register('email')} />
      <Field
        id="masuk-password"
        label="Kata sandi"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        inputProps={register('password')}
      />
      {serverError && (
        <p role="alert" className="text-sm text-red-700">
          {serverError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Masuk
      </Button>
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
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-3.5">
      <Field id="daftar-name" label="Nama" autoComplete="name" error={errors.name?.message} inputProps={register('name')} />
      <Field id="daftar-email" label="Email" type="email" autoComplete="email" error={errors.email?.message} inputProps={register('email')} />
      <Field
        id="daftar-password"
        label="Kata sandi"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        inputProps={register('password')}
      />
      {serverError && (
        <p role="alert" className="text-sm text-red-700">
          {serverError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Daftar
      </Button>
    </form>
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
  error?: string
  inputProps: UseFormRegisterReturn
}

function Field({ id, label, type = 'text', autoComplete, error, inputProps }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
        {...inputProps}
      />
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
