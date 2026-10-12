// Curriculum choices for the learning plan (rencana belajar). The labels are shown to users in Bahasa Indonesia.
// This is a starting list. It can be extended here, without a database change.

export const LEVEL_IDS = ['sd', 'smp', 'sma', 'kuliah'] as const
export type LevelId = (typeof LEVEL_IDS)[number]

export interface CurriculumSubject {
  name: string
  topics: string[]
}

export interface CurriculumLevel {
  id: LevelId
  label: string
  // Shown before the number: "Kelas 4", or "Semester 2" for kuliah.
  gradeUnit: 'Kelas' | 'Semester'
  grades: number[]
  subjects: CurriculumSubject[]
}

export const CURRICULUM: CurriculumLevel[] = [
  {
    id: 'sd',
    label: 'SD',
    gradeUnit: 'Kelas',
    grades: [1, 2, 3, 4, 5, 6],
    subjects: [
      {
        name: 'Matematika',
        topics: ['Bilangan cacah', 'Penjumlahan dan pengurangan', 'Perkalian dan pembagian', 'Pecahan sederhana', 'Bangun datar', 'Pengukuran'],
      },
      {
        name: 'Bahasa Indonesia',
        topics: ['Membaca dan memahami teks', 'Menulis kalimat', 'Tanda baca', 'Kosakata', 'Puisi dan cerita'],
      },
      {
        name: 'IPA',
        topics: ['Makhluk hidup dan lingkungannya', 'Tubuh manusia', 'Energi dan gaya sederhana', 'Cahaya dan bunyi', 'Siklus air'],
      },
      {
        name: 'IPS',
        topics: ['Keluarga dan kehidupan sosial', 'Lingkungan tempat tinggal', 'Kegiatan ekonomi sederhana', 'Peta dan lingkungan', 'Sejarah lokal'],
      },
      {
        name: 'Bahasa Inggris',
        topics: ['Greetings', 'Angka dan warna', 'Benda di sekitar', 'Keluarga', 'Kegiatan sehari-hari'],
      },
    ],
  },
  {
    id: 'smp',
    label: 'SMP',
    gradeUnit: 'Kelas',
    grades: [7, 8, 9],
    subjects: [
      {
        name: 'Matematika',
        topics: [
          'Bilangan bulat',
          'Pecahan dan desimal',
          'Aljabar dasar',
          'Persamaan linear satu variabel',
          'Perbandingan',
          'Garis dan sudut',
          'Bangun ruang sisi datar',
          'Statistika sederhana',
          'Peluang dasar',
        ],
      },
      {
        name: 'Bahasa Indonesia',
        topics: ['Teks narasi', 'Teks eksposisi', 'Teks deskripsi', 'Puisi', 'Drama'],
      },
      {
        name: 'IPA',
        topics: ['Klasifikasi makhluk hidup', 'Sel dan jaringan', 'Zat dan wujudnya', 'Gaya dan gerak', 'Ekosistem', 'Sistem pernapasan'],
      },
      {
        name: 'IPS',
        topics: ['Interaksi sosial', 'Kegiatan ekonomi', 'Sejarah Indonesia masa kolonial', 'Geografi Indonesia'],
      },
      {
        name: 'Bahasa Inggris',
        topics: ['Simple present', 'Simple past', 'Descriptive text', 'Recount text'],
      },
    ],
  },
  {
    id: 'sma',
    label: 'SMA',
    gradeUnit: 'Kelas',
    grades: [10, 11, 12],
    subjects: [
      {
        name: 'Matematika',
        topics: ['Fungsi kuadrat', 'Persamaan dan pertidaksamaan', 'Trigonometri', 'Limit fungsi', 'Turunan fungsi', 'Integral', 'Peluang', 'Statistika'],
      },
      {
        name: 'Fisika',
        topics: ['Besaran dan satuan', 'Gerak lurus', 'Hukum Newton', 'Usaha dan energi', 'Listrik statis', 'Gelombang'],
      },
      {
        name: 'Kimia',
        topics: ['Struktur atom', 'Ikatan kimia', 'Stoikiometri', 'Larutan asam basa', 'Termokimia', 'Laju reaksi'],
      },
      {
        name: 'Biologi',
        topics: ['Sel', 'Genetika dasar', 'Ekosistem', 'Sistem organ manusia', 'Bioteknologi'],
      },
      {
        name: 'Ekonomi',
        topics: ['Kelangkaan dan pilihan', 'Permintaan dan penawaran', 'Akuntansi dasar', 'Inflasi', 'Perdagangan internasional'],
      },
      {
        name: 'Sejarah',
        topics: ['Masa praaksara', 'Kerajaan Hindu-Buddha', 'Kemerdekaan Indonesia', 'Orde lama', 'Orde baru'],
      },
      {
        name: 'Bahasa Indonesia',
        topics: ['Teks eksposisi', 'Teks argumentasi', 'Puisi modern', 'Penulisan ilmiah'],
      },
      {
        name: 'Bahasa Inggris',
        topics: ['Narrative text', 'Procedure text', 'Report text', 'Analytical exposition'],
      },
    ],
  },
  {
    id: 'kuliah',
    label: 'Kuliah',
    gradeUnit: 'Semester',
    grades: [1, 2, 3, 4, 5, 6, 7, 8],
    subjects: [
      {
        name: 'Matematika Dasar',
        topics: ['Himpunan', 'Logika matematika', 'Fungsi', 'Limit', 'Turunan', 'Integral'],
      },
      {
        name: 'Statistika',
        topics: ['Statistika deskriptif', 'Peluang', 'Distribusi probabilitas', 'Uji hipotesis', 'Regresi sederhana'],
      },
      {
        name: 'Pemrograman Dasar',
        topics: ['Variabel dan tipe data', 'Percabangan', 'Perulangan', 'Fungsi', 'Array dan struktur data', 'Algoritma pencarian dan pengurutan'],
      },
      {
        name: 'Ekonomi Dasar',
        topics: ['Konsep kelangkaan', 'Permintaan dan penawaran', 'Elastisitas', 'Pasar', 'Pendapatan nasional'],
      },
      {
        name: 'Bahasa Inggris Akademik',
        topics: ['Academic writing', 'Reading strategies', 'Presentation skills'],
      },
    ],
  },
]

export function findLevel(id: string): CurriculumLevel | undefined {
  return CURRICULUM.find((level) => level.id === id)
}

export function findSubject(level: CurriculumLevel, name: string): CurriculumSubject | undefined {
  return level.subjects.find((subject) => subject.name === name)
}
