# Teach Tren (CLAUDE.md)

## Produk
Teach Tren adalah aplikasi belajar berbasis chat untuk pelajar dan pengajar di Indonesia. Pusat aplikasi adalah percakapan. Pengguna bisa mengetik pertanyaan langsung tanpa login (tamu). Pengguna yang masuk mendapat fitur lengkap.

## Role
- Hanya ada satu jenis pengguna: user. Tidak ada guru atau siswa sebagai role terpisah.
- Dua status sesi: tamu (belum login) dan masuk (sudah login). Lihat docs/role.md untuk matriks hak akses.
- Tamu dibatasi keras. Setiap batasan wajib diperiksa di backend, tidak cukup di frontend.

## Halaman utama (navbar)
1. Learning: kanvas bulat yang bisa di-zoom, digeser, dan dihubungkan. Setiap bulat adalah topik.
2. Jadwal: kalender belajar berisi saran AI dan panel Ingatan AI.
3. Chat: percakapan umum.
4. Pengaturan: profil, belajar, data, dan keluar.
5. Tentang: panduan penggunaan aplikasi.
Materi, Kuis, Masuk, dan Daftar adalah halaman pendukung.

## Gaya visual
- Latar putih, aksen biru #2563EB, biru gelap #1E40AF, biru muda #EFF6FF, teks #0F172A, teks sekunder #64748B, border #E2E8F0.
- Status bulat: hijau #16A34A (dikuasai), kuning #D97706 (sedang), merah #DC2626 (perlu diulang), teal #0D9488 (baru), abu #94A3B8 (belum dibuka), ungu #7C3AED (saran).
- Ikon dari lucide-react. Tidak ada emoji. Tidak ada gradien ungu atau pelangi.
- Font: Plus Jakarta Sans untuk judul, Inter untuk isi. Teks minimal 11px, isi pesan 14px di mobile.
- Gambar acuan desain ada di docs/design/. Saat mengerjakan tampilan, bandingkan dengan gambar yang sesuai sebelum selesai.

## Teknologi
- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, Zustand, TanStack Query, Zod, React Hook Form, d3-force, KaTeX (rehype-katex, remark-math), react-markdown, remark-gfm, vite-plugin-pwa.
- Backend: Node.js 20, Express, TypeScript, Prisma, PostgreSQL, Zod, jsonwebtoken, bcryptjs, pino, multer.
- AI: provider OpenRouter (endpoint kompatibel OpenAI) dengan rantai model cadangan. Model dipilih dari env, bukan ditulis di kode.

## Aturan kode
- Tidak ada tipe any. Tidak ada kunci API di frontend.
- Teks antarmuka dan pesan error dalam Bahasa Indonesia. Nama variabel dan komentar dalam Bahasa Inggris.
- Setiap respons AI wajib divalidasi dengan Zod sebelum disimpan atau ditampilkan.
- Tulis test untuk aturan bisnis (kuota, akses tamu, penilaian, status bulat).
- Jangan mengubah kontrak API di docs/api.md tanpa memperbarui dokumennya.

## Perintah
- npm run dev (frontend), npm run dev (backend), npm test, npm run e2e, npm run db:migrate, npm run db:seed, npm run db:start (PostgreSQL lokal di backend), npm run db:setup (buat database dan terapkan migrasi).
