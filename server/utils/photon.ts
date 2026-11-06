// https://photon.komoot.io: OpenStreetMap search that knows city districts.
import { z } from 'zod'
import type { Place, PlaceKind } from '../../shared/types/air'
import { EUROPE_BBOX } from '../../shared/utils/stations'

export const PHOTON_URL = 'https://photon.komoot.io/api'
/** Photon may return several objects per place; ask for more than we show. */
const FETCH_LIMIT = 15
export const SHOW_LIMIT = 6

/** OSM place=* values we offer, and how they are grouped. Anything else is left out. */
const KIND: Record<string, PlaceKind> = {
  city: 'city',
  town: 'town',
  borough: 'district',
  suburb: 'district',
  quarter: 'district',
  neighbourhood: 'district',
  village: 'village',
  hamlet: 'hamlet',
}

export interface PhotonQuery {
  q: string
  lang: 'en' | 'pl'
  near?: { lat: number, lon: number }
}

export function photonQuery({ q, lang, near }: PhotonQuery): Record<string, string | number> {
  const query: Record<string, string | number> = {
    q,
    limit: FETCH_LIMIT,
    bbox: EUROPE_BBOX.join(','),
    osm_tag: 'place',
  }
  // Photon has no Polish; without `lang` it returns local names (Warszawa, München),
  // which is what a Polish reader expects. English asks for English names (Warsaw, Munich).
  if (lang === 'en') query.lang = 'en'
  if (near) {
    query.lat = near.lat
    query.lon = near.lon
  }
  return query
}

const Feature = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    osm_id: z.number(),
    osm_type: z.string(),
    osm_key: z.string(),
    osm_value: z.string(),
    name: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    county: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    countrycode: z.string().optional(),
  }).passthrough(),
})

const PhotonResponse = z.object({ features: z.array(Feature) })

export class PhotonFormatError extends Error {
  override name = 'PhotonFormatError'
}

const join = (...parts: (string | undefined)[]) =>
  parts.filter((p, i, all): p is string => !!p && all.indexOf(p) === i).join(', ')

/** Settlements and city parts only, one entry per place, hamlets last. */
export function parsePhoton(raw: unknown): Place[] {
  const parsed = PhotonResponse.safeParse(raw)
  if (!parsed.success) throw new PhotonFormatError(`Unexpected Photon response: ${parsed.error.message}`)

  const seen = new Set<string>()
  const places: Place[] = []

  for (const f of parsed.data.features) {
    const p = f.properties
    const kind = p.osm_key === 'place' ? KIND[p.osm_value] : undefined
    if (!kind || !p.name) continue

    const [lon, lat] = f.geometry.coordinates
    const partOfCity = kind === 'district'
    const label = partOfCity && p.city && p.city !== p.name ? `${p.name}, ${p.city}` : p.name
    const context = partOfCity
      ? join(p.district !== p.name ? p.district : undefined, p.city, p.country)
      : join(p.county, p.state, p.country).split(', ').slice(-2).join(', ')

    // The same place often comes back as a node and as an area.
    const key = `${label}|${context}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    places.push({
      id: `${p.osm_type}${p.osm_id}`,
      name: p.name,
      label,
      context,
      kind,
      countryCode: p.countrycode ?? null,
      lat,
      lon,
    })
  }

  // Stable sort: hamlets (tiny, often sharing a big city's name) go last.
  return places
    .map((place, i) => ({ place, i }))
    .sort((a, b) => Number(a.place.kind === 'hamlet') - Number(b.place.kind === 'hamlet') || a.i - b.i)
    .map(x => x.place)
    .slice(0, SHOW_LIMIT)
}
