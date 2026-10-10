import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { passwordChangeSchema, profileSchema } from '../../domain/settings'
import { initialsOf } from '../../lib/format'
import { useSessionStore } from '../../stores/sessionStore'
import { INPUT_CLASS, SECTION_CLASS, TITLE_CLASS } from './styles'

interface ProfileValues {
  name: string
}

interface PasswordValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Profile: display name (editable), email (read-only), and password change.
export function ProfileSection() {
  const account = useSessionStore((state) => state.account)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  return (
    <section id="profil" aria-labelledby="profil-title" className={SECTION_CLASS}>
      <h2 id="profil-title" className={TITLE_CLASS}>
        Profil
      </h2>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-semibold text-[#1E40AF]"
        >
          {initialsOf(account.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{account.name}</p>
          <p className="truncate text-xs text-muted">{account.email} · email tidak bisa diubah</p>
        </div>
        <Button variant="secondary" aria-expanded={editing} onClick={() => setEditing((value) => !value)}>
          Ubah profil
        </Button>
      </div>
      {editing && (
        <ProfileForm
          onSaved={() => {
            setEditing(false)
            setMessage('Profil diperbarui.')
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5">
        <span className="text-sm text-ink">Kata sandi</span>
        <Button variant="secondary" aria-expanded={changingPassword} onClick={() => setChangingPassword((value) => !value)}>
          Ubah kata sandi
        </Button>
      </div>
      {changingPassword && (
        <PasswordForm
          onSaved={() => {
            setChangingPassword(false)
            setMessage('Kata sandi diperbarui.')
          }}
          onCancel={() => setChangingPassword(false)}
        />
      )}

      {message && (
        <p role="status" className="text-xs text-muted">
          {message}
        </p>
      )}
    </section>
  )
}

interface ProfileFormProps {
  onSaved: () => void
  onCancel: () => void
}

function ProfileForm({ onSaved, onCancel }: ProfileFormProps) {
  const account = useSessionStore((state) => state.account)
  const updateAccountName = useSessionStore((state) => state.updateAccountName)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: account.name },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => {
        updateAccountName(values.name)
        onSaved()
      })}
      className="flex flex-col gap-2"
    >
      <label htmlFor="profil-nama" className="text-xs font-semibold text-ink">
        Nama tampilan
      </label>
      <input id="profil-nama" type="text" className={INPUT_CLASS} {...register('name')} />
      {errors.name && (
        <p role="alert" className="text-xs text-red-700">
          {errors.name.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit">Simpan</Button>
        <Button variant="secondary" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  )
}

interface PasswordFormProps {
  onSaved: () => void
  onCancel: () => void
}

// The current password is checked by the backend later. This form only validates the input for now.
function PasswordForm({ onSaved, onCancel }: PasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  return (
    <form noValidate onSubmit={handleSubmit(() => onSaved())} className="flex flex-col gap-2">
      <label htmlFor="sandi-lama" className="text-xs font-semibold text-ink">
        Kata sandi lama
      </label>
      <input id="sandi-lama" type="password" autoComplete="current-password" className={INPUT_CLASS} {...register('currentPassword')} />
      {errors.currentPassword && (
        <p role="alert" className="text-xs text-red-700">
          {errors.currentPassword.message}
        </p>
      )}
      <label htmlFor="sandi-baru" className="text-xs font-semibold text-ink">
        Kata sandi baru
      </label>
      <input id="sandi-baru" type="password" autoComplete="new-password" className={INPUT_CLASS} {...register('newPassword')} />
      {errors.newPassword && (
        <p role="alert" className="text-xs text-red-700">
          {errors.newPassword.message}
        </p>
      )}
      <label htmlFor="sandi-konfirmasi" className="text-xs font-semibold text-ink">
        Ulangi kata sandi baru
      </label>
      <input
        id="sandi-konfirmasi"
        type="password"
        autoComplete="new-password"
        className={INPUT_CLASS}
        {...register('confirmPassword')}
      />
      {errors.confirmPassword && (
        <p role="alert" className="text-xs text-red-700">
          {errors.confirmPassword.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit">Simpan</Button>
        <Button variant="secondary" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  )
}
