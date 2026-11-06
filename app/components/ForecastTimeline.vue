<script setup lang="ts">
import type { AirReport } from '#shared/types/air'
import type { Assessment } from '~/utils/verdict'

const props = defineProps<{ report: AirReport, assessment: Assessment }>()

const { t, locale } = useI18n()
const text = useAirText()

const tz = computed(() => props.report.location.timezone)
const now = computed(() => props.report.current.time)
const timeline = computed(() => buildTimeline(props.report, props.assessment.cleanest, locale.value))

const selected = ref(0)
const reading = ref(false)
watch(() => props.report, () => {
  selected.value = 0
  reading.value = false
})

function pick(i: number) {
  selected.value = i
  reading.value = true
}

// Touch fires pointerleave after every tap, so only a mouse resets to "now".
function onLeave(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  selected.value = 0
  reading.value = false
}

const readout = computed(() => {
  const col = timeline.value.columns[selected.value]!
  const sample = props.report.hourly[selected.value]!
  const when = col.isNow ? t('time.now', { clock: col.clock }) : text.hour(col.time, now.value, tz.value)
  if (col.aqi === null) return { when, text: t('forecast.noData') }
  const band = text.band(aqiBand(col.aqi).id)
  const aqi = Math.round(col.aqi)
  const dominant = dominantPollutant(sample)
  return {
    when,
    text: dominant
      ? t('forecast.readoutBy', { aqi, band, pollutant: POLLUTANT_INFO[dominant].label })
      : t('forecast.readout', { aqi, band }),
  }
})

const cleanestText = computed(() => {
  const c = props.assessment.cleanest
  if (!c) return null
  return t('forecast.cleanestValue', { range: text.range(c.start, c.end, now.value, tz.value), aqi: Math.round(c.meanAqi) })
})
</script>

<template>
  <div>
    <p v-if="cleanestText" class="grid border-b border-line pb-3 text-sm">
      <span class="text-muted">{{ t('forecast.cleanest', { n: CLEANEST_HOURS }) }}</span>
      <span class="font-medium tabular-nums text-ink">{{ cleanestText }}</span>
    </p>

    <!-- Hidden from screen readers; they get the table below. -->
    <div class="mt-6 flex gap-2">
      <div aria-hidden="true" class="relative h-44 w-6 flex-none tabular-nums text-[10px] text-muted sm:h-52">
        <span
          v-for="g in timeline.gridlines"
          :key="g"
          class="absolute right-0 -translate-y-1/2"
          :style="{ bottom: `${(g / timeline.max) * 100}%` }"
        >{{ g }}</span>
      </div>

      <div class="min-w-0 flex-1">
        <div
          aria-hidden="true"
          class="relative h-44 sm:h-52"
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
                col.inCleanest ? 'bg-level-good/12' : '',
                col.dayLabel ? 'border-l border-dashed border-line-strong' : '',
              ]"
              @pointerenter="pick(i)"
              @pointerdown="pick(i)"
            >
              <span v-if="col.dayLabel" class="absolute -top-5 left-1 tabular-nums text-[10px] text-muted">{{ col.dayLabel }}</span>
              <span v-if="col.isNow" class="absolute -top-5 tabular-nums text-[10px] font-semibold text-ink">{{ t('forecast.now') }}</span>
              <span
                v-if="col.band"
                class="w-full rounded-t-[3px] transition-opacity duration-150 motion-reduce:transition-none"
                :class="[
                  BAND_BG[col.band],
                  reading && i !== selected ? 'opacity-35' : 'opacity-100',
                  col.clipped ? 'rounded-t-none' : '',
                ]"
                :style="{ height: `${Math.max(col.height * 100, 1.5)}%` }"
              />
              <span v-else class="w-full border-b-2 border-dotted border-muted" />
            </div>
          </div>
        </div>

        <div aria-hidden="true" class="mt-1.5 grid grid-cols-[repeat(25,minmax(0,1fr))] tabular-nums text-[10px] text-muted">
          <span v-for="(col, i) in timeline.columns" :key="col.time" class="text-center">
            {{ i % 3 === 0 ? col.hour : '' }}
          </span>
        </div>
      </div>
    </div>

    <p class="mt-4 grid border-t border-line pt-3 text-sm" aria-hidden="true">
      <span class="font-medium">{{ readout.when }}</span>
      <span class="tabular-nums text-ink-2">{{ readout.text }}</span>
    </p>

    <!-- A div, not sr-only on the table: a table ignores the 1px box and widens the page. -->
    <div class="sr-only">
      <table>
        <caption>{{ t('forecast.caption', { tz }) }}</caption>
        <thead>
          <tr>
            <th scope="col">
              {{ t('forecast.colHour') }}
            </th>
            <th scope="col">
              {{ t('forecast.colAqi') }}
            </th>
            <th scope="col">
              {{ t('forecast.colBand') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="col in timeline.columns" :key="col.time">
            <th scope="row">
              {{ col.isNow ? t('time.now', { clock: col.clock }) : text.hour(col.time, now, tz) }}{{ col.inCleanest ? ` ${t('forecast.cleanestMark')}` : '' }}
            </th>
            <td>{{ col.aqi === null ? t('pollutants.noData') : Math.round(col.aqi) }}</td>
            <td>{{ col.aqi === null ? '' : text.band(aqiBand(col.aqi).id) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
