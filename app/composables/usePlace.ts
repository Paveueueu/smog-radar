export type PlaceSource = 'url' | 'saved' | 'network' | 'default'

/** URL, then the last pick (cookie), then IP geolocation headers, then the default place. */
export function usePlace() {
  const route = useRoute()
  const router = useRouter()
  const saved = useCookie<unknown>('smog-radar-place', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    default: () => null,
  })

  const network = useState<SelectedPlace | null>('network-place', () =>
    import.meta.server ? placeFromGeoHeaders(useRequestHeaders()) : null,
  )

  const resolved = computed<{ place: SelectedPlace, source: PlaceSource }>(() => {
    const fromUrl = parsePlace(route.query)
    if (fromUrl) return { place: fromUrl, source: 'url' }
    const fromCookie = parsePlace(saved.value)
    if (fromCookie) return { place: fromCookie, source: 'saved' }
    if (network.value) return { place: network.value, source: 'network' }
    return { place: DEFAULT_PLACE, source: 'default' }
  })

  const place = computed(() => resolved.value.place)
  const source = computed(() => resolved.value.source)

  async function select(next: SelectedPlace) {
    const clean = parsePlace(next)
    if (!clean) return
    saved.value = clean
    await router.replace({ query: placeQuery(clean) })
  }

  return { place, source, select }
}
