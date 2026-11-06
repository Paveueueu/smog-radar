/** GET /api/stations: latest PM2.5 per OpenAQ station in Europe. 503 without an API key. */
import type { StationsReport } from '../../shared/types/air'
import { EUROPE_BBOX } from '../../shared/utils/stations'
import {
  MAX_AGE_HOURS,
  MAX_PAGES,
  OPENAQ_URL,
  PAGE_SIZE,
  PM25_PARAMETER,
  latestQuery,
  parseLatest,
  toStations,
  totalFound,
  type Reading,
} from '../utils/openaq'
import { UPSTREAM_FETCH, upstreamError } from '../utils/upstream'

/** Version of the StationsReport shape; part of the cache key. */
const STATIONS_VERSION = 1

// Stations report hourly; refreshing every 30 minutes costs ~20 requests an hour.
const MAX_AGE_S = 60 * 30
/** Longest a stale map may be served while refreshing. */
const STALE_LIMIT_S = 60 * 10
const getStations = defineCachedFunction(
  async (apiKey: string): Promise<StationsReport> => {
    const now = new Date()
    const since = new Date(now.getTime() - MAX_AGE_HOURS * 3_600_000)
    const url = `${OPENAQ_URL}/parameters/${PM25_PARAMETER}/latest`
    const fetchPage = (page: number) =>
      $fetch(url, { query: latestQuery(page, since), headers: { 'X-API-Key': apiKey }, ...UPSTREAM_FETCH })

    const first = await fetchPage(1)
    const pages = Math.min(MAX_PAGES, Math.ceil((totalFound(first) ?? PAGE_SIZE) / PAGE_SIZE))
    const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2)))

    const readings: Reading[] = [first, ...rest].flatMap(parseLatest)
    return {
      stations: toStations(readings, { now, maxAgeHours: MAX_AGE_HOURS, bbox: EUROPE_BBOX }),
      maxAgeHours: MAX_AGE_HOURS,
      bbox: EUROPE_BBOX,
      fetchedAt: now.toISOString(),
    }
  },
  {
    name: 'stations',
    maxAge: MAX_AGE_S,
    // Stale-while-revalidate, but bounded: Nitro alone would serve stale data of any age.
    swr: true,
    validate: entry => entry.value !== undefined && Date.now() - (entry.mtime ?? 0) < (MAX_AGE_S + STALE_LIMIT_S) * 1000,
    // The key itself must never end up in a cache key or a log.
    getKey: () => `v${STATIONS_VERSION}:europe`,
  },
)

export default defineEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaqApiKey
  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Station data is not configured' })
  }
  try {
    return await getStations(apiKey)
  }
  catch (error) {
    throw upstreamError(error, 'Station data')
  }
})
