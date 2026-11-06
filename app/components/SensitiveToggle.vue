<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

const profile = defineModel<Profile>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="flex items-start gap-3">
    <SwitchRoot
      id="sensitive"
      v-model="profile"
      true-value="sensitive"
      false-value="general"
      aria-describedby="sensitive-help"
      class="relative mt-0.5 inline-flex h-6 w-11 flex-none cursor-pointer items-center rounded-full bg-line-strong p-0.5 transition-colors data-[state=checked]:bg-ink"
    >
      <SwitchThumb
        class="block size-5 rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-5"
      />
    </SwitchRoot>
    <div>
      <label for="sensitive" class="cursor-pointer font-medium">{{ t('sensitive.label') }}</label>
      <p id="sensitive-help" class="text-sm text-muted">
        {{ t('sensitive.help') }}
      </p>
    </div>
  </div>
</template>
