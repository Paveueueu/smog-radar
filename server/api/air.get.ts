/** GET /api/air?lat=52.23&lon=21.01 */
import { z } from 'zod'
import type { AirReport } from '../../shared/types/air'

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
    getKey: (lat: number, lon: number) => `${lat}:${lon}`,
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
