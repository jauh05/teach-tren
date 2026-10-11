import type { Quiz, QuizQuestion, QuizSettings, QuizStimulus, QuizStyle } from '../domain/quiz'
import { fetchTopicGraph } from './topics'

// Mock quiz bank until the AI backend exists. Question 3 matches the mockup (docs/design/html/04-kuis-soal-desktop.html).
const STIMULUS: QuizStimulus = {
  id: 'toko-buku',
  text: 'Toko Sinar Ilmu menjual buku tulis dan pensil. Harga satu buku tulis adalah $x$ rupiah, sedangkan harga satu pensil adalah Rp3.000. Bu Wati membeli 4 buku tulis dan 2 pensil dengan total Rp26.000. Ia ingin mengetahui harga satu buku tulis dari data pembelian tersebut. Toko itu memberi potongan harga untuk pembelian di atas Rp20.000, tetapi potongan itu tidak dihitung dalam soal ini. Pada hari itu tidak ada promo lain, sehingga semua harga dihitung normal.',
}

const BANK: QuizQuestion[] = [
  {
    id: 'q1',
    type: 'PG',
    prompt: 'Nilai $x$ yang memenuhi persamaan $x + 5 = 12$ adalah ...',
    options: [
      { letter: 'A', text: '5' },
      { letter: 'B', text: '7' },
      { letter: 'C', text: '12' },
      { letter: 'D', text: '17' },
    ],
    answer: 'B',
    explanation: 'Kurangi kedua ruas dengan 5: $x = 12 - 5 = 7$.',
    stimulusId: null,
  },
  {
    id: 'q2',
    type: 'PG',
    prompt: 'Bentuk sederhana dari $3(2x - 1) + 4$ adalah ...',
    options: [
      { letter: 'A', text: '$6x + 1$' },
      { letter: 'B', text: '$6x - 1$' },
      { letter: 'C', text: '$6x + 7$' },
      { letter: 'D', text: '$2x + 1$' },
    ],
    answer: 'A',
    explanation: 'Kalikan 3 ke dalam kurung: $6x - 3 + 4 = 6x + 1$.',
    stimulusId: null,
  },
  {
    id: 'q3',
    type: 'CERITA',
    prompt:
      'Ani membeli 2 buku dan 1 pensil. Harga satu buku adalah $x$ rupiah dan harga pensil Rp3.000. Total pembayaran Ani adalah Rp11.000, sehingga berlaku $2x + 3000 = 11000$. Tentukan harga satu buku.\n\nHarga satu buku yang benar adalah:',
    options: [
      { letter: 'A', text: '$x = 3.000$' },
      { letter: 'B', text: '$x = 4.000$' },
      { letter: 'C', text: '$x = 5.000$' },
      { letter: 'D', text: '$x = 7.000$' },
    ],
    answer: 'B',
    explanation: 'Kurangi 11.000 dengan 3.000, sehingga $2x = 8000$. Bagi dengan 2: $x = 4000$.',
    stimulusId: null,
  },
  {
    id: 'q4',
    type: 'CERITA',
    prompt: 'Persamaan yang sesuai dengan data pada teks adalah ...',
    options: [
      { letter: 'A', text: '$4x + 6000 = 26000$' },
      { letter: 'B', text: '$4x + 3000 = 26000$' },
      { letter: 'C', text: '$6x + 3000 = 26000$' },
      { letter: 'D', text: '$4x + 2000 = 26000$' },
    ],
    answer: 'A',
    explanation: 'Empat buku tulis menjadi $4x$ dan dua pensil menjadi $2 \\times 3000 = 6000$.',
    stimulusId: 'toko-buku',
  },
  {
    id: 'q5',
    type: 'PG',
    prompt: 'Berdasarkan teks, harga satu buku tulis adalah ...',
    options: [
      { letter: 'A', text: 'Rp4.000' },
      { letter: 'B', text: 'Rp4.500' },
      { letter: 'C', text: 'Rp5.000' },
      { letter: 'D', text: 'Rp6.000' },
    ],
    answer: 'C',
    explanation: 'Dari $4x + 6000 = 26000$ diperoleh $4x = 20000$, sehingga $x = 5000$.',
    stimulusId: 'toko-buku',
  },
  {
    id: 'q6',
    type: 'ISIAN',
    prompt: 'Berapa nilai $x$ dari persamaan $2x = 8000$? Tulis angkanya saja.',
    acceptedAnswers: ['4000', 'x = 4000', 'x=4000'],
    explanation: 'Bagi kedua ruas dengan 2: $x = 4000$.',
    stimulusId: null,
  },
  {
    id: 'q7',
    type: 'ISIAN',
    prompt: 'Jika harga satu buku tulis Rp5.000, berapa rupiah harga 2 buku tulis? Tulis angkanya saja.',
    acceptedAnswers: ['10000', 'Rp10.000'],
    explanation: 'Harga dua buku adalah $2 \\times 5000 = 10000$ rupiah.',
    stimulusId: null,
  },
  {
    id: 'q8',
    type: 'ESAI',
    prompt: 'Jelaskan langkah pertama untuk menyelesaikan persamaan $2x + 3000 = 11000$ dan bagaimana kamu memeriksa hasilnya.',
    rubric: [
      { point: 'Memindahkan konstanta ke ruas kanan', keywords: ['kurangi', 'pindahkan'], weight: 40 },
      { point: 'Membagi dengan koefisien x', keywords: ['bagi'], weight: 30 },
      { point: 'Memeriksa hasil dengan substitusi', keywords: ['substitusi', 'periksa'], weight: 30 },
    ],
    explanation: 'Kurangi 3000 dari kedua ruas, bagi dengan 2, lalu substitusikan $x = 4000$ untuk memeriksa hasilnya.',
    stimulusId: null,
  },
  {
    id: 'q9',
    type: 'ESAI',
    prompt: 'Apa perbedaan sel hewan dan sel tumbuhan? Sebutkan satu contoh bagian yang hanya dimiliki sel tumbuhan.',
    rubric: [
      { point: 'Menyebut dinding sel', keywords: ['dinding sel'], weight: 40 },
      { point: 'Menyebut kloroplas', keywords: ['kloroplas'], weight: 40 },
      { point: 'Memberi contoh', keywords: ['contoh', 'misalnya'], weight: 20 },
    ],
    explanation: 'Sel tumbuhan memiliki dinding sel dan kloroplas, yang tidak dimiliki sel hewan.',
    stimulusId: null,
  },
  {
    id: 'q10',
    type: 'PG',
    prompt: 'Hasil dari $2 + 3 \\times 4$ adalah ...',
    options: [
      { letter: 'A', text: '14' },
      { letter: 'B', text: '20' },
      { letter: 'C', text: '10' },
      { letter: 'D', text: '24' },
    ],
    answer: 'A',
    explanation: 'Kerjakan perkalian lebih dulu: $3 \\times 4 = 12$, lalu $2 + 12 = 14$.',
    stimulusId: null,
  },
]

// Which questions each style draws from, in order.
const STYLE_POOL: Record<QuizStyle, string[]> = {
  Campuran: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'],
  'Pilihan ganda saja': ['q1', 'q2', 'q5', 'q10'],
  'Banyak cerita': ['q3', 'q4', 'q5', 'q8', 'q9'],
}

// Builds a quiz with the requested number of questions. Larger quizzes repeat the pool with new ids.
export function buildQuestions(settings: QuizSettings): QuizQuestion[] {
  const pool = STYLE_POOL[settings.style].map((id) => BANK.find((item) => item.id === id)).filter(
    (item): item is QuizQuestion => item !== undefined,
  )
  return Array.from({ length: settings.count }, (_, index) => {
    const base = pool[index % pool.length]
    const round = Math.floor(index / pool.length)
    const copy = structuredClone(base)
    copy.id = round === 0 ? base.id : `${base.id}-${round + 1}`
    return copy
  })
}

export async function fetchQuiz(quizId: string, settings: QuizSettings = { count: 5, level: 'Sedang', style: 'Campuran' }): Promise<Quiz> {
  const graph = await fetchTopicGraph()
  const topic = graph.topics.find((item) => item.id === quizId)
  return {
    id: quizId,
    subject: 'Matematika',
    topicName: topic?.name ?? 'Latihan umum',
    level: settings.level,
    style: settings.style,
    stimuli: [STIMULUS],
    questions: buildQuestions(settings),
  }
}
