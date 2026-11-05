import type { Place } from '#shared/types/air'

export interface SelectedPlace {
  name: string
  lat: number
  lon: number
}

export const DEFAULT_PLACE: SelectedPlace = { name: 'Kraków', lat: 50.06, lon: 19.94 }

const MAX_NAME = 80

/** ~1 km: enough for an ~11 km model grid without pinning down an address. */
export const roundCoord = (v: number) => Math.round(v * 100) / 100

const toNumber = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : Number.NaN)
const firstValue = (v: unknown) => (Array.isArray(v) ? v[0] : v)

/** From the URL or a cookie; null unless lat, lon and name are all valid. */
export function parsePlace(input: unknown): SelectedPlace | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const lat = toNumber(firstValue(raw.lat))
  const lon = toNumber(firstValue(raw.lon))
  const name = firstValue(raw.name)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null
  if (typeof name !== 'string') return null
  const trimmed = name.trim().slice(0, MAX_NAME)
  if (!trimmed) return null
  return { name: trimmed, lat: roundCoord(lat), lon: roundCoord(lon) }
}

/** URL query for a place, e.g. ?name=Krak%C3%B3w&lat=50.06&lon=19.94 */
export function placeQuery(place: SelectedPlace): Record<string, string> {
  return { name: place.name, lat: String(place.lat), lon: String(place.lon) }
}

export function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(roundCoord(lat)).toFixed(2)}°${ns}, ${Math.abs(roundCoord(lon)).toFixed(2)}°${ew}`
}

/** "Lesser Poland, Poland": the context line for a search result. */
export function placeContext(place: Place): string {
  return [place.region, place.country].filter((part, i, all) => part && all.indexOf(part) === i).join(', ')
}
