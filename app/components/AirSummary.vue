<script setup lang="ts">
import type { AirReport } from '#shared/types/air'
import type { Assessment } from '~/utils/verdict'

// One line under the place name: band, AQI, what drives it, and how fresh it is.
const props = defineProps<{ report: AirReport, assessment: Assessment }>()

const { t } = useI18n()
const text = useAirText()

const tz = computed(() => props.report.location.timezone)
const hour = computed(() => formatClock(props.report.current.time, tz.value))
const updated = computed(() => formatClock(props.report.fetchedAt, tz.value))
const mostly = computed(() => {
  const id = props.assessment.dominant
  return id ? t('summary.mostly', { name: t(`pollutant.${id}`).toLowerCase(), label: POLLUTANT_INFO[id].label }) : null
})
</script>

<template>
  <div class="grid gap-1">
    <p v-if="assessment.band" class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-lg">
      <span class="inline-flex items-center gap-2 font-semibold">
        <span class="size-3 rounded-full ring-1 ring-ink/15" :class="BAND_BG[assessment.band.id]" aria-hidden="true" />
        {{ text.band(assessment.band.id) }}
      </span>
      <span class="font-mono text-base text-ink-2">AQI {{ Math.round(assessment.aqi!) }}</span>
      <!-- dot and text wrap together, so a line never ends on a lone "·" -->
      <span v-if="mostly" class="inline-flex gap-2.5 text-base text-muted">
        <span aria-hidden="true">·</span>{{ mostly }}
      </span>
    </p>
    <p v-else class="text-lg text-muted">
      {{ t('summary.noValue') }}
    </p>
    <p class="font-mono text-xs text-muted">
      {{ t('summary.at', { hour }) }} · {{ t('summary.updated', { time: updated }) }}
    </p>
  </div>
</template>
