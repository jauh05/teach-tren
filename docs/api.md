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

`user` berisi `id`, `name`, dan `email`. Kata sandi tidak pernah dikembalikan.

## Bulat

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| GET | `/api/topics` | - | 200 `{ topics, links }` |
| POST | `/api/topics` | `name` | 201 `{ topic: { id, name } }`. Nama sama (tanpa memperhatikan huruf besar dan spasi tepi) menghasilkan 409 |
| PATCH | `/api/topics/:id` | `name` | 200 `{ topic: { id, name } }` |
| POST | `/api/topics/:id/scores` | `percent` (bilangan bulat 0 sampai 100) | 201 `{ lastScore }`. Mencatat satu kali kuis dan menjadikannya skor terbaru |

Setiap item di `topics`: `id`, `name`, `x`, `y`, `lastScore` (atau `null`), `unlocked`, `pendingSuggestion`.
Setiap item di `links`: `source`, `target`, `suggested`.

## Percakapan

| Metode | Alamat | Isi permintaan | Hasil |
| --- | --- | --- | --- |
| GET | `/api/conversations` | - | 200 `{ conversations: [{ id, title, updatedAt }] }`, terbaru di atas |
| GET | `/api/conversations/:id` | - | 200 `{ conversation: { id, title, updatedAt, messages } }` |
| PUT | `/api/conversations/:id` | `title` (1 sampai 120 karakter), `messages` (maksimal 500 pesan) | 200 `{ conversation }`. Membuat atau memperbarui, dan mengganti seluruh pesan |
| DELETE | `/api/conversations/:id` | - | 204 |

Setiap pesan: `id` (maksimal 64 karakter), `role` (`user` atau `assistant`), `content` (maksimal 20.000 karakter), `status` (`streaming`, `done`, atau `stopped`). Urutan pesan mengikuti urutan di array.

## Kesehatan server

`GET /api/health` mengembalikan `{ "status": "ok" }`. Tidak butuh sesi.

## Yang belum ada

Materi, jadwal, ingatan AI, pembuatan soal oleh AI, dan batas tamu di sisi server. Endpoint ini ditambahkan di tahap berikutnya dan dicatat di dokumen ini saat dibuat.
