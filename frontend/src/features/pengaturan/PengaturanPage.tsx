import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../stores/sessionStore'
import { DataSection, HelpSection, SignOutSection } from './DataSections'
import { DisplaySection, LearningSection } from './PreferenceSections'
import { ProfileSection } from './ProfileSection'

const SECTION_LINKS = [
  { id: 'profil', label: 'Profil' },
  { id: 'belajar', label: 'Belajar' },
  { id: 'tampilan', label: 'Tampilan dan notifikasi' },
  { id: 'data', label: 'Data dan privasi' },
  { id: 'bantuan', label: 'Bantuan' },
]

// Settings (/pengaturan), for signed-in users only. Desktop shows a section list on the left.
export function PengaturanPage() {
  const signOut = useSessionStore((state) => state.signOut)
  const navigate = useNavigate()

  return (
    <div className="flex min-h-0 flex-1">
      <nav aria-label="Bagian pengaturan" className="hidden w-[220px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-canvas p-2.5 md:flex">
        {SECTION_LINKS.map((link) => (
          <a key={link.id} href={`#${link.id}`} className="rounded-lg px-2.5 py-2 text-[13px] text-ink hover:bg-white">
            {link.label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => {
            navigate('/chat')
            signOut()
          }}
          className="rounded-lg px-2.5 py-2 text-left text-[13px] text-[#991B1B] hover:bg-white"
        >
          Keluar
        </button>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-7">
        <h1 className="mb-3 font-heading text-lg font-semibold text-ink">Pengaturan</h1>
        <div className="flex max-w-[620px] flex-col gap-3">
          <ProfileSection />
          <LearningSection />
          <DisplaySection />
          <DataSection />
          <HelpSection />
          <SignOutSection />
        </div>
      </div>
    </div>
  )
}
