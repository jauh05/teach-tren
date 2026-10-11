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
| 6 | Pengaturan mobile | Hanya Profil, Belajar, Data dan privasi | Bagian lengkap: profil, belajar, tampilan, notifikasi, data, bantuan, keluar (bagian 4.7) | Semua bagian tampil di mobile dalam satu kolom | Diperbaiki |
| 7 | Sidebar riwayat (Chat) | Lebar 248px | Lebar 264px, bisa diciutkan ke 64px (bagian 3.1, CC-02) | 264px, bisa diciutkan | Diperbaiki |
| 8 | Header Chat mobile | Tidak ada ikon riwayat | Riwayat dibuka sebagai drawer dari ikon di header Chat (bagian 3.1) | Ikon "Buka riwayat" di atas konten Chat | Diterapkan |
| 9 | Riwayat dikelompokkan | Hanya Hari ini dan Kemarin | Hari ini, Kemarin, 7 hari terakhir, Lebih lama (CC-05) | Empat grup, grup kosong disembunyikan | Diterapkan |
| 10 | Kolom tulis Chat | Teks placeholder dan tombol kirim | Enter kirim, Shift+Enter baris baru (CC-05) | Sesuai role. Tombol kirim berubah jadi berhenti saat streaming (langkah 4) | Diterapkan |
| 11 | Fitur CC-05 di luar mockup | Tidak ada cari, ganti nama, dan hapus riwayat | Cari judul, ganti nama, hapus dengan konfirmasi (CC-05) | Belum dikerjakan. Data riwayat masih mock | Terbuka |
| 12 | Aksi di bawah jawaban | Tidak ada pada mockup | Salin, ulangi, dan buat latihan (bagian 4.3) | Ditambah di bawah setiap jawaban yang selesai | Diterapkan |
| 13 | Kartu Langkah berikutnya | Tiga baris dengan tombol Mulai, Atur, Buat | Sama, dan AI tidak dipanggil sebelum pilihan (bagian 4.8) | Sesuai mockup. Tombol mengarah ke rute yang sudah ada | Diterapkan |
| 14 | Tombol kirim saat streaming | Tidak ada pada mockup | Tombol berubah menjadi berhenti dan membatalkan jawaban (CC-05) | Berhenti menandai jawaban "Jawaban dihentikan." | Diterapkan |
| 15 | Rumus LaTeX | Tidak ada rumus di mockup chat | KaTeX dimuat hanya saat jawaban berisi rumus (bagian 5) | Dimuat lazy. Rumus gagal tampil sebagai teks abu-abu | Diterapkan |
| 16 | Sisa kuota di header | Header hanya menampilkan nama pengguna | Sisa kuota tampil di header (bagian 4.3, CC-05) | Belum untuk pengguna masuk. Untuk tamu dikerjakan pada langkah 8 | Terbuka |
| 17 | Jawaban chat | Teks statis di mockup | Jawaban streaming dari AI (CC-05, CC-06) | Streaming dummy dari contoh statis. AI dan backend belum dibuat | Terbuka |
| 18 | Detail bulat (desktop) | Bar kecil di bawah kanvas | Panel kanan lebar 320px (bagian 4.1) | Panel kanan 320px | Diperbaiki |
| 19 | Detail bulat (mobile) | Bottom sheet kecil | Bottom sheet tinggi 70% (bagian 3.1) | Tinggi 70% dengan pegangan | Diperbaiki |
| 20 | Ukuran bulat | Diameter 40 sampai 76 px | Diameter 60 sampai 76 px pada zoom 100% (CC-03) | Sesuai role. Bulat terkecil 60 px | Diperbaiki |
| 21 | Tombol plus di bulat | Tidak ada pada mockup | Ketuk plus membuka chat dengan konteks topik (bagian 4.1) | Ditambahkan di pojok kanan atas setiap bulat | Diterapkan |
| 22 | Zoom awal di mobile | Viewbox diperkecil, seluruh kanvas terlihat | Zoom 100 persen, posisi awal di tengah (bagian 4.1) | Sebagian kanvas terlihat, geser untuk melihat sisanya | Terbuka |
| 23 | Posisi dan tata letak | Tata letak statis dari mockup | Tidak disimpan. Refresh kembali ke tata letak awal (bagian 4.1) | Layout d3-force dari posisi mockup. Tidak disimpan ke server | Diterapkan |
| 24 | Mode contoh untuk tamu | Tidak dibedakan di mockup | Tamu melihat contoh, tanpa ganti nama dan buat soal (bagian 2.2) | Diterapkan pada panel detail. Batas tamu lengkap di langkah 8 | Diterapkan |
| 25 | Ganti nama bulat | Tidak ada di mockup 02 | Ganti nama dari panel detail, nama unik tanpa huruf besar kecil (bagian 6.2, CC-04) | Diterapkan dengan validasi Zod dan pesan nama sudah dipakai | Diterapkan |
| 26 | Sidebar Chat di halaman kuis | Tidak ada sidebar | Kuis berada di layar penuh (bagian 4.4) | Halaman kuis tanpa sidebar | Diterapkan |
| 27 | Teks bacaan (stimulus) | Teks soal cerita langsung di kartu soal | Teks panjang di atas soal dan bisa dilipat (bagian 4.4) | Tampil di atas soal dalam elemen details yang bisa dilipat | Diterapkan |
| 28 | Hasil akhir kuis | Tidak ada mockup 07-kuis-hasil di zip | Skor, daftar benar salah, dan pembahasan (bagian 4.4) | Layar hasil minimal: skor, daftar soal, dan dua tombol | Terbuka |
| 29 | Bentuk soal isian dan esai | Hanya pilihan ganda di mockup | Isian singkat dan esai dengan penilaian AI (bagian 4.4, CC-07) | Belum dikerjakan. Konten mock hanya pilihan ganda | Terbuka |
| 30 | Atur kuis | Tidak ada di mockup | Pilih sumber, jumlah soal, tingkat, dan gaya (bagian 4.4) | Belum dikerjakan. Kuis mock 5 soal | Terbuka |
| 31 | Skor kuis memperbarui bulat | Tidak ada di mockup | Skor memperbarui status bulat (bagian 4.4) | Diterapkan. Skor persen menggantikan skor terakhir dan status dihitung ulang | Diterapkan |
| 32 | Pembahasan untuk tamu | Tidak ada di mockup 04 | Tamu tidak melihat pembahasan, kartu ajakan masuk (bagian 2.2) | Diterapkan dengan kartu terkunci | Diterapkan |
| 33 | Minggu yang tampil | Saat hari ini Minggu 11 Oktober, mockup menampilkan 12 sampai 18 Oktober | Minggu ini dan minggu berikutnya (bagian 4.2) | Senin sampai Minggu yang memuat hari ini (5 sampai 11 Oktober). Minggu berikutnya lewat tombol panah | Diterapkan |
| 34 | Lebar panel Ingatan AI | 220px | 200px (CC-08) | 200px | Diperbaiki |
| 35 | Ingatan AI di mobile | Tombol Ingatan AI di header | Halaman terpisah dari tombol di header (CC-08) | Tombol ke halaman /jadwal/ingatan | Diterapkan |
| 36 | Menerima dan memindah saran | Tidak ada cara menerima di mockup | Ketuk atau seret ke hari lain (bagian 4.2) | Tombol Terima di semua layar. Seret ke hari lain hanya di desktop (drag HTML5). Seret di layar sentuh belum ada | Terbuka |
| 37 | Item yang sudah dikerjakan | Tidak ada di mockup | Berubah hijau atau tercoret ringan (bagian 4.2) | Belum ada status selesai | Terbuka |
| 38 | Data jadwal dan Ingatan AI | Data contoh | Tersimpan di server, job saran harian (CC-08) | Data mock di memori browser. Hilang saat reload | Terbuka |
| 39 | Jadwal tamu | Tidak ada di mockup | Contoh read-only dengan ajakan masuk (CC-08) | Diterapkan dengan banner dan panel Ingatan terkunci | Diterapkan |
| 40 | Kuota tamu di header | Tamu · 2 dari 2 aksi terpakai, tombol Masuk | Sisa kuota di header, merah saat habis (bagian 4.3, CC-05) | Diterapkan. Tombol Masuk di desktop. Mobile hanya badge Tamu | Diterapkan |
| 41 | Kuota per perangkat | Tidak dijelaskan | Per guestId (bagian 2.3) | Dihitung per perangkat dan tidak direset saat Keluar. Mencegah kuota diakali dengan keluar-masuk | Diterapkan |
| 42 | Riwayat tamu | Dua percakapan di bawah Di perangkat ini | Maksimal 2 percakapan, disimpan di perangkat (bagian 2.3) | Menampilkan dua percakapan contoh dari data mock, bukan riwayat tamu yang tersimpan | Terbuka |
| 43 | Langkah berikutnya untuk tamu | Pilihan dikunci dengan label Daftar dulu | Dikunci dengan ikon gembok (bagian 4.8) | Sesuai mockup, ditambah ikon gembok | Diterapkan |
| 44 | Halaman Masuk dan Daftar | Tidak ada di mockup | Form sederhana dengan tombol Lanjut sebagai tamu (bagian 4.5) | Formulir simulasi dengan validasi Zod dan redirect aman. Belum terhubung ke server | Terbuka |
| 45 | Penegakan batas tamu | Tampilan saja | Wajib di backend (bagian 2.3, CC-10) | Hanya di frontend. Backend belum dibuat | Terbuka |
| 46 | Yang dihitung sebagai aksi | Pesan chat dan kuis 5 soal | Satu pesan chat atau satu kuis (bagian 2.3) | Pesan dihitung saat jawaban selesai atau dihentikan. Kuis dihitung saat selesai | Diterapkan |
| 47 | Kuis saat kuota habis | Tidak ada di mockup | Tamu tidak bisa membuka kuis baru tanpa kuota | Kuis diblokir dengan kartu Lanjutkan belajar | Diterapkan |
| 48 | Avatar tamu | Tidak ada avatar di header tamu | Menu avatar berisi Masuk dan Daftar (bagian 3.1) | Avatar dengan tanda tanya, dibuka menu Masuk, Daftar, dan Tentang | Diterapkan |
| 49 | Bantuan dan Keluar di mobile | Tidak ada di mockup mobile | Bagian bantuan dan keluar (bagian 4.7) | Ditambahkan di bawah konten | Diterapkan |
| 50 | Formulir umpan balik | Tautan di mockup bantuan | Formulir umpan balik (bagian 4.7) | Tombol nonaktif dengan label Segera hadir | Terbuka |
| 51 | Ubah kata sandi | Tidak ada di mockup | Kata sandi lama diverifikasi (CC-09) | Hanya validasi form. Kata sandi lama belum dicek karena belum ada backend | Terbuka |
| 52 | Hapus akun dan hapus riwayat | Tidak ada di mockup detail | Konfirmasi kata sandi dan ketik HAPUS (CC-09) | Konfirmasi dan ketikan HAPUS sudah ada. Hapus akun masih simulasi tanpa backend | Terbuka |
| 53 | Preferensi belajar dan tampilan | Tidak dijelaskan | Disimpan di akun (bagian 4.7) | Disimpan di browser perangkat ini. Belum sinkron ke akun | Terbuka |
| 54 | Ekspor riwayat | Tidak ada di mockup | Ekspor riwayat chat dan kuis dalam JSON (CC-09) | Berkas JSON dari data mock di sisi klien | Diterapkan |
| 55 | Halaman Pengaturan untuk tamu | Tamu melihat tombol Masuk dan Daftar (bagian 4.7) | Tamu diarahkan ke Masuk dengan parameter redirect (CC-01) | Diterapkan. Setelah masuk, kembali ke Pengaturan | Diterapkan |
| 56 | Mode gelap | Ditandai segera hadir | Segera hadir (bagian 4.7) | Pilihan nonaktif dengan label Segera hadir | Diterapkan |
| 57 | Halaman Tentang dan Materi | Tidak ada mockup | Halaman Tentang dari docs/tentang.md, Materi dengan unggah berkas (bagian 4.5, 4.6, CC-09) | Hanya placeholder. Tidak termasuk sembilan langkah frontend | Terbuka |
| 58 | Riwayat chat tingkat lanjut | Tidak ada di mockup | Cari judul, ganti nama, dan hapus per percakapan (CC-05) | Belum dikerjakan. Hanya hapus semua riwayat di Pengaturan | Terbuka |
| 59 | Backend dan docs/api.md | Tidak ada | Express, Prisma, PostgreSQL, OpenRouter, dan kontrak API (CLAUDE.md) | Belum dibuat. Semua data berasal dari mock di frontend | Terbuka |
| 60 | Posisi scroll antar tab | Tidak ada di mockup | Posisi scroll dipertahankan saat berpindah tab (CC-02) | Belum dikerjakan. Setiap pindah tab mulai dari atas | Terbuka |
| 61 | Chat di halaman Learning | Tidak ada di mockup 02 | Permintaan pengguna: chat topik di samping kanvas | Desktop: panel kanan 360px. Mobile: bottom sheet 70%. Bulat tanpa percakapan menampilkan teks kosong dengan kolom tulis | Diterapkan |
| 62 | Ketuk bulat | Panel detail berisi materi dan tombol Mulai chat | Panel detail (bagian 4.1) | Panel detail diganti chat topik. Tombol Mulai chat dihapus karena chat sudah di panel | Diterapkan |
| 63 | Riwayat chat topik | Tidak ada | Percakapan dari bulat tampil di riwayat chat umum | Percakapan tersimpan di store mock dan muncul di /chat setelah pesan pertama. Hilang saat reload | Terbuka |
| 64 | Nama bulat tidak menabrak | Tata letak statis dari mockup | Nama bulat tidak boleh menabrak (permintaan pengguna) | Label diperiksa dan dipisahkan setelah simulasi selesai. Diuji e2e | Diterapkan |
| 65 | Letak chat dan keterangan di Learning | Panel detail di samping kanvas | Permintaan pengguna: chat di bawah kanvas, keterangan bisa dibuka dan ditutup dengan tombol Lihat keterangan | Desktop: chat di bawah kanvas setinggi 300px. Keterangan tertutup secara default | Diterapkan |
