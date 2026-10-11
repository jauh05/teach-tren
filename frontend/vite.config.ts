import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Requests to /api go to the backend, so the session cookie stays on the frontend's origin.
    proxy: {
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:3001' },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Teach Tren',
        short_name: 'Teach Tren',
        description: 'Aplikasi belajar berbasis chat untuk pelajar Indonesia.',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        theme_color: '#2563EB',
        background_color: '#FFFFFF',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
