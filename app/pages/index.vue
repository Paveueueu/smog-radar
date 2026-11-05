<script setup lang="ts">
import type { AirReport } from '#shared/types/air'

const { place, select } = usePlace()
const profile: Profile = 'general' // the sensitive toggle comes in a later step

const { data: report, status, error, refresh } = await useFetch<AirReport>('/api/air', {
  query: computed(() => ({ lat: place.value.lat, lon: place.value.lon })),
})

const assessment = computed(() => (report.value ? assess(report.value, profile) : null))

useSeoMeta({ title: () => `${place.value.name} - Smog Radar` })

// Loading and error states are minimal for now; skeletons and friendlier errors come in the polish step.
</script>

<template>
  <div class="grid gap-8">
    <PlacePicker @select="select" />

    <div v-if="report && assessment" class="grid gap-8" :class="{ 'opacity-60 transition-opacity': status === 'pending' }">
      <AirSummary :report="report" :assessment="assessment" :place="place.name" />

      <div class="grid gap-4 sm:grid-cols-2">
        <VerdictCard :verdict="assessment.walk" :now="report.current.time" :time-zone="report.location.timezone" />
        <VerdictCard :verdict="assessment.windows" :now="report.current.time" :time-zone="report.location.timezone" />
      </div>

      <ForecastTimeline :report="report" :assessment="assessment" />
    </div>

    <p v-else-if="status === 'pending'" class="text-muted">
      Loading air quality…
    </p>

    <div v-else-if="error" class="grid justify-items-start gap-3">
      <p>Couldn't load air quality data. {{ error.statusMessage }}</p>
      <button type="button" class="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm font-medium hover:bg-surface" @click="refresh()">
        Try again
      </button>
    </div>
  </div>
</template>
