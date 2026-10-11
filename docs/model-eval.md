# Uji pemilihan model (docs/role.md 7.4)

**Status: belum dijalankan.** Kunci OpenRouter di `backend/.env` ditolak dengan `401 API key expired` saat diperiksa pada 2026-10-11. Uji dijalankan setelah kunci baru dipasang di `backend/.env`.

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

Belum ada. Bagian ini diisi setelah uji dijalankan dengan kunci baru.
