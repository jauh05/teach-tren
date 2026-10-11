// Schedule items (JadwalItem in docs/role.md 6.2). Suggestions become normal items once accepted.

export type ScheduleKind = 'LATIHAN' | 'ULANG' | 'BARU' | 'SARAN' | 'ISTIRAHAT' | 'DIKUASAI'

// Display tone of an item. Colors come from the mockup (docs/design/html/05-jadwal-desktop.html).
export type ScheduleTone = 'mastered' | 'learning' | 'review' | 'suggested' | 'rest'

export interface ScheduleItem {
  id: string
  // Calendar date, YYYY-MM-DD.
  date: string
  title: string
  kind: ScheduleKind
  tone: ScheduleTone
  // Short reason shown under the title, for example "Karena skor 38 pada Sel tumbuhan".
  reason: string
}

export function isSuggestion(item: ScheduleItem): boolean {
  return item.kind === 'SARAN'
}

// Accepting a suggestion turns it into a normal practice item on the chosen day.
// Moving a normal item only changes its date.
export function placeItem(item: ScheduleItem, date: string): ScheduleItem {
  if (!isSuggestion(item)) {
    return { ...item, date }
  }
  return { ...item, date, kind: 'LATIHAN', tone: 'learning' }
}
