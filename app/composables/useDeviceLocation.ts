/** Message key: place.geo.<reason> */
export type LocationError = 'unsupported' | 'denied' | 'unavailable' | 'timeout'

const BY_CODE: Record<number, LocationError> = { 1: 'denied', 2: 'unavailable', 3: 'timeout' }

export function useDeviceLocation() {
  const pending = ref(false)
  const error = ref<LocationError | null>(null)

  function locate(): Promise<{ lat: number, lon: number } | null> {
    error.value = null
    if (!import.meta.client || !('geolocation' in navigator)) {
      error.value = 'unsupported'
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
          error.value = BY_CODE[err.code] ?? 'unavailable'
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
      )
    })
  }

  return { locate, pending, error }
}
