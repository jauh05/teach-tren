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
