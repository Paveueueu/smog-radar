// https://docs.openaq.org (v3, API key, 60 requests/minute on the free tier)
import { z } from 'zod'
import type { Station } from '../../shared/types/air'
import { EUROPE_BBOX, STATION_MAX_AGE_HOURS } from '../../shared/utils/stations'

export { EUROPE_BBOX }

export const OPENAQ_URL = 'https://api.openaq.org/v3'
/** OpenAQ parameter id for PM2.5 in µg/m³. */
export const PM25_PARAMETER = 2
export const PAGE_SIZE = 1000
/** About 10 pages are needed today. */
export const MAX_PAGES = 20

/** Readings older than this don't describe "now" (shared with the About page). */
export const MAX_AGE_HOURS = STATION_MAX_AGE_HOURS

/** Plausible hourly PM2.5 range; outside it a sensor is broken, not the air. */
const MAX_PLAUSIBLE = 1000

const LatestResponse = z.object({
  meta: z.object({ found: z.union([z.number(), z.string()]).optional() }).passthrough(),
  results: z.array(z.object({
    datetime: z.object({ utc: z.string() }),
    value: z.number().nullable(),
    coordinates: z.object({ latitude: z.number(), longitude: z.number() }).nullable(),
    sensorsId: z.number(),
    locationsId: z.number(),
  }).passthrough()),
})

export interface Reading {
  locationId: number
  lat: number
  lon: number
  value: number
  time: string
}

export class OpenAqFormatError extends Error {
  override name = 'OpenAqFormatError'
}

export function latestQuery(page: number, since: Date) {
  return {
    limit: PAGE_SIZE,
    page,
    // whole seconds, as the API expects
    datetime_min: `${since.toISOString().slice(0, 19)}Z`,
  }
}

/** Number of results the API says exist (a string like ">1000" on some endpoints). */
export function totalFound(raw: unknown): number | null {
  const found = LatestResponse.shape.meta.safeParse((raw as { meta?: unknown })?.meta)
  if (!found.success) return null
  const n = Number(String(found.data.found ?? '').replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function parseLatest(raw: unknown): Reading[] {
  const parsed = LatestResponse.safeParse(raw)
  if (!parsed.success) throw new OpenAqFormatError(`Unexpected OpenAQ response: ${parsed.error.message}`)
  const readings: Reading[] = []
  for (const r of parsed.data.results) {
    if (r.value === null || r.coordinates === null) continue
    readings.push({
      locationId: r.locationsId,
      lat: r.coordinates.latitude,
      lon: r.coordinates.longitude,
      value: r.value,
      time: r.datetime.utc,
    })
  }
  return readings
}

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

/** One reading per location: median of its sensors, time of the newest. */
export function toStations(
  readings: readonly Reading[],
  { now, maxAgeHours = MAX_AGE_HOURS, bbox = EUROPE_BBOX }: { now: Date, maxAgeHours?: number, bbox?: [number, number, number, number] },
): Station[] {
  const [west, south, east, north] = bbox
  const oldest = now.getTime() - maxAgeHours * 3_600_000
  const byLocation = new Map<number, Reading[]>()

  for (const r of readings) {
    const t = Date.parse(r.time)
    if (!Number.isFinite(t) || t < oldest || t > now.getTime() + 3_600_000) continue
    if (r.value < 0 || r.value > MAX_PLAUSIBLE) continue
    if (r.lon < west || r.lon > east || r.lat < south || r.lat > north) continue
    const list = byLocation.get(r.locationId)
    if (list) list.push(r)
    else byLocation.set(r.locationId, [r])
  }

  return [...byLocation.entries()].map(([id, list]) => ({
    id,
    lat: Math.round(list[0]!.lat * 1e4) / 1e4,
    lon: Math.round(list[0]!.lon * 1e4) / 1e4,
    pm25: Math.round(median(list.map(r => r.value)) * 10) / 10,
    time: new Date(Math.max(...list.map(r => Date.parse(r.time)))).toISOString(),
  }))
}
