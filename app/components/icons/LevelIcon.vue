<script setup lang="ts">
import type { Level } from '~/utils/verdict'

defineProps<{ level: Level | null }>()
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path v-if="level === 'good'" d="M5 12.5l4.5 4.5L19 7.5" />
    <path v-else-if="level === 'caution'" d="M5 12c2.3-3 4.7-3 7 0s4.7 3 7 0" />
    <path v-else-if="level === 'bad'" d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    <path v-else d="M7 12h10" />
  </svg>
</template>
