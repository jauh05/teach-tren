import { ai } from '../ai/index.js'
import { polaSuggestionSystemPrompt } from '../ai/prompts.js'
import { polaSuggestionsSchema, type PolaSuggestions } from '../ai/schemas.js'
import { normalizeTopicName } from './names.js'

// Output for AI_MODE=mock: three follow-up patterns built from the name of the pattern.
export function mockPolaSuggestions(name: string): PolaSuggestions {
  return {
    saran: [
      { nama: `Penerapan ${name}`.slice(0, 60), alasan: `Menerapkan ${name} pada soal cerita.` },
      { nama: `Latihan ${name}`.slice(0, 60), alasan: `Latihan soal ${name} dari yang mudah ke yang sulit.` },
      { nama: `Lanjutan ${name}`.slice(0, 60), alasan: `Materi lanjutan yang memakai ${name} sebagai dasar.` },
    ],
  }
}

interface SuggestInput {
  name: string
  // Names of all patterns of the account. Suggestions with these names are dropped.
  existingNames: string[]
  // Names of the patterns the account has finished (score 80 or more).
  completedNames: string[]
}

// Patterns that follow the given one. The AI output is checked against the schema before it is used.
export async function suggestPatterns(input: SuggestInput): Promise<PolaSuggestions['saran']> {
  const result = await ai.complete({
    task: 'POLA_SARAN',
    system: polaSuggestionSystemPrompt(
      JSON.stringify({ polaUtama: input.name, polaYangSudahAda: input.existingNames, polaYangSudahDikuasai: input.completedNames }),
    ),
    user: `Usulkan pola belajar berikutnya setelah ${input.name}.`,
    schema: polaSuggestionsSchema,
    mock: () => JSON.stringify(mockPolaSuggestions(input.name)),
  })
  const taken = new Set(input.existingNames.map(normalizeTopicName))
  return result.saran.filter((item) => !taken.has(normalizeTopicName(item.nama)))
}
