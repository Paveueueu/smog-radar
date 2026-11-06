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

/** PM2.5 (µg/m³) at each band boundary, EEA 2024 revision. */
export const PM25_BREAKPOINTS = [0, 5, 15, 50, 90, 140] as const

/** Linear inside each band; keeps rising past 100 above 140 µg/m³. */
export function pm25ToAqi(concentration: number): number {
  const c = Math.max(0, concentration)
  const bp = PM25_BREAKPOINTS
  for (let i = 1; i < bp.length; i++) {
    if (c < bp[i]!) return (i - 1) * 20 + ((c - bp[i - 1]!) / (bp[i]! - bp[i - 1]!)) * 20
  }
  const last = bp.length - 1
  return 100 + ((c - bp[last]!) / (bp[last]! - bp[last - 1]!)) * 20
}
