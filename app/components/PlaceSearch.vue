<script setup lang="ts">
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxViewport,
} from 'reka-ui'
import type { Place } from '#shared/types/air'

const emit = defineEmits<{ select: [place: SelectedPlace] }>()
const { t, locale } = useI18n()

const MIN_CHARS = 2

const term = ref('')
const results = ref<Place[]>([])
const state = ref<'idle' | 'loading' | 'done' | 'error'>('idle')
const open = ref(false)

// Ignore responses to older queries.
let controller: AbortController | null = null

async function search(q: string) {
  controller?.abort()
  if (q.trim().length < MIN_CHARS) {
    results.value = []
    state.value = 'idle'
    return
  }
  controller = new AbortController()
  state.value = 'loading'
  try {
    results.value = await $fetch<Place[]>('/api/geocode', { query: { q: q.trim(), lang: locale.value }, signal: controller.signal })
    state.value = 'done'
  }
  catch (e) {
    if ((e as Error).name === 'AbortError' || controller.signal.aborted) return
    results.value = []
    state.value = 'error'
  }
}

watchDebounced(term, search, { debounce: 250 })

function onSelect(place: Place | null) {
  if (!place) return
  emit('select', { name: place.name, lat: place.lat, lon: place.lon })
  term.value = ''
  results.value = []
  state.value = 'idle'
  open.value = false
}
</script>

<template>
  <ComboboxRoot
    v-model:open="open"
    :model-value="null"
    by="id"
    ignore-filter
    :reset-search-term-on-blur="false"
    class="relative min-w-0 flex-1"
    @update:model-value="onSelect"
  >
    <ComboboxAnchor
      class="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 shadow-card focus-within:border-line-strong"
    >
      <svg viewBox="0 0 24 24" class="size-4 flex-none text-muted" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2" />
      </svg>
      <ComboboxInput
        v-model="term"
        :placeholder="t('place.search')"
        :aria-label="t('place.search')"
        autocomplete="off"
        class="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        @focus="open = term.trim().length >= MIN_CHARS"
        @input="open = true"
      />
      <span v-if="state === 'loading'" class="size-4 flex-none animate-spin rounded-full motion-reduce:animate-none border-2 border-line-strong border-t-ink" aria-hidden="true" />
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        v-if="term.trim().length >= MIN_CHARS"
        position="popper"
        :side-offset="6"
        class="z-50 w-(--reka-combobox-trigger-width) min-w-64 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-card"
      >
        <ComboboxViewport class="max-h-72">
          <ComboboxItem
            v-for="place in results"
            :key="place.id"
            :value="place"
            :text-value="place.name"
            class="flex cursor-pointer flex-col rounded-xl px-3 py-2 outline-none data-[highlighted]:bg-bg"
          >
            <span class="font-medium text-ink">{{ place.name }}</span>
            <span v-if="placeContext(place)" class="text-sm text-muted">{{ placeContext(place) }}</span>
          </ComboboxItem>

          <ComboboxEmpty v-if="state === 'done'" class="px-3 py-2 text-sm text-muted">
            {{ t('place.noMatch', { query: term.trim() }) }}
          </ComboboxEmpty>
          <p v-else-if="state === 'loading' && !results.length" class="px-3 py-2 text-sm text-muted">
            {{ t('place.searching') }}
          </p>
          <p v-else-if="state === 'error'" class="px-3 py-2 text-sm text-muted">
            {{ t('place.searchDown') }}
          </p>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
