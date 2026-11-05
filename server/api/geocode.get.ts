/**
 * GET /api/geocode?q=Krakow
 * Places matching a name, best match first.
 */
import { z } from 'zod'
import type { Place } from '../../shared/types/air'
import { GEOCODING_URL, geocodingQuery, parseGeocoding } from '../utils/open-meteo'
import { UPSTREAM_FETCH, upstreamError } from '../utils/upstream'

const Query = z.object({
  q: z.string().trim().min(2).max(80),
  count: z.coerce.number().int().min(1).max(10).default(5),
})

const searchPlaces = defineCachedFunction(
  async (name: string, count: number): Promise<Place[]> => {
    const raw = await $fetch(GEOCODING_URL, { query: geocodingQuery(name, count), ...UPSTREAM_FETCH })
    return parseGeocoding(raw)
  },
  {
    name: 'geocode',
    maxAge: 60 * 60 * 24,
    getKey: (name: string, count: number) => `${name.toLowerCase()}:${count}`,
  },
)

export default defineEventHandler(async (event) => {
  const { q, count } = await getValidatedQuery(event, Query.parse)
  try {
    return await searchPlaces(q, count)
  }
  catch (error) {
    throw upstreamError(error, 'Place search')
  }
})
