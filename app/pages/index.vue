<script setup lang="ts">
import type { AirReport } from '#shared/types/air'

const { place, select } = usePlace()
const profile = useProfile()

const { data: report, status, error, refresh } = await useFetch<AirReport>('/api/air', {
  query: computed(() => ({ lat: place.value.lat, lon: place.value.lon })),
})

useAutoRefresh(report, refresh)

const assessment = computed(() => (report.value ? assess(report.value, profile.value) : null))
const updating = computed(() => status.value === 'pending' && !!report.value)

useSeoMeta({ title: () => `${place.value.name} - Smog Radar` })
</script>

<template>
  <div class="grid gap-8">
    <PlacePicker @select="select" />

    <LoadError
      v-if="error"
      :status="error.statusCode"
      :retrying="status === 'pending'"
      @retry="refresh()"
    />

    <div
      v-else-if="report && assessment"
      class="relative grid gap-8 transition-opacity"
      :class="{ 'opacity-60': updating }"
      :aria-busy="updating"
    >
      <p
        v-if="updating"
        role="status"
        class="absolute -top-6 right-0 font-mono text-xs text-muted"
      >
        Updating…
      </p>

      <AirSummary :report="report" :assessment="assessment" :place="place.name" />

      <div class="grid gap-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <VerdictCard :verdict="assessment.walk" :now="report.current.time" :time-zone="report.location.timezone" />
          <VerdictCard :verdict="assessment.windows" :now="report.current.time" :time-zone="report.location.timezone" />
        </div>
        <SensitiveToggle v-model="profile" class="px-1" />
      </div>

      <ForecastTimeline :report="report" :assessment="assessment" />

      <PollutantBreakdown :sample="report.current" />
    </div>

    <div v-else>
      <p role="status" class="sr-only">
        Loading air quality…
      </p>
      <LoadingSkeleton />
    </div>
  </div>
</template>
