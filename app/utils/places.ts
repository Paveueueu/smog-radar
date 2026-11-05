export interface SelectedPlace {
  name: string
  lat: number
  lon: number
}

/** Shown until the visitor picks a place (location picker comes next). */
export const DEFAULT_PLACE: SelectedPlace = { name: 'Kraków', lat: 50.06, lon: 19.94 }
