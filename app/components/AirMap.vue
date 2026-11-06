<script setup lang="ts">
import type { GeoJSONSource, ImageSource, Map as MlMap, Popup as MlPopup } from 'maplibre-gl'
import type { Station, StationsReport } from '#shared/types/air'

const props = defineProps<{ place: SelectedPlace, timeZone: string }>()

const { t, locale } = useI18n()
const text = useAirText()
const colorMode = useColorMode()

const container = useTemplateRef<HTMLDivElement>('container')

const { data, status, error, refresh } = useFetch<StationsReport>('/api/stations', { server: false, lazy: true })
const index = computed(() => new StationIndex(data.value?.stations ?? []))

const NEAREST_KM = 50
const nearest = computed(() => (data.value ? index.value.nearest(props.place.lat, props.place.lon, NEAREST_KM) : null))
const nearestText = computed(() => {
  if (!data.value) return null
  const n = nearest.value
  if (!n) return t('map.nearestNone', { km: NEAREST_KM })
  return t('map.nearest', {
    km: Math.max(1, Math.round(n.km)),
    value: text.concentration(n.station.pm25),
    band: text.band(aqiBand(pm25ToAqi(n.station.pm25)).id),
    time: formatClock(n.station.time, props.timeZone),
  })
})

const STYLE = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}
/** Screen pixels per surface cell. */
const CELL_PX = 6
/** Margin around the view, so small pans don't show an empty edge. */
const MARGIN = 0.25

let map: MlMap | null = null
let popup: MlPopup | null = null
const surfaceCanvas = import.meta.client ? document.createElement('canvas') : null

const styleUrl = () => (colorMode.value === 'dark' ? STYLE.dark : STYLE.light)

function cssColor(name: string): [number, number, number] {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace('#', '')
  return [0, 2, 4].map(i => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function bandColors() {
  return Object.fromEntries(AQI_BANDS.map(b => [b.id, cssColor(`--band-${b.id}`)])) as Record<AqiBand, [number, number, number]>
}

const rgb = (c: [number, number, number]) => `rgb(${c.join(',')})`

function stationsGeoJson(stations: readonly Station[]) {
  return {
    type: 'FeatureCollection' as const,
    features: stations.map(s => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
      properties: { pm25: s.pm25, time: s.time },
    })),
  }
}

function placeGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: [{ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [props.place.lon, props.place.lat] }, properties: {} }],
  }
}

function drawSurface() {
  if (!map || !surfaceCanvas || !container.value) return
  const source = map.getSource<ImageSource>('surface')
  if (!source) return

  const w = container.value.clientWidth
  const h = container.value.clientHeight
  const x0 = -w * MARGIN
  const y0 = -h * MARGIN
  const cols = Math.ceil((w * (1 + 2 * MARGIN)) / CELL_PX)
  const rows = Math.ceil((h * (1 + 2 * MARGIN)) / CELL_PX)

  surfaceCanvas.width = cols
  surfaceCanvas.height = rows
  const ctx = surfaceCanvas.getContext('2d')!
  const img = ctx.createImageData(cols, rows)
  const colors = bandColors()

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ll = map.unproject([x0 + (c + 0.5) * CELL_PX, y0 + (r + 0.5) * CELL_PX])
      const p = estimate(index.value, ll.lat, ll.lng)
      if (!p) continue
      const [red, green, blue] = colors[aqiBand(pm25ToAqi(p.pm25)).id]
      const o = (r * cols + c) * 4
      img.data[o] = red
      img.data[o + 1] = green
      img.data[o + 2] = blue
      img.data[o + 3] = Math.round(255 * p.alpha)
    }
  }
  ctx.putImageData(img, 0, 0)

  const corner = (x: number, y: number): [number, number] => {
    const ll = map!.unproject([x, y])
    return [ll.lng, ll.lat]
  }
  const x1 = x0 + cols * CELL_PX
  const y1 = y0 + rows * CELL_PX
  source.updateImage({ image: surfaceCanvas, coordinates: [corner(x0, y0), corner(x1, y0), corner(x1, y1), corner(x0, y1)] })
}

// Basemap labels in the page language where available.
function localiseLabels() {
  if (!map) return
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    const field = map.getLayoutProperty(layer.id, 'text-field')
    if (!field || !JSON.stringify(field).includes('name')) continue
    map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', `name:${locale.value}`], ['get', 'name']])
  }
}

// Runs again after every style change (theme switch).
function addLayers() {
  if (!map) return
  localiseLabels()
  const colors = bandColors()
  const firstLabel = map.getStyle().layers.find(l => l.type === 'symbol')?.id

  map.addSource('surface', {
    type: 'image',
    url: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
    coordinates: [[-1, 1], [1, 1], [1, -1], [-1, -1]],
  })
  // Below place labels; lighter on the dark basemap.
  const opacity = colorMode.value === 'dark' ? 0.45 : 0.55
  map.addLayer({ id: 'surface', type: 'raster', source: 'surface', paint: { 'raster-opacity': opacity, 'raster-resampling': 'linear', 'raster-fade-duration': 0 } }, firstLabel)

  map.addSource('stations', {
    type: 'geojson',
    data: stationsGeoJson(data.value?.stations ?? []),
    attribution: 'Air quality: <a href="https://openaq.org" target="_blank" rel="noopener">OpenAQ</a>',
  })
  map.addLayer({
    id: 'stations',
    type: 'circle',
    source: 'stations',
    minzoom: 5,
    paint: {
      'circle-color': ['step', ['get', 'pm25'],
        rgb(colors.good), 5, rgb(colors.fair), 15, rgb(colors.moderate), 50, rgb(colors.poor), 90, rgb(colors['very-poor']), 140, rgb(colors['extremely-poor'])],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 6],
      'circle-stroke-width': 1,
      'circle-stroke-color': colorMode.value === 'dark' ? '#0F1113' : '#FFFFFF',
    },
  })

  map.addSource('place', { type: 'geojson', data: placeGeoJson() })
  map.addLayer({
    id: 'place',
    type: 'circle',
    source: 'place',
    paint: {
      'circle-radius': 7,
      'circle-color': colorMode.value === 'dark' ? '#ECEDEE' : '#16181B',
      'circle-stroke-width': 3,
      'circle-stroke-color': colorMode.value === 'dark' ? '#0F1113' : '#FFFFFF',
    },
  })

  drawSurface()
}

function showPopup(lngLat: { lng: number, lat: number }, pm25: number, time: string, Popup: typeof MlPopup) {
  if (!map) return
  // Text nodes only, never HTML from data.
  const el = document.createElement('div')
  const line1 = document.createElement('strong')
  line1.textContent = t('map.popup', { value: text.concentration(pm25), band: text.band(aqiBand(pm25ToAqi(pm25)).id) })
  const line2 = document.createElement('div')
  line2.textContent = t('map.popupTime', { time: formatClock(time, props.timeZone) })
  el.append(line1, line2)
  popup?.remove()
  popup = new Popup({ closeButton: false, offset: 8, className: 'smog-popup' }).setLngLat(lngLat).setDOMContent(el).addTo(map)
}

onMounted(async () => {
  const [{ Map, NavigationControl, Popup, setWorkerUrl }, { default: workerUrl }] = await Promise.all([
    import('maplibre-gl'),
    // Bundling breaks MapLibre's worker path, so pass the worker URL.
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ])
  if (!container.value) return
  setWorkerUrl(workerUrl)

  map = new Map({
    container: container.value,
    style: styleUrl(),
    center: [props.place.lon, props.place.lat],
    zoom: 7,
    minZoom: 3,
    maxZoom: 12,
    dragRotate: false,
    pitchWithRotate: false,
    // On phones one finger scrolls the page; two move the map.
    cooperativeGestures: true,
    attributionControl: { compact: true },
    locale: {
      'NavigationControl.ZoomIn': t('map.zoomIn'),
      'NavigationControl.ZoomOut': t('map.zoomOut'),
      'NavigationControl.ResetBearing': t('map.resetBearing'),
      'AttributionControl.ToggleAttribution': t('map.attribution'),
      'CooperativeGesturesHandler.WindowsHelpText': t('map.windowsHelp'),
      'CooperativeGesturesHandler.MacHelpText': t('map.macHelp'),
      'CooperativeGesturesHandler.MobileHelpText': t('map.mobileHelp'),
    },
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  map.on('style.load', addLayers)
  map.on('moveend', drawSurface)

  const onStation = (e: { features?: { properties: Record<string, unknown> }[], lngLat: { lng: number, lat: number } }) => {
    const f = e.features?.[0]
    if (f) showPopup(e.lngLat, Number(f.properties.pm25), String(f.properties.time), Popup)
  }
  map.on('mousemove', 'stations', (e) => {
    map!.getCanvas().style.cursor = 'pointer'
    onStation(e)
  })
  map.on('mouseleave', 'stations', () => {
    map!.getCanvas().style.cursor = ''
    popup?.remove()
  })
  map.on('click', 'stations', onStation)
})

watch(data, (d) => {
  map?.getSource<GeoJSONSource>('stations')?.setData(stationsGeoJson(d?.stations ?? []))
  drawSurface()
})

watch(() => props.place, (p) => {
  map?.getSource<GeoJSONSource>('place')?.setData(placeGeoJson())
  map?.flyTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 7) })
})

watch(locale, localiseLabels)

// Full reload on theme change: diffing two basemaps left the old labels behind.
watch(() => colorMode.value, () => {
  map?.setStyle(styleUrl(), { diff: false })
})

onBeforeUnmount(() => {
  popup?.remove()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="grid gap-4">
    <div class="relative overflow-hidden rounded-xl border border-line">
      <div
        ref="container"
        role="region"
        :aria-label="t('map.aria', { place: place.name })"
        class="h-[24rem] w-full bg-surface-2 sm:h-[28rem]"
      />
      <p
        v-if="status === 'pending' && !data"
        role="status"
        class="absolute left-3 top-3 rounded-full bg-surface px-3 py-1.5 text-sm text-muted shadow-card"
      >
        {{ t('map.loading') }}
      </p>
      <div
        v-else-if="error"
        role="alert"
        class="absolute inset-x-3 top-3 flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm shadow-card"
      >
        <span>{{ error.statusCode === 503 ? t('map.errorConfig') : t('map.error') }}</span>
        <button
          v-if="error.statusCode !== 503"
          type="button"
          class="cursor-pointer rounded-full border border-line-strong px-3 py-1 font-medium hover:bg-bg"
          @click="refresh()"
        >
          {{ t('state.retry') }}
        </button>
      </div>
    </div>

    <p v-if="nearestText" class="text-sm">
      {{ nearestText }}
    </p>

    <div class="grid max-w-sm gap-1.5">
      <div class="flex h-2 gap-0.5 overflow-hidden rounded-full">
        <span
          v-for="b in AQI_BANDS"
          :key="b.id"
          :title="text.band(b.id)"
          class="flex-1"
          :class="BAND_BG[b.id]"
        />
      </div>
      <div class="flex justify-between text-xs text-muted">
        <span>{{ text.band(AQI_BANDS[0]!.id) }}</span>
        <span>{{ text.band(AQI_BANDS.at(-1)!.id) }}</span>
      </div>
    </div>

    <p v-if="data" class="text-sm text-muted">
      <i18n-t keypath="map.sources" tag="span" scope="global">
        <template #n>
          <span class="tabular-nums">{{ data.stations.length }}</span>
        </template>
        <template #source>
          <a href="https://openaq.org" target="_blank" rel="noopener" class="underline decoration-line-strong underline-offset-2 hover:text-ink">OpenAQ</a>
        </template>
      </i18n-t>
      {{ ' ' }}
      <NuxtLink to="/about" class="text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink">
        {{ t('map.how') }}
      </NuxtLink>
    </p>
  </div>
</template>

<style>
.smog-popup .maplibregl-popup-content {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  font: 13px/1.45 var(--font-sans);
  box-shadow: var(--shadow-card);
}
.smog-popup .maplibregl-popup-tip { display: none; }
</style>
