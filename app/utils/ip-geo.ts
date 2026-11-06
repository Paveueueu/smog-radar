/*
 * Approximate visitor location from the host's geolocation headers:
 * Netlify x-nf-geo, Vercel x-vercel-ip-*, Cloudflare cf-ip*. No external lookup.
 */
import { formatCoords, parsePlace, type SelectedPlace } from './places'

type Headers = Record<string, string | undefined>

const decodeSafe = (v: string) => {
  try {
    return decodeURIComponent(v)
  }
  catch {
    return v
  }
}

/** Netlify sends JSON; production may base64-encode it, the CLI sends it plain. */
function netlifyGeo(raw: string): { city?: string, latitude?: number, longitude?: number } | null {
  const tryParse = (s: string) => {
    try {
      const v = JSON.parse(s)
      return v && typeof v === 'object' ? v : null
    }
    catch {
      return null
    }
  }
  const plain = tryParse(raw)
  if (plain) return plain
  try {
    return tryParse(new TextDecoder().decode(Uint8Array.from(atob(raw), c => c.charCodeAt(0))))
  }
  catch {
    return null
  }
}

function fromParts(city: string | undefined, lat: unknown, lon: unknown): SelectedPlace | null {
  const latN = Number(lat)
  const lonN = Number(lon)
  if (lat === undefined || lon === undefined || !Number.isFinite(latN) || !Number.isFinite(lonN)) return null
  const name = city?.trim() || formatCoords(latN, lonN)
  return parsePlace({ name, lat: latN, lon: lonN })
}

export function placeFromGeoHeaders(input: Headers): SelectedPlace | null {
  const h: Headers = {}
  for (const [k, v] of Object.entries(input)) h[k.toLowerCase()] = v

  const nf = h['x-nf-geo']
  if (nf) {
    const geo = netlifyGeo(nf)
    const place = geo && fromParts(geo.city, geo.latitude, geo.longitude)
    if (place) return place
  }

  if (h['x-vercel-ip-latitude']) {
    const city = h['x-vercel-ip-city'] ? decodeSafe(h['x-vercel-ip-city']) : undefined
    const place = fromParts(city, h['x-vercel-ip-latitude'], h['x-vercel-ip-longitude'])
    if (place) return place
  }

  if (h['cf-iplatitude']) {
    const place = fromParts(h['cf-ipcity'], h['cf-iplatitude'], h['cf-iplongitude'])
    if (place) return place
  }

  return null
}
