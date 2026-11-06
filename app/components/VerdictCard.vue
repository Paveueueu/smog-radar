<script setup lang="ts">
import type { ActivityVerdict } from '~/utils/verdict'

const props = defineProps<{
  verdict: ActivityVerdict
  /** ISO UTC */
  now: string
  timeZone: string
}>()

const { t } = useI18n()
const text = useAirText()

const style = computed(() => (props.verdict.level ? LEVEL_STYLE[props.verdict.level] : null))

const headline = computed(() => {
  const { activity, level } = props.verdict
  return level ? t(`verdict.${activity}.${level}.headline`) : t('verdict.noData.headline')
})
const advice = computed(() => {
  const { activity, level, profile } = props.verdict
  return level ? t(`verdict.${activity}.${level}.advice.${profile}`) : t('verdict.noData.advice')
})

const outlook = computed(() => {
  const v = props.verdict
  if (v.level === null || v.level === 'good') return null
  if (v.betterAt) return t('verdict.nextGood', { hour: text.hour(v.betterAt.start, props.now, props.timeZone) })
  return t('verdict.noBetter')
})
</script>

<template>
  <article
    class="relative flex flex-col overflow-hidden rounded-card border border-line bg-surface py-4 pl-5 pr-4 shadow-card"
    :aria-labelledby="`${verdict.activity}-title`"
  >
    <span aria-hidden="true" class="absolute inset-y-0 left-0 w-1" :class="style?.accent ?? 'bg-line-strong'" />

    <h2 :id="`${verdict.activity}-title`" class="flex items-center gap-2 text-sm text-muted">
      <IconsActivityIcon :activity="verdict.activity" class="size-4" />
      {{ t(`activity.${verdict.activity}`) }}
      <span class="sr-only">: {{ t(`level.${verdict.level ?? 'unknown'}`) }}</span>
    </h2>

    <p class="mt-2 flex items-start gap-2 text-2xl font-semibold leading-tight tracking-tight">
      <span
        aria-hidden="true"
        class="mt-1 grid size-6 flex-none place-items-center rounded-full"
        :class="style ? [style.soft, style.text] : 'bg-surface-2 text-muted'"
      >
        <IconsLevelIcon :level="verdict.level" class="size-3.5" />
      </span>
      {{ headline }}
    </p>
    <p class="mt-1.5 text-sm text-ink-2">
      {{ advice }}
    </p>
    <p v-if="outlook" class="mt-2 text-sm text-muted">
      {{ outlook }}
    </p>
  </article>
</template>
