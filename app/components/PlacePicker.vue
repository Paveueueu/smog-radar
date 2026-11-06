<script setup lang="ts">
const emit = defineEmits<{ select: [place: SelectedPlace] }>()
const { t } = useI18n()

const { locate, pending, error } = useDeviceLocation()

async function useMyLocation() {
  const pos = await locate()
  if (pos) emit('select', { name: formatCoords(pos.lat, pos.lon), lat: pos.lat, lon: pos.lon })
}
</script>

<template>
  <div class="grid gap-2">
    <div class="flex items-center gap-2">
      <PlaceSearch @select="emit('select', $event)" />
      <button
        type="button"
        :disabled="pending"
        :aria-busy="pending"
        class="flex h-11 flex-none cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium shadow-card hover:border-line-strong disabled:cursor-wait disabled:opacity-60"
        @click="useMyLocation"
      >
        <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="7" />
        </svg>
        <span class="max-sm:sr-only">{{ pending ? t('place.locating') : t('place.useMyLocation') }}</span>
      </button>
    </div>
    <p v-if="error" role="status" class="px-4 text-sm text-level-bad-text">
      {{ t(`place.geo.${error}`) }}
    </p>
  </div>
</template>
