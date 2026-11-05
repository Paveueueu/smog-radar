import type { AirSample } from '#shared/types/air'

/** Hour of day (0–23) of an ISO timestamp in a time zone. */
export function localHour(iso: string, timeZone: string): number {
  const hour = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(new Date(iso))
  return Number(hour)
}

export interface TimeWindow {
  /** start of the first hour, ISO UTC */
  start: string
  /** end of the last hour, ISO UTC */
  end: string
  hours: number
  meanAqi: number
  maxAqi: number
  startIndex: number
}

export interface WindowOptions {
  hours: number
  timeZone: string
  /** only consider windows that sit inside these local hours, [from, to) */
  daytime?: readonly [number, number]
}

export const DAYTIME: readonly [number, number] = [7, 22]

const HOUR_MS = 3_600_000

/** Every complete window of `hours` consecutive samples with data, inside daytime. */
function* candidateWindows(hourly: readonly AirSample[], { hours, timeZone, daytime }: WindowOptions) {
  for (let i = 0; i + hours <= hourly.length; i++) {
    const slice = hourly.slice(i, i + hours)
    const values = slice.map(s => s.aqi)
    if (values.some(v => v === null)) continue
    if (daytime) {
      const inside = slice.every((s) => {
        const h = localHour(s.time, timeZone)
        return h >= daytime[0] && h < daytime[1]
      })
      if (!inside) continue
    }
    const aqi = values as number[]
    yield {
      start: slice[0]!.time,
      end: new Date(Date.parse(slice.at(-1)!.time) + HOUR_MS).toISOString(),
      hours,
      meanAqi: aqi.reduce((a, b) => a + b, 0) / hours,
      maxAqi: Math.max(...aqi),
      startIndex: i,
    } satisfies TimeWindow
  }
}

/** The window with the lowest mean AQI; the earliest one wins a tie. */
export function cleanestWindow(hourly: readonly AirSample[], options: WindowOptions): TimeWindow | null {
  let best: TimeWindow | null = null
  for (const w of candidateWindows(hourly, options)) {
    if (!best || w.meanAqi < best.meanAqi) best = w
  }
  return best
}

/** The earliest window in which every hour is below `below`. */
export function nextWindowBelow(hourly: readonly AirSample[], below: number, options: WindowOptions): TimeWindow | null {
  for (const w of candidateWindows(hourly, options)) {
    if (w.maxAqi < below) return w
  }
  return null
}
