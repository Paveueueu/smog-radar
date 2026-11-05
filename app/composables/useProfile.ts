/**
 * Whether answers use the stricter "sensitive" limits. Kept in a cookie so the
 * server renders the right answers straight away; not in the URL, because it
 * is a personal setting, not part of a shared place.
 */
export function useProfile() {
  const cookie = useCookie<string | null>('smog-radar-profile', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    default: () => null,
  })

  return computed<Profile>({
    get: () => (cookie.value === 'sensitive' ? 'sensitive' : 'general'),
    set: (value) => { cookie.value = value },
  })
}
