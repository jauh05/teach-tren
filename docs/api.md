# Kontrak API Teach Tren

Basis URL: `/api`. Semua data bersifat pribadi dan diambil dari sesi yang sedang masuk.

## Konvensi

- Format data: JSON. Nama field dan endpoint memakai Bahasa Inggris. Pesan untuk pengguna memakai Bahasa Indonesia.
- Sesi: cookie `tt_sesi` (httpOnly, SameSite=Lax, berlaku 7 hari). Dibuat saat daftar atau masuk, dihapus saat keluar.
- Error selalu berbentuk `{ "pesan": "..." }`. Jika data tidak valid, ada tambahan `rincian: [{ "path": "email", "pesan": "..." }]` dengan status 400.
- Status yang dipakai: 200, 201, 204, 400 (data tidak valid), 401 (belum masuk atau salah kata sandi), 404 (tidak ditemukan atau milik orang lain), 409 (data sudah ada).

## Akun

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `name` (1 sampai 60 karakter), `email`, `password` (8 sampai 72 karakter) | 201 `{ user }`. Membuat sesi dan 9 bulat awal beserta 7 tautan |
| POST | `/api/auth/login` | `email`, `password` | 200 `{ user }`. Salah email atau kata sandi: 401 dengan pesan yang sama |
| POST | `/api/auth/logout` | - | 204 |
| GET | `/api/auth/me` | - | 200 `{ user }`, atau 401 |
| PATCH | `/api/auth/me` | `name` (1 sampai 60 karakter) | 200 `{ user }`. Email tidak bisa diubah |
| POST | `/api/auth/password` | `currentPassword`, `newPassword` (8 sampai 72 karakter) | 204. Kata sandi lama salah: 400 |
| DELETE | `/api/auth/me` | `password` | 204. Akun dijadwalkan dihapus dan sesi berakhir. Salah kata sandi: 400. Masuk lagi dalam 30 hari memulihkan akun |

`user` berisi `id`, `name`, dan `email`. Kata sandi tidak pernah dikembalikan.

## Bulat

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| GET | `/api/topics` | - | 200 `{ topics, links }` |
| POST | `/api/topics` | `name` | 201 `{ topic: { id, name } }`. Nama sama (tanpa memperhatikan huruf besar dan spasi tepi) menghasilkan 409 |
| PATCH | `/api/topics/:id` | `name` | 200 `{ topic: { id, name } }` |
| POST | `/api/topics/:id/scores` | `percent` (bilangan bulat 0 sampai 100) | 201 `{ lastScore }`. Mencatat satu kali kuis dan menjadikannya skor terbaru |

Setiap item di `topics`: `id`, `name`, `x`, `y`, `lastScore` (atau `null`), `unlocked`, `pendingSuggestion`, `materials` (judul materi yang dikaitkan).
Setiap item di `links`: `source`, `target`, `suggested`.

## Percakapan

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| GET | `/api/conversations` | - | 200 `{ conversations: [{ id, title, updatedAt }] }`, terbaru di atas |
| GET | `/api/conversations/:id` | - | 200 `{ conversation: { id, title, updatedAt, messages } }` |
| PUT | `/api/conversations/:id` | `messages` (maksimal 500 pesan), `title` (opsional, 1 sampai 120 karakter) | 200 `{ conversation }`. Membuat atau memperbarui, dan mengganti seluruh pesan. Tanpa `title`, percakapan baru memakai pertanyaan pertama dan percakapan lama mempertahankan judulnya |
| PATCH | `/api/conversations/:id` | `title` (1 sampai 120 karakter) | 200 `{ conversation }`. Mengganti judul saja |
| DELETE | `/api/conversations/:id` | - | 204 |
| DELETE | `/api/conversations` | - | 204. Menghapus semua percakapan milik pengguna (Hapus semua riwayat) |

Setiap pesan: `id` (maksimal 64 karakter, unik di dalam percakapan), `role` (`user` atau `assistant`), `content` (maksimal 20.000 karakter), `status` (`streaming`, `done`, atau `stopped`). Urutan pesan mengikuti urutan di array.

## Materi

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| GET | `/api/materi` | - | 200 `{ materials }`, urut dari yang lama |
| POST | `/api/materi` | formulir ganda dengan berkas di field `berkas` | 201 `{ material }` berstatus `MEMPROSES`. Lihat aturan unggahan di bawah |
| POST | `/api/materi/:id/link` | `topicId` | 200 `{ material }`. Materi dikaitkan ke bulat milik pengguna itu |

Aturan unggahan:
- Format PDF, DOCX, atau PPTX. Isi berkas dicek dari awal berkas (magic bytes): PDF harus diawali `%PDF-`, DOCX dan PPTX harus berupa arsip zip.
- Ukuran maksimal 20 MB. Berkas kosong ditolak.
- Maksimal 50 materi per pengguna.
- Status: `MENGUNGGAH`, `MEMPROSES`, `SIAP`, `GAGAL`. Setelah diproses, materi berstatus `SIAP` dengan `summary` (3 sampai 5 poin) dan `suggestedTopics`.
- Kesalahan: format, ukuran, batas 50, dan berkas kosong memakai status 400. Isi berkas yang tidak sesuai jenisnya memakai status 422.
- Berkas tidak disimpan di server. Ringkasan saat ini masih teks contoh sampai pembuatan ringkasan dengan AI tersedia.

Setiap materi: `id`, `title`, `type` (`PDF`, `DOCX`, atau `PPTX`), `sizeBytes`, `status`, `summary`, `suggestedTopics`, `linkedTopicId`, `error`.

## Chat

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| POST | `/api/conversations/:id/messages` | `content` (1 sampai 3000 karakter), `history` (opsional, maksimal 10 pesan terakhir), `topicName` (opsional) | Aliran SSE: `meta`, `delta`, `done`, atau `error` |

Identitas:
- Pengguna masuk: cookie sesi.
- Tamu: header `X-Guest-Id` berisi UUID dari perangkat. Tanpa keduanya: 401.

Event:
- `meta` `{ conversationId, messageId }`: dikirim pertama, sebelum teks.
- `delta` `{ text }`: potongan jawaban.
- `done` `{ messageId, status: "done" }`: jawaban selesai.
- `error` `{ pesan, kode }`: jawaban gagal. `kode` bisa `AI_TIDAK_TERSEDIA` atau `JAWABAN_GAGAL`.

Aturan:
- Pengguna masuk: pertanyaan disimpan dulu. Jawaban disimpan setelah selesai. Jika aliran dibatalkan (koneksi ditutup), jawaban yang sudah terbentuk disimpan dengan status `stopped`. Di kontrak ini statusnya `stopped`, bukan GAGAL.
- Tamu: tidak ada yang disimpan di server. Riwayat tamu tetap di perangkat.
- Kuota tamu: 2 aksi per perangkat. Jawaban yang selesai atau dihentikan dihitung satu aksi. Jawaban yang gagal tidak dihitung. Melewati batas: 429 `KUOTA_HABIS`.
- Kuota pengguna masuk: 200 pesan per hari (UTC). Melewati batas: 429 `KUOTA_HABIS`.
- Batas kecepatan: 10 pesan per menit per IP dan per akun atau tamu. Melewati batas: 429 `TERLALU_CEPAT`.
- Id percakapan dibuat per akun. Id yang sama dari akun lain menjadi percakapan baru milik pengguna yang sedang masuk, dan tidak membocorkan keberadaan percakapan orang lain. Ini menyimpang dari tabel CC-05 yang meminta 404.
- Log tidak memuat isi pesan.

## Jadwal dan ingatan

Hanya pengguna masuk. Tamu mendapat 401 (spesifikasi CC-10 menyebut 403 HANYA_MASUK).

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| GET | `/api/jadwal` | - | 200 `{ items }`, diurutkan dari tanggal terdekat. Menjalankan job saran harian lebih dulu |
| POST | `/api/jadwal/item` | `date` (YYYY-MM-DD), `title` (1 sampai 80 karakter), `kind` (opsional), `reason` (opsional) | 201 `{ item }` |
| PATCH | `/api/jadwal/item/:id` | `date` atau `accept` | 200 `{ item }`. Memindah item atau menerima saran. Memindah saran juga menerimanya |
| DELETE | `/api/jadwal/item/:id` | - | 204 |
| GET | `/api/memori` | - | 200 `{ entries }`: topik yang punya skor, dengan status `DIKUASAI` (80 ke atas), `SEDANG` (50 sampai 79), atau `PERLU_DIULANG` (di bawah 50) |

Item: `id`, `date`, `title`, `kind` (`LATIHAN`, `ULANG`, `BARU`, `SARAN`, atau `ISTIRAHAT`), `reason`.

Job saran harian:
- Dijalankan saat jadwal dibuka, paling banyak sekali per pengguna per hari.
- Input ke AI hanya nama topik, status, dan skor. Tidak ada data pribadi.
- Jika skor dan nama topik tidak berubah sejak job terakhir, AI tidak dipanggil.
- Saran dibuat untuk minggu ini (Senin sampai Minggu). Maksimal lima saran.
- Jika AI gagal, tidak ada yang disimpan dan percobaan berikutnya dilakukan saat jadwal dibuka lagi.
- Respons GET menunggu job paling lama dua belas detik, karena model berbayar bisa memakan sekitar sepuluh detik. Jika lebih lama, job tetap berjalan di latar belakang.

## Kuis

Tamu dan pengguna masuk memakai endpoint yang sama. Tamu mengirim `X-Guest-Id`, seperti di chat.

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| POST | `/api/kuis/generate` | `sumberId` (id bulat atau percakapan), `topicName` (opsional), `count` (5, 10, 15, atau 20), `level`, `style` | 201 `{ quiz }`. Tanpa kunci jawaban dan tanpa pembahasan |
| POST | `/api/kuis/:quizId/jawaban/:itemId` | `answer` (1 sampai 1000 karakter) | 200. PG dan soal cerita serta isian langsung dinilai dan memberi `kunci`. Esai hanya disimpan |
| POST | `/api/kuis/:quizId/kumpul` | - | 200 `{ percent, benar, total, items, stimuli }`. Esai dinilai AI dalam satu panggilan |
| POST | `/api/kuis/:quizId/ulangi-salah` | - | 201 `{ quiz }` baru berisi soal yang salah saja. Tidak mengubah skor |

Aturan:
- Tamu: tepat 5 soal. Satu kuis memakai satu aksi dari dua aksi gratis. Melewati batas: 429 `KUOTA_HABIS`.
- Pengguna masuk: 5 sampai 20 soal, 20 kuis per hari (UTC). Melewati batas: 429 `KUOTA_HABIS`.
- Pembahasan (`pembahasan`) hanya ada untuk pengguna masuk, di respons jawaban dan hasil. Tamu tidak mendapat field ini.
- Skor pengguna masuk disimpan dan memperbarui status bulat, kecuali pada ulangi soal salah.
- Komposisi default: PG 50%, soal cerita 25%, isian 10%, esai 15%. Gaya "Pilihan ganda saja" hanya PG. "Banyak cerita" memberi cerita 50%.
- Bank soal: soal dibuat AI sekali, lalu dipakai ulang. Pengguna masuk tidak mendapat soal yang sudah pernah dikerjakan. Kunci bank memakai mapel, sehingga soal dari mapel lain tidak dipakai.
- AI membuat soal dalam batch maksimal 5. Soal matematika dan IPA diperiksa ulang kuncinya (`VERIFIKASI_KUNCI`). Soal yang kuncinya tidak cocok dibuang dan dibuat ulang.
- Pembahasan dibuat bersama soal, bukan saat hasil dibuka. Ini menghemat satu panggilan AI per soal salah. Menyimpang dari CC-07 (yang menunda pembahasan).
- Penilaian esai: satu panggilan AI untuk semua esai. Jika AI tidak tersedia, kata kunci dipakai dan jawabannya ditandai `lowConfidence`.
- Kuis yang sudah dikumpulkan tidak bisa dijawab lagi (409).

## Kesehatan server

`GET /api/health` mengembalikan `{ "status": "ok" }`. Tidak butuh sesi.

## Yang belum ada

Penghapusan akun setelah 30 hari belum berjalan otomatis. Penghapusan akun yang sudah lewat 30 hari belum dijalankan otomatis. Endpoint ini ditambahkan di tahap berikutnya dan dicatat di dokumen ini saat dibuat.
