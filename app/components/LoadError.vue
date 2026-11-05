<script setup lang="ts">
const props = defineProps<{ status?: number, retrying: boolean }>()
defineEmits<{ retry: [] }>()

const message = computed(() =>
  props.status === 400
    ? 'That location doesn\'t look right. Search for a place instead.'
    : 'We couldn\'t reach the air quality service. It\'s usually back within a few minutes.',
)
</script>

<template>
  <section role="alert" class="grid justify-items-start gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
    <div>
      <h2 class="text-lg font-semibold">
        No air quality data right now
      </h2>
      <p class="mt-1 text-ink-2">
        {{ message }}
      </p>
    </div>
    <button
      v-if="status !== 400"
      type="button"
      :disabled="retrying"
      class="cursor-pointer rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      @click="$emit('retry')"
    >
      {{ retrying ? 'Trying again…' : 'Try again' }}
    </button>
  </section>
</template>
