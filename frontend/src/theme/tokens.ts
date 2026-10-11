// Single source of design tokens. Used by tailwind.config.ts and by tests.
// Values mirror docs/design/html/styles.css and docs/role.md sections 3, 4, and 5.

export const colors = {
  brand: {
    DEFAULT: '#2563EB',
    dark: '#1E40AF',
    soft: '#EFF6FF',
  },
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E2E8F0',
  canvas: '#FAFBFD',
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
