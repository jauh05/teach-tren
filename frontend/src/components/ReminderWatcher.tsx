import { useEffect } from 'react'
import { usePreferencesStore } from '../stores/preferencesStore'

const SHOWN_KEY = 'teach-tren-pengingat-tanggal'
const CHECK_EVERY_MS = 30_000

function shownToday(today: string): boolean {
  try {
    return localStorage.getItem(SHOWN_KEY) === today
  } catch {
    return false
  }
}

function rememberShown(today: string): void {
  try {
    localStorage.setItem(SHOWN_KEY, today)
  } catch {
    // Storage can be blocked. The reminder may then repeat within the same minute.
  }
}

// Shows the daily study reminder while the app is open. There is no push server yet, so a closed browser shows nothing.
export function ReminderWatcher() {
  useEffect(() => {
    function check() {
      const { reminderEnabled, reminderTime } = usePreferencesStore.getState()
      if (!reminderEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return
      }
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const today = now.toDateString()
      if (time !== reminderTime || shownToday(today)) {
        return
      }
      new Notification('Teach Tren', { body: 'Saatnya belajar. Lihat jadwal hari ini.' })
      rememberShown(today)
    }
    const timer = window.setInterval(check, CHECK_EVERY_MS)
    return () => window.clearInterval(timer)
  }, [])
  return null
}
