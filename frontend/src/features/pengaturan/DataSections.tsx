import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { deleteAccount } from '../../api/auth'
import { clearConversations, fetchConversations } from '../../api/conversations'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { deleteAccountSchema, isClearHistoryConfirmed } from '../../domain/settings'
import { useSessionStore } from '../../stores/sessionStore'
import { INPUT_CLASS, SECTION_CLASS, TITLE_CLASS } from './styles'

const ROW_CLASS = 'flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2.5 text-left text-sm text-ink hover:bg-slate-100'

// Data and privacy: export, clear history, and delete the account (docs/role.md 4.7).
export function DataSection() {
  const [clearOpen, setClearOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const signOut = useSessionStore((state) => state.signOut)

  const clear = useMutation({
    mutationFn: clearConversations,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setClearOpen(false)
      setStatus('Semua riwayat dihapus.')
    },
  })

  async function exportHistory() {
    const conversations = await fetchConversations()
    const payload = { exportedAt: new Date().toISOString(), conversations }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'riwayat-teach-tren.json'
    link.click()
    URL.revokeObjectURL(url)
    setStatus('Riwayat diekspor sebagai berkas JSON.')
  }

  return (
    <section id="data" aria-labelledby="data-title" className={SECTION_CLASS}>
      <h2 id="data-title" className={TITLE_CLASS}>
        Data dan privasi
      </h2>
      <button type="button" className={ROW_CLASS} onClick={() => void exportHistory()}>
        Ekspor riwayat (JSON)
        <ChevronRight size={16} aria-hidden="true" className="text-muted" />
      </button>
      <button type="button" className={ROW_CLASS} onClick={() => setClearOpen(true)}>
        Hapus semua riwayat
        <ChevronRight size={16} aria-hidden="true" className="text-muted" />
      </button>
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="flex items-center justify-between gap-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-left text-sm text-[#991B1B]"
      >
        Hapus akun
        <span className="text-xs">data hilang dalam 30 hari</span>
      </button>

      {status && (
        <p role="status" className="text-xs text-muted">
          {status}
        </p>
      )}

      <ClearHistoryDialog
        open={clearOpen}
        pending={clear.isPending}
        onClose={() => setClearOpen(false)}
        onConfirm={() => clear.mutate()}
      />
      <DeleteAccountDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={async () => {
          setDeleteOpen(false)
          await signOut()
          navigate('/chat')
        }}
      />
    </section>
  )
}

interface ClearHistoryDialogProps {
  open: boolean
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}

// The user must type HAPUS before the delete button enables.
function ClearHistoryDialog({ open, pending, onClose, onConfirm }: ClearHistoryDialogProps) {
  const [typed, setTyped] = useState('')
  const confirmed = isClearHistoryConfirmed(typed)

  function close() {
    setTyped('')
    onClose()
  }

  return (
    <Dialog open={open} title="Hapus semua riwayat?" onClose={close}>
      <p className="text-sm text-muted">
        Semua riwayat chat dan kuis di akun ini akan dihapus. Ketik <strong className="text-ink">HAPUS</strong> untuk
        konfirmasi.
      </p>
      <input
        aria-label="Ketik HAPUS untuk konfirmasi"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        className={clsx(INPUT_CLASS, 'mt-3 w-full')}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Batal
        </Button>
        <Button
          disabled={!confirmed || pending}
          onClick={() => {
            setTyped('')
            onConfirm()
          }}
        >
          Hapus semua
        </Button>
      </div>
    </Dialog>
  )
}

interface DeleteAccountDialogProps {
  open: boolean
  onClose: () => void
  onDeleted: () => void
}

interface DeleteAccountValues {
  password: string
}

// Account deletion asks for the password. Data is removed within 30 days (docs/role.md 2.4).
function DeleteAccountDialog({ open, onClose, onDeleted }: DeleteAccountDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  })

  function close() {
    reset()
    setServerError(null)
    onClose()
  }

  async function confirm(values: DeleteAccountValues) {
    setServerError(null)
    try {
      await deleteAccount(values.password)
      reset()
      onDeleted()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.')
    }
  }

  return (
    <Dialog open={open} title="Hapus akun?" onClose={close}>
      <p className="text-sm text-muted">
        Akunmu dijadwalkan dihapus. Data dihapus dalam 30 hari. Selama masa itu, akun bisa dipulihkan dengan masuk
        kembali.
      </p>
      <form noValidate onSubmit={handleSubmit(confirm)} className="mt-3 flex flex-col gap-2">
        <label htmlFor="hapus-akun-sandi" className="text-xs font-semibold text-ink">
          Kata sandi untuk konfirmasi
        </label>
        <input id="hapus-akun-sandi" type="password" autoComplete="current-password" className={INPUT_CLASS} {...register('password')} />
        {errors.password && (
          <p role="alert" className="text-xs text-red-700">
            {errors.password.message}
          </p>
        )}
        {serverError && (
          <p role="alert" className="text-xs text-red-700">
            {serverError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Batal
          </Button>
          <button type="submit" className="rounded-[10px] bg-red-700 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-red-800">
            Hapus akun
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// Help links and the feedback form placeholder (docs/role.md 4.7).
export function HelpSection() {
  return (
    <section id="bantuan" aria-labelledby="bantuan-title" className={SECTION_CLASS}>
      <h2 id="bantuan-title" className={TITLE_CLASS}>
        Bantuan
      </h2>
      <Link to="/tentang" className={ROW_CLASS}>
        Tentang Teach Tren
        <ChevronRight size={16} aria-hidden="true" className="text-muted" />
      </Link>
      <button type="button" disabled className={clsx(ROW_CLASS, 'cursor-not-allowed text-slate-400')}>
        Formulir umpan balik
        <span className="text-xs">Segera hadir</span>
      </button>
    </section>
  )
}

// Sign out ends the session on this device. Account data stays on the server (docs/role.md 2.4).
export function SignOutSection() {
  const signOut = useSessionStore((state) => state.signOut)
  const navigate = useNavigate()

  return (
    <section id="keluar" aria-labelledby="keluar-title" className={clsx(SECTION_CLASS, 'flex-row items-center justify-between')}>
      <h2 id="keluar-title" className="sr-only">
        Keluar
      </h2>
      <p className="text-xs text-muted">Keluar menghapus sesi di perangkat ini. Data akun tetap tersimpan.</p>
      <Button
        variant="secondary"
        onClick={async () => {
          await signOut()
          navigate('/chat')
        }}
      >
        Keluar
      </Button>
    </section>
  )
}
