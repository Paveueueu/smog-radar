<script setup lang="ts">
import type { Activity } from '~/utils/verdict'

defineProps<{ activity: Activity }>()
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="activity === 'walk'">
      <path d="M12 3c-3 0-5 2.4-5 5.2 0 .5.1 1 .2 1.4A3.6 3.6 0 0 0 8.6 16h6.8a3.6 3.6 0 0 0 1.4-6.4c.1-.4.2-.9.2-1.4C17 5.4 15 3 12 3Z" />
      <path d="M12 21v-8.5M12 15.5l-2.2-2M12 14l2-1.8" />
      <path d="M7 21h10" />
    </template>
    <template v-else>
      <rect x="4.5" y="3.5" width="15" height="15" rx="1.2" />
      <path d="M12 3.5v15M4.5 11h15" />
      <path d="M3 20.5h18" />
    </template>
  </svg>
</template>
