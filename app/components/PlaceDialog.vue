<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

defineProps<{ place: string }>()
const emit = defineEmits<{ select: [place: SelectedPlace] }>()
const { t } = useI18n()

const open = defineModel<boolean>('open', { default: false })

// Focus the search box, not the close button.
function focusSearch(e: Event) {
  e.preventDefault()
  document.getElementById('place-search')?.focus()
}

function onSelect(place: SelectedPlace) {
  emit('select', place)
  open.value = false
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <h1 class="min-w-0 flex-1">
      <DialogTrigger as-child>
        <button
          type="button"
          aria-describedby="place-change-hint"
          class="group -mx-1 inline-flex max-w-full cursor-pointer items-center gap-2 rounded-xl px-1 text-left text-4xl font-semibold tracking-tight hover:bg-surface sm:text-5xl"
        >
          <span class="truncate">{{ place }}</span>
          <svg viewBox="0 0 24 24" class="size-6 flex-none text-muted transition-colors group-hover:text-ink sm:size-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </button>
      </DialogTrigger>
    </h1>
    <span id="place-change-hint" class="sr-only">{{ t('place.change') }}</span>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]" />
      <DialogContent
        class="fixed left-1/2 top-[8vh] z-50 grid max-h-[84vh] w-[min(92vw,30rem)] -translate-x-1/2 gap-4 overflow-y-auto rounded-card border border-line bg-surface p-5 shadow-card focus:outline-none"
        @open-auto-focus="focusSearch"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <DialogTitle class="text-lg font-semibold">
              {{ t('place.dialogTitle') }}
            </DialogTitle>
            <DialogDescription class="text-sm text-muted">
              {{ t('place.dialogHelp') }}
            </DialogDescription>
          </div>
          <DialogClose
            class="grid size-9 flex-none cursor-pointer place-items-center rounded-full text-muted hover:bg-bg hover:text-ink"
            :aria-label="t('place.close')"
          >
            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </DialogClose>
        </div>
        <PlacePicker @select="onSelect" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
