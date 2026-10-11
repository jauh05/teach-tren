import { ai } from '../ai/index.js'
import { polaSuggestionSystemPrompt } from '../ai/prompts.js'
import { polaSuggestionsSchema, type PolaSuggestions } from '../ai/schemas.js'
import { normalizeTopicName } from './names.js'

// Output for AI_MODE=mock: three follow-up patterns built from the label of the request.
export function mockPolaSuggestions(label: string): PolaSuggestions {
  return {
    saran: [
      { nama: `Penerapan ${label}`.slice(0, 60), alasan: `Menerapkan ${label} pada soal cerita.` },
      { nama: `Latihan ${label}`.slice(0, 60), alasan: `Latihan soal ${label} dari yang mudah ke yang sulit.` },
      { nama: `Lanjutan ${label}`.slice(0, 60), alasan: `Materi lanjutan yang memakai ${label} sebagai dasar.` },
    ],
  }
}

interface SuggestInput {
  // The pattern the suggestions follow. Optional when only a goal is given.
  name?: string
  // What the user wants to learn, typed in their own words.
  tujuan?: string
  // Names of the patterns the account already has. Suggestions with these names are dropped.
  existingNames: string[]
  // Names of the patterns the account has finished (score 80 or more).
  completedNames: string[]
}

// Patterns that could come next. The AI output is checked against the schema before it is used.
export async function suggestPatterns(input: SuggestInput): Promise<PolaSuggestions['saran']> {
  const label = input.name ?? input.tujuan ?? 'pola ini'
  const result = await ai.complete({
    task: 'POLA_SARAN',
    system: polaSuggestionSystemPrompt(
      JSON.stringify({
        polaUtama: input.name ?? null,
        tujuan: input.tujuan ?? null,
        polaYangSudahAda: input.existingNames,
        polaYangSudahDikuasai: input.completedNames,
      }),
    ),
    user: input.tujuan ? `Usulkan pola belajar untuk tujuan: ${input.tujuan}.` : `Usulkan pola belajar berikutnya setelah ${label}.`,
    schema: polaSuggestionsSchema,
    mock: () => JSON.stringify(mockPolaSuggestions(label)),
  })
  const taken = new Set(input.existingNames.map(normalizeTopicName))
  return result.saran.filter((item) => !taken.has(normalizeTopicName(item.nama)))
}
