interface PlaceholderPageProps {
  title: string
}

// Temporary page for routes whose screens are not built yet.
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="font-heading text-xl font-semibold text-ink">{title}</h1>
      <p className="text-sm text-muted">Halaman ini belum tersedia pada tahap ini.</p>
    </section>
  )
}
