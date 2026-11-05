<script setup lang="ts">
// The six European AQI bands as a strip, with a marker at the current value.
// Decorative: the same information is in the text next to it.
const props = defineProps<{ aqi: number }>()

/** Values above this sit at the end of the strip. */
const SCALE_MAX = 120

const segments = AQI_BANDS.map(b => ({
  id: b.id,
  width: ((Math.min(b.max, SCALE_MAX) - b.min) / SCALE_MAX) * 100,
}))
const position = (v: number) => (Math.min(Math.max(v, 0), SCALE_MAX) / SCALE_MAX) * 100
const marker = computed(() => position(props.aqi))
const ticks = [0, 20, 40, 60, 80, 100].map(v => ({ v, left: position(v) }))
</script>

<template>
  <div aria-hidden="true" class="relative pt-3">
    <div class="flex h-2 gap-0.5 overflow-hidden rounded-full">
      <span
        v-for="s in segments"
        :key="s.id"
        :class="BAND_BG[s.id]"
        class="h-full"
        :style="{ width: `${s.width}%` }"
      />
    </div>
    <span
      class="absolute top-0 size-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-ink"
      :style="{ left: `${marker}%` }"
    />
    <div class="relative mt-1.5 h-4 font-mono text-[11px] text-muted">
      <span
        v-for="t in ticks"
        :key="t.v"
        class="absolute"
        :class="t.v === 0 ? '' : '-translate-x-1/2'"
        :style="{ left: `${t.left}%` }"
      >{{ t.v }}</span>
    </div>
  </div>
</template>
