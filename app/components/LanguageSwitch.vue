<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
</script>

<template>
  <div role="group" :aria-label="t('language.label')" class="flex rounded-full border border-line p-0.5">
    <button
      v-for="l in locales"
      :key="l.code"
      type="button"
      :lang="l.code"
      :title="l.name"
      :aria-pressed="l.code === locale"
      class="cursor-pointer rounded-full px-2.5 py-1 tabular-nums text-xs font-medium uppercase text-muted hover:text-ink aria-pressed:bg-ink aria-pressed:text-bg"
      @click="setLocale(l.code)"
    >
      {{ l.code }}
    </button>
  </div>
</template>
