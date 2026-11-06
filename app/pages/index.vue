<script setup lang="ts">
import type { AirReport } from '#shared/types/air'

const { t } = useI18n()
const { place, select } = usePlace()
const profile = useProfile()

const { data: report, status, error, refresh } = await useFetch<AirReport>('/api/air', {
  query: computed(() => ({ lat: place.value.lat, lon: place.value.lon })),
})

useAutoRefresh(report, refresh)

const assessment = computed(() => (report.value ? assess(report.value, profile.value) : null))
const updating = computed(() => status.value === 'pending' && !!report.value)

useSeoMeta({ title: () => t('meta.placeTitle', { place: place.value.name }) })
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-2">
      <div class="flex items-center justify-between gap-3">
        <PlaceDialog :place="place.name" @select="select" />
        <p v-if="updating" role="status" class="flex-none font-mono text-xs text-muted">
          {{ t('state.updating') }}
        </p>
      </div>
      <AirSummary v-if="report && assessment && !error" :report="report" :assessment="assessment" />
    </div>

    <LoadError
      v-if="error"
      :status="error.statusCode"
      :retrying="status === 'pending'"
      @retry="refresh()"
    />

    <template v-else-if="report && assessment">
      <div class="grid gap-3 transition-opacity" :class="{ 'opacity-60': updating }" :aria-busy="updating">
        <div class="grid gap-3 sm:grid-cols-2">
          <VerdictCard :verdict="assessment.walk" :now="report.current.time" :time-zone="report.location.timezone" />
          <VerdictCard :verdict="assessment.windows" :now="report.current.time" :time-zone="report.location.timezone" />
        </div>
        <p v-if="profile === 'sensitive'" class="flex items-center gap-2 text-sm text-muted">
          <span class="size-2 rounded-full bg-level-caution" aria-hidden="true" />
          {{ t('sensitive.on') }}
        </p>
      </div>

      <DetailTabs :report="report" :assessment="assessment" :class="{ 'opacity-60': updating }" />
    </template>

    <div v-else>
      <p role="status" class="sr-only">
        {{ t('state.loading') }}
      </p>
      <LoadingSkeleton />
    </div>
  </div>
</template>
