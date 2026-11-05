/** One-shot device location with readable errors. */
export function useDeviceLocation() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  const MESSAGES: Record<number, string> = {
    1: 'Location access was denied. Search for a place instead.',
    2: 'Your location isn\'t available right now. Search for a place instead.',
    3: 'Finding your location took too long. Try again or search for a place.',
  }

  function locate(): Promise<{ lat: number, lon: number } | null> {
    error.value = null
    if (!import.meta.client || !('geolocation' in navigator)) {
      error.value = 'This browser can\'t share your location. Search for a place instead.'
      return Promise.resolve(null)
    }
    pending.value = true
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pending.value = false
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        },
        (err) => {
          pending.value = false
          error.value = MESSAGES[err.code] ?? MESSAGES[2]!
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
      )
    })
  }

  return { locate, pending, error }
}
