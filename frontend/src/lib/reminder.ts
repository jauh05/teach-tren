// Asks the browser for permission to show reminders. Returns "unsupported" when the browser has no notifications.
export async function requestReminderPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }
  return Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission
}
