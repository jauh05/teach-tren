// Placeholder answer until the AI backend exists (docs/role.md section 7).
// It includes a list and LaTeX so that streaming and math rendering can be tested.
export function createMockAnswer(question: string): string {
  return [
    'Ini jawaban contoh dari tampilan frontend. Jawaban asli akan dibuat oleh AI pada tahap backend.',
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
