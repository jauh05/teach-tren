import { AvatarMenu } from './AvatarMenu'
import { BrandLink } from './BrandLink'
import { ModeBadge } from './ModeBadge'

// Compact header for phones (below 768px).
export function MobileHeader() {
  return (
    <header className="relative z-20 flex h-nav shrink-0 items-center justify-between gap-2 border-b border-line px-4 md:hidden">
      <BrandLink />
      <div className="flex items-center gap-2">
        <ModeBadge compact />
        <AvatarMenu />
      </div>
    </header>
  )
}
