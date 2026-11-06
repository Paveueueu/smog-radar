/**
 * GET /api/geocode?q=Krakow&lang=pl
 * Places matching a name, best match first, named in the requested language
 * ("Warszawa" for pl, "Warsaw" for en).
 */
import { z } from 'zod'
import type { Place } from '../../shared/types/air'
import { GEOCODING_URL, geocodingQuery, parseGeocoding } from '../utils/open-meteo'
import { UPSTREAM_FETCH, upstreamError } from '../utils/upstream'

const Query = z.object({
  q: z.string().trim().min(2).max(80),
  count: z.coerce.number().int().min(1).max(10).default(5),
  lang: z.enum(['en', 'pl']).default('en'),
})

const searchPlaces = defineCachedFunction(
  async (name: string, count: number, lang: string): Promise<Place[]> => {
    const raw = await $fetch(GEOCODING_URL, { query: geocodingQuery(name, count, lang), ...UPSTREAM_FETCH })
    return parseGeocoding(raw)
  },
  {
    name: 'geocode',
    maxAge: 60 * 60 * 24,
    getKey: (name: string, count: number, lang: string) => `${lang}:${name.toLowerCase()}:${count}`,
  },
)

export default defineEventHandler(async (event) => {
  const { q, count, lang } = await getValidatedQuery(event, Query.parse)
  try {
    return await searchPlaces(q, count, lang)
  }
  catch (error) {
    throw upstreamError(error, 'Place search')
  }
})
