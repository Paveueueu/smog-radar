<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="absolute left-4 top-3 z-50 -translate-y-20 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg focus:translate-y-0"
    >{{ t('nav.skip') }}</a>
    <AppHeader />
    <main id="main" tabindex="-1" class="app-wrap flex-1 pb-16 pt-6 outline-none sm:pt-10">
      <slot />
    </main>
    <footer class="app-wrap border-t border-line py-6 text-sm text-muted">
      <i18n-t keypath="footer.data" tag="span" scope="global">
        <template #source>
          <a href="https://open-meteo.com/en/docs/air-quality-api" class="underline decoration-line-strong underline-offset-2 hover:text-ink" target="_blank" rel="noopener">Open-Meteo</a>
        </template>
      </i18n-t>
      {{ ' ' }}
      <NuxtLink to="/about" class="underline decoration-line-strong underline-offset-2 hover:text-ink">
        {{ t('footer.how') }}
      </NuxtLink>
    </footer>
  </div>
</template>
