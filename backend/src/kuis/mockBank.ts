import type { QuestionData, StimulusData } from './types.js'

// Example questions for AI_MODE=mock. They match the first version of the browser bank, so the tests keep their meaning.
export const MOCK_STIMULUS: StimulusData = {
  id: 'toko-buku',
  text: 'Toko Sinar Ilmu menjual buku tulis dan pensil. Harga satu buku tulis adalah $x$ rupiah, sedangkan harga satu pensil adalah Rp3.000. Bu Wati membeli 4 buku tulis dan 2 pensil dengan total Rp26.000. Ia ingin mengetahui harga satu buku tulis dari data pembelian tersebut. Toko itu memberi potongan harga untuk pembelian di atas Rp20.000, tetapi potongan itu tidak dihitung dalam soal ini. Pada hari itu tidak ada promo lain, sehingga semua harga dihitung normal.',
}

const choice = (prompt: string, texts: string[], answer: string, explanation: string, stimulusId: string | null = null, type: 'PG' | 'CERITA' = 'PG'): QuestionData => ({
  type,
  stimulusId,
  prompt,
  options: ['A', 'B', 'C', 'D'].map((letter, index) => ({ letter, text: texts[index] })),
  answer,
  acceptedAnswers: [],
  rubric: null,
  explanation,
  bankId: null,
})

const fill = (prompt: string, accepted: string[], explanation: string): QuestionData => ({
  type: 'ISIAN',
  stimulusId: null,
  prompt,
  options: null,
  answer: null,
  acceptedAnswers: accepted,
  rubric: null,
  explanation,
  bankId: null,
})

const essay = (prompt: string, rubric: QuestionData['rubric'], explanation: string): QuestionData => ({
  type: 'ESAI',
  stimulusId: null,
  prompt,
  options: null,
  answer: null,
  acceptedAnswers: [],
  rubric,
  explanation,
  bankId: null,
})

const BANK: QuestionData[] = [
  choice('Nilai $x$ yang memenuhi persamaan $x + 5 = 12$ adalah ...', ['5', '7', '12', '17'], 'B', 'Kurangi kedua ruas dengan 5: $x = 12 - 5 = 7$.'),
  choice('Bentuk sederhana dari $3(2x - 1) + 4$ adalah ...', ['$6x + 1$', '$6x - 1$', '$6x + 7$', '$2x + 1$'], 'A', 'Kalikan 3 ke dalam kurung: $6x - 3 + 4 = 6x + 1$.'),
  choice(
    'Ani membeli 2 buku dan 1 pensil. Harga satu buku adalah $x$ rupiah dan harga pensil Rp3.000. Total pembayaran Ani adalah Rp11.000, sehingga berlaku $2x + 3000 = 11000$. Tentukan harga satu buku.\n\nHarga satu buku yang benar adalah:',
    ['$x = 3.000$', '$x = 4.000$', '$x = 5.000$', '$x = 7.000$'],
    'B',
    'Kurangi 11.000 dengan 3.000, sehingga $2x = 8000$. Bagi dengan 2: $x = 4000$.',
    null,
    'CERITA',
  ),
  choice(
    'Persamaan yang sesuai dengan data pada teks adalah ...',
    ['$4x + 6000 = 26000$', '$4x + 3000 = 26000$', '$6x + 3000 = 26000$', '$4x + 2000 = 26000$'],
    'A',
    'Empat buku tulis menjadi $4x$ dan dua pensil menjadi $2 \\times 3000 = 6000$.',
    'toko-buku',
    'CERITA',
  ),
  choice('Berdasarkan teks, harga satu buku tulis adalah ...', ['Rp4.000', 'Rp4.500', 'Rp5.000', 'Rp6.000'], 'C', 'Dari $4x + 6000 = 26000$ diperoleh $4x = 20000$, sehingga $x = 5000$.', 'toko-buku'),
  fill('Berapa nilai $x$ dari persamaan $2x = 8000$? Tulis angkanya saja.', ['4000', 'x = 4000', 'x=4000'], 'Bagi kedua ruas dengan 2: $x = 4000$.'),
  fill('Jika harga satu buku tulis Rp5.000, berapa rupiah harga 2 buku tulis? Tulis angkanya saja.', ['10000', 'Rp10.000'], 'Harga dua buku adalah $2 \\times 5000 = 10000$ rupiah.'),
  essay(
    'Jelaskan langkah pertama untuk menyelesaikan persamaan $2x + 3000 = 11000$ dan bagaimana kamu memeriksa hasilnya.',
    [
      { point: 'Memindahkan konstanta ke ruas kanan', keywords: ['kurangi', 'pindahkan'], weight: 40 },
      { point: 'Membagi dengan koefisien x', keywords: ['bagi'], weight: 30 },
      { point: 'Memeriksa hasil dengan substitusi', keywords: ['substitusi', 'periksa'], weight: 30 },
    ],
    'Kurangi 3000 dari kedua ruas, bagi dengan 2, lalu substitusikan $x = 4000$ untuk memeriksa hasilnya.',
  ),
  essay(
    'Apa perbedaan sel hewan dan sel tumbuhan? Sebutkan satu contoh bagian yang hanya dimiliki sel tumbuhan.',
    [
      { point: 'Menyebut dinding sel', keywords: ['dinding sel'], weight: 40 },
      { point: 'Menyebut kloroplas', keywords: ['kloroplas'], weight: 40 },
      { point: 'Memberi contoh', keywords: ['contoh', 'misalnya'], weight: 20 },
    ],
    'Sel tumbuhan memiliki dinding sel dan kloroplas, yang tidak dimiliki sel hewan.',
  ),
  choice('Hasil dari $2 + 3 \\times 4$ adalah ...', ['14', '20', '10', '24'], 'A', 'Kerjakan perkalian lebih dulu: $3 \\times 4 = 12$, lalu $2 + 12 = 14$.'),
]

// Which questions each style draws from, in order (the first version of the browser bank).
const STYLE_POOL: Record<string, number[]> = {
  Campuran: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  'Pilihan ganda saja': [0, 1, 4, 9],
  'Banyak cerita': [2, 3, 4, 7, 8],
}

// Questions for a quiz of the given size. Bigger quizzes repeat the pool, as before.
export function mockQuestions(style: string, count: number): QuestionData[] {
  const pool = (STYLE_POOL[style] ?? STYLE_POOL.Campuran).map((index) => BANK[index])
  return Array.from({ length: count }, (_, index) => structuredClone(pool[index % pool.length]))
}
