import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchPreferencesMock, savePreferencesMock } = vi.hoisted(() => ({
  fetchPreferencesMock: vi.fn(),
  savePreferencesMock: vi.fn(),
}))

vi.mock('../api/preferences', () => ({
  fetchPreferences: fetchPreferencesMock,
  savePreferences: savePreferencesMock,
}))

import { DEFAULT_PREFERENCES, hydratePreferences, usePreferencesStore, type Preferences } from './preferencesStore'
import { useSessionStore } from './sessionStore'

describe('hydratePreferences', () => {
  beforeEach(() => {
    fetchPreferencesMock.mockReset()
    savePreferencesMock.mockReset().mockResolvedValue(undefined)
    usePreferencesStore.setState(DEFAULT_PREFERENCES)
    useSessionStore.setState({ mode: 'signedIn' })
  })

  it('memakai pilihan dari server jika tidak ada perubahan di perangkat', async () => {
    fetchPreferencesMock.mockResolvedValue({ ...DEFAULT_PREFERENCES, questionCount: 20 })

    await hydratePreferences()

    expect(usePreferencesStore.getState().questionCount).toBe(20)
  })

  it('tidak menimpa pilihan yang diubah saat data server masih dimuat', async () => {
    let finishLoading: (value: Preferences) => void = () => undefined
    fetchPreferencesMock.mockReturnValue(new Promise<Preferences>((resolve) => (finishLoading = resolve)))

    const loading = hydratePreferences()
    usePreferencesStore.getState().updatePreferences({ questionCount: 20 })
    finishLoading({ ...DEFAULT_PREFERENCES, questionCount: 10 })
    await loading

    expect(usePreferencesStore.getState().questionCount).toBe(20)
  })

  it('tidak mengambil data server untuk tamu', async () => {
    useSessionStore.setState({ mode: 'guest' })

    await hydratePreferences()

    expect(fetchPreferencesMock).not.toHaveBeenCalled()
  })

  it('mempertahankan nilai perangkat saat server tidak bisa dihubungi', async () => {
    usePreferencesStore.getState().updatePreferences({ level: 'Sulit' })
    fetchPreferencesMock.mockRejectedValue(new Error('Jaringan terputus'))

    await hydratePreferences()

    expect(usePreferencesStore.getState().level).toBe('Sulit')
  })
})
