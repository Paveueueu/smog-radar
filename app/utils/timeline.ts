import type { AirReport } from '#shared/types/air'
import { aqiBand, type AqiBand } from './aqi'
import { DAYTIME, localHour, type TimeWindow } from './forecast'
import { dayOffset, formatClock } from './time'

export interface TimelineColumn {
  time: string
  /** "15" — hour of day for the axis */
  hour: string
  clock: string
  aqi: number | null
  band: AqiBand | null
  /** bar height as a share of the chart, 0–1 */
  height: number
  /** the value is above the top of the scale */
  clipped: boolean
  isNow: boolean
  isNight: boolean
  /** first hour of a new local day: "Fri" */
  dayLabel: string | null
  inCleanest: boolean
}

export interface Timeline {
  columns: TimelineColumn[]
  max: number
  /** horizontal guide lines, bottom to top, excluding 0 */
  gridlines: number[]
}

/** The scale always shows at least up to "poor", and never more than this. */
const MIN_TOP = 60
const MAX_TOP = 120
const STEP = 20

export function buildTimeline(report: AirReport, cleanest: TimeWindow | null): Timeline {
  const tz = report.location.timezone
  const values = report.hourly.map(s => s.aqi).filter((v): v is number => v !== null)
  const peak = values.length ? Math.max(...values) : 0
  const max = Math.min(MAX_TOP, Math.max(MIN_TOP, Math.ceil(peak / STEP) * STEP))

  const gridlines: number[] = []
  for (let v = STEP; v <= max; v += STEP) gridlines.push(v)

  const now = report.current.time
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: tz })

  const columns = report.hourly.map((s, i): TimelineColumn => {
    const h = localHour(s.time, tz)
    const prev = report.hourly[i - 1]
    const newDay = prev !== undefined && dayOffset(s.time, prev.time, tz) !== 0
    return {
      time: s.time,
      hour: String(h).padStart(2, '0'),
      clock: formatClock(s.time, tz),
      aqi: s.aqi,
      band: s.aqi === null ? null : aqiBand(s.aqi).id,
      height: s.aqi === null ? 0 : Math.min(s.aqi, max) / max,
      clipped: s.aqi !== null && s.aqi > max,
      isNow: s.time === now,
      isNight: h < DAYTIME[0] || h >= DAYTIME[1],
      dayLabel: newDay ? weekday.format(new Date(s.time)) : null,
      inCleanest: cleanest !== null && i >= cleanest.startIndex && i < cleanest.startIndex + cleanest.hours,
    }
  })

  return { columns, max, gridlines }
}
