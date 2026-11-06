import { POLLUTANTS, type AirSample, type Pollutant } from '#shared/types/air'
import { aqiBand, type AqiBand } from './aqi'

export interface PollutantInfo {
  /** e.g. "PM2.5"; full name in `pollutant.<id>` */
  label: string
  /** WHO 2021 guideline, µg/m³ (24 h mean; 8 h for ozone). Our data is hourly, so the ratio is indicative. */
  guideline: number
  guidelineHours: 24 | 8
}

export const POLLUTANT_INFO: Record<Pollutant, PollutantInfo> = {
  pm2_5: { label: 'PM2.5', guideline: 15, guidelineHours: 24 },
  pm10: { label: 'PM10', guideline: 45, guidelineHours: 24 },
  no2: { label: 'NO₂', guideline: 25, guidelineHours: 24 },
  o3: { label: 'O₃', guideline: 100, guidelineHours: 8 },
}

export function guidelineRatio(pollutant: Pollutant, concentration: number | null): number | null {
  return concentration === null ? null : concentration / POLLUTANT_INFO[pollutant].guideline
}

export interface PollutantRow extends PollutantInfo {
  id: Pollutant
  /** µg/m³ */
  value: number | null
  subIndex: number | null
  band: AqiBand | null
  ratio: number | null
  /** 0–1 of the track; the guideline sits at GUIDELINE_MARK */
  bar: number
  isDominant: boolean
}

/** The track shows up to 3× the guideline. */
export const RATIO_SCALE = 3
export const GUIDELINE_MARK = 1 / RATIO_SCALE

export function pollutantRows(sample: AirSample): PollutantRow[] {
  const dominant = dominantPollutant(sample)
  return POLLUTANTS.map((id) => {
    const value = sample[id]
    const subIndex = sample.subIndex[id]
    const ratio = guidelineRatio(id, value)
    return {
      id,
      ...POLLUTANT_INFO[id],
      value,
      subIndex,
      band: subIndex === null ? null : aqiBand(subIndex).id,
      ratio,
      bar: ratio === null ? 0 : Math.min(ratio, RATIO_SCALE) / RATIO_SCALE,
      isDominant: id === dominant,
    }
  })
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
