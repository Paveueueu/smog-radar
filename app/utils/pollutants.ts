import { POLLUTANTS, type AirSample, type Pollutant } from '#shared/types/air'

export interface PollutantInfo {
  /** short label, e.g. "PM2.5" */
  label: string
  name: string
  /** WHO 2021 guideline, µg/m³ (24 h mean; 8 h for ozone). Our data is hourly, so the ratio is indicative. */
  guideline: number
  guidelinePeriod: '24-hour' | '8-hour'
}

export const POLLUTANT_INFO: Record<Pollutant, PollutantInfo> = {
  pm2_5: { label: 'PM2.5', name: 'Fine particulate matter', guideline: 15, guidelinePeriod: '24-hour' },
  pm10: { label: 'PM10', name: 'Coarse particulate matter', guideline: 45, guidelinePeriod: '24-hour' },
  no2: { label: 'NO₂', name: 'Nitrogen dioxide', guideline: 25, guidelinePeriod: '24-hour' },
  o3: { label: 'O₃', name: 'Ozone', guideline: 100, guidelinePeriod: '8-hour' },
}

export function guidelineRatio(pollutant: Pollutant, concentration: number | null): number | null {
  return concentration === null ? null : concentration / POLLUTANT_INFO[pollutant].guideline
}

/** Highest sub-index sets the AQI; ties go to the earlier pollutant. */
export function dominantPollutant(sample: AirSample): Pollutant | null {
  let best: Pollutant | null = null
  let bestValue = Number.NEGATIVE_INFINITY
  for (const p of POLLUTANTS) {
    const v = sample.subIndex[p]
    if (v !== null && v > bestValue) {
      best = p
      bestValue = v
    }
  }
  return best
}
