<script setup lang="ts">
import type { AirReport } from '#shared/types/air'
import type { Assessment } from '~/utils/verdict'

const props = defineProps<{ report: AirReport, assessment: Assessment }>()

const tz = computed(() => props.report.location.timezone)
const now = computed(() => props.report.current.time)
const timeline = computed(() => buildTimeline(props.report, props.assessment.cleanest))

// ---------- selection: pointer, touch and arrow keys all move the same readout ----------

const selected = ref(0)
watch(() => props.report, () => { selected.value = 0 })

function onKey(e: KeyboardEvent) {
  const last = timeline.value.columns.length - 1
  const next = { ArrowRight: selected.value + 1, ArrowLeft: selected.value - 1, Home: 0, End: last }[e.key]
  if (next === undefined) return
  e.preventDefault()
  selected.value = Math.min(last, Math.max(0, next))
}

// Touch fires pointerleave after every tap, so only a mouse resets to "now".
function onLeave(e: PointerEvent) {
  if (e.pointerType === 'mouse') selected.value = 0
}

const readout = computed(() => {
  const col = timeline.value.columns[selected.value]!
  const sample = props.report.hourly[selected.value]!
  const when = col.isNow ? `Now (${col.clock})` : formatHour(col.time, now.value, tz.value)
  if (col.aqi === null) return { when, text: 'no data for this hour' }
  const band = aqiBand(col.aqi).label
  const dominant = dominantPollutant(sample)
  const by = dominant ? ` · mostly ${POLLUTANT_INFO[dominant].label}` : ''
  return { when, text: `AQI ${Math.round(col.aqi)} · ${band}${by}` }
})

const cleanestText = computed(() => {
  const c = props.assessment.cleanest
  if (!c) return null
  return `${formatRange(c.start, c.end, now.value, tz.value)}, average AQI ${Math.round(c.meanAqi)}`
})
</script>

<template>
  <section aria-labelledby="forecast-title" class="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
    <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <h2 id="forecast-title" class="text-lg font-semibold">
        Next 24 hours
      </h2>
      <p v-if="cleanestText" class="text-sm text-muted">
        Cleanest {{ CLEANEST_HOURS }} hours: <span class="font-medium text-ink">{{ cleanestText }}</span>
      </p>
    </div>

    <!-- Chart. The plot is a slider over the hours; bars and axes are decorative,
         and screen readers also get the full table below. -->
    <div class="mt-6 flex gap-2">
      <div aria-hidden="true" class="relative h-44 w-6 flex-none font-mono text-[10px] text-muted sm:h-52">
        <span
          v-for="g in timeline.gridlines"
          :key="g"
          class="absolute right-0 -translate-y-1/2"
          :style="{ bottom: `${(g / timeline.max) * 100}%` }"
        >{{ g }}</span>
      </div>

      <div class="min-w-0 flex-1">
        <div
          role="slider"
          tabindex="0"
          aria-label="Hour of the forecast"
          aria-valuemin="0"
          :aria-valuemax="timeline.columns.length - 1"
          :aria-valuenow="selected"
          :aria-valuetext="`${readout.when}: ${readout.text}`"
          class="relative h-44 cursor-crosshair rounded-sm outline-offset-4 sm:h-52"
          @keydown="onKey"
          @pointerleave="onLeave"
        >
          <span
            v-for="g in timeline.gridlines"
            :key="g"
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-0 border-t border-dashed border-line"
            :style="{ bottom: `${(g / timeline.max) * 100}%` }"
          />
          <span aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 border-t border-line-strong" />

          <div aria-hidden="true" class="absolute inset-0 grid grid-cols-[repeat(25,minmax(0,1fr))]">
            <div
              v-for="(col, i) in timeline.columns"
              :key="col.time"
              class="relative flex h-full items-end justify-center px-px sm:px-[2px]"
              :class="[
                col.isNight ? 'bg-ink/[0.035]' : '',
                col.inCleanest ? 'bg-level-good/12' : '',
                col.dayLabel ? 'border-l border-dashed border-line-strong' : '',
              ]"
              @pointerenter="selected = i"
              @pointerdown="selected = i"
            >
              <span v-if="col.dayLabel" class="absolute -top-5 left-1 font-mono text-[10px] text-muted">{{ col.dayLabel }}</span>
              <span v-if="col.isNow" class="absolute -top-5 font-mono text-[10px] font-semibold text-ink">now</span>
              <span
                v-if="col.band"
                class="w-full rounded-t-[3px] transition-[outline-color] duration-100"
                :class="[
                  BAND_BG[col.band],
                  i === selected ? 'outline-2 outline-offset-1 outline-ink' : 'outline-transparent',
                  col.clipped ? 'rounded-t-none' : '',
                ]"
                :style="{ height: `${Math.max(col.height * 100, 1.5)}%` }"
              />
              <span v-else class="w-full border-b-2 border-dotted border-muted" />
            </div>
          </div>
        </div>

        <div aria-hidden="true" class="mt-1.5 grid grid-cols-[repeat(25,minmax(0,1fr))] font-mono text-[10px] text-muted">
          <span v-for="(col, i) in timeline.columns" :key="col.time" class="text-center">
            {{ i % 3 === 0 ? col.hour : '' }}
          </span>
        </div>
      </div>
    </div>

    <p class="mt-4 flex flex-wrap items-baseline gap-x-2 border-t border-line pt-3 text-sm" aria-hidden="true">
      <span class="font-medium">{{ readout.when }}</span>
      <span class="font-mono text-ink-2">{{ readout.text }}</span>
    </p>

    <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
      <li class="flex items-center gap-1.5">
        <span class="size-3 rounded-sm bg-level-good/25" aria-hidden="true" />Cleanest stretch
      </li>
      <li class="flex items-center gap-1.5">
        <span class="size-3 rounded-sm bg-ink/10" aria-hidden="true" />Night, not suggested
      </li>
      <li class="max-sm:hidden">
        Hover or use ← → to read an hour
      </li>
      <li class="sm:hidden">
        Tap a bar to read an hour
      </li>
    </ul>

    <!-- A div, not sr-only on the table: a table ignores the 1px box and widens the page. -->
    <div class="sr-only">
      <table>
        <caption>Air quality forecast by hour, {{ tz }} time</caption>
        <thead>
          <tr>
            <th scope="col">
              Hour
            </th>
            <th scope="col">
              European AQI
            </th>
            <th scope="col">
              Band
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="col in timeline.columns" :key="col.time">
            <th scope="row">
              {{ col.isNow ? `Now, ${col.clock}` : formatHour(col.time, now, tz) }}{{ col.inCleanest ? ' (cleanest stretch)' : '' }}
            </th>
            <td>{{ col.aqi === null ? 'no data' : Math.round(col.aqi) }}</td>
            <td>{{ col.aqi === null ? '' : aqiBand(col.aqi).label }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
