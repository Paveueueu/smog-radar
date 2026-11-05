// https://open-meteo.com/en/docs/air-quality-api (CAMS, hourly)
// https://open-meteo.com/en/docs/geocoding-api
import { z } from 'zod'
import type { AirReport, AirSample, Place } from '../../shared/types/air'

export const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
export const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

/** Upstream variable names, in the same order as our AirSample fields. */
const VARIABLES = {
  aqi: 'european_aqi',
  pm2_5: 'pm2_5',
  pm10: 'pm10',
  no2: 'nitrogen_dioxide',
  o3: 'ozone',
} as const

export const FORECAST_HOURS = 25

export function airQualityQuery(lat: number, lon: number) {
  const vars = Object.values(VARIABLES).join(',')
  return {
    latitude: lat,
    longitude: lon,
    current: vars,
    hourly: vars,
    // Two days always cover the next 24 hours, even late in the evening.
    forecast_days: 2,
    timezone: 'auto',
    // Absolute timestamps, so daylight-saving changes inside the window can't shift hours.
    timeformat: 'unixtime',
  }
}

export function geocodingQuery(name: string, count: number) {
  return { name, count, language: 'en', format: 'json' }
}

const value = z.number().nullable()
const series = z.array(value)

const AirQualityResponse = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.number(),
    european_aqi: value,
    pm2_5: value,
    pm10: value,
    nitrogen_dioxide: value,
    ozone: value,
  }),
  hourly: z.object({
    time: z.array(z.number()),
    european_aqi: series,
    pm2_5: series,
    pm10: series,
    nitrogen_dioxide: series,
    ozone: series,
  }),
})

type Row = Record<(typeof VARIABLES)[keyof typeof VARIABLES], number | null>

const isoFromUnix = (seconds: number) => new Date(seconds * 1000).toISOString()

function toSample(time: number, row: Row): AirSample {
  return {
    time: isoFromUnix(time),
    aqi: row.european_aqi,
    pm2_5: row.pm2_5,
    pm10: row.pm10,
    no2: row.nitrogen_dioxide,
    o3: row.ozone,
  }
}

export class UpstreamFormatError extends Error {
  override name = 'UpstreamFormatError'
}

/** Keeps the current hour plus the next 24; throws UpstreamFormatError on a bad shape. */
export function parseAirQuality(raw: unknown, fetchedAt: Date): AirReport {
  const parsed = AirQualityResponse.safeParse(raw)
  if (!parsed.success) throw new UpstreamFormatError(`Unexpected air quality response: ${parsed.error.message}`)
  const data = parsed.data
  const { time } = data.hourly

  const names = Object.values(VARIABLES)
  if (names.some(n => data.hourly[n].length !== time.length)) {
    throw new UpstreamFormatError('Hourly series have different lengths')
  }

  // The hour that contains "current" (current.time may be on or just after the hour mark).
  const start = time.findIndex(t => t <= data.current.time && data.current.time < t + 3600)
  if (start === -1 || start + FORECAST_HOURS > time.length) {
    throw new UpstreamFormatError('Forecast does not cover the next 24 hours')
  }

  const hourly: AirSample[] = []
  for (let i = start; i < start + FORECAST_HOURS; i++) {
    const row = Object.fromEntries(names.map(n => [n, data.hourly[n][i] ?? null])) as Row
    hourly.push(toSample(time[i]!, row))
  }

  return {
    location: { lat: data.latitude, lon: data.longitude, timezone: data.timezone },
    current: toSample(time[start]!, data.current),
    hourly,
    source: {
      name: 'Open-Meteo',
      model: 'CAMS European air quality forecast',
      url: 'https://open-meteo.com/en/docs/air-quality-api',
    },
    fetchedAt: fetchedAt.toISOString(),
  }
}

// ---------- geocoding ----------

const GeocodingResponse = z.object({
  // Absent when nothing matches.
  results: z.array(z.object({
    id: z.number(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    country: z.string().optional(),
    country_code: z.string().optional(),
    admin1: z.string().optional(),
    timezone: z.string().optional(),
  })).optional(),
})

export function parseGeocoding(raw: unknown): Place[] {
  const parsed = GeocodingResponse.safeParse(raw)
  if (!parsed.success) throw new UpstreamFormatError(`Unexpected geocoding response: ${parsed.error.message}`)
  return (parsed.data.results ?? []).map(r => ({
    id: r.id,
    name: r.name,
    region: r.admin1 ?? null,
    country: r.country ?? null,
    countryCode: r.country_code ?? null,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone ?? null,
  }))
}
