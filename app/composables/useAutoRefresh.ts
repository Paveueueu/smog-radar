import type { Ref } from 'vue'
import type { AirReport } from '#shared/types/air'

/** Same TTL as the server cache. */
export const STALE_AFTER_MS = 20 * 60_000

export const isStale = (fetchedAt: string, now = Date.now()) => now - Date.parse(fetchedAt) > STALE_AFTER_MS

/** Refetches stale data when the tab becomes visible and every few minutes while it is. */
export function useAutoRefresh(report: Ref<AirReport | undefined | null>, refresh: () => Promise<void>) {
  const visibility = useDocumentVisibility()

  function check() {
    if (visibility.value !== 'visible' || !report.value) return
    if (isStale(report.value.fetchedAt)) refresh()
  }

  watch(visibility, check)
  useIntervalFn(check, 5 * 60_000)
}
