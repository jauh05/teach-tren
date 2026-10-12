# Palet warna Teach Tren

Sumber: [acuan-palet-baru.png](acuan-palet-baru.png). Warna diambil dari gambar acuan, dan dipakai lewat `frontend/src/theme/tokens.ts`. Tes `frontend/src/theme/tokens.test.ts` membaca tabel ini dan memeriksa kontras teks.

| Token | Hex | Dipakai untuk |
| --- | --- | --- |
| accent | #68D69E | Logo, ikon aktif, garis pilihan, dan lingkaran kosong yang dipilih |
| accent-gelap | #15795A | Teks hijau di latar putih dan mint, serta tautan |
| accent-lembut | #F1FBFA | Bubble jawaban, panel pilihan, dan latar kartu kecil |
| ink | #141414 | Teks utama, tombol utama (hitam), tab aktif |
| muted | #606563 | Teks sekunder dan keterangan |
| line | #E3E6E5 | Garis tepi kartu, kolom, dan pemisah |
| canvas | #F2F2F2 | Latar halaman di belakang kartu |
| kuasai | #16A34A | Status: sudah dikuasai |
| sedang | #D97706 | Status: sedang dipelajari |
| ulang | #DC2626 | Status: perlu diulang |
| baru | #0D9488 | Status: kosong atau baru (teal) |
| belum | #94A3B8 | Status: belum dibuka |
| saran | #7C3AED | Status: saran berikutnya |

Kartu dan panel berwarna putih (#FFFFFF). Tombol utama hitam berbentuk pil, dan tombol sekunder putih dengan garis tepi `line`.

## Halaman masuk dan daftar

Sumber: [acuan-masuk-daftar.png](acuan-masuk-daftar.png). Hanya halaman masuk dan daftar yang memakai palet ini. Bagian lain aplikasi tetap memakai palet di atas.

| Token | Hex | Dipakai untuk |
| --- | --- | --- |
| masuk-biru | #2A3CE6 | Header daftar, bentuk geometris, dan garis fokus kolom |
| masuk-biru-gelap | #1C2AA8 | Bentuk geometris kedua dan bayangan biru |
| masuk-lembut | #EEF1FE | Latar lingkaran ilustrasi |
| masuk-kolom | #E4E4EA | Garis tepi kolom isian dan tombol garis |
| masuk-placeholder | #6B6B78 | Teks petunjuk di dalam kolom isian |

Tombol utama tetap hitam dan berbentuk pil, sama seperti bagian lain aplikasi.
