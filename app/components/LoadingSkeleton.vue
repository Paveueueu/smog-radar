<template>
  <div class="grid gap-6 motion-safe:animate-pulse" aria-hidden="true">
    <div class="grid gap-2">
      <div class="h-6 w-64 max-w-full rounded bg-line" />
      <div class="h-3 w-40 rounded bg-line" />
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <div v-for="i in 2" :key="i" class="h-32 rounded-card border border-line bg-surface" />
    </div>
    <div class="h-80 rounded-card border border-line bg-surface" />
  </div>
</template>
