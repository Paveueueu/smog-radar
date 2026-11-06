# Methodology

How Smog Radar turns an air quality forecast into "go for a walk?" and "open the windows?". The rules live in `app/utils/verdict.ts`. The wording of each answer, in English and Polish, is in `i18n/locales/` under `verdict.*`.

Smog Radar is an informational tool, not medical advice.

## Data

- **Source:** [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api), which serves the CAMS European air quality forecast (Copernicus Atmosphere Monitoring Service).
- **Resolution:** about 11 km in Europe, hourly. Values are **modelled**, not measured at a station, so a busy street or a chimney next door can be worse than the number shown.
- **Variables:** European AQI, PM2.5, PM10, NO₂, O₃ (µg/m³), and the European AQI of each pollutant separately.
- **Window:** the current hour plus the next 24 hours.

## European Air Quality Index

The European AQI (EAQI) is the index used by the European Environment Agency (EEA). Each pollutant gets its own sub-index; the overall index is the highest of them. We name that pollutant as the one driving the air quality.

| Band | EAQI |
|---|---|
| Good | 0 – < 20 |
| Fair | 20 – < 40 |
| Moderate | 40 – < 60 |
| Poor | 60 – < 80 |
| Very poor | 80 – < 100 |
| Extremely poor | ≥ 100 |

A band includes its lower bound: 20 is "fair".

## Profiles

- **General:** healthy adults.
- **Sensitive:** people more affected by air pollution, such as those with asthma or heart and lung conditions, children and older people. Every rule is the same or stricter for this profile, never more lenient.

## Going for a walk

Based on the EEA health recommendations for each EAQI band, which advise the general population to consider cutting down intense outdoor activity from "poor", and sensitive people from "moderate".

| Answer | General | Sensitive |
|---|---|---|
| **Yes, go for a walk** | EAQI < 60 | EAQI < 40 |
| **Take it easy**: a walk is fine, skip intense exercise | 60 – < 80 | 40 – < 60 |
| **Not now**: limit time outside | ≥ 80 | ≥ 60 |

## Opening the windows

The EEA gives no guidance on ventilation, so this rule is our own. Rooms still need fresh air (CO₂, humidity), so the middle answer is a short airing rather than "keep closed".

| Answer | General | Sensitive |
|---|---|---|
| **Open the windows** | EAQI < 40 | EAQI < 20 |
| **Short airing only**: 5–10 minutes, then close | 40 – < 80 | 20 – < 60 |
| **Keep them closed** | ≥ 80 | ≥ 60 |

## Better times

- **Better at:** when an answer isn't the best one, we look for the earliest hour in the forecast that would get the best answer. If there is none, we say so.
- **Cleanest stretch:** the two consecutive hours with the lowest average EAQI, highlighted on the timeline.
- Both only consider local daytime hours, 07:00 to 22:00 in the location's time zone. Hours are handled as absolute timestamps, so daylight-saving changes don't shift them.

## Station map

The map is the one part of the page that uses **measurements** rather than the model, so the two can be compared.

- **Source:** [OpenAQ](https://openaq.org) (v3 API), the latest hourly PM2.5 of every sensor. Server code: `server/utils/openaq.ts`.
- **Filtering:** only readings from the last 3 hours, between 0 and 1000 µg/m³, inside Europe (−25° to 45° E, 34° to 72° N). Several sensors at one location become one station: the median value and the newest time.
- **Colour:** each value is converted to the European AQI PM2.5 sub-index with the EEA 2024 hourly thresholds (0–5, 5–15, 15–50, 50–90, 90–140, above 140 µg/m³), interpolated linearly inside each band (`pm25ToAqi` in `app/utils/aqi.ts`), and coloured by the same bands as the rest of the page.
- **Surface:** inverse distance weighting (power 2) over the stations within 50 km of a point (`app/utils/surface.ts`). Further than 25 km from the nearest station there is no value at all, so places without measurements stay uncoloured; between 20 and 25 km the colour fades out.
- **Limits:** PM2.5 only; stations include both reference monitors and low-cost sensors, as published by OpenAQ; IDW knows nothing about terrain or wind, so treat the colour between stations as a guide.

## WHO guidelines

For context, each pollutant is also shown against the [WHO 2021 air quality guidelines](https://www.who.int/publications/i/item/9789240034228):

| Pollutant | Guideline |
|---|---|
| PM2.5 | 15 µg/m³, 24-hour mean |
| PM10 | 45 µg/m³, 24-hour mean |
| NO₂ | 25 µg/m³, 24-hour mean |
| O₃ | 100 µg/m³, 8-hour mean |

Our values are hourly, so "1.5× the guideline" is a pointer, not a compliance check. The verdicts use the EAQI only.

## Missing data

If the model has no value for the current hour, both answers say "No data right now" instead of guessing. Hours without data are skipped when looking for better times.
