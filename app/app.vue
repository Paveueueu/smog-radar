<script setup lang="ts">
const { t } = useI18n()
const head = useLocaleHead()

useHead(() => ({ htmlAttrs: { lang: head.value.htmlAttrs?.lang } }))
useSeoMeta({ description: () => t('meta.description') })
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
