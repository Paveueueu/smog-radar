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

// A name search can't list a city's districts, so a reverse search around its centre adds them.

export const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse'
/** Covers the larger European cities (Berlin's districts reach ~25 km from its centre). */
const DISTRICT_RADIUS_KM = 30
/** Photon's maximum per request; big cities return their nearest 50 districts and quarters. */
const DISTRICT_FETCH = 50
export const DISTRICT_LIMIT = 40

/** "Łódź" → "lodz": for comparing what was typed with a place name. */
export function foldName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, 'l') // ł has no decomposed form
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function isCitySearch(q: string, place: Place | undefined): place is Place {
  return !!place && (place.kind === 'city' || place.kind === 'town') && foldName(q) === foldName(place.name)
}

export function districtsQuery(city: Pick<Place, 'lat' | 'lon'>, lang: 'en' | 'pl'): Record<string, string | number | string[]> {
  const query: Record<string, string | number | string[]> = {
    lat: city.lat,
    lon: city.lon,
    radius: DISTRICT_RADIUS_KM,
    limit: DISTRICT_FETCH,
    osm_tag: ['place:suburb', 'place:borough'],
  }
  // Must match the name search, so the city is named the same way in both answers.
  if (lang === 'en') query.lang = 'en'
  return query
}

export function parseDistricts(raw: unknown, city: Pick<Place, 'name'>, lang: 'en' | 'pl'): Place[] {
  const parsed = PhotonResponse.safeParse(raw)
  if (!parsed.success) throw new PhotonFormatError(`Unexpected Photon response: ${parsed.error.message}`)

  const byName = new Map<string, Place>()
  for (const f of parsed.data.features) {
    const p = f.properties
    if (p.osm_key !== 'place' || !p.name || p.city !== city.name || p.name === city.name) continue
    const key = p.name.toLowerCase()
    if (byName.has(key)) continue // a district often comes back as a node and as an area
    const [lon, lat] = f.geometry.coordinates
    byName.set(key, {
      id: `${p.osm_type}${p.osm_id}`,
      name: p.name,
      label: `${p.name}, ${city.name}`,
      context: '',
      kind: 'district',
      countryCode: p.countrycode ?? null,
      lat,
      lon,
    })
  }

  const collator = new Intl.Collator(lang)
  return [...byName.values()].sort((a, b) => collator.compare(a.name, b.name)).slice(0, DISTRICT_LIMIT)
}
