# Selisih antara mockup dan implementasi

Mockup di `docs/design/html/` adalah acuan visual. Jika mockup dan `docs/role.md` berbeda, implementasi mengikuti `docs/role.md`, dan selisihnya dicatat di sini.

Status: **Diperbaiki** (sesuai role), **Diterapkan** (mockup dipakai karena tidak bertentangan), **Terbuka** (belum diselesaikan atau butuh keputusan).

| No | Layar | Mockup | docs/role.md | Implementasi | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Navbar atas | Tinggi 56px (`.nav` di styles.css) | Tinggi 52px (bagian 3.1, CC-02) | 52px | Diperbaiki |
| 2 | Bottom navigation | Tinggi 64px | Tinggi 60px (bagian 3.1) | 60px dengan safe area bawah | Diperbaiki |
| 3 | Judul halaman | Font Inter untuk semua teks | Plus Jakarta Sans untuk judul, Inter untuk isi | Judul memakai `font-heading` | Diperbaiki |
| 4 | Header mobile | Hanya badge "Masuk" | Menu avatar dibuka dari header mobile (bagian 3.1) | Ditambah tombol avatar di header mobile | Diperbaiki |
| 5 | Menu akun | Tidak ada pada mockup | Profil, Tentang, Keluar. Tamu melihat Masuk dan Daftar | Diterapkan sesuai role | Diterapkan |
| 6 | Pengaturan mobile | Hanya Profil, Belajar, Data dan privasi | Bagian lengkap: profil, belajar, tampilan, notifikasi, data, bantuan, keluar (bagian 4.7) | Akan dikerjakan pada langkah 9 | Terbuka |
