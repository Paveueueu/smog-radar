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

interface Copy {
  headline: string
  advice: string
}

const COPY: Record<Activity, Record<Level, Record<Profile, Copy>>> = {
  walk: {
    good: {
      general: { headline: 'Yes, go for a walk', advice: 'Enjoy your usual outdoor activities.' },
      sensitive: { headline: 'Yes, go for a walk', advice: 'Fine for outdoor activities, even if you are sensitive to air pollution.' },
    },
    caution: {
      general: { headline: 'Take it easy', advice: 'A walk is fine. Cut down on intense exercise outside, especially if your eyes or throat get irritated.' },
      sensitive: { headline: 'Take it easy', advice: 'Keep it to a gentle walk and skip strenuous exercise outside.' },
    },
    bad: {
      general: { headline: 'Not now', advice: 'Limit time outside and avoid exercising outdoors.' },
      sensitive: { headline: 'Not now', advice: 'Stay in if you can and avoid physical activity outdoors.' },
    },
  },
  windows: {
    good: {
      general: { headline: 'Open the windows', advice: 'The air outside is clean enough to ventilate freely.' },
      sensitive: { headline: 'Open the windows', advice: 'The air outside is clean enough to ventilate freely.' },
    },
    caution: {
      general: { headline: 'Short airing only', advice: 'Air out for 5–10 minutes, then close the windows.' },
      sensitive: { headline: 'Short airing only', advice: 'Air out briefly, then close the windows.' },
    },
    bad: {
      general: { headline: 'Keep them closed', advice: 'Ventilate when the air improves.' },
      sensitive: { headline: 'Keep them closed', advice: 'Ventilate when the air improves.' },
    },
  },
}

const ACTIVITY_HOURS: Record<Activity, number> = { walk: 1, windows: 1 }

export interface ActivityVerdict extends Copy {
  activity: Activity
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

const NO_DATA: Copy = { headline: 'No data right now', advice: 'The air quality model has no value for this hour.' }

function activityVerdict(activity: Activity, profile: Profile, report: AirReport): ActivityVerdict {
  const aqi = report.current.aqi
  if (aqi === null) return { activity, level: null, ...NO_DATA, betterAt: null }

  const level = levelFor(activity, profile, aqi)
  const betterAt = level === 'good'
    ? null
    : nextWindowBelow(report.hourly, THRESHOLDS[activity][profile].caution, {
        hours: ACTIVITY_HOURS[activity],
        timeZone: report.location.timezone,
        daytime: DAYTIME,
      })

  return { activity, level, ...COPY[activity][level][profile], betterAt }
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
