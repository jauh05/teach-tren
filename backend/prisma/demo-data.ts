// Demo conversations for the demo account and for end-to-end tests. Content matches the frontend mock (guest) data.
export interface DemoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface DemoConversation {
  id: string
  title: string
  messages: DemoMessage[]
}

const PERSAMAAN_LINEAR_ANSWER = [
  'Inti jawabannya: pindahkan konstanta ke ruas kanan, lalu bagi dengan koefisien $x$.',
  '',
  'Langkahnya:',
  '',
  '1. Kurangi kedua ruas dengan 3000: $2x + 3000 - 3000 = 11000 - 3000$.',
  '2. Sederhanakan: $2x = 8000$.',
  '3. Bagi kedua ruas dengan 2: $x = \\frac{8000}{2} = 4000$.',
  '',
  'Jadi harga satu buku adalah Rp4.000.',
  '',
  'Untuk memeriksa, substitusikan kembali: $2(4000) + 3000 = 11000$.',
].join('\n')

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: 'persamaan-linear',
    title: 'Persamaan linear',
    messages: [
      { id: 'persamaan-linear-0', role: 'user', content: 'Bagaimana cara menyelesaikan persamaan 2x + 3000 = 11000?' },
      { id: 'persamaan-linear-1', role: 'assistant', content: PERSAMAAN_LINEAR_ANSWER },
    ],
  },
  {
    id: 'sel-tumbuhan',
    title: 'Sel tumbuhan',
    messages: [
      { id: 'sel-tumbuhan-0', role: 'user', content: 'Apa beda sel hewan dan sel tumbuhan?' },
      {
        id: 'sel-tumbuhan-1',
        role: 'assistant',
        content:
          'Sel tumbuhan memiliki dinding sel dan kloroplas, sedangkan sel hewan tidak memilikinya. Keduanya sama-sama memiliki membran sel, sitoplasma, dan inti sel.',
      },
    ],
  },
  {
    id: 'proklamasi-kemerdekaan',
    title: 'Proklamasi kemerdekaan',
    messages: [
      { id: 'proklamasi-kemerdekaan-0', role: 'user', content: 'Kapan proklamasi kemerdekaan Indonesia dibacakan?' },
      {
        id: 'proklamasi-kemerdekaan-1',
        role: 'assistant',
        content: 'Proklamasi kemerdekaan Indonesia dibacakan pada 17 Agustus 1945 di Jalan Pegangsaan Timur 56, Jakarta.',
      },
    ],
  },
  {
    id: 'bangun-datar',
    title: 'Bangun datar',
    messages: [
      { id: 'bangun-datar-0', role: 'user', content: 'Apa rumus luas persegi panjang?' },
      { id: 'bangun-datar-1', role: 'assistant', content: 'Luas persegi panjang adalah $L = p \\times l$, dengan $p$ panjang dan $l$ lebar.' },
    ],
  },
  {
    id: 'hukum-newton',
    title: 'Hukum Newton',
    messages: [
      { id: 'hukum-newton-0', role: 'user', content: 'Apa bunyi hukum Newton kedua?' },
      {
        id: 'hukum-newton-1',
        role: 'assistant',
        content: 'Percepatan benda sebanding dengan gaya total yang bekerja padanya dan berbanding terbalik dengan massanya: $F = m a$.',
      },
    ],
  },
]
