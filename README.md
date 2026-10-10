# Teach Tren

Aplikasi belajar berbasis chat untuk pelajar Indonesia. Pusat aplikasi adalah percakapan. Pengguna bisa bertanya tanpa login (tamu), lalu masuk untuk fitur lengkap.

## Dokumen acuan

- `CLAUDE.md`: aturan proyek untuk pengembangan.
- `docs/role.md`: role, hak akses, spesifikasi halaman, dan prompt.
- `docs/pemahaman.md`: ringkasan produk, daftar layar, token warna, dan aturan status bulat.
- `docs/design/html/`: mockup HTML desktop (1280 x 800) dan mobile (390 x 844). Buka `index.html` untuk galeri.

## Prasyarat

- Node.js 20 atau lebih baru.
- Untuk test E2E: pasang Chromium sekali dengan `npx playwright install chromium`.

## Cara install

```bash
cd frontend
npm install
```

## Cara menjalankan

```bash
cd frontend
npm run dev
```

Buka `http://localhost:5173`.

## Cara test

```bash
cd frontend
npm run lint
npm test
npm run build
npm run e2e
```

- `npm test` menjalankan Vitest untuk logika dan token warna.
- `npm run e2e` menjalankan Playwright di dua proyek: desktop 1280px dan mobile 390px.

## Struktur

```
frontend/   aplikasi React, Vite, TypeScript, dan Tailwind CSS
docs/       dokumen acuan dan mockup HTML
input/      berkas sumber asli (jangan dihapus)
```

## Status

Tahap pengerjaan: fondasi frontend (Vite, Tailwind, Vitest, Playwright, PWA). Daftar layar dan selisih akan ditambahkan setelah layar dibangun.
