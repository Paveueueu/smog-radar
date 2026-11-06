<script setup lang="ts">
const colorMode = useColorMode()
const { t } = useI18n()

// The stored preference is only known after hydration.
const mounted = useMounted()
const OPTIONS = ['light', 'dark', 'system'] as const
</script>

<template>
  <div role="group" :aria-label="t('settings.theme')" class="flex rounded-full border border-line p-0.5">
    <button
      v-for="mode in OPTIONS"
      :key="mode"
      type="button"
      :aria-pressed="mounted && colorMode.preference === mode"
      class="flex-1 cursor-pointer rounded-full px-3 py-1 text-xs font-medium text-muted hover:text-ink aria-pressed:bg-ink aria-pressed:text-bg"
      @click="colorMode.preference = mode"
    >
      {{ t(`settings.${mode}`) }}
    </button>
  </div>
</template>
