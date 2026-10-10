# Pemahaman Teach Tren

Dokumen ini hasil Tahap 0. Sumber: `input/Dokumen_Role_Prompt_Teach_Tren_v4_Final.docx` (salinan Markdown di `docs/role.md`), `input/teach-tren-mockup.zip` (diekstrak ke `docs/design/html/`).

## 1. Ringkasan produk

Teach Tren adalah aplikasi belajar berbasis chat untuk pelajar Indonesia. Pusat aplikasi adalah percakapan. Pengguna bisa langsung bertanya tanpa login (tamu). Tiga halaman utama di navbar:

- **Learning:** kanvas bulat (SVG, d3-force) tempat setiap topik belajar digambar sebagai bulat yang saling terhubung. Bisa di-zoom, digeser, dan bulat bisa ditarik. Posisi tidak disimpan, refresh kembali ke tata letak awal.
- **Jadwal:** kalender belajar minggu ini dan minggu berikutnya, berisi saran AI dan panel Ingatan AI.
- **Chat:** percakapan umum dengan streaming, rumus LaTeX, dan kartu "Langkah berikutnya".

Tab tambahan: **Pengaturan** (tab navbar sendiri) dan **Tentang** (panduan). **Kuis**, **Materi**, **Masuk**, dan **Daftar** adalah halaman pendukung.

## 2. Role dan batas tamu

Hanya ada satu role, yaitu `user`. Perbedaan hak ditentukan status sesi:

- **Tamu:** belum login. Identitas berupa `guestId` acak di perangkat. Data bersifat sementara.
- **Masuk:** login dengan email dan kata sandi. Mendapat seluruh fitur, data tersimpan di akun.

Batas tamu yang wajib ditegakkan di backend (bukan hanya tampilan):

| Area | Tamu | Masuk |
| --- | --- | --- |
| Chat | 2 aksi AI seumur perangkat (1 chat atau 1 kuis 5 soal), lalu wajib daftar atau masuk | 200 pesan per hari |
| Riwayat chat | Lokal di perangkat, maksimal 2 percakapan, diimpor saat masuk | Tersimpan di akun |
| Learning | Lihat contoh, geser, zoom. Tidak bisa buat bulat | Buat bulat sendiri, maksimal 200 |
| Kuis | 1 kuis 5 soal (memakai 1 dari 2 aksi), hasil lokal | 20 kuis per hari, 5 sampai 20 soal, tersimpan |
| Pembahasan kuis | Tidak (kartu ajakan masuk) | Ya |
| Jadwal | Contoh read-only | Penuh: terima, seret, pindah saran |
| Ingatan AI, unggah materi | Tidak | Ya (materi maksimal 50) |
| Pengaturan | Tidak (ajakan masuk atau daftar) | Penuh |
| Tentang | Ya | Ya |

Aturan tambahan: kuota dihitung per `guestId`, tidak per IP. Rate limit kecepatan per IP tetap dipasang. Setelah kuota habis, data tamu tidak dihapus sebelum impor berhasil. Keluar menghapus token dan kembali sebagai tamu baru. Hapus akun: data dihapus dalam 30 hari.

## 3. Daftar layar

Setiap layar punya dua versi: desktop (1280 x 800) dan mobile (390 x 844). Route mengikuti CC-01 di `docs/role.md`.

| No | Layar | Berkas desktop | Berkas mobile | Route | Isi utama |
| --- | --- | --- | --- | --- | --- |
| 1 | Chat beranda | `01-chat-beranda-desktop.html` | `01-chat-beranda-mobile.html` | `/chat` | Sapaan, composer, empat chip saran. Desktop: sidebar riwayat. Mobile: bottom nav |
| 2 | Learning | `02-learning-desktop.html` | `02-learning-mobile.html` | `/learning` | Kanvas SVG dengan bulat, legenda, kontrol zoom, panel detail (desktop: bawah, mobile: bottom sheet) |
| 3 | Chat jawaban | `03-chat-jawaban-desktop.html` | `03-chat-jawaban-mobile.html` | `/c/:id` | Bubble pengguna dan asisten, kartu "Langkah berikutnya", composer |
| 4 | Kuis soal | `04-kuis-soal-desktop.html` | `04-kuis-soal-mobile.html` | `/kuis/:id` | Progres soal, stimulus, rumus, pilihan benar dan salah, pembahasan |
| 5 | Jadwal | `05-jadwal-desktop.html` | `05-jadwal-mobile.html` | `/jadwal` | Desktop: minggu 7 kolom + panel Ingatan AI. Mobile: agenda per hari |
| 6 | Tamu batas | `06-tamu-batas-desktop.html` | `06-tamu-batas-mobile.html` | `/c/:id` (status tamu) | Badge "2 dari 2 aksi", kartu terkunci, kartu Daftar akun dan Masuk |
| 7 | Pengaturan | `07-pengaturan-desktop.html` | `07-pengaturan-mobile.html` | `/pengaturan` | Profil, belajar, tampilan dan notifikasi, data dan privasi, bantuan, keluar |

Halaman tanpa mockup di zip: Tentang, Materi, Masuk, Daftar. Lihat bagian 6.

## 4. Token warna

Diambil dari `docs/design/html/styles.css` dan CLAUDE.md. Dipindahkan ke `tailwind.config` pada Tahap 1.

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| brand | #2563EB | Aksen, tombol utama, logo |
| brand-d | #1E40AF | Teks tab aktif, judul kecil |
| soft | #EFF6FF | Latar tab aktif, kartu biru muda |
| ink | #0F172A | Teks utama |
| muted | #64748B | Teks sekunder |
| line | #E2E8F0 | Border |
| canvas | #FAFBFD | Latar sidebar dan kanvas |
| ok | #16A34A | Dikuasai |
| warn | #D97706 | Sedang dipelajari |
| bad | #DC2626 | Perlu diulang |
| teal | #0D9488 | Baru ditambahkan |
| violet | #7C3AED | Saran AI |
| slate | #94A3B8 | Belum dibuka, teks nonaktif |

Font: Plus Jakarta Sans untuk judul, Inter untuk isi. Ikon dari lucide-react. Tidak ada emoji, tidak ada gradien ungu atau pelangi.

## 5. Aturan status bulat

| Status | Syarat | Tampilan |
| --- | --- | --- |
| DIKUASAI | Skor terbaru 80 ke atas | Hijau, segel centang putih, skor di bawah nama |
| SEDANG | Skor 50 sampai 79 | Kuning muda, skor di tengah |
| PERLU_DIULANG | Skor di bawah 50 | Merah muda, segel seru merah, skor di bawah nama |
| BARU | Dari chat atau materi, belum ada latihan | Teal, label "baru" di atas |
| BELUM_DIBUKA | Prasyarat belum dikuasai | Putih, border putus-putus abu, gembok |
| SARAN | Dari AI, belum diterima | Putih, border putus-putus ungu. Tidak bisa dipilih sebelum diterima |

Aturan perubahan:

- Hanya latihan atau kuis yang mengubah status. Chat biasa tidak.
- Skor terbaru selalu menggantikan status sebelumnya, termasuk dari PERLU_DIULANG ke DIKUASAI.
- BARU berubah setelah latihan pertama.
- Saran AI tidak menjadi bulat sampai pengguna menerimanya.

## 6. Ruang lingkup tahap ini

- Tahap 0 hingga 4 mengerjakan **frontend saja**. CLAUDE.md dan `docs/role.md` juga memuat backend (Express, Prisma, PostgreSQL) dan `docs/api.md`. Bagian itu belum dibuat di sini.
- Mockup tidak memuat halaman Tentang, Materi, Masuk, dan Daftar. Halaman ini dibuat sebagai rute dengan konten sementara.
- Sebelum Tahap 3, mockup dan `docs/role.md` punya beberapa selisih ukuran (navbar, sidebar, panel detail). Aturannya: ikuti `docs/role.md`, catat di `docs/selisih.md`.

## 7. Pertanyaan

1. **Gambar PNG acuan belum ada.** `docs/role.md` menyebut `docs/design/01-layout.png` sampai `14-kartu-lanjut.png`, tetapi zip hanya berisi HTML. Saya pakai HTML sebagai acuan visual. Tidak memblokir pekerjaan.
2. **Backend belum masuk ruang lingkup.** Tahap 3 hanya frontend. Apakah backend dikerjakan di tahap terpisah? Sampai dijawab, folder `backend/` tidak dibuat.
3. **Kalimat repo di Tahap 2 ambigu.** Tertulis "Jangan membuat repo atau push ke akun lain selain jauh05 dan buat repo baru dan jangna di private reponya". Tafsiran saya: akun `jauh05`, repo baru bernama `teach-tren`, visibilitas private sesuai langkah 3 Tahap 2.
4. **Instruksi "tunggu saya mengetik lanjut" di PROMPT-FRONTEND.** Instruksi Tahap 3 meminta langkah berurutan dengan commit per langkah tanpa menunggu. Saya ikuti instruksi Tahap 3.
5. **Halaman yang tidak ada mockup** (Tentang, Materi, Masuk, Daftar). Saya buat rute dan konten sementara, dan menyebutkannya di laporan akhir.

Keputusan default yang saya ambil atas pertanyaan di atas: frontend saja, tanpa backend. Tidak ada blokir untuk Tahap 1.
