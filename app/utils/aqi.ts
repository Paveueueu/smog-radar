// European AQI bands (CAMS / EEA). Band names: `band.<id>` in the locale files.

export type AqiBand = 'good' | 'fair' | 'moderate' | 'poor' | 'very-poor' | 'extremely-poor'

export interface AqiBandInfo {
  id: AqiBand
  /** inclusive */
  min: number
  /** exclusive */
  max: number
}

export const AQI_BANDS: readonly AqiBandInfo[] = [
  { id: 'good', min: 0, max: 20 },
  { id: 'fair', min: 20, max: 40 },
  { id: 'moderate', min: 40, max: 60 },
  { id: 'poor', min: 60, max: 80 },
  { id: 'very-poor', min: 80, max: 100 },
  { id: 'extremely-poor', min: 100, max: Number.POSITIVE_INFINITY },
]

export function aqiBand(aqi: number): AqiBandInfo {
  return AQI_BANDS.find(b => aqi < b.max) ?? AQI_BANDS.at(-1)!
}
