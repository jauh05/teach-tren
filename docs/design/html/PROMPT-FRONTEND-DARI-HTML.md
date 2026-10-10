# Prompt Claude Code: Bangun Frontend Teach Tren dari Mockup HTML

Salin isi blok di bawah ke Claude Code di root repo, setelah CLAUDE.md dan docs/role.md sudah tersedia.

---

Bangun frontend Teach Tren di folder frontend/ berdasarkan mockup HTML di docs/design/html/.

ACUAN
- Setiap layar punya dua versi: *-desktop.html (1280x800) dan *-mobile.html (390x844). Keduanya wajib diimplementasikan.
- styles.css berisi token warna dan komponen dasar. Pindahkan token ke tailwind.config.
- Aturan bisnis, batas tamu, dan aturan status bulat mengikuti docs/role.md. Jika mockup dan docs/role.md berbeda, ikuti docs/role.md dan laporkan perbedaannya.
- index.html berisi galeri semua layar.

LANGKAH (kerjakan berurutan, tunggu saya mengetik "lanjut")
1. Setup proyek Vite + React + TypeScript + Tailwind + React Router + Zustand + TanStack Query + Zod. Tambahkan token warna, font Inter dan Plus Jakarta Sans, dan logo SVG dari mockup.
2. Buat AppShell: navbar desktop dengan lima tab (Learning, Jadwal, Chat, Pengaturan, Tentang) dan avatar menu. Mobile: navbar ringkas dan bottom navigation empat tab. Tab aktif sesuai route.
3. Implementasikan 01-chat-beranda (desktop dan mobile) dengan data mock.
4. Implementasikan 03-chat-jawaban: streaming dummy, kartu Langkah berikutnya, dan composer.
5. Implementasikan 02-learning: kanvas SVG dengan zoom 40 sampai 200 persen, geser, dan drag bulat dengan d3-force. Posisi tidak disimpan, refresh kembali ke tata letak awal. Legenda di pojok kanan atas. Di mobile, legenda dibuka dari tombol Keterangan.
6. Implementasikan 04-kuis-soal: satu soal per layar, teks panjang bisa dilipat, rumus dengan KaTeX, dan pembahasan hanya untuk pengguna masuk.
7. Implementasikan 05-jadwal: tampilan minggu di desktop, agenda vertikal di mobile, dan panel Ingatan AI.
8. Implementasikan 06-tamu-batas: tamu setelah 2 aksi melihat kartu Langkah berikutnya terkunci dan kartu Daftar atau Masuk.
9. Implementasikan 07-pengaturan: profil, belajar, tampilan, notifikasi, data dan privasi, dan keluar.

ATURAN
- Tidak ada tipe any. Tidak ada kunci API di frontend.
- Teks antarmuka Bahasa Indonesia. Nama kode dan komentar Bahasa Inggris.
- Tidak ada emoji sebagai ikon. Ikon dari lucide-react.
- Setiap layar diuji di 1280px dan 390px. Tidak ada scroll horizontal.
- Setiap langkah ditutup dengan test (Vitest untuk logika, Playwright untuk alur) dan commit.

OUTPUT
Daftar file per langkah, perintah menjalankan, hasil test, dan selisih antara mockup dan implementasi.
