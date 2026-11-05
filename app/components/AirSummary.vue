<script setup lang="ts">
import type { AirReport } from '#shared/types/air'
import type { Assessment } from '~/utils/verdict'

const props = defineProps<{ report: AirReport, assessment: Assessment, place: string }>()

const tz = computed(() => props.report.location.timezone)
const hour = computed(() => formatClock(props.report.current.time, tz.value))
const dominant = computed(() => (props.assessment.dominant ? POLLUTANT_INFO[props.assessment.dominant] : null))
</script>

<template>
  <section aria-labelledby="place-name" class="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:items-end">
    <div>
      <p class="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted">
        Air quality at {{ hour }}
      </p>
      <h1 id="place-name" class="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
        {{ place }}
      </h1>
      <p v-if="assessment.band" class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg">
        <span class="inline-flex items-center gap-2 font-semibold">
          <span class="size-3 rounded-full ring-1 ring-ink/15" :class="BAND_BG[assessment.band.id]" aria-hidden="true" />
          {{ assessment.band.label }}
        </span>
        <span class="font-mono text-base text-ink-2">AQI {{ Math.round(assessment.aqi!) }}</span>
        <span v-if="dominant" class="text-base text-muted">mostly {{ dominant.name.toLowerCase() }} ({{ dominant.label }})</span>
      </p>
      <p v-else class="mt-3 text-lg text-muted">
        No air quality value for this hour.
      </p>
    </div>
    <AqiScale v-if="assessment.aqi !== null" :aqi="assessment.aqi" />
  </section>
</template>
