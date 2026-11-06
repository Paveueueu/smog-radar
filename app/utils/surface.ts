// Inverse distance weighting, only near stations; fades out over the last FADE_KM.
import type { Station } from '#shared/types/air'

export const MAX_DISTANCE_KM = 25
export const FADE_KM = 5
/** Stations further than this don't take part in the average. */
export const SEARCH_KM = 50
/** IDW exponent: higher means nearby stations dominate more. */
export const POWER = 2

const KM_PER_DEG_LAT = 110.57
/** Grid cell for the spatial index, in degrees (comfortably larger than SEARCH_KM). */
const CELL_DEG = 0.5

/** Fast equirectangular distance; accurate to well under 1% at these ranges. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const x = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180) * 111.32
  const y = (lat2 - lat1) * KM_PER_DEG_LAT
  return Math.hypot(x, y)
}

export class StationIndex {
  private cells = new Map<string, Station[]>()

  constructor(readonly stations: readonly Station[]) {
    for (const s of stations) {
      const key = this.key(Math.floor(s.lat / CELL_DEG), Math.floor(s.lon / CELL_DEG))
      const list = this.cells.get(key)
      if (list) list.push(s)
      else this.cells.set(key, [s])
    }
  }

  private key(row: number, col: number) {
    return `${row}:${col}`
  }

  /** Stations within roughly `km` (a superset; callers check the exact distance). */
  candidates(lat: number, lon: number, km: number): Station[] {
    const dLat = km / KM_PER_DEG_LAT
    const dLon = km / (111.32 * Math.max(0.1, Math.cos(lat * Math.PI / 180)))
    const out: Station[] = []
    for (let r = Math.floor((lat - dLat) / CELL_DEG); r <= Math.floor((lat + dLat) / CELL_DEG); r++) {
      for (let c = Math.floor((lon - dLon) / CELL_DEG); c <= Math.floor((lon + dLon) / CELL_DEG); c++) {
        const list = this.cells.get(this.key(r, c))
        if (list) out.push(...list)
      }
    }
    return out
  }

  nearest(lat: number, lon: number, km = SEARCH_KM): { station: Station, km: number } | null {
    let best: { station: Station, km: number } | null = null
    for (const s of this.candidates(lat, lon, km)) {
      const d = distanceKm(lat, lon, s.lat, s.lon)
      if (d <= km && (!best || d < best.km)) best = { station: s, km: d }
    }
    return best
  }
}

export interface SurfacePoint {
  /** µg/m³ */
  pm25: number
  /** 1 near stations, fading to 0 at MAX_DISTANCE_KM */
  alpha: number
  nearestKm: number
}

export function estimate(index: StationIndex, lat: number, lon: number): SurfacePoint | null {
  let weightSum = 0
  let valueSum = 0
  let nearestKm = Number.POSITIVE_INFINITY

  for (const s of index.candidates(lat, lon, SEARCH_KM)) {
    const d = distanceKm(lat, lon, s.lat, s.lon)
    if (d > SEARCH_KM) continue
    if (d < nearestKm) nearestKm = d
    if (d < 0.05) return { pm25: s.pm25, alpha: 1, nearestKm: d }
    const w = 1 / d ** POWER
    weightSum += w
    valueSum += w * s.pm25
  }

  if (nearestKm > MAX_DISTANCE_KM || weightSum === 0) return null
  const fadeStart = MAX_DISTANCE_KM - FADE_KM
  const alpha = nearestKm <= fadeStart ? 1 : (MAX_DISTANCE_KM - nearestKm) / FADE_KM
  return { pm25: valueSum / weightSum, alpha, nearestKm }
}
