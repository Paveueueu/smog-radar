/** GET /api/air?lat=52.23&lon=21.01 */
import { z } from 'zod'
import type { AirReport } from '../../shared/types/air'
import { AIR_QUALITY_URL, AIR_REPORT_VERSION, airQualityQuery, parseAirQuality } from '../utils/open-meteo'
import { roundCoord, UPSTREAM_FETCH, upstreamError } from '../utils/upstream'

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
})

// Open-Meteo updates hourly. Errors aren't cached.
const getAirReport = defineCachedFunction(
  async (lat: number, lon: number): Promise<AirReport> => {
    const raw = await $fetch(AIR_QUALITY_URL, { query: airQualityQuery(lat, lon), ...UPSTREAM_FETCH })
    return parseAirQuality(raw, new Date())
  },
  {
    name: 'air-report',
    maxAge: 60 * 20,
    // No stale-while-revalidate: after a quiet night it would serve hours-old data.
    swr: false,
    // Bump AIR_REPORT_VERSION whenever the AirReport shape changes, so stale entries are never served.
    getKey: (lat: number, lon: number) => `v${AIR_REPORT_VERSION}:${lat}:${lon}`,
  },
)

export default defineEventHandler(async (event) => {
  const { lat, lon } = await getValidatedQuery(event, Query.parse)
  try {
    return await getAirReport(roundCoord(lat), roundCoord(lon))
  }
  catch (error) {
    throw upstreamError(error, 'Air quality data')
  }
})
