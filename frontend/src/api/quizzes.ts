import type { Quiz, QuizQuestion, QuizStimulus } from '../domain/quiz'
import { fetchTopicGraph } from './topics'

// Mock quiz content until the AI backend exists. Question 3 matches the mockup (docs/design/html/04-kuis-soal-desktop.html).
const STIMULUS: QuizStimulus = {
  id: 'toko-buku',
  text: 'Toko Sinar Ilmu menjual buku tulis dan pensil. Harga satu buku tulis adalah $x$ rupiah, sedangkan harga satu pensil adalah Rp3.000. Bu Wati membeli 4 buku tulis dan 2 pensil dengan total Rp26.000. Ia ingin mengetahui harga satu buku tulis dari data pembelian tersebut. Toko itu memberi potongan harga untuk pembelian di atas Rp20.000, tetapi potongan itu tidak dihitung dalam soal ini. Pada hari itu tidak ada promo lain, sehingga semua harga dihitung normal.',
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
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
]

// The topic name comes from the topic graph, so renamed topics show their current name.
export async function fetchQuiz(quizId: string): Promise<Quiz> {
  const graph = await fetchTopicGraph()
  const topic = graph.topics.find((item) => item.id === quizId)
  return {
    id: quizId,
    subject: 'Matematika',
    topicName: topic?.name ?? 'Latihan umum',
    level: 'Sedang',
    style: 'Soal cerita',
    stimuli: [STIMULUS],
    questions: structuredClone(QUESTIONS),
  }
}
