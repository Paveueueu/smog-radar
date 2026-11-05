<script setup lang="ts">
import type { ActivityVerdict } from '~/utils/verdict'

const props = defineProps<{
  verdict: ActivityVerdict
  /** ISO UTC */
  now: string
  timeZone: string
}>()

const TITLE = { walk: 'Going for a walk', windows: 'Opening the windows' } as const

const style = computed(() => (props.verdict.level ? LEVEL_STYLE[props.verdict.level] : null))

const outlook = computed(() => {
  const v = props.verdict
  if (v.level === null || v.level === 'good') return null
  if (v.betterAt) return `Better from ${formatHour(v.betterAt.start, props.now, props.timeZone)}`
  return 'No better hour in the next 24 hours'
})
</script>

<template>
  <article
    class="relative flex flex-col overflow-hidden rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
    :aria-labelledby="`${verdict.activity}-title`"
  >
    <span aria-hidden="true" class="absolute inset-y-0 left-0 w-1" :class="style?.accent ?? 'bg-line-strong'" />

    <div class="flex items-center justify-between gap-3">
      <h2 :id="`${verdict.activity}-title`" class="flex items-center gap-2 text-sm font-medium text-muted">
        <IconsActivityIcon :activity="verdict.activity" class="size-5" />
        {{ TITLE[verdict.activity] }}
      </h2>
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="style ? [style.soft, style.text] : 'bg-surface-2 text-muted'"
      >
        <IconsLevelIcon :level="verdict.level" class="size-3.5" />
        {{ style?.label ?? 'Unknown' }}
      </span>
    </div>

    <p class="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-[2.1rem]">
      {{ verdict.headline }}
    </p>
    <p class="mt-2 text-ink-2">
      {{ verdict.advice }}
    </p>

    <div v-if="outlook" class="mt-auto pt-5">
      <p class="border-t border-line pt-3 text-sm text-muted">
        {{ outlook }}
      </p>
    </div>
  </article>
</template>
