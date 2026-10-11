// Answers used when AI_MODE=mock. They pass the same validation as live answers.

// Chat answer for AI_MODE=mock. It includes a list and LaTeX, so streaming and math rendering can be checked.
export function mockChatAnswer(question: string): string {
  return [
    'Ini jawaban contoh dari tampilan frontend. Jawaban asli akan dibuat oleh AI saat AI_MODE=live.',
    '',
    `Untuk pertanyaan "${question}", inti jawabannya adalah langkah berurutan:`,
    '',
    '1. Tulis data yang diketahui.',
    '2. Gunakan rumus yang sesuai, misalnya $v = \\frac{s}{t}$.',
    '3. Hitung dan periksa satuannya.',
    '',
    '$$v = \\frac{s}{t} = \\frac{120\\ \\text{m}}{4\\ \\text{s}} = 30\\ \\text{m/s}$$',
  ].join('\n')
}
