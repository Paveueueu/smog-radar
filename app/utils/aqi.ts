/*
 * European Air Quality Index bands, as used by CAMS and the EEA.
 * Each band includes its lower bound: 20 is "fair", 19.9 is "good".
 */

export type AqiBand = 'good' | 'fair' | 'moderate' | 'poor' | 'very-poor' | 'extremely-poor'

export interface AqiBandInfo {
  id: AqiBand
  label: string
  /** inclusive */
  min: number
  /** exclusive */
  max: number
}

export const AQI_BANDS: readonly AqiBandInfo[] = [
  { id: 'good', label: 'Good', min: 0, max: 20 },
  { id: 'fair', label: 'Fair', min: 20, max: 40 },
  { id: 'moderate', label: 'Moderate', min: 40, max: 60 },
  { id: 'poor', label: 'Poor', min: 60, max: 80 },
  { id: 'very-poor', label: 'Very poor', min: 80, max: 100 },
  { id: 'extremely-poor', label: 'Extremely poor', min: 100, max: Number.POSITIVE_INFINITY },
]

export function aqiBand(aqi: number): AqiBandInfo {
  return AQI_BANDS.find(b => aqi < b.max) ?? AQI_BANDS.at(-1)!
}
