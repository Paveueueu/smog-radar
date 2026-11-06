import { UpstreamFormatError } from './open-meteo'
import { OpenAqFormatError } from './openaq'
import { PhotonFormatError } from './photon'

export const UPSTREAM_FETCH = { timeout: 8000, retry: 1, retryDelay: 300 } as const

/** Errors thrown by $fetch (network, timeout, non-2xx) are named "FetchError". */
const isFetchError = (e: unknown): e is Error => e instanceof Error && e.name === 'FetchError'

/** Upstream failure → 502; details only in the server log. */
export function upstreamError(error: unknown, what: string) {
  if (isFetchError(error) || error instanceof UpstreamFormatError || error instanceof OpenAqFormatError || error instanceof PhotonFormatError) {
    console.error(`[${what}]`, error.message)
    return createError({ statusCode: 502, statusMessage: `${what} is unavailable right now` })
  }
  return error
}

/** Rounds a coordinate to 0.01° (about 1 km), well inside the ~11 km model grid. */
export const roundCoord = (v: number) => Math.round(v * 100) / 100
