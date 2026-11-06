<script setup lang="ts">
import type { AirReport } from '#shared/types/air'
import type { Assessment } from '~/utils/verdict'

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
    <p v-if="assessment.band" class="text-lg">
      <span class="mr-2 inline-block size-3 rounded-full ring-1 ring-ink/15" :class="BAND_BG[assessment.band.id]" aria-hidden="true" />
      <strong class="font-semibold">{{ text.band(assessment.band.id) }}</strong>,
      <span class="tabular-nums">AQI {{ Math.round(assessment.aqi!) }}</span><template v-if="mostly">, <span class="text-muted">{{ mostly }}</span></template>
    </p>
    <p v-else class="text-lg text-muted">
      {{ t('summary.noValue') }}
    </p>
    <p class="tabular-nums text-sm text-muted">
      {{ t('summary.dataTime', { hour, time: updated }) }}
    </p>
  </div>
</template>
