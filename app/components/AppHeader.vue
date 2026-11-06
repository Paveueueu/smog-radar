<template>
  <header class="app-wrap flex h-16 items-center justify-between gap-3">
    <NuxtLink to="/" class="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink no-underline">
      <IconsRadarMark class="size-6" />
      Smog Radar
    </NuxtLink>
    <SettingsPopover />
  </header>
</template>
