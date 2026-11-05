// Our API's responses; the frontend never sees upstream formats.

export type Pollutant = 'pm2_5' | 'pm10' | 'no2' | 'o3'

export const POLLUTANTS: readonly Pollutant[] = ['pm2_5', 'pm10', 'no2', 'o3']

export interface AirSample {
  /** ISO UTC */
  time: string
  /** European AQI: 0 clean, over 100 extremely poor */
  aqi: number | null
  // µg/m³
  pm2_5: number | null
  pm10: number | null
  no2: number | null
  o3: number | null
}

export interface AirReport {
  location: {
    /** centre of the model grid cell */
    lat: number
    lon: number
    /** IANA time zone */
    timezone: string
  }
  current: AirSample
  /** current hour + 24 */
  hourly: AirSample[]
  source: {
    name: string
    model: string
    url: string
  }
  /** ISO UTC */
  fetchedAt: string
}

/** A place found by name search. */
export interface Place {
  id: number
  name: string
  /** region / voivodeship, when known */
  region: string | null
  country: string | null
  countryCode: string | null
  lat: number
  lon: number
  timezone: string | null
}
