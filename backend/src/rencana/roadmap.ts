import { normalizeTopicName } from '../topics/names.js'

// Layout of the roadmap on the Learning canvas: one lane per subject, topics in the order chosen. Each lane is centered
// on the canvas center, so the roadmap is in view when the canvas opens.
export const LANE_GAP = 150
const TOPIC_GAP = 130

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
}

interface BuildRoadmapInput {
  // Subjects in the order the user chose them. Each one becomes a lane.
  subjects: string[]
  topics: RoadmapTopicInput[]
  // Names of the topics the account already has.
  existingNames: string[]
  // Y position of the first lane.
  startY: number
  // X position the lanes are centered on.
  centerX: number
  newId: () => string
}

// Builds the roadmap of a learning plan. Each topic links to the next one in its lane, so the lane reads as a path.
// A topic whose name the account already has is skipped, because topic names are unique (docs/role.md 6.2).
export function buildRoadmap(input: BuildRoadmapInput): { topics: RoadmapTopic[]; links: RoadmapLink[] } {
  const takenNames = new Set(input.existingNames.map(normalizeTopicName))
  const topics: RoadmapTopic[] = []
  const links: RoadmapLink[] = []

  input.subjects.forEach((subject, lane) => {
    // Materials of this subject that the account does not have yet, in the order the user picked them.
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

    const y = input.startY + lane * LANE_GAP
    const firstX = input.centerX - ((names.length - 1) * TOPIC_GAP) / 2
    let previous: RoadmapTopic | null = null
    names.forEach((name, column) => {
      const topic: RoadmapTopic = { id: input.newId(), name, subject, x: firstX + column * TOPIC_GAP, y }
      topics.push(topic)
      if (previous) {
        links.push({ sourceId: previous.id, targetId: topic.id })
      }
      previous = topic
    })
  })

  return { topics, links }
}
