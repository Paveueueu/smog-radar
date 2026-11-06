/**
 * GET /api/geocode?q=Gocław&lang=pl&lat=52.23&lon=21.01
 * lat/lon rank nearby places first; a bare city name also returns its districts.
 */
import { z } from 'zod'
import type { Place, PlaceResults } from '../../shared/types/air'
import {
  districtsQuery,
  isCitySearch,
  parseDistricts,
  parsePhoton,
  PHOTON_REVERSE_URL,
  PHOTON_URL,
  photonQuery,
} from '../utils/photon'
import { UPSTREAM_FETCH, upstreamError } from '../utils/upstream'

const Query = z.object({
  q: z.string().trim().min(2).max(80),
  lang: z.enum(['en', 'pl']).default('en'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
})

const PHOTON_HEADERS = { 'User-Agent': 'SmogRadar/0.1 (portfolio demo)' }

/** Nearness only needs to be rough; 0.5° (~50 km) lets nearby searches share a cache entry. */
const roughly = (v: number) => Math.round(v * 2) / 2

const searchPlaces = defineCachedFunction(
  async (q: string, lang: 'en' | 'pl', lat?: number, lon?: number): Promise<Place[]> => {
    const near = lat !== undefined && lon !== undefined ? { lat, lon } : undefined
    const raw = await $fetch(PHOTON_URL, { query: photonQuery({ q, lang, near }), headers: PHOTON_HEADERS, ...UPSTREAM_FETCH })
    return parsePhoton(raw)
  },
  {
    name: 'geocode',
    maxAge: 60 * 60 * 24,
    getKey: (q: string, lang: string, lat?: number, lon?: number) =>
      `v2:${lang}:${q.toLowerCase()}:${lat ?? '-'}:${lon ?? '-'}`,
  },
)

const cityDistricts = defineCachedFunction(
  async (city: Place, lang: 'en' | 'pl'): Promise<Place[]> => {
    const raw = await $fetch(PHOTON_REVERSE_URL, { query: districtsQuery(city, lang), headers: PHOTON_HEADERS, ...UPSTREAM_FETCH })
    return parseDistricts(raw, city, lang)
  },
  {
    name: 'districts',
    maxAge: 60 * 60 * 24 * 7,
    getKey: (city: Place, lang: string) => `v1:${lang}:${city.id}`,
  },
)

export default defineEventHandler(async (event): Promise<PlaceResults> => {
  const { q, lang, lat, lon } = await getValidatedQuery(event, Query.parse)
  const near = lat !== undefined && lon !== undefined

  let places: Place[]
  try {
    places = await searchPlaces(q, lang, near ? roughly(lat) : undefined, near ? roughly(lon) : undefined)
  }
  catch (error) {
    throw upstreamError(error, 'Place search')
  }

  const city = places[0]
  if (!isCitySearch(q, city)) return { places, districts: null }

  // Districts are optional.
  const districts = await cityDistricts(city, lang).catch((error: unknown) => {
    console.warn('[geocode] districts unavailable:', (error as Error).message)
    return []
  })
  if (!districts.length) return { places, districts: null }

  const listed = new Set(districts.map(d => d.label))
  return {
    places: places.filter(p => !listed.has(p.label)),
    districts: { of: city.name, places: districts },
  }
})
