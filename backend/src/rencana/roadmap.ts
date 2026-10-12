import { normalizeTopicName } from '../topics/names.js'

// Layout of the roadmap on the Learning canvas. Each subject starts a new band of rows. Inside a band, the branches (cabang)
// fill rows of COLUMNS, and every other row runs the other way, so the path winds across the canvas instead of running in one
// direction. Items in neighboring rows of the same column are linked too (suggested, shown dashed), so the roadmap is
// connected in two directions. Three columns keep the roadmap inside a phone-width canvas.
export const COLUMNS = 3
export const COLUMN_GAP = 110
export const ROW_GAP = 100
// Odd columns sit a little lower, so the layout does not look like a plain table.
const STAGGER = 26

export interface RoadmapTopicInput {
  subject: string
  name: string
}

export interface RoadmapTopic {
  id: string
  name: string
  subject: string
  x: number
  y: number
}

export interface RoadmapLink {
  sourceId: string
  targetId: string
  // Links between neighbors that are not on the path. They are shown dashed on the canvas.
  suggested: boolean
}

interface BuildRoadmapInput {
  // Subjects in the order the user chose them. Each one starts a new band of rows.
  subjects: string[]
  topics: RoadmapTopicInput[]
  // Names of the topics the account already has.
  existingNames: string[]
  // Center of the roadmap on the canvas.
  anchor: { x: number; y: number }
  // Highest allowed top of the roadmap, so it starts below the account's existing topics. Null on an empty canvas.
  minTop: number | null
  newId: () => string
}

// Builds the roadmap of a learning plan. A topic whose name the account already has is skipped, because topic names are unique
// (docs/role.md 6.2). Names are compared without case and spacing.
export function buildRoadmap(input: BuildRoadmapInput): { topics: RoadmapTopic[]; links: RoadmapLink[] } {
  const takenNames = new Set(input.existingNames.map(normalizeTopicName))
  const groups = input.subjects
    .map((subject) => {
      const names: string[] = []
      for (const item of input.topics) {
        if (item.subject !== subject) {
          continue
        }
        const key = normalizeTopicName(item.name)
        if (takenNames.has(key)) {
          continue
        }
        takenNames.add(key)
        names.push(item.name)
      }
      return { subject, names }
    })
    .filter((group) => group.names.length > 0)

  const totalRows = groups.reduce((sum, group) => sum + Math.ceil(group.names.length / COLUMNS), 0)
  const top = input.minTop ?? input.anchor.y - ((totalRows - 1) * ROW_GAP) / 2

  const topics: RoadmapTopic[] = []
  const links: RoadmapLink[] = []
  // A pair of items is linked once. At the end of a row, the path and the neighbor above can be the same pair.
  const linked = new Set<string>()
  const addLink = (sourceId: string, targetId: string, suggested: boolean) => {
    const key = `${sourceId}>${targetId}`
    if (linked.has(key)) {
      return
    }
    linked.add(key)
    links.push({ sourceId, targetId, suggested })
  }
  let lastOfPrevious: RoadmapTopic | null = null
  let rowStart = 0

  for (const group of groups) {
    // Every item with its row and column in the band, so neighbors can be found.
    const band: { topic: RoadmapTopic; row: number; column: number }[] = []

    group.names.forEach((name, index) => {
      const row = Math.floor(index / COLUMNS)
      const position = index % COLUMNS
      // Rows alternate direction, so the path turns at the end of each row.
      const column = row % 2 === 1 ? COLUMNS - 1 - position : position
      const topic: RoadmapTopic = {
        id: input.newId(),
        name,
        subject: group.subject,
        x: input.anchor.x + (column - (COLUMNS - 1) / 2) * COLUMN_GAP,
        y: top + (rowStart + row) * ROW_GAP + (column % 2 === 1 ? STAGGER : 0),
      }
      topics.push(topic)
      band.push({ topic, row, column })
    })

    // The path: each item links to the next one in the band.
    for (let index = 1; index < band.length; index += 1) {
      addLink(band[index - 1].topic.id, band[index].topic.id, false)
    }
    // Neighbors above: the same column in the row before. These links are suggested, shown dashed.
    for (const item of band) {
      const above = band.find((candidate) => candidate.row === item.row - 1 && candidate.column === item.column)
      if (above) {
        addLink(above.topic.id, item.topic.id, true)
      }
    }
    // The path continues from the previous subject into this one.
    if (lastOfPrevious && band[0]) {
      addLink(lastOfPrevious.id, band[0].topic.id, false)
    }

    lastOfPrevious = band[band.length - 1]?.topic ?? lastOfPrevious
    rowStart += Math.ceil(group.names.length / COLUMNS)
  }

  return { topics, links }
}
