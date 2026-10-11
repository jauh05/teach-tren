import { ai } from '../ai/index.js'
import { materiBulatSystemPrompt } from '../ai/prompts.js'
import { materiBulatSchema, type MateriBulat } from '../ai/schemas.js'

// Output for AI_MODE=mock: a short part that names the topic and its position.
export function mockMateriBulat(topicName: string, position: number): MateriBulat {
  return {
    judul: `Bagian ${position}: ${topicName}`.slice(0, 80),
    isi: `Ini bagian ${position} tentang ${topicName}. Isi materi yang sebenarnya dibuat AI saat AI_MODE=live.`,
  }
}

interface MateriInput {
  topicName: string
  position: number
  // Titles of the parts already written, so the next part does not repeat them.
  previousTitles: string[]
}

// One part of the study material of a topic.
export async function generateMateriBulat(input: MateriInput): Promise<MateriBulat> {
  return ai.complete({
    task: 'MATERI_BULAT',
    system: materiBulatSystemPrompt(
      JSON.stringify({ bulat: input.topicName, bagianKe: input.position, judulSebelumnya: input.previousTitles }),
    ),
    user: `Tulis bagian ${input.position} materi tentang ${input.topicName}.`,
    schema: materiBulatSchema,
    mock: () => JSON.stringify(mockMateriBulat(input.topicName, input.position)),
  })
}
