// Rules of the learning-plan wizard, kept apart from the screens so they can be tested on their own.
// The backend checks the same rules again (backend/src/rencana/plan.ts), so these rules only guide the user.

export type LevelId = 'sd' | 'smp' | 'sma' | 'kuliah'

export interface CurriculumSubject {
  name: string
  topics: string[]
}

export interface CurriculumLevel {
  id: LevelId
  label: string
  gradeUnit: 'Kelas' | 'Semester'
  grades: number[]
  subjects: CurriculumSubject[]
}

export interface PlanTopic {
  subject: string
  name: string
}

// What the user has picked so far. Nothing is saved until the last step.
export interface PlanDraft {
  levelId: LevelId | null
  grade: number | null
  subjects: string[]
  topics: PlanTopic[]
}

export interface PlanPayload {
  levelId: LevelId
  grade: number
  subjects: string[]
  topics: PlanTopic[]
}

export type WizardStep = 'kelas' | 'mapel' | 'materi'

export const WIZARD_STEPS: WizardStep[] = ['kelas', 'mapel', 'materi']
export const MAX_SUBJECTS = 6

export const EMPTY_DRAFT: PlanDraft = { levelId: null, grade: null, subjects: [], topics: [] }

// Subjects belong to one level, so a different level starts the choice again.
export function chooseLevel(draft: PlanDraft, levelId: LevelId): PlanDraft {
  if (draft.levelId === levelId) {
    return draft
  }
  return { levelId, grade: null, subjects: [], topics: [] }
}

export function chooseGrade(draft: PlanDraft, grade: number): PlanDraft {
  return { ...draft, grade }
}

// Deselecting a subject also drops its materials. A subject can be picked up to MAX_SUBJECTS times.
export function toggleSubject(draft: PlanDraft, name: string): PlanDraft {
  if (draft.subjects.includes(name)) {
    return {
      ...draft,
      subjects: draft.subjects.filter((subject) => subject !== name),
      topics: draft.topics.filter((topic) => topic.subject !== name),
    }
  }
  if (draft.subjects.length >= MAX_SUBJECTS) {
    return draft
  }
  return { ...draft, subjects: [...draft.subjects, name] }
}

export function isTopicSelected(draft: PlanDraft, subject: string, name: string): boolean {
  return draft.topics.some((topic) => topic.subject === subject && topic.name === name)
}

export function toggleTopic(draft: PlanDraft, subject: string, name: string): PlanDraft {
  if (isTopicSelected(draft, subject, name)) {
    return { ...draft, topics: draft.topics.filter((topic) => !(topic.subject === subject && topic.name === name)) }
  }
  return { ...draft, topics: [...draft.topics, { subject, name }] }
}

export function canContinue(step: WizardStep, draft: PlanDraft): boolean {
  if (step === 'kelas') {
    return draft.levelId !== null && draft.grade !== null
  }
  if (step === 'mapel') {
    return draft.subjects.length > 0
  }
  // Materials are optional, so the last step can always be saved.
  return true
}

export function stepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step)
}

export function nextStep(step: WizardStep): WizardStep | null {
  return WIZARD_STEPS[stepIndex(step) + 1] ?? null
}

export function previousStep(step: WizardStep): WizardStep | null {
  return WIZARD_STEPS[stepIndex(step) - 1] ?? null
}

// The body sent to the server. Materials follow the order of the curriculum, so each lane reads from the start of the subject.
// Returns null while the level or grade is still missing.
export function buildPayload(draft: PlanDraft, level: CurriculumLevel | undefined): PlanPayload | null {
  if (!draft.levelId || draft.grade === null || !level) {
    return null
  }
  const topics = draft.topics
    .map((topic) => {
      const subject = level.subjects.find((item) => item.name === topic.subject)
      return { topic, order: subject ? subject.topics.indexOf(topic.name) : -1 }
    })
    .sort((a, b) => a.topic.subject.localeCompare(b.topic.subject) || a.order - b.order)
    .map(({ topic }) => topic)
  return { levelId: draft.levelId, grade: draft.grade, subjects: draft.subjects, topics }
}
