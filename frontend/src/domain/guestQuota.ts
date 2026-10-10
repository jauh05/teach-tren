// Guest limits (docs/role.md 2.3). The quota is per device, not per account.

export const GUEST_ACTION_LIMIT = 2

// Guests see only this many conversations from the device history.
export const GUEST_HISTORY_LIMIT = 2

export function remainingGuestActions(used: number): number {
  return Math.max(0, GUEST_ACTION_LIMIT - used)
}

export function isGuestLimitReached(used: number): boolean {
  return used >= GUEST_ACTION_LIMIT
}

// Text for the header badge: "sisa 1 dari 2 aksi" or "2 dari 2 aksi terpakai".
export function guestQuotaText(used: number): string {
  if (isGuestLimitReached(used)) {
    return `${GUEST_ACTION_LIMIT} dari ${GUEST_ACTION_LIMIT} aksi terpakai`
  }
  return `sisa ${remainingGuestActions(used)} dari ${GUEST_ACTION_LIMIT} aksi`
}
