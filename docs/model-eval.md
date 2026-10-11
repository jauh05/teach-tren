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

Uji terakhir dijalankan dengan `caffeinate -i` agar Mac tidak tidur. Percobaan sebelumnya terganggu oleh mode tidur (lihat catatan di bawah). Hanya hasil uji terakhir yang dipakai.

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
