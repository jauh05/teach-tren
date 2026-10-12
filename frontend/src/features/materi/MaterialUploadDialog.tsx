import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { FileUp } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { uploadMaterial } from '../../api/materi'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { MAX_MATERIAL_BYTES } from '../../domain/materi'

interface MaterialUploadDialogProps {
  open: boolean
  onClose: () => void
}

// Upload pop-up for study materials. Used from Materi and from the attachment menu in chat.
export function MaterialUploadDialog({ open, onClose }: MaterialUploadDialogProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const upload = useMutation({
    mutationFn: uploadMaterial,
    onSuccess: async () => {
      setError(null)
      // The new file shows in the materi list, already in progress, once the pop-up closes.
      onClose()
      await queryClient.invalidateQueries({ queryKey: ['materi'] })
    },
    onError: (failure) => setError(failure.message),
  })

  function handleFile(file: File | undefined) {
    if (file) {
      upload.mutate(file)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  function close() {
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} title="Unggah materi" description="Berkas PDF, DOCX, atau PPTX." onClose={close}>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'flex flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed bg-white p-6 text-center',
          dragging ? 'border-brand bg-brand-soft' : 'border-line',
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
          <FileUp size={20} aria-hidden="true" />
        </span>
        <p className="text-sm text-ink">Seret berkas ke sini, atau pilih dari perangkatmu.</p>
        <p className="text-xs text-muted">Maksimal {MAX_MATERIAL_BYTES / (1024 * 1024)} MB per berkas.</p>
        <Button variant="secondary" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
          Pilih berkas
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          aria-label="Pilih berkas materi"
          className="sr-only"
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </Dialog>
  )
}
