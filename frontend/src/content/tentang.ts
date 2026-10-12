// Content for the Tentang (guide) page. Edit text here; the page layout does not change.
// Section bodies use Markdown and are rendered with RichText.

export type GuideIcon =
  | 'rocket'
  | 'user'
  | 'network'
  | 'calendar'
  | 'message'
  | 'quiz'
  | 'gauge'
  | 'shield'
  | 'book'

export interface GuideStep {
  title: string
  text: string
  icon: GuideIcon
  link: string
  linkLabel: string
}

export interface GuideSection {
  id: string
  title: string
  icon: GuideIcon
  body: string
}

export interface GuideFact {
  value: string
  label: string
}

export interface GuideFaq {
  question: string
  answer: string
}

export const GUIDE_FACTS: GuideFact[] = [
  { value: '2', label: 'aksi gratis untuk tamu per perangkat' },
  { value: '5-20', label: 'soal dalam satu kuis' },
  { value: '200', label: 'pesan chat per hari untuk pengguna masuk' },
]

export const QUICK_START: GuideStep[] = [
  {
    title: 'Mulai chat',
    text: 'Tulis pertanyaan di kolom bawah, lalu tekan Enter. Jawaban muncul bertahap.',
    icon: 'message',
    link: '/chat',
    linkLabel: 'Buka Chat',
  },
  {
    title: 'Buat topik',
    text: 'Di Learning, setiap neuron adalah topik. Ketuk neuron untuk membuka chat tentang topik itu.',
    icon: 'network',
    link: '/learning',
    linkLabel: 'Buka Learning',
  },
  {
    title: 'Kerjakan kuis',
    text: 'Dari chat atau panel topik, pilih Generate soal. Kuis berisi pilihan ganda dan soal cerita.',
    icon: 'quiz',
    link: '/kuis/persamaan-linear',
    linkLabel: 'Coba kuis contoh',
  },
]

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'tamu-dan-masuk',
    title: 'Tamu dan masuk',
    icon: 'user',
    body: `- **Tamu** mendapat dua aksi AI di perangkat ini. Satu aksi adalah satu pesan chat atau satu kuis lima soal. Setelah itu kamu diminta daftar atau masuk.
- **Masuk** memberi fitur lengkap: riwayat tersimpan di akun, pembahasan kuis, jadwal, Learning memory, dan pengaturan.`,
  },
  {
    id: 'learning',
    title: 'Learning',
    icon: 'network',
    body: `- Geser area kosong untuk menggeser papan. Gunakan dua jari atau roda mouse untuk zoom antara 40 dan 200 persen.
- Tarik neuron untuk memindahkannya. Neuron lain menyingkir. Posisi tidak disimpan, jadi refresh kembali ke tata letak awal.
- Warna neuron menunjukkan status: hijau sudah dikuasai (skor 80 ke atas), kuning sedang dipelajari (50 sampai 79), merah perlu diulang (di bawah 50), teal baru, abu belum dibuka, dan ungu saran berikutnya.
- Tekan **Perbesar papan** untuk memperluas kanvas. Tekan **Lihat keterangan** untuk melihat arti warna.`,
  },
  {
    id: 'jadwal',
    title: 'Jadwal',
    icon: 'calendar',
    body: `- Kalender menampilkan rencana belajar. Pilih **Minggu** atau **Bulan** di pojok kanan atas.
- Saran AI berwarna ungu dengan garis putus-putus. Terima saran dengan tombol Terima, atau seret ke hari lain di desktop.
- **Learning memory** menampilkan topik yang sudah kamu pelajari beserta skornya.`,
  },
  {
    id: 'chat',
    title: 'Chat',
    icon: 'message',
    body: `- Enter mengirim pesan. Shift dan Enter membuat baris baru.
- Setiap jawaban punya tombol **Salin**, **Ulangi**, dan **Buat latihan**.
- Setelah jawaban selesai, kartu **Langkah berikutnya** menawarkan kuis, jadwal, atau materi lanjutan. AI tidak dipanggil sebelum kamu memilih.
- Riwayat berisi semua percakapan. Kamu bisa mencari judul, mengganti nama, dan menghapus percakapan.`,
  },
  {
    id: 'kuis',
    title: 'Kuis',
    icon: 'quiz',
    body: `- Kuis berisi 5 sampai 20 soal: pilihan ganda, soal cerita, isian, dan esai.
- Teks bacaan bisa dilipat. Rumus ditulis dengan LaTeX, jadi tetap rapi di layar kecil.
- **Pembahasan** hanya tersedia untuk pengguna yang sudah masuk. Skor kuis memperbarui status neuron.`,
  },
  {
    id: 'batas-penggunaan',
    title: 'Batas penggunaan',
    icon: 'gauge',
    body: `| | Tamu | Masuk |
| --- | --- | --- |
| Chat AI | 2 aksi per perangkat | 200 pesan per hari |
| Kuis | 1 kuis lima soal | 20 kuis per hari, 5 sampai 20 soal |
| Pembahasan | Tidak | Ya |
| Riwayat | Di perangkat ini, maksimal 2 percakapan | Tersimpan di akun |
| Jadwal | Kosong, hanya baca | Penuh |`,
  },
  {
    id: 'privasi-dan-data',
    title: 'Privasi dan data',
    icon: 'shield',
    body: `- Chat, kuis, dan jadwal disimpan di akun setelah masuk.
- Pesan yang kamu kirim diproses layanan AI untuk membuat jawaban. Jangan menulis data pribadi di chat.
- Dari **Pengaturan** kamu bisa mengekspor riwayat (JSON), menghapus semua riwayat, atau menghapus akun. Akun dihapus dalam 30 hari dan bisa dipulihkan dengan masuk kembali selama masa itu.`,
  },
]

export const GUIDE_FAQ: GuideFaq[] = [
  {
    question: 'Apakah jawaban AI selalu benar?',
    answer: 'Tidak selalu. Periksa kembali hal penting, terutama rumus dan tanggal.',
  },
  {
    question: 'Apakah saya bisa memakai Teach Tren tanpa internet?',
    answer: 'Tidak. Jawaban AI membutuhkan koneksi.',
  },
  {
    question: 'Di mana saya memberi umpan balik?',
    answer: 'Formulir umpan balik akan tersedia di Pengaturan, bagian Bantuan.',
  },
]

export const GUIDE_VERSION = { number: '0.1.0', date: '11 Oktober 2026' }
