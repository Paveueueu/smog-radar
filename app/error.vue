<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: () => (notFound.value ? 'Page not found - Smog Radar' : 'Something went wrong - Smog Radar') })

const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <section class="grid max-w-xl gap-4 py-10">
      <p class="font-mono text-xs uppercase tracking-[0.08em] text-muted">
        Error {{ error.statusCode }}
      </p>
      <h1 class="text-4xl font-semibold tracking-tight">
        {{ notFound ? 'There\'s nothing on this page' : 'Something went wrong' }}
      </h1>
      <p class="text-lg text-ink-2">
        {{ notFound ? 'The address may be mistyped, or the page has moved.' : 'Please try again in a moment.' }}
      </p>
      <div>
        <button
          type="button"
          class="cursor-pointer rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90"
          @click="goHome"
        >
          Check the air
        </button>
      </div>
    </section>
  </NuxtLayout>
</template>
