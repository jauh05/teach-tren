# Uji pemilihan model (docs/role.md 7.4)

**Status: sudah dijalankan (2026-10-11). Hasil: kedua model belum memenuhi ambang.** Lihat bagian Hasil di bawah.

## Yang diuji

- Model: `openai/gpt-oss-20b` (berbayar, sekarang dipakai) dan `nvidia/nemotron-3-ultra-550b-a55b:free` (gratis).
- Soal: 100 soal dalam 20 panggilan, masing-masing 5 soal, sama seperti generate kuis di aplikasi.
  - Matematika 30, IPA 30, Bahasa Indonesia 20, IPS 20.
  - Tingkat Sedang, gaya Campuran (PG 3, CERITA 1, ESAI 1 per panggilan).
- Pengaturan sama dengan aplikasi: prompt `quizBatchPrompt`, skema `kuisBatchSchema`, effort `medium`, token 3000, batas waktu 45 detik, suhu 0,2.
- Tidak ada data pengguna yang dikirim. Hanya nama mapel, topik, dan teks soal.

## Kriteria

1. **JSON valid tanpa perbaikan.** Persentase panggilan yang lolos normalisasi lokal dan validasi skema tanpa panggilan perbaikan AI. Dicatat juga persentase yang sudah JSON murni tanpa normalisasi.
2. **Kunci benar.** Sampel 10 soal per model: 3 Matematika, 3 IPA, 2 Bahasa Indonesia, 2 IPS. Diambil acak dengan benih tetap (7) dari soal yang punya kunci. Setiap soal diselesaikan ulang secara manual, dan hasilnya dicatat di bawah.
3. **Waktu respons.** Median dan p90 per panggilan, dalam milidetik.

Ambang yang disetujui: JSON valid minimal 95%, kunci benar minimal 9 dari 10. Model gratis dipakai jika lolos keduanya dan waktu respons wajar. Jika tidak, dipakai `openai/gpt-oss-20b`.

## Perkiraan biaya

Sekitar Rp150 sampai Rp300 untuk gpt-oss-20b dan Rp0 untuk model gratis. Batas yang disetujui: Rp500. Biaya nyata dicatat dari selisih pemakaian kunci sebelum dan sesudah tiap model.

## Cara menjalankan

```bash
cd backend
npm run eval:model -- --out <folder-hasil>
```

Hasil mentah (`model-eval-raw.json`) dan sampel untuk pemeriksaan kunci (`model-eval-sampel.json`) ditulis ke folder `--out`. Ringkasan tampil di terminal. Mode `--dry-run` memakai jawaban palsu dan tidak memakai kredit, hanya untuk menguji alur.

## Hasil

### Putaran 4: penyebab gagal generate kuis dan perbaikannya (aplikasi)

Uji langsung dengan kuis 10 soal, bank dikosongkan setiap kali. Semua hasil di bawah memakai kode yang sama dengan commit ini, kecuali angka batas yang tertulis.

**Penyebab yang ditemukan dari rekaman panggilan (`finish_reason`, token, dan isi keluaran):**
1. **Keluaran terpotong di batas token.** Penalaran gpt-oss memakan sebagian besar token. Dari 21 panggilan kuis dengan batas 3000, lima terpotong (`finish_reason: length`). Ini penyebab terbesar.
2. **Batch dijalankan berurutan.** Satu batch bisa 50 sampai 90 detik. Dua batch berurutan melewati jendela waktu, sehingga percobaan ulang tidak sempat dimulai.
3. **Breaker mematikan rantai satu model.** Tiga kegagalan berturut-turut mendinginkan satu-satunya model selama 10 menit, dan chat juga ikut mati. Sempat terjadi: lima kuis gagal dalam 0 detik.
4. **Perbaikan dipanggil untuk keluaran yang sudah terpotong.** Panggilan perbaikan memakan sekitar 90 detik sampai timeout dan tidak mungkin berhasil.
5. **Jenis soal tidak sesuai permintaan.** Batch yang diminta pilihan ganda bisa kembali berisi soal cerita, sehingga gaya kuis yang dipilih pengguna tidak terjaga.
6. **Satu soal yang cacat membuang seluruh batch.** Model sering hanya mengembalikan 1 sampai 4 soal dari 5.
7. **Bentuk JSON verifikasi kunci salah.** Dua dari delapan keluaran berupa satu objek tanpa kunci `hasil`.
8. **JSON rusak kecil** (kurung atau tanda kutip). Sekitar lima kasus dari 21 panggilan.

**Yang sudah diperbaiki (tanpa mengubah spesifikasi):**
- Keluaran terpotong langsung gagal tanpa perbaikan (`openrouter.ts`).
- Batch berjalan paralel dalam satu putaran (`generate.ts`).
- Breaker tidak mendinginkan model jika rantai hanya punya satu model (`service.ts`).
- Setiap soal diperiksa satu per satu. Soal yang benar disimpan, yang cacat dibuang, dan jenis soal dibatasi sesuai permintaan (`quizSchemas.ts`).
- Prompt verifikasi kunci mewajibkan `hasil` dan `jawabanBenar`.
- JSON yang rusak kecil diperbaiki dengan `jsonrepair`, lalu tetap divalidasi skema (`normalize.ts`).
- Effort `low` ditolak. Ia menghasilkan 44 dari 98 kunci yang ditandai salah oleh verifikasi, dibanding 3 dari 67 dengan `medium`.

**Hasil terukur (8 kuis berurutan, sama dengan aplikasi):**

| Pengaturan | Berhasil |
| --- | --- |
| Batas token 3000, batch 5, timeout 90 detik | 4 dari 8 |
| Batas token 3000, batch 3, tiga percobaan | 4 dari 8 |
| Batas token 6000, batch 5, timeout 90 detik | 7 dari 8 |
| Batas token 6000, batch 5, timeout 120 detik, mulai percobaan baru sebelum 120 detik | 15 dari 16 (dua putaran) |
| **Batas token 7000, batch 5, timeout 120 detik, mulai percobaan baru sebelum 150 detik, route 360 detik** | **16 dari 16** (waktu 29 sampai 155 detik, median sekitar 60 detik) |

**Keputusan dan selisih:**
- Batas token kuis **7000**, bukan 3000 seperti di `docs/role.md`. Ini dicatat di `docs/selisih.md` (baris 96) dan memerlukan persetujuan. Dengan 3000, sekitar separuh kuis gagal. Batas chat tetap 1200.
- Timeout panggilan kuis 120 detik. Percobaan baru dimulai hanya sebelum 150 detik, dan route generate diberi 360 detik supaya percobaan terakhir beserta pemeriksaan kuncinya selesai.
- Keberhasilan terukur 16 dari 16 pada konfigurasi akhir (dan 8 dari 8 pada putaran sebelumnya dengan angka yang sama), jadi total 24 dari 24. Jumlah ini belum cukup untuk menjamin 100 persen. Sisa risiko: keluaran yang masih terpotong pada 7000 token, gangguan penyedia, dan jendela waktu yang habis. Jika semua itu terjadi, pengguna melihat pesan kesalahan dan tombol Coba lagi, bukan kuis rusak.
- Biaya sekitar Rp20 per kuis 10 soal (kurs Rp17.889 per dolar).

### Putaran 2: batas waktu kuis 90 detik (gpt-oss-20b saja)

Setelah putaran pertama, batas waktu panggilan kuis dinaikkan dari 45 ke 90 detik (`AI_TIMEOUT_KUIS_MS=90000`). Ini disetujui untuk mengurangi batch yang habis waktu. Uji diulang untuk gpt-oss-20b, dengan `--timeout-ms 90000`.

| Ukuran | 45 detik (putaran 1) | 90 detik (putaran 2) | Ambang |
| --- | --- | --- | --- |
| Batch valid | 6 dari 20 (30%) | 13 dari 20 (65%) | minimal 95% |
| Soal valid | 30 dari 100 | 65 dari 100 | |
| Batch habis waktu | 9 | 3 | |
| Waktu respons median | 40,6 detik | 24,0 detik | wajar |
| Waktu respons p90 | 45 detik | 90 detik | |
| Biaya | $0,0043 | $0,0048 | |

Batas 90 detik membantu, tetapi belum cukup. Kegagalan yang tersisa: 3 batch habis waktu, 1 respons kosong, 2 bukan JSON, dan 1 batch dengan stimulus yang tidak ditemukan.

Pemeriksaan kunci manual pada 10 soal sampel: 8 benar, 1 salah, dan 1 ambigu.
- **Salah:** soal Rina membeli 5 pensil dan 3 pulpen. Hasil yang benar Rp6,10 (5×0,50 + 3×1,20), dan jawaban itu tidak ada di pilihan. Kunci model C (5,10). Bacaannya juga tidak konsisten, karena menyebut total Rp4,10 untuk pembelian lain.
- **Ambigu:** "Kalimat mana yang paling tepat menggantikan kalimat lama". Pilihan A dan C sama-sama tepat.
- Sisanya benar: persamaan linear (x=7 dan y=2), detritus, gaya gesek 0,3 × 49 = 14,7 N, foton 200 × 0,5 = 100, majas perbandingan, tarian Saman, dan festival.
- Catatan kualitas: satu bacaan IPS ditulis dalam bahasa Inggris untuk mapel Bahasa Indonesia.

**Keputusan:** 90 detik dipertahankan untuk kuis, karena keandalannya naik dari 30% ke 65% dan waktu median turun. Namun model ini belum memenuhi ambang, baik untuk keandalan maupun untuk kunci.

### Putaran 3: percobaan ulang dan perbaikan prompt verifikasi (aplikasi, bukan uji 7.4)

Uji langsung di aplikasi, dengan enam kuis 10 soal berurutan dan bank dikosongkan setiap kali. Ini mengukur kuis utuh, bukan batch.

- **Percobaan ulang batch:** batch yang gagal dicoba sekali lagi, selama masih ada cukup waktu untuk satu percobaan penuh (sebelum 150 detik).
- **Verifikasi kunci:** 2 dari 8 keluaran sebelumnya berisi satu objek tanpa kunci `hasil`. Prompt sekarang mewajibkan `hasil` dengan satu entri per soal, dan `jawabanBenar` selalu diisi. Setelah perbaikan, 8 dari 8 keluaran berbentuk benar.
- **Pesan alasan:** respons kosong sekarang tercatat sebagai "respons tidak berisi teks", bukan "HTTP 200". Kegagalan validasi juga mencatat error skema.

**Hasil:** 5 dari 6 kuis 10 soal berhasil. Sebelum percobaan ulang dan perbaikan prompt, pengujian serupa berhasil 0 dari 5. Sampelnya kecil, jadi ini indikasi, bukan kepastian.

Kegagalan yang tersisa tercatat sebagai: bukan JSON (2), tidak lolos validasi (2), timeout (1), dan respons kosong (1).

**Risiko yang belum ditangani:** circuit breaker menghitung tiga kegagalan berturut-turut sebagai alasan mendinginkan model selama 10 menit. Karena rantai saat ini hanya punya satu model, selama pendinginan chat dan kuis sama-sama gagal. Pengujian ini tidak memicu pendinginan, tetapi risikonya nyata. Keputusan ambang atau perilaku pendinginan perlu persetujuan.

### Putaran 1: batas waktu 45 detik

Uji dijalankan dengan `caffeinate -i` agar Mac tidak tidur. Percobaan sebelumnya terganggu oleh mode tidur (lihat catatan di bawah). Hanya hasil uji terakhir yang dipakai.

| Ukuran | `openai/gpt-oss-20b` (berbayar) | `nvidia/nemotron-3-ultra-550b-a55b:free` (gratis) | Ambang |
| --- | --- | --- | --- |
| Batch valid tanpa perbaikan | 6 dari 20 (30%) | 1 dari 20 (5%) | minimal 95% |
| JSON murni tanpa normalisasi | 7 dari 20 (35%) | 1 dari 20 (5%) | catatan |
| Soal valid | 30 dari 100 | 5 dari 100 | |
| Kunci benar pada sampel | 8 dari 10 (lihat di bawah) | 2 dari 2, sampel tidak lengkap | minimal 9 dari 10 |
| Waktu respons median | 40,6 detik | 45 detik | wajar |
| Waktu respons p90 | 45 detik | 45 detik | |
| Biaya | $0,0043 (sekitar Rp77) | $0,0002 | |

**Kegagalan gpt-oss-20b (14 dari 20 batch):** 9 habis waktu 45 detik, 1 respons kosong, 3 bukan JSON, dan 1 salah jumlah pilihan atau kunci.
**Kegagalan nemotron (19 dari 20 batch):** 18 habis waktu 45 detik, dan 1 bukan JSON.

**Pemeriksaan kunci manual, gpt-oss-20b.** 10 soal diambil acak dari 30 soal yang valid. Setiap soal diselesaikan ulang dengan teks bacaan lengkap:

1. Total pengeluaran Rina: 3×5.000 + 2×12.000 + 5×2.000 = Rp49.000. Kunci A benar.
2. Diskon 10% diberikan jika total lebih dari Rp50.000. Total Rp49.000, jadi tidak diberikan. Kunci model "A (Ya)" **salah**. Kunci yang benar B.
3. 0,75 = 3/4. Kunci A benar.
4. Kecepatan konstan berarti gaya total nol. Kunci A benar.
5. F = 0,3 × 200 = 60 N. Kunci A benar.
6. a = F/m = 50/10 = 5 m/s². Kunci A benar.
7. Inti cerita Rina adalah kegiatan akhir pekan. Kunci B benar.
8. "Kalimat paling efektif" tidak punya jawaban pasti dari teks. Opsi D hanya ringkasan. Soal **ambigu**.
9. Koperasi dimiliki dan dikelola oleh anggota yang memiliki hak suara yang sama. Kunci B benar.
10. Pilihan C paling masuk akal, tetapi rumusannya kurang tepat: akta dibuat notaris, dan pengesahan dilakukan pemerintah. Kunci C benar dengan catatan.

Hasilnya 8 dari 10 kunci benar, satu salah, dan satu soal ambigu.

**Sampel nemotron tidak lengkap.** Hanya 5 soal yang valid, jadi hanya 2 soal bisa diperiksa. Keduanya benar: majas personifikasi dan majas perbandingan.

**Keputusan:** kedua model tidak lolos ambang. Model gratis tidak dipakai. Model yang tetap dipakai adalah `openai/gpt-oss-20b`, dan itu pun belum memenuhi ambang keandalan.

**Temuan yang perlu ditindaklanjuti:** sebagian besar kegagalan gpt-oss adalah batas waktu 45 detik, bukan format soal. Di aplikasi, batch yang gagal bisa membuat kuis tidak lengkap. Pilihan yang bisa dipertimbangkan:
- Naikkan batas waktu panggilan kuis dari 45 detik ke sekitar 90 detik. Permintaan generate kuis sudah punya batas 180 detik, jadi ini aman dari sisi server. Pengguna menunggu lebih lama.
- Turunkan effort kuis ke `low`. Lebih cepat, tetapi percobaan sebelumnya menghasilkan opsi yang sama untuk semua soal.
- Naikkan batas token dari 3000. Spesifikasi menetapkan 3000, jadi ini perlu persetujuan.

**Catatan pelaksanaan.** Percobaan pertama dan kedua gagal karena dua hal. Pertama, skrip berhenti saat pemeriksaan kredit gagal sementara, sehingga hasil model pertama hilang. Kedua, Mac tidur di tengah uji dua kali. Skrip sudah diperbaiki: pemeriksaan kredit tidak menghentikan uji, hasil disimpan per model, dan timeout saat membaca isi respons dicatat sebagai timeout. Sampel juga sudah diperbaiki agar esai tidak ikut diperiksa.

**Kredit total** untuk semua percobaan termasuk yang gagal: $0,0092 (sekitar Rp165).

**Privasi:** hanya nama mapel, topik, dan teks soal yang dikirim. Tidak ada data pengguna.
