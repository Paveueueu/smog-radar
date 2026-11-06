<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <header class="app-wrap flex h-16 items-center justify-between gap-3">
    <NuxtLink to="/" class="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink no-underline">
      <IconsRadarMark class="size-6" />
      Smog Radar
    </NuxtLink>
    <nav :aria-label="t('nav.main')" class="flex items-center gap-1">
      <NuxtLink
        to="/about"
        class="rounded-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-ink aria-[current=page]:text-ink max-sm:hidden"
      >
        {{ t('nav.about') }}
      </NuxtLink>
      <LanguageSwitch />
      <ThemeToggle />
    </nav>
  </header>
</template>
