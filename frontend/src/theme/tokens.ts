// Single source of design tokens. Used by tailwind.config.ts and by tests.
// The palette follows the reference image docs/design/acuan-palet-baru.png (documented in docs/design/palet.md).

export const colors = {
  // Mint green is the accent. Dark green is for text on white. Black is for the main buttons.
  brand: {
    DEFAULT: '#68D69E',
    dark: '#15795A',
    soft: '#F1FBFA',
  },
  ink: '#141414',
  muted: '#606563',
  line: '#E3E6E5',
  // Page background behind the cards. Cards are white.
  canvas: '#F2F2F2',
  // Topic status colors (docs/role.md 4.1). Names follow the domain, not the color.
  status: {
    kuasai: '#16A34A',
    sedang: '#D97706',
    ulang: '#DC2626',
    baru: '#0D9488',
    belum: '#94A3B8',
    saran: '#7C3AED',
  },
} as const

export const fontFamily: Record<string, string[]> = {
  sans: ['"Inter Variable"', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'],
  heading: ['"Plus Jakarta Sans"', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'],
}

// Layout sizes from docs/role.md section 3.
export const layout = {
  navHeight: '52px',
  bottomNavHeight: '60px',
  sidebarWidth: '264px',
  sidebarMiniWidth: '64px',
  detailPanelWidth: '320px',
  legendWidth: '156px',
  memoryPanelWidth: '200px',
  chatPanelWidth: '360px',
} as const
