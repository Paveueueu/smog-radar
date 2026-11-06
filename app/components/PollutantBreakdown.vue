<script setup lang="ts">
import type { AirSample } from '#shared/types/air'

const props = defineProps<{ sample: AirSample }>()

const { t } = useI18n()
const text = useAirText()

const rows = computed(() => pollutantRows(props.sample))
</script>

<template>
  <div>
    <p class="text-sm text-muted">
      {{ t('pollutants.subtitle') }}
    </p>

    <ul class="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
      <li v-for="row in rows" :key="row.id" class="min-w-0">
        <div class="flex items-baseline justify-between gap-3">
          <p class="min-w-0">
            <span class="font-semibold">{{ row.label }}</span>
            <span class="ml-2 text-sm text-muted">{{ t(`pollutant.${row.id}`) }}</span>
          </p>
          <p class="flex-none font-mono text-sm">
            <template v-if="row.value !== null">
              {{ text.concentration(row.value) }} <span class="text-muted">{{ t('pollutants.unit') }}</span>
            </template>
            <span v-else class="text-muted">{{ t('pollutants.noData') }}</span>
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
          <span v-if="row.ratio !== null" class="text-ink-2">{{ text.ratio(row.ratio) }}</span>
          <span v-if="row.subIndex !== null" class="font-mono text-xs text-muted">EAQI {{ Math.round(row.subIndex) }}</span>
          <span
            v-if="row.isDominant"
            class="rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-bg"
          >{{ t('pollutants.setsIndex') }}</span>
        </p>
      </li>
    </ul>

    <p class="mt-6 border-t border-line pt-3 text-xs text-muted">
      {{ t('pollutants.note') }}
    </p>
  </div>
</template>
