<script setup lang="ts">
const colorMode = useColorMode()
const { t } = useI18n()

// The resolved mode is only known in the browser; render a neutral label until then.
const mounted = useMounted()
const isDark = computed(() => colorMode.value === 'dark')
const label = computed(() => {
  if (!mounted.value) return t('theme.label')
  return isDark.value ? t('theme.toLight') : t('theme.toDark')
})

function toggle() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    class="grid size-10 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </svg>
  </button>
</template>
