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

// One branch (cabang) of the roadmap: the subject it belongs to and its name.
export interface PlanTopic {
  subject: string
  name: string
}

// The roadmap made for the current choices. Each change to the choices makes it out of date.
export interface DraftRoadmap {
  // "manual" when the user wrote the branches. The others come from the server.
  sumber: 'ai' | 'katalog' | 'manual'
  cabang: PlanTopic[]
}

// What the user has picked so far. Nothing is saved until the last step.
export interface PlanDraft {
  levelId: LevelId | null
  grade: number | null
  subjects: string[]
  roadmap: DraftRoadmap | null
}

export interface PlanPayload {
  levelId: LevelId
  grade: number
  subjects: string[]
  topics: PlanTopic[]
}

export type WizardStep = 'kelas' | 'mapel' | 'roadmap'

export const WIZARD_STEPS: WizardStep[] = ['kelas', 'mapel', 'roadmap']
export const MAX_SUBJECTS = 6
// A roadmap has 6 to 12 branches (cabang), as in the backend.
export const MIN_CABANG = 6
export const MAX_CABANG = 12

export const EMPTY_DRAFT: PlanDraft = { levelId: null, grade: null, subjects: [], roadmap: null }

// Subjects belong to one level, so a different level starts the choice again.
export function chooseLevel(draft: PlanDraft, levelId: LevelId): PlanDraft {
  if (draft.levelId === levelId) {
    return draft
  }
  return { levelId, grade: null, subjects: [], roadmap: null }
}

export function chooseGrade(draft: PlanDraft, grade: number): PlanDraft {
  if (draft.grade === grade) {
    return draft
  }
  return { ...draft, grade, roadmap: null }
}

// A subject can be picked up to MAX_SUBJECTS times. Any change to the subjects makes the roadmap out of date.
export function toggleSubject(draft: PlanDraft, name: string): PlanDraft {
  if (draft.subjects.includes(name)) {
    return { ...draft, subjects: draft.subjects.filter((subject) => subject !== name), roadmap: null }
  }
  if (draft.subjects.length >= MAX_SUBJECTS) {
    return draft
  }
  return { ...draft, subjects: [...draft.subjects, name], roadmap: null }
}

export function setRoadmap(draft: PlanDraft, roadmap: DraftRoadmap): PlanDraft {
  return { ...draft, roadmap }
}

// Between 6 and 12 branches, each with a name, and no two with the same name (without case).
export function hasValidRoadmap(draft: PlanDraft): boolean {
  const cabang = draft.roadmap?.cabang ?? []
  if (cabang.length < MIN_CABANG || cabang.length > MAX_CABANG) {
    return false
  }
  const names = new Set<string>()
  for (const item of cabang) {
    const key = item.name.trim().toLocaleLowerCase('id-ID')
    if (key === '' || names.has(key)) {
      return false
    }
    names.add(key)
  }
  return true
}

// A roadmap the user writes without the AI. It starts empty, and the user adds the branches.
export function startManualRoadmap(draft: PlanDraft): PlanDraft {
  return setRoadmap(draft, { sumber: 'manual', cabang: [] })
}

function editCabang(draft: PlanDraft, change: (cabang: PlanTopic[]) => PlanTopic[]): PlanDraft {
  if (!draft.roadmap) {
    return draft
  }
  return { ...draft, roadmap: { ...draft.roadmap, cabang: change(draft.roadmap.cabang) } }
}

export function renameCabang(draft: PlanDraft, index: number, name: string): PlanDraft {
  return editCabang(draft, (cabang) => cabang.map((item, position) => (position === index ? { ...item, name } : item)))
}

export function removeCabang(draft: PlanDraft, index: number): PlanDraft {
  return editCabang(draft, (cabang) => cabang.filter((_, position) => position !== index))
}

// Adds a branch under one of the chosen subjects. Nothing changes when the subject is not chosen, the name is empty,
// the name is already used, or the roadmap is full.
export function addCabang(draft: PlanDraft, subject: string, name: string): PlanDraft {
  const trimmed = name.trim()
  const cabang = draft.roadmap?.cabang ?? []
  if (!draft.subjects.includes(subject) || trimmed === '' || cabang.length >= MAX_CABANG) {
    return draft
  }
  const key = trimmed.toLocaleLowerCase('id-ID')
  if (cabang.some((item) => item.name.trim().toLocaleLowerCase('id-ID') === key)) {
    return draft
  }
  return editCabang(draft, (current) => [...current, { subject, name: trimmed.slice(0, 60) }])
}

export function canContinue(step: WizardStep, draft: PlanDraft): boolean {
  if (step === 'kelas') {
    return draft.levelId !== null && draft.grade !== null
  }
  if (step === 'mapel') {
    return draft.subjects.length > 0
  }
  return hasValidRoadmap(draft)
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

// The body sent to the server. Returns null while the choices or the roadmap are incomplete.
export function buildPayload(draft: PlanDraft): PlanPayload | null {
  if (!draft.levelId || draft.grade === null || !hasValidRoadmap(draft) || !draft.roadmap) {
    return null
  }
  return { levelId: draft.levelId, grade: draft.grade, subjects: draft.subjects, topics: draft.roadmap.cabang }
}
