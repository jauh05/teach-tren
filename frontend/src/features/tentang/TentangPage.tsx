import { useNavigate } from 'react-router-dom'
import tentangContent from '../../content/tentang.md?raw'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'

// Usage guide (/tentang). Content lives in src/content/tentang.md, so it can change without code changes.
export function TentangPage() {
  const navigate = useNavigate()

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-xl font-semibold text-ink">Tentang Teach Tren</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Kembali
            </Button>
            <Button onClick={() => navigate('/chat')}>Mulai chat</Button>
          </div>
        </div>
        <div className="tentang-body">
          <RichText content={tentangContent} />
        </div>
      </div>
    </section>
  )
}
