# Laporan visual (CC-11)

Dibuat dari `frontend/e2e/visual.spec.ts` dan `frontend/scripts/visual-compare.py`. Tangkapan aplikasi dan mockup dibuat pada ukuran yang sama: desktop 1440 x 900 dan mobile 390 x 844.

## Metode

- Mockup yang dibandingkan adalah `docs/design/html/*.html`, dirender langsung di browser. Berkas PNG yang disebut CC-11 belum ada di repo.
- Sebuah piksel dihitung berbeda jika salah satu kanal warnanya berselisih lebih dari 24 dari 255.
- Layar lulus jika piksel yang berbeda tidak lebih dari 3 persen.

## Hasil

| Layar | Desktop 1440 | Mobile 390 |
| --- | --- | --- |
| 01 Chat beranda | 2,23% lulus | 7,68% gagal |
| 02 Learning | 7,90% gagal | 13,14% gagal |
| 03 Chat jawaban | 3,49% gagal | 9,04% gagal |
| 04 Kuis soal | 2,87% lulus | 10,84% gagal |
| 05 Jadwal | 2,30% lulus | 7,92% gagal |
| 06 Tamu batas | 5,71% gagal | 12,03% gagal |
| 07 Pengaturan | 3,26% gagal | 7,78% gagal |

**Hasilnya: 3 dari 14 lulus.** Belum memenuhi target, dan sebagian besar selisih bukan kesalahan desain.

## Mengapa angkanya tinggi

1. **Keadaan berbeda.** Tangkapan aplikasi memakai data akun demo, sedangkan mockup menampilkan keadaan tertentu. Contoh: mockup kuis menampilkan soal 3 yang sudah dijawab dengan pembahasan, sedangkan tangkapan aplikasi berada di soal 1 yang belum dijawab. Mockup Learning menempatkan bulat dan skor yang berbeda.
2. **Font.** Mockup memakai font sistem. Aplikasi memakai Plus Jakarta Sans dan Inter sesuai CLAUDE.md. Setiap teks berbeda di tepinya, sehingga selisih kecil tersebar di semua layar.
3. **Ikon.** Mockup memakai kotak placeholder di navigasi bawah. Aplikasi memakai ikon lucide-react sesuai CLAUDE.md.

Untuk perbandingan yang adil, tangkapan berikutnya perlu dibuat pada keadaan yang sama dengan mockup. Itu belum dikerjakan.

## Perbedaan yang disengaja

Perbedaan ini mengikuti permintaan atau keputusan yang sudah dicatat:

- **Navbar tiga tab** (Learning, Jadwal, Chat). Pengaturan dan Tentang ada di menu avatar, sesuai permintaan untuk mode desktop. Mockup memiliki lima tab.
- **Chat di panel kanan** Learning, berdampingan dengan kanvas. Ini sesuai permintaan awal agar halaman Learning memuat chat. Mockup tidak punya panel chat di Learning, dan chat dibuka dari bilah detail bawah lewat tombol "Mulai chat".
- **Keterangan status** tersembunyi di balik tombol "Lihat keterangan", sesuai permintaan agar bisa dibuka dan ditutup. Mockup menampilkannya terus di pojok kanan atas.
- **Tombol kirim nonaktif** saat kolom kosong, sehingga abu-abu. Mockup menampilkannya biru.
- **Kontrol zoom** di Learning berupa bilah kecil pojok kanan bawah dengan tombol perkecil, perbesar, dan atur ulang.

## Perbedaan yang belum disengaja

Ini belum sesuai dengan mockup dan perlu dikerjakan:

- **Bilah detail bulat** di bawah kanvas Learning (skor terakhir, tombol "Generate soal", dan "Mulai chat") belum ada sebagai panel terpisah. Mockup dan CC-04 memintanya. Aplikasi hanya membuka panel chat topik.
- **Mobile: bulat baru tidak bisa diketuk** di tampilan awal Learning setelah dibuat dari Materi. Ini ditemukan saat menulis tes CC-11. Penyebab belum diselidiki. Dugaan awal: bulat berada di luar area pandang awal kanvas.
- **Footer** "Riwayat Anda tersimpan di akun." di chat mobile tidak ada di mockup.

## Skenario E2E CC-11

| Skenario | Status |
| --- | --- |
| 1. Tamu di /learning: contoh bulat, zoom, tanpa tombol simpan | Lulus. Ditambahkan `Learning tamu` di `learning.spec.ts`. Geser dan zoom sudah diuji di tes Learning sebelumnya |
| 2. Tamu mengirim 10 pesan, pesan ke-11 ditolak | Tidak diuji sebagai 10 pesan. Keputusan final di docs/role.md (bagian 2.1) adalah 2 aksi. Tes `dua aksi habis mengunci composer` di `tamu.spec.ts` yang berlaku |
| 3. Pengguna membuat bulat, membuka detail, mulai chat dari plus | Sebagian. Bulat dibuat dari Materi lalu tampil di Learning (`materi.spec.ts`). Tombol plus diuji di desktop. Mobile belum (lihat di atas). Panel detail belum ada |
| 4. Kuis 5 soal, skor 90 persen, status bulat berubah | Skor 90 persen tidak mungkin dengan 5 soal. Skor yang mungkin adalah 0, 20, 40, 60, 80, dan 100. Tes memakai skor 100 persen, dan status bulat berubah (`menyelesaikan kuis memperbarui status bulat di Learning`) |
| 5. Jadwal: terima saran, refresh, item tetap ada | Lulus. `saran diterima dengan tombol Terima` sekarang memuat muat ulang halaman |
| 6. Refresh di Learning kembali ke tata letak awal | Lulus (`refresh mengembalikan tata letak awal`) |

Seluruh suite E2E dijalankan tiga kali berurutan. Setiap jalan: 175 lulus, 9 dilewati, 0 gagal, di dua project. Tidak ada tes yang flaky.

## Cara mengulang

```bash
cd frontend
npx playwright test e2e/visual.spec.ts
pip install pillow
python3 scripts/visual-compare.py test-results/visual
```
