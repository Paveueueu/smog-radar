<script setup lang="ts">
// Numbers come from the same constants the answers use.
import { STATION_MAX_AGE_HOURS } from '#shared/utils/stations'

const { t, tm, rt } = useI18n()
const text = useAirText()

useSeoMeta({
  title: () => t('meta.aboutTitle'),
  description: () => t('meta.aboutDescription'),
})

const PROFILES: Profile[] = ['general', 'sensitive']
const ACTIVITIES: Activity[] = ['walk', 'windows']
const LEVELS: Level[] = ['good', 'caution', 'bad']

function range(activity: Activity, profile: Profile, level: Level): string {
  const th = THRESHOLDS[activity][profile]
  if (level === 'good') return t('about.below', { n: th.caution })
  if (level === 'caution') return t('about.rangeTo', { from: th.caution, to: th.bad - 1 })
  return t('about.rangeUp', { from: th.bad })
}

const bandRange = (b: { min: number, max: number }) =>
  Number.isFinite(b.max) ? t('about.rangeTo', { from: b.min, to: b.max - 1 }) : t('about.rangeUp', { from: b.min })

const privacy = computed(() => (tm('about.privacy') as unknown[]).map(m => rt(m as Parameters<typeof rt>[0])))

const clock = (h: number) => `${String(h).padStart(2, '0')}:00`
</script>

<template>
  <article class="prose-like mx-auto grid max-w-2xl">
    <header class="pb-8">
      <NuxtLink to="/" class="text-sm text-muted underline decoration-line-strong underline-offset-2 hover:text-ink">
        {{ t('about.back') }}
      </NuxtLink>
      <h1 class="mt-4 text-4xl font-semibold tracking-tight">
        {{ t('about.title') }}
      </h1>
    </header>

    <section>
      <h2>{{ t('about.sourceTitle') }}</h2>
      <i18n-t keypath="about.sourceText" tag="p" scope="global">
        <template #openMeteo>
          <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener">{{ t('about.openMeteo') }}</a>
        </template>
        <template #cams>
          <a href="https://atmosphere.copernicus.eu/" target="_blank" rel="noopener">CAMS</a>
        </template>
      </i18n-t>
      <p>{{ t('about.modelNote') }}</p>
    </section>

    <section>
      <h2>{{ t('about.eaqiTitle') }}</h2>
      <p>{{ t('about.eaqiText') }}</p>
      <p>{{ t('about.eaqiScale') }}</p>
      <table class="data-table">
        <thead>
          <tr><th>{{ t('about.colBand') }}</th><th>{{ t('about.colAqi') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="b in AQI_BANDS" :key="b.id">
            <td>
              <span class="inline-flex items-center gap-2">
                <span class="size-3 rounded-full ring-1 ring-ink/15" :class="BAND_BG[b.id]" aria-hidden="true" />{{ text.band(b.id) }}
              </span>
            </td>
            <td class="tabular-nums">
              {{ bandRange(b) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-for="a in ACTIVITIES" :key="a">
      <h2>{{ t(`about.${a}Title`) }}</h2>
      <p>{{ t(`about.${a}Basis`) }}</p>
      <p v-if="a === 'walk'">
        {{ t('about.sensitiveNote') }}
      </p>
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('about.colAnswer') }}</th>
            <th v-for="p in PROFILES" :key="p">
              {{ t(`profile.${p}`) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="level in LEVELS" :key="level">
            <td>{{ t(`verdict.${a}.${level}.headline`) }}</td>
            <td v-for="p in PROFILES" :key="p" class="tabular-nums">
              AQI {{ range(a, p, level) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>{{ t('about.betterTitle') }}</h2>
      <p>{{ t('about.betterText', { hours: CLEANEST_HOURS, from: clock(DAYTIME[0]), to: clock(DAYTIME[1]) }) }}</p>
    </section>

    <section>
      <h2>{{ t('about.mapTitle') }}</h2>
      <i18n-t keypath="about.mapText" tag="p" scope="global">
        <template #openaq>
          <a href="https://openaq.org" target="_blank" rel="noopener">OpenAQ</a>
        </template>
        <template #hours>
          {{ STATION_MAX_AGE_HOURS }}
        </template>
      </i18n-t>
      <p>{{ t('about.mapSurface', { km: MAX_DISTANCE_KM }) }}</p>
    </section>

    <section>
      <h2>{{ t('about.whoTitle') }}</h2>
      <i18n-t keypath="about.whoText" tag="p" scope="global">
        <template #who>
          <a href="https://www.who.int/publications/i/item/9789240034228" target="_blank" rel="noopener">{{ t('about.who') }}</a>
        </template>
      </i18n-t>
      <table class="data-table">
        <thead>
          <tr><th>{{ t('about.colPollutant') }}</th><th>{{ t('about.colGuideline') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(info, id) in POLLUTANT_INFO" :key="id">
            <td>{{ info.label }} <span class="text-muted">({{ t(`pollutant.${id}`).toLowerCase() }})</span></td>
            <td class="tabular-nums">
              {{ t('about.guideline', { value: info.guideline, hours: info.guidelineHours }) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>{{ t('about.privacyTitle') }}</h2>
      <p>{{ t('about.privacyIntro') }}</p>
      <ul class="grid list-disc gap-2 pl-5 text-ink-2 marker:text-muted">
        <li v-for="(item, i) in privacy" :key="i">
          {{ item }}
        </li>
      </ul>
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
.prose-like p { color: var(--ink-2); line-height: 1.65; }

.prose-like section {
  display: grid;
  gap: 0.875rem;
  padding-block: 2rem;
  border-top: 1px solid var(--line);
}
/* No rule right after a table: it reads as a table border. */
.prose-like section:has(> table:last-child) + section { border-top: 0; }
.prose-like h2 {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.prose-like li { line-height: 1.6; }

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
.data-table tbody tr:last-child td { border-bottom: 0; }
.data-table th {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted);
}
</style>
