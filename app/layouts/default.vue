<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />
    <main class="app-wrap flex-1 pb-16 pt-6 sm:pt-10">
      <slot />
    </main>
    <footer class="app-wrap border-t border-line py-6 text-sm text-muted">
      Modelled data from
      <a href="https://open-meteo.com/en/docs/air-quality-api" class="underline decoration-line-strong underline-offset-2 hover:text-ink" target="_blank" rel="noopener">Open-Meteo</a>
      (CAMS European air quality forecast). Not medical advice.
    </footer>
  </div>
</template>
