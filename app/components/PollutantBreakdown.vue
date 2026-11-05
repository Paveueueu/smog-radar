<script setup lang="ts">
import type { AirSample } from '#shared/types/air'

const props = defineProps<{ sample: AirSample }>()

const rows = computed(() => pollutantRows(props.sample))
const formatValue = (v: number) => (v < 10 ? v.toFixed(1) : String(Math.round(v)))
</script>

<template>
  <section aria-labelledby="pollutants-title" class="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
    <h2 id="pollutants-title" class="text-lg font-semibold">
      What's in the air
    </h2>
    <p class="mt-1 text-sm text-muted">
      This hour, against the WHO 2021 air quality guidelines.
    </p>

    <ul class="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
      <li v-for="row in rows" :key="row.id" class="min-w-0">
        <div class="flex items-baseline justify-between gap-3">
          <p class="min-w-0">
            <span class="font-semibold">{{ row.label }}</span>
            <span class="ml-2 text-sm text-muted">{{ row.name }}</span>
          </p>
          <p class="flex-none font-mono text-sm">
            <template v-if="row.value !== null">
              {{ formatValue(row.value) }} <span class="text-muted">µg/m³</span>
            </template>
            <span v-else class="text-muted">no data</span>
          </p>
        </div>

        <div aria-hidden="true" class="relative mt-2 h-2 rounded-full bg-line">
          <span
            v-if="row.band"
            class="absolute inset-y-0 left-0 rounded-full"
            :class="BAND_BG[row.band]"
            :style="{ width: `${Math.max(row.bar * 100, 2)}%` }"
          />
          <span
            class="absolute -inset-y-1 w-0.5 rounded-full bg-ink"
            :style="{ left: `${GUIDELINE_MARK * 100}%` }"
          />
        </div>

        <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span v-if="row.ratioText" class="text-ink-2">{{ row.ratioText }}</span>
          <span v-if="row.subIndex !== null" class="font-mono text-xs text-muted">EAQI {{ Math.round(row.subIndex) }}</span>
          <span
            v-if="row.isDominant"
            class="rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-bg"
          >sets the index</span>
        </p>
      </li>
    </ul>

    <p class="mt-6 border-t border-line pt-3 text-xs text-muted">
      The tick marks the guideline: a 24-hour mean (8-hour for ozone). These are hourly values, so treat the
      comparison as a pointer, not a compliance check. The answers above use the European AQI only.
    </p>
  </section>
</template>
