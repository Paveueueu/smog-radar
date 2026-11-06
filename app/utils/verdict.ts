// Thresholds and their sources: docs/methodology.md.
import type { AirReport, Pollutant } from '#shared/types/air'
import { aqiBand, type AqiBandInfo } from './aqi'
import { cleanestWindow, DAYTIME, nextWindowBelow, type TimeWindow } from './forecast'
import { dominantPollutant } from './pollutants'

export type Activity = 'walk' | 'windows'
export type Profile = 'general' | 'sensitive'
export type Level = 'good' | 'caution' | 'bad'

/** AQI where each activity turns "caution" and "bad". Walk: EEA advice; windows: our own rule. */
export const THRESHOLDS: Record<Activity, Record<Profile, { caution: number, bad: number }>> = {
  walk: {
    general: { caution: 60, bad: 80 }, // poor → cut intense exercise; very poor → limit time outside
    sensitive: { caution: 40, bad: 60 }, // moderate → cut intense exercise; poor → limit time outside
  },
  windows: {
    general: { caution: 40, bad: 80 },
    sensitive: { caution: 20, bad: 60 },
  },
}

export function levelFor(activity: Activity, profile: Profile, aqi: number): Level {
  const t = THRESHOLDS[activity][profile]
  if (aqi >= t.bad) return 'bad'
  if (aqi >= t.caution) return 'caution'
  return 'good'
}

const ACTIVITY_HOURS: Record<Activity, number> = { walk: 1, windows: 1 }

export interface ActivityVerdict {
  activity: Activity
  profile: Profile
  /** null when there is no AQI value for the current hour */
  level: Level | null
  /** Next daytime hour that would be good; null if none in the forecast. */
  betterAt: TimeWindow | null
}

export interface Assessment {
  aqi: number | null
  band: AqiBandInfo | null
  dominant: Pollutant | null
  walk: ActivityVerdict
  windows: ActivityVerdict
  /** cleanest daytime stretch in the forecast, for highlighting on the timeline */
  cleanest: TimeWindow | null
}

export const CLEANEST_HOURS = 2

function activityVerdict(activity: Activity, profile: Profile, report: AirReport): ActivityVerdict {
  const aqi = report.current.aqi
  if (aqi === null) return { activity, profile, level: null, betterAt: null }

  const level = levelFor(activity, profile, aqi)
  const betterAt = level === 'good'
    ? null
    : nextWindowBelow(report.hourly, THRESHOLDS[activity][profile].caution, {
        hours: ACTIVITY_HOURS[activity],
        timeZone: report.location.timezone,
        daytime: DAYTIME,
      })

  return { activity, profile, level, betterAt }
}

export function assess(report: AirReport, profile: Profile): Assessment {
  const aqi = report.current.aqi
  return {
    aqi,
    band: aqi === null ? null : aqiBand(aqi),
    dominant: dominantPollutant(report.current),
    walk: activityVerdict('walk', profile, report),
    windows: activityVerdict('windows', profile, report),
    cleanest: cleanestWindow(report.hourly, {
      hours: CLEANEST_HOURS,
      timeZone: report.location.timezone,
      daytime: DAYTIME,
    }),
  }
}
