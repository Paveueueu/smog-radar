/** Sensitive mode. In a cookie so the server renders the right answers. */
export function useProfile() {
  const cookie = useCookie<string | null>('smog-radar-profile', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    default: () => null,
  })
  const state = useState<Profile>('profile', () => (cookie.value === 'sensitive' ? 'sensitive' : 'general'))

  return computed<Profile>({
    get: () => state.value,
    set: (value) => {
      state.value = value
      cookie.value = value
    },
  })
}
