<script setup lang="ts">
defineProps<{ source: PlaceSource }>()
defineEmits<{ choose: [] }>()
const { t } = useI18n()
</script>

<template>
  <i18n-t
    v-if="source === 'network' || source === 'default'"
    :keypath="source === 'network' ? 'place.hintNetwork' : 'place.hintDefault'"
    tag="p"
    scope="global"
    class="text-sm text-muted"
  >
    <template #choose>
      <button
        type="button"
        class="cursor-pointer font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
        @click="$emit('choose')"
      >
        {{ t('place.choose') }}
      </button>
    </template>
  </i18n-t>
</template>
