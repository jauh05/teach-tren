import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createTopic } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { topicNameSchema } from '../../domain/topicNames'

const schema = z.object({ name: topicNameSchema })
type Values = z.infer<typeof schema>

interface AddTopicDialogProps {
  open: boolean
  onClose: () => void
  // Called with the id of the new topic, after the topic list has been refreshed.
  onCreated: (topicId: string) => void
}

// Pop-up to add a topic by name. The server places the new topic on the canvas.
export function AddTopicDialog({ open, onClose, onCreated }: AddTopicDialogProps) {
  const inputId = useId()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '' } })

  const create = useMutation({
    mutationFn: (name: string) => createTopic(name),
    onSuccess: async (topicId) => {
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
      reset()
      onCreated(topicId)
    },
    onError: (error) => {
      setError('name', { message: error.message })
    },
  })

  function close() {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} title="Tambah bulat" description="Tulis topik yang ingin kamu pelajari." onClose={close}>
      <form onSubmit={handleSubmit((values) => create.mutate(values.name))} noValidate className="flex flex-col gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          Nama bulat
        </label>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          placeholder="Contoh: Persamaan linear"
          aria-invalid={errors.name ? 'true' : undefined}
          className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          {...register('name')}
        />
        {errors.name && (
          <p role="alert" className="text-xs text-red-700">
            {errors.name.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            Tambah
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
