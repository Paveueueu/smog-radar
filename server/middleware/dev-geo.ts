// Dev only: adds the geolocation headers a host would, from this machine's public IP.
const LOOKUP_URL = 'https://ipwho.is/?fields=success,city,latitude,longitude'

let lookup: Promise<{ city: string, lat: number, lon: number } | null> | null = null

function devLocation() {
  lookup ??= $fetch<{ success: boolean, city?: string, latitude?: number, longitude?: number }>(LOOKUP_URL, {
    timeout: 3000,
    headers: { 'User-Agent': 'SmogRadar/0.1 (portfolio demo, development)' },
  })
    .then(r => (r.success && r.latitude !== undefined && r.longitude !== undefined
      ? { city: r.city ?? '', lat: r.latitude, lon: r.longitude }
      : null))
    .catch(() => null)
  return lookup
}

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) return
  const path = event.path ?? ''
  if (path.startsWith('/api/') || path.startsWith('/_') || path.includes('.')) return

  const headers = event.node.req.headers
  if (headers['x-nf-geo'] || headers['x-vercel-ip-latitude'] || headers['cf-iplatitude']) return

  const loc = await devLocation()
  if (!loc) return
  headers['x-vercel-ip-city'] = encodeURIComponent(loc.city)
  headers['x-vercel-ip-latitude'] = String(loc.lat)
  headers['x-vercel-ip-longitude'] = String(loc.lon)
})
