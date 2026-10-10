import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

// Shown when a guest has used both free actions. Chat and quiz results move to the account after sign-in.
export function GuestLimitCard() {
  const navigate = useNavigate()

  return (
    <section aria-label="Lanjutkan belajar dengan akun" className="self-start rounded-[14px] bg-soft p-4 md:max-w-[560px]">
      <h2 className="font-heading text-base font-semibold text-ink">Lanjutkan belajar dengan akun</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#334155]">
        Kamu sudah memakai 2 aksi gratis di perangkat ini. Chat dan hasil kuis kamu akan dipindahkan ke akun. Tidak ada
        yang hilang.
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Button className="flex-1" onClick={() => navigate('/daftar')}>
          Daftar akun
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => navigate('/masuk')}>
          Masuk
        </Button>
      </div>
    </section>
  )
}
