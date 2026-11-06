import type { AqiBand } from '~/utils/aqi'

export function useAirText() {
  const { t, locale } = useI18n()

  /** "17:00", "tomorrow 13:00" / "jutro 13:00", "Sat 13:00" / "sob. 13:00" */
  function hour(iso: string, reference: string, timeZone: string): string {
    const d = describeHour(iso, reference, timeZone, locale.value)
    if (d.offset === 0) return d.clock
    if (d.offset === 1) return t('time.tomorrow', { clock: d.clock })
    return t('time.weekday', { day: d.weekday, clock: d.clock })
  }

  /** "tomorrow 13:00–15:00"; the day is named once, from the start. */
  function range(start: string, end: string, reference: string, timeZone: string): string {
    return t('time.range', { from: hour(start, reference, timeZone), to: formatClock(end, timeZone) })
  }

  const band = (id: AqiBand) => t(`band.${id}`)

  const decimal = (value: number, digits = 1) =>
    new Intl.NumberFormat(locale.value, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)

  /** "82% of the WHO guideline" / "1.5× the WHO guideline" */
  function ratio(r: number): string {
    if (r < 1) return t('pollutants.below', { pct: Math.round(r * 100) })
    return t('pollutants.above', { x: r < 10 ? decimal(r) : String(Math.round(r)) })
  }

  /** Concentration: one decimal below 10 µg/m³, whole numbers above. */
  const concentration = (v: number) => (v < 10 ? decimal(v) : String(Math.round(v)))

  return { hour, range, band, ratio, concentration, decimal }
}
