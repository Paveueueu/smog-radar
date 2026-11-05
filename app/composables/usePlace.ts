/**
 * The place being shown. Sources, in order: the URL (so links can be shared),
 * the last place picked (cookie, so the server renders it straight away), the default.
 */
export function usePlace() {
  const route = useRoute()
  const router = useRouter()
  const saved = useCookie<unknown>('smog-radar-place', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    default: () => null,
  })

  const place = computed<SelectedPlace>(
    () => parsePlace(route.query) ?? parsePlace(saved.value) ?? DEFAULT_PLACE,
  )

  async function select(next: SelectedPlace) {
    const clean = parsePlace(next)
    if (!clean) return
    saved.value = clean
    await router.replace({ query: placeQuery(clean) })
  }

  return { place, select }
}
