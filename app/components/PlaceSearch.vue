<script setup lang="ts">
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxRoot,
  ComboboxViewport,
} from 'reka-ui'
import type { Place, PlaceResults } from '#shared/types/air'

// Results near `near` come first.
const props = defineProps<{ near?: { lat: number, lon: number } }>()
const emit = defineEmits<{ select: [place: SelectedPlace] }>()
const { t, locale } = useI18n()

const MIN_CHARS = 2

const term = ref('')
const NO_RESULTS: PlaceResults = { places: [], districts: null }
const results = ref<PlaceResults>(NO_RESULTS)
const head = computed(() => (results.value.districts ? results.value.places.slice(0, 1) : results.value.places))
const tail = computed(() => (results.value.districts ? results.value.places.slice(1) : []))
const hasResults = computed(() => results.value.places.length > 0 || !!results.value.districts)
const state = ref<'idle' | 'loading' | 'done' | 'error'>('idle')
const open = ref(false)

// Ignore responses to older queries.
let controller: AbortController | null = null

async function search(q: string) {
  controller?.abort()
  if (q.trim().length < MIN_CHARS) {
    results.value = NO_RESULTS
    state.value = 'idle'
    return
  }
  controller = new AbortController()
  state.value = 'loading'
  try {
    results.value = await $fetch<PlaceResults>('/api/geocode', { query: { q: q.trim(), lang: locale.value, lat: props.near?.lat, lon: props.near?.lon }, signal: controller.signal })
    state.value = 'done'
  }
  catch (e) {
    if ((e as Error).name === 'AbortError' || controller.signal.aborted) return
    results.value = NO_RESULTS
    state.value = 'error'
  }
}

watchDebounced(term, search, { debounce: 250 })

function onSelect(place: Place | null) {
  if (!place) return
  emit('select', { name: place.label, lat: place.lat, lon: place.lon })
  term.value = ''
  results.value = NO_RESULTS
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
    class="min-w-0 flex-1"
    @update:model-value="onSelect"
  >
    <ComboboxAnchor
      class="flex h-11 items-center gap-2 rounded-full border border-line bg-bg px-4 focus-within:border-line-strong"
    >
      <svg viewBox="0 0 24 24" class="size-4 flex-none text-muted" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2" />
      </svg>
      <ComboboxInput
        id="place-search"
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

    <!-- Inline, not portalled: a click on a result must not close the dialog. -->
    <ComboboxContent
        v-if="term.trim().length >= MIN_CHARS"
        position="inline"
        class="mt-2 overflow-hidden rounded-2xl border border-line bg-surface p-1.5"
      >
        <ComboboxViewport class="max-h-72">
          <ComboboxItem
            v-for="place in head"
            :key="place.id"
            :value="place"
            :text-value="place.label"
            class="flex cursor-pointer flex-col rounded-xl px-3 py-2 outline-none data-[highlighted]:bg-bg"
          >
            <span class="font-medium text-ink">{{ place.name }}</span>
            <span v-if="place.context" class="text-sm text-muted">{{ place.context }}</span>
          </ComboboxItem>

          <ComboboxGroup v-if="results.districts" class="my-1 border-y border-line py-1">
            <ComboboxLabel class="px-3 pt-1.5 pb-1 text-xs font-medium text-muted">
              {{ t('place.districtsOf', { city: results.districts.of }) }}
            </ComboboxLabel>
            <ComboboxItem
              v-for="place in results.districts.places"
              :key="place.id"
              :value="place"
              :text-value="place.label"
              class="cursor-pointer rounded-xl px-3 py-1.5 text-ink outline-none data-[highlighted]:bg-bg"
            >
              {{ place.name }}
            </ComboboxItem>
          </ComboboxGroup>

          <ComboboxItem
            v-for="place in tail"
            :key="place.id"
            :value="place"
            :text-value="place.label"
            class="flex cursor-pointer flex-col rounded-xl px-3 py-2 outline-none data-[highlighted]:bg-bg"
          >
            <span class="font-medium text-ink">{{ place.name }}</span>
            <span v-if="place.context" class="text-sm text-muted">{{ place.context }}</span>
          </ComboboxItem>

          <ComboboxEmpty v-if="state === 'done' && !hasResults" class="px-3 py-2 text-sm text-muted">
            {{ t('place.noMatch', { query: term.trim() }) }}
          </ComboboxEmpty>
          <p v-else-if="state === 'loading' && !hasResults" class="px-3 py-2 text-sm text-muted">
            {{ t('place.searching') }}
          </p>
          <p v-else-if="state === 'error'" class="px-3 py-2 text-sm text-muted">
            {{ t('place.searchDown') }}
          </p>
        </ComboboxViewport>
      </ComboboxContent>
  </ComboboxRoot>
</template>
