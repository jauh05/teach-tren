import { Link } from 'react-router-dom'
import { Logo } from '../Logo'

export function BrandLink() {
  return (
    <Link to="/chat" className="flex items-center gap-2 font-heading text-[15px] font-semibold text-ink">
      <Logo size={20} />
      <span>
        Teach <span className="text-brand">Tren</span>
      </span>
    </Link>
  )
}
