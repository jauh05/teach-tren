import type { Config } from 'tailwindcss'
import { colors, fontFamily, layout } from './src/theme/tokens.ts'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily,
      fontSize: {
        micro: ['11px', '16px'],
      },
      height: {
        nav: layout.navHeight,
        'bottom-nav': layout.bottomNavHeight,
      },
      width: {
        sidebar: layout.sidebarWidth,
        'sidebar-mini': layout.sidebarMiniWidth,
        'detail-panel': layout.detailPanelWidth,
        legend: layout.legendWidth,
        'memory-panel': layout.memoryPanelWidth,
        'chat-panel': layout.chatPanelWidth,
      },
    },
  },
  plugins: [],
}

export default config
