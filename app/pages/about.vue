<script setup lang="ts">
// Numbers come from the same constants the answers use.
useSeoMeta({
  title: 'About the data - Smog Radar',
  description: 'Where Smog Radar\'s data comes from and how it decides whether to go for a walk or open the windows.',
})

const PROFILES: { id: Profile, label: string }[] = [
  { id: 'general', label: 'Most people' },
  { id: 'sensitive', label: 'Sensitive' },
]

const ACTIVITIES: { id: Activity, title: string, answers: [string, string, string], basis: string }[] = [
  {
    id: 'walk',
    title: 'Going for a walk',
    answers: ['Yes, go for a walk', 'Take it easy', 'Not now'],
    basis: 'Follows the European Environment Agency\'s health advice for each AQI band: most people are advised to cut down intense outdoor activity from "poor", sensitive people from "moderate".',
  },
  {
    id: 'windows',
    title: 'Opening the windows',
    answers: ['Open the windows', 'Short airing only', 'Keep them closed'],
    basis: 'The EEA gives no advice on ventilation, so this rule is ours. Rooms still need fresh air, so the middle answer is a short airing rather than keeping the windows shut.',
  },
]

function ranges(activity: Activity, profile: Profile): [string, string, string] {
  const t = THRESHOLDS[activity][profile]
  return [`below ${t.caution}`, `${t.caution}–${t.bad - 1}`, `${t.bad} and above`]
}

const bandRange = (b: { min: number, max: number }) =>
  Number.isFinite(b.max) ? `${b.min}–${b.max - 1}` : `${b.min} and above`
</script>

<template>
  <article class="prose-like mx-auto grid max-w-2xl gap-10">
    <header>
      <NuxtLink to="/" class="text-sm text-muted underline decoration-line-strong underline-offset-2 hover:text-ink">
        ← Back to the radar
      </NuxtLink>
      <h1 class="mt-4 text-4xl font-semibold tracking-tight">
        About the data
      </h1>
      <p class="mt-3 text-lg text-ink-2">
        Smog Radar answers two everyday questions, whether to go for a walk and whether to open the windows,
        from an air quality forecast. Here is where the numbers come from and how the answers are made.
      </p>
    </header>

    <section class="grid gap-3">
      <h2 class="text-xl font-semibold">
        Where the data comes from
      </h2>
      <p>
        Air quality comes from the
        <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener">Open-Meteo Air Quality API</a>,
        which serves the <a href="https://atmosphere.copernicus.eu/" target="_blank" rel="noopener">CAMS</a> European air quality forecast:
        hourly values on a grid of roughly 11 km. Place search uses Open-Meteo's geocoding.
      </p>
      <p class="rounded-xl border border-line bg-surface p-4 text-ink-2">
        These are <strong class="text-ink">modelled values, not station measurements</strong>. A busy street or a neighbour's chimney
        can make the air on your doorstep worse than the number here. Smog Radar is general information, not medical advice.
      </p>
    </section>

    <section class="grid gap-3">
      <h2 class="text-xl font-semibold">
        The European Air Quality Index
      </h2>
      <p>
        The index used across the EU. Each pollutant (PM2.5, PM10, NO₂, O₃) gets its own sub-index; the overall
        AQI is the highest of them, which is why the page names the pollutant that "sets the index".
      </p>
      <table class="data-table">
        <thead>
          <tr><th>Band</th><th>European AQI</th></tr>
        </thead>
        <tbody>
          <tr v-for="b in AQI_BANDS" :key="b.id">
            <td>
              <span class="inline-flex items-center gap-2">
                <span class="size-3 rounded-full ring-1 ring-ink/15" :class="BAND_BG[b.id]" aria-hidden="true" />{{ b.label }}
              </span>
            </td>
            <td class="font-mono">
              {{ bandRange(b) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-for="a in ACTIVITIES" :key="a.id" class="grid gap-3">
      <h2 class="text-xl font-semibold">
        {{ a.title }}
      </h2>
      <p>{{ a.basis }}</p>
      <table class="data-table">
        <thead>
          <tr>
            <th>Answer</th>
            <th v-for="p in PROFILES" :key="p.id">
              {{ p.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(answer, i) in a.answers" :key="answer">
            <td>{{ answer }}</td>
            <td v-for="p in PROFILES" :key="p.id" class="font-mono">
              AQI {{ ranges(a.id, p.id)[i] }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="grid gap-3">
      <h2 class="text-xl font-semibold">
        Better times
      </h2>
      <p>
        When an answer isn't the best one, Smog Radar looks ahead for the first hour that would be, and highlights
        the cleanest {{ CLEANEST_HOURS }} hours on the chart. Both only consider {{ String(DAYTIME[0]).padStart(2, '0') }}:00 to
        {{ DAYTIME[1] }}:00 local time; nobody wants a walk suggestion for 3 a.m.
      </p>
    </section>

    <section class="grid gap-3">
      <h2 class="text-xl font-semibold">
        WHO guidelines
      </h2>
      <p>
        For context, each pollutant is compared with the
        <a href="https://www.who.int/publications/i/item/9789240034228" target="_blank" rel="noopener">WHO 2021 air quality guidelines</a>.
        Those are 24-hour (or 8-hour) averages and our values are hourly, so the comparison is a pointer, not a compliance check.
        The answers themselves use the European AQI only.
      </p>
      <table class="data-table">
        <thead>
          <tr><th>Pollutant</th><th>Guideline</th></tr>
        </thead>
        <tbody>
          <tr v-for="(info, id) in POLLUTANT_INFO" :key="id">
            <td>{{ info.label }} <span class="text-muted">· {{ info.name }}</span></td>
            <td class="font-mono">
              {{ info.guideline }} µg/m³, {{ info.guidelinePeriod }} mean
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="grid gap-3">
      <h2 class="text-xl font-semibold">
        Privacy
      </h2>
      <p>
        No accounts, no analytics, no tracking. "Use my location" asks your browser once; the position is rounded to about
        1 km before it leaves your browser, and the rounded position is used only to fetch the forecast from Open-Meteo.
        Two cookies remember your last place and whether sensitive mode is on, so the page opens where you left it.
      </p>
    </section>
  </article>
</template>

<style scoped>
.prose-like a {
  text-decoration: underline;
  text-decoration-color: var(--line-strong);
  text-underline-offset: 2px;
}
.prose-like a:hover { text-decoration-color: var(--ink); }
.prose-like p { color: var(--ink-2); }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: 0.55rem 0.75rem 0.55rem 0;
  border-bottom: 1px solid var(--line);
}
.data-table th {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
</style>
