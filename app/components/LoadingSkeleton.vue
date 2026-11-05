<template>
  <div class="grid gap-8 motion-safe:animate-pulse" aria-hidden="true">
    <div class="grid gap-3">
      <div class="h-3 w-32 rounded bg-line" />
      <div class="h-10 w-56 rounded bg-line" />
      <div class="h-5 w-72 max-w-full rounded bg-line" />
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div v-for="i in 2" :key="i" class="h-44 rounded-card border border-line bg-surface" />
    </div>
    <div class="h-72 rounded-card border border-line bg-surface" />
  </div>
</template>
