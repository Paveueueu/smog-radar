<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="absolute left-4 top-3 z-50 -translate-y-20 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg focus:translate-y-0"
    >Skip to content</a>
    <AppHeader />
    <main id="main" tabindex="-1" class="app-wrap flex-1 pb-16 pt-6 outline-none sm:pt-10">
      <slot />
    </main>
    <footer class="app-wrap border-t border-line py-6 text-sm text-muted">
      Modelled data from
      <a href="https://open-meteo.com/en/docs/air-quality-api" class="underline decoration-line-strong underline-offset-2 hover:text-ink" target="_blank" rel="noopener">Open-Meteo</a>
      (CAMS European air quality forecast). Not medical advice.
      <NuxtLink to="/about" class="underline decoration-line-strong underline-offset-2 hover:text-ink">
        How it works
      </NuxtLink>
    </footer>
  </div>
</template>
