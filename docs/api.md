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

## Kesehatan server

`GET /api/health` mengembalikan `{ "status": "ok" }`. Tidak butuh sesi.

## Yang belum ada

Jadwal, ingatan AI, pembuatan soal oleh AI, dan batas tamu di sisi server. Penghapusan akun yang sudah lewat 30 hari belum dijalankan otomatis. Endpoint ini ditambahkan di tahap berikutnya dan dicatat di dokumen ini saat dibuat.
