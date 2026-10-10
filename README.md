# Teach Tren

Aplikasi belajar berbasis chat untuk pelajar Indonesia. Pusat aplikasi adalah percakapan. Pengguna bisa bertanya tanpa login (tamu). Setelah dua aksi AI, tamu diminta daftar atau masuk. Pengguna yang masuk mendapat fitur lengkap: kanvas topik belajar, kuis, jadwal, dan pengaturan.

## Status

- **Frontend (tahap ini):** tujuh layar dari mockup (desktop 1280 px dan mobile 390 px) sudah dibangun dengan data mock. Lihat [docs/selisih.md](docs/selisih.md) untuk perbedaan dengan mockup.
- **Backend:** belum dibuat. Semua data berasal dari `frontend/src/api/`. Batas tamu dan kuota saat ini hanya dijalankan di frontend.

## Dokumen acuan

- [CLAUDE.md](CLAUDE.md): aturan proyek untuk pengembangan.
- [docs/role.md](docs/role.md): role, hak akses, spesifikasi halaman, dan prompt.
- [docs/pemahaman.md](docs/pemahaman.md): ringkasan produk, daftar layar, token warna, dan aturan status bulat.
- [docs/selisih.md](docs/selisih.md): perbedaan antara mockup dan implementasi, beserta statusnya.
- [docs/design/html/](docs/design/html/): mockup HTML. Buka `index.html` untuk galeri.

## Prasyarat

- Node.js 22.12 atau lebih baru (atau 20.19 atau lebih baru). Vite 8 membutuhkan versi ini.
- Chromium untuk Playwright. Pasang sekali dengan perintah di bawah.

## Install

```bash
cd frontend
npm install
npx playwright install chromium
```

## Menjalankan

```bash
cd frontend
npm run dev
```

Buka `http://localhost:5173`. Aplikasi langsung masuk ke halaman Chat dalam mode masuk dengan akun demo `Rafi Arkan`. Untuk mencoba mode tamu, pilih **Keluar** dari menu avatar.

Opsional: salin `.env.example` ke `frontend/.env` untuk mengubah `VITE_API_BASE_URL`. Frontend tidak boleh berisi kunci API.

## Test

```bash
cd frontend
npm run lint     # oxlint, termasuk aturan dilarang memakai any
npm test         # Vitest: logika domain, token warna, dan utilitas
npm run build    # tsc -b dan build produksi, termasuk PWA
npm run e2e      # Playwright: desktop 1280 px dan mobile 390 px
```

- `npm test` menjalankan 97 unit test. Mencakup status bulat, kuota tamu, skor kuis, penjadwalan, kalender, validasi formulir, dan paritas token warna dengan `styles.css`.
- `npm run e2e` menjalankan alur pengguna dari setiap layar di dua ukuran layar. Termasuk pengecekan tidak ada scroll horizontal.

## Daftar layar

| No | Layar | Route | Mockup | Keterangan |
| --- | --- | --- | --- | --- |
| 1 | Chat beranda | `/chat` | 01 | Sapaan, kolom tulis, dan saran. Desktop memakai sidebar riwayat, mobile memakai drawer |
| 2 | Learning | `/learning` | 02 | Kanvas bulat: zoom 40 sampai 200 persen, geser, tarik bulat, legenda, dan panel detail |
| 3 | Chat jawaban | `/c/:id` | 03 | Streaming, berhenti, ulangi, rumus KaTeX, dan kartu Langkah berikutnya |
| 4 | Kuis | `/kuis/:id` | 04 | Satu soal per layar, teks bacaan bisa dilipat, pembahasan untuk pengguna masuk |
| 5 | Jadwal | `/jadwal` | 05 | Minggu di desktop, agenda harian di mobile, saran AI bisa diterima atau diseret |
| 5b | Ingatan AI | `/jadwal/ingatan` | 05 | Topik yang sudah dipelajari, halaman terpisah di mobile |
| 6 | Tamu batas | `/c/:id` dan `/kuis/:id` | 06 | Kuota dua aksi per perangkat, kartu terkunci, dan ajakan daftar atau masuk |
| 7 | Pengaturan | `/pengaturan` | 07 | Profil, belajar, tampilan, data dan privasi, bantuan, dan keluar |
| - | Masuk dan Daftar | `/masuk`, `/daftar` | - | Formulir simulasi dengan validasi dan redirect aman |
| - | Tentang, Materi | `/tentang`, `/materi` | - | Placeholder. Belum termasuk ruang lingkup tahap ini |

## Struktur

```
CLAUDE.md                 aturan proyek untuk pengembangan
docs/                     dokumen acuan, pemahaman, dan selisih
docs/design/html/        mockup HTML (14 layar)
frontend/
  src/api/                data mock (akan diganti API backend)
  src/domain/             aturan bisnis murni dan unit test
  src/features/           satu folder per halaman
  src/components/         komponen bersama (layout, markdown, ui)
  src/stores/             Zustand: sesi dan preferensi
  src/theme/tokens.ts     token warna dan tata letak dari mockup
  e2e/                    Playwright: alur pengguna
```

## Catatan

- `npm audit` menunjukkan 11 advisory, hampir semuanya di toolchain Tailwind 3 yang hanya dipakai saat build. Perbaikannya membutuhkan migrasi ke Tailwind 4.
- Berkas sumber asli di `input/` tidak dikirim ke repo.
