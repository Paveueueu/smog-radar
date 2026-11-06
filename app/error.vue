<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()

const notFound = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: () => (notFound.value ? t('error.notFoundMeta') : t('error.otherMeta')) })

const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <section class="grid max-w-xl gap-4 py-10">
      <p class="tabular-nums text-xs uppercase tracking-[0.08em] text-muted">
        {{ t('error.code', { code: error.statusCode }) }}
      </p>
      <h1 class="text-4xl font-semibold tracking-tight">
        {{ notFound ? t('error.notFoundTitle') : t('error.otherTitle') }}
      </h1>
      <p class="text-lg text-ink-2">
        {{ notFound ? t('error.notFoundText') : t('error.otherText') }}
      </p>
      <div>
        <button
          type="button"
          class="cursor-pointer rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90"
          @click="goHome"
        >
          {{ t('error.home') }}
        </button>
      </div>
    </section>
  </NuxtLayout>
</template>
