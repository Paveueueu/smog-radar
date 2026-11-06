<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'

const { t } = useI18n()
const profile = useProfile()
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger
      class="relative grid size-10 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface hover:text-ink data-[state=open]:bg-surface data-[state=open]:text-ink"
      :aria-label="t('settings.label')"
    >
      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </svg>
      <span v-if="profile === 'sensitive'" class="absolute right-2 top-2 size-2 rounded-full bg-level-caution" aria-hidden="true" />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        align="end"
        :side-offset="8"
        class="z-50 grid w-[min(92vw,20rem)] gap-5 rounded-card border border-line bg-surface p-4 shadow-card focus:outline-none"
      >
        <div class="grid gap-2">
          <p class="text-xs font-medium uppercase tracking-[0.06em] text-muted">
            {{ t('language.label') }}
          </p>
          <LanguageSwitch class="w-full [&>button]:flex-1" />
        </div>

        <div class="grid gap-2">
          <p class="text-xs font-medium uppercase tracking-[0.06em] text-muted">
            {{ t('settings.theme') }}
          </p>
          <ThemeSwitch />
        </div>

        <SensitiveToggle v-model="profile" />

        <NuxtLink to="/about" class="border-t border-line pt-3 text-sm text-muted underline decoration-line-strong underline-offset-2 hover:text-ink">
          {{ t('nav.about') }}
        </NuxtLink>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
