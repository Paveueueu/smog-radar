/*
 * Hours are always shown in the location's time zone (not the visitor's),
 * 24-hour clock, with "tomorrow" when the hour is on the next local day.
 */

const dayKey = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).format(new Date(iso))

export function formatClock(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(new Date(iso))
}

/** Whole local days between two instants: 0 = same day, 1 = the next day. */
export function dayOffset(iso: string, reference: string, timeZone: string): number {
  const a = Date.parse(`${dayKey(iso, timeZone)}T00:00:00Z`)
  const b = Date.parse(`${dayKey(reference, timeZone)}T00:00:00Z`)
  return Math.round((a - b) / 86_400_000)
}

/** "17:00", "tomorrow 13:00", or "Sat 13:00" further out. Relative to `reference` (usually the current hour). */
export function formatHour(iso: string, reference: string, timeZone: string): string {
  const clock = formatClock(iso, timeZone)
  const offset = dayOffset(iso, reference, timeZone)
  if (offset === 0) return clock
  if (offset === 1) return `tomorrow ${clock}`
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone }).format(new Date(iso))
  return `${weekday} ${clock}`
}

/** "17:00–19:00" or "tomorrow 13:00–15:00"; the day is named once, from the start. */
export function formatRange(start: string, end: string, reference: string, timeZone: string): string {
  return `${formatHour(start, reference, timeZone)}–${formatClock(end, timeZone)}`
}
