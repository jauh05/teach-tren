# Teach Tren

Aplikasi belajar berbasis chat untuk pelajar Indonesia. Pusat aplikasi adalah percakapan. Pengguna bisa bertanya tanpa masuk (tamu). Setelah dua aksi AI, tamu diminta daftar atau masuk. Pengguna yang masuk mendapat fitur lengkap: kanvas topik belajar, kuis, materi, jadwal, dan pengaturan.

## Status

Frontend dan backend sudah terhubung, dan AI memakai OpenRouter. Akun, percakapan, topik, kuis, materi, dan jadwal tersimpan di PostgreSQL.

Yang belum ada:
- **Lupa kata sandi dan verifikasi email.** Keduanya butuh layanan pengiriman email.
- **AI yang menyusun jalur belajar** dari tujuan pengguna. Saat ini pengguna menambah bulat sendiri, dari materi, atau dari Learning.
- **PDF hasil scan.** Teks harus bisa dibaca dari berkas.
- **Moderasi input.** Menunggu keputusan model dan perilakunya.

Perbedaan dengan spesifikasi dan mockup dicatat di [docs/selisih.md](docs/selisih.md).

## Dokumen acuan

- [CLAUDE.md](CLAUDE.md): aturan proyek untuk pengembangan.
- [docs/role.md](docs/role.md): role, hak akses, spesifikasi halaman, dan prompt.
- [docs/api.md](docs/api.md): kontrak endpoint.
- [docs/selisih.md](docs/selisih.md): perbedaan antara spesifikasi atau mockup dan implementasi, beserta statusnya.
- [docs/model-eval.md](docs/model-eval.md): uji model AI, penyebab gagal generate kuis, dan biayanya.
- [docs/visual-report.md](docs/visual-report.md): perbandingan tampilan dengan mockup.
- [docs/pemahaman.md](docs/pemahaman.md): ringkasan produk dan aturan status bulat.

## Prasyarat

- Node.js 22.12 atau lebih baru (atau 20.19 atau lebih baru).
- Chromium untuk test Playwright (hanya untuk menjalankan e2e).
- Kunci OpenRouter, jika ingin memakai AI sungguhan. Tanpa kunci, aplikasi tetap jalan dengan jawaban tiruan (`AI_MODE=mock`).

PostgreSQL tidak perlu dipasang. Skrip `npm run db:start` menjalankan PostgreSQL lokal.

## Pasang dan jalankan (sekali jalan)

Buka tiga terminal.

**1. Database.** Biarkan terminal ini tetap terbuka.

```bash
cd backend
npm install
npm run db:start
```

**2. Backend.** Di terminal kedua:

```bash
cd backend
cp .env.example .env
# Isi JWT_SECRET dengan nilai acak (perintahnya ada di komentar .env.example).
# Untuk AI sungguhan: isi OPENROUTER_API_KEY dan ubah AI_MODE=live.
npm run db:setup       # membuat tabel di database dev dan database test
npm run dev            # http://localhost:3001
```

**3. Frontend.** Di terminal ketiga:

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Buka `http://localhost:5173`. Aplikasi mulai sebagai tamu. Pilih **Daftar** untuk membuat akun pertama. Akun baru mulai dengan kanvas Learning kosong: tambah bulat dengan tombol **Tambah bulat**, dari halaman Materi, atau tanyakan sesuatu di chat.

Frontend tidak boleh berisi kunci API. Opsional: salin `frontend/.env.example` ke `frontend/.env` untuk mengubah `VITE_API_BASE_URL`.

### Mulai dari data bersih

Semua data pengembangan ada di `backend/.dev-db`. Untuk mengosongkannya, hentikan `npm run db:start`, hapus folder itu, lalu jalankan `npm run db:start` dan `npm run db:setup` lagi.

## Pengaturan penting (`backend/.env`)

| Variabel | Fungsi |
| --- | --- |
| `JWT_SECRET` | Rahasia penanda sesi. Minimal 32 karakter dan acak. Wajib diganti |
| `AI_MODE` | `mock` tanpa memanggil model, `live` memanggil OpenRouter |
| `OPENROUTER_API_KEY` | Kunci OpenRouter. Wajib saat `AI_MODE=live` |
| `AI_MAX_TOKENS_KUIS` | Batas token kuis. 7000 dipilih dari pengukuran, spesifikasi menulis 3000 |
| `AUTH_ATTEMPTS_PER_15_MIN`, `AUTH_IP_PER_15_MIN`, `REGISTER_PER_HOUR` | Batas percobaan masuk dan daftar |
| `TRUST_PROXY` | Jumlah proxy di depan server. Isi 1 di belakang reverse proxy |
| `SEED_EXAMPLE_TOPICS` | `true` memberi akun baru sembilan bulat contoh, untuk demo |
| `CORS_ORIGIN` | Alamat frontend yang boleh memanggil API |

## Keamanan

- Kata sandi disimpan dengan bcrypt. Sesi memakai cookie `httpOnly` dan token penyegaran yang berotasi. Token yang dipakai dua kali mengakhiri semua sesi akun itu.
- Percobaan masuk dibatasi per email dari satu alamat IP, jadi orang lain tidak bisa mengunci pemilik akun dari jaringan berbeda.
- Mengganti kata sandi mengakhiri sesi di perangkat lain.
- Batas tamu (dua aksi AI, kuis lima soal, tanpa pembahasan) diperiksa di backend, bukan hanya di frontend.
- Kunci API hanya ada di backend. Berkas `.env` tidak masuk git.

## Untuk produksi

- Pakai HTTPS. Cookie sesi hanya dikirim lewat HTTPS saat `NODE_ENV=production`.
- Isi `JWT_SECRET` yang acak, `CORS_ORIGIN` dengan alamat frontend, dan `TRUST_PROXY` sesuai jumlah proxy.
- Jalankan `npm run build` lalu `npm run db:deploy` dan `npm start` di backend.
- Backup database secara berkala, dan cabut kunci OpenRouter yang pernah ditempel di chat atau tempat lain.
- Perkiraan biaya AI sekitar Rp20 per kuis 10 soal (lihat [docs/model-eval.md](docs/model-eval.md)).

## Test

```bash
cd backend
npm test            # Vitest. Memakai TEST_DATABASE_URL (nama berakhiran _test) dan mengosongkannya
npm run typecheck

cd frontend
npm run lint        # oxlint, termasuk aturan dilarang memakai any
npm test            # Vitest: logika domain, token warna, dan utilitas
npm run build       # tsc -b dan build produksi, termasuk PWA
npm run e2e         # Playwright: desktop dan mobile. Menyalakan backend sendiri di database _test
```

`npm run e2e` menyalakan backend sendiri di port 3001, jadi hentikan `npm run dev` di folder backend sebelum menjalankannya. Database dari `npm run db:start` harus tetap hidup.

## Struktur

```
CLAUDE.md                 aturan proyek untuk pengembangan
backend/                  API Express, Prisma, dan PostgreSQL
  scripts/                db:start, db:setup, dan uji model (model-eval)
  src/ai/                 layanan AI: rantai model, normalisasi JSON, prompt, dan skema
docs/                     dokumen acuan dan kontrak API
frontend/
  src/api/                pemanggilan backend
  src/domain/             aturan bisnis murni dan unit test
  src/features/           satu folder per halaman
  src/components/         komponen bersama
  src/stores/             Zustand: sesi dan preferensi
  e2e/                    Playwright: alur pengguna
```

## Catatan

- `npm audit` di backend menunjukkan kerentanan tingkat tinggi pada Prisma dan `mysql2`. Perbaikannya membutuhkan Prisma versi 6, yang merupakan perubahan besar.
- `npm audit` di frontend menunjukkan advisory di toolchain Tailwind 3 yang hanya dipakai saat build.
- Berkas sumber asli di `input/` tidak dikirim ke repo.
