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
    class="relative flex flex-col overflow-hidden rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
    :aria-labelledby="`${verdict.activity}-title`"
  >
    <span aria-hidden="true" class="absolute inset-y-0 left-0 w-1" :class="style?.accent ?? 'bg-line-strong'" />

    <div class="flex items-center justify-between gap-3">
      <h2 :id="`${verdict.activity}-title`" class="flex items-center gap-2 text-sm font-medium text-muted">
        <IconsActivityIcon :activity="verdict.activity" class="size-5" />
        {{ t(`activity.${verdict.activity}`) }}
      </h2>
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="style ? [style.soft, style.text] : 'bg-surface-2 text-muted'"
      >
        <IconsLevelIcon :level="verdict.level" class="size-3.5" />
        {{ t(`level.${verdict.level ?? 'unknown'}`) }}
      </span>
    </div>

    <p class="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-[2.1rem]">
      {{ headline }}
    </p>
    <p class="mt-2 text-ink-2">
      {{ advice }}
    </p>

    <div v-if="outlook" class="mt-auto pt-5">
      <p class="border-t border-line pt-3 text-sm text-muted">
        {{ outlook }}
      </p>
    </div>
  </article>
</template>
