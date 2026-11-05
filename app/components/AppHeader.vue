<template>
  <header class="app-wrap flex h-16 items-center justify-between">
    <NuxtLink to="/" class="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink no-underline">
      <IconsRadarMark class="size-6" />
      Smog Radar
    </NuxtLink>
    <nav aria-label="Main" class="flex items-center gap-1">
      <NuxtLink
        to="/about"
        class="rounded-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-ink aria-[current=page]:text-ink"
      >
        About the data
      </NuxtLink>
      <ThemeToggle />
    </nav>
  </header>
</template>
