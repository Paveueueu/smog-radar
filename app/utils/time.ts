// Hours are shown in the location's time zone, 24-hour clock.

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

export function formatWeekday(iso: string, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone }).format(new Date(iso))
}

export interface HourDescription {
  clock: string
  /** local days after the reference: 0 today, 1 tomorrow, … */
  offset: number
  weekday: string
}

export function describeHour(iso: string, reference: string, timeZone: string, locale: string): HourDescription {
  return {
    clock: formatClock(iso, timeZone),
    offset: dayOffset(iso, reference, timeZone),
    weekday: formatWeekday(iso, timeZone, locale),
  }
}
