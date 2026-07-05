const LAST_SEEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export function shouldRefreshSessionLastSeen(lastSeenAt: Date | null, now = new Date()) {
  if (!lastSeenAt) return true
  return now.getTime() - lastSeenAt.getTime() >= LAST_SEEN_REFRESH_INTERVAL_MS
}
