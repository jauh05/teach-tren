import { describe, expect, it } from 'vitest'
import { tabForPath } from './navigation'

describe('tabForPath', () => {
  it.each([
    ['/learning', 'learning'],
    ['/jadwal', 'jadwal'],
    ['/jadwal/ingatan', 'jadwal'],
    ['/chat', 'chat'],
    ['/c/persamaan-linear', 'chat'],
    ['/kuis/persamaan-linear-1', 'chat'],
    ['/pengaturan', 'pengaturan'],
    ['/tentang', 'tentang'],
    ['/materi', null],
    ['/masuk', null],
  ])('%s memberi tab %s', (path, expected) => {
    expect(tabForPath(path)).toBe(expected)
  })
})
