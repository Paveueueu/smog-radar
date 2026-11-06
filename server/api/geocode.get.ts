/**
 * GET /api/geocode?q=Gocław&lang=pl&lat=52.23&lon=21.01
 * Cities, towns, villages and parts of cities in Europe matching a name, best first.
 * lat/lon (optional) make nearby places win, so "Praga" near Warsaw finds Praga-Południe.
 */
import { z } from 'zod'
import type { Place } from '../../shared/types/air'
import { parsePhoton, PHOTON_URL, photonQuery } from '../utils/photon'
import { UPSTREAM_FETCH, upstreamError } from '../utils/upstream'

const Query = z.object({
  q: z.string().trim().min(2).max(80),
  lang: z.enum(['en', 'pl']).default('en'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
})

/** Nearness only needs to be rough; 0.5° (~50 km) lets nearby searches share a cache entry. */
const roughly = (v: number) => Math.round(v * 2) / 2

const searchPlaces = defineCachedFunction(
  async (q: string, lang: 'en' | 'pl', lat?: number, lon?: number): Promise<Place[]> => {
    const near = lat !== undefined && lon !== undefined ? { lat, lon } : undefined
    const raw = await $fetch(PHOTON_URL, {
      query: photonQuery({ q, lang, near }),
      headers: { 'User-Agent': 'SmogRadar/0.1 (portfolio demo)' },
      ...UPSTREAM_FETCH,
    })
    return parsePhoton(raw)
  },
  {
    name: 'geocode',
    maxAge: 60 * 60 * 24,
    getKey: (q: string, lang: string, lat?: number, lon?: number) =>
      `v2:${lang}:${q.toLowerCase()}:${lat ?? '-'}:${lon ?? '-'}`,
  },
)

export default defineEventHandler(async (event) => {
  const { q, lang, lat, lon } = await getValidatedQuery(event, Query.parse)
  const near = lat !== undefined && lon !== undefined
  try {
    return await searchPlaces(q, lang, near ? roughly(lat) : undefined, near ? roughly(lon) : undefined)
  }
  catch (error) {
    throw upstreamError(error, 'Place search')
  }
})
