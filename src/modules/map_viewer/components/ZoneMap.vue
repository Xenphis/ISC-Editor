<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import type { ImagePoint, MapMarker, MapPin, ZoneCalibration } from '../types'
import { worldToImage } from '../service'
import { loadZoneImageUrl } from '../data/zone-images'

const props = defineProps<{
  slug: string
  calibration: ZoneCalibration | null
  pins: MapPin[]
  selectedPinId?: string | null
  /** Plain dots (calibration clicks) rendered on the image, tracking zoom/pan. */
  markers?: MapMarker[]
  /** Show a crosshair instead of the pan cursor (calibration capture mode). */
  captureCursor?: boolean
}>()

const emit = defineEmits<{
  (e: 'pin-click', pin: MapPin): void
  (e: 'image-click', point: ImagePoint): void
}>()

const { t } = useI18n()

type Status = 'loading' | 'ready' | 'error'
const status = ref<Status>('loading')
const imageUrl = ref('')
// Guards against out-of-order async loads when the zone changes rapidly.
let loadToken = 0

async function loadImage(slug: string) {
  const token = ++loadToken
  status.value = 'loading'
  try {
    const url = await loadZoneImageUrl(slug)
    if (token !== loadToken) return
    imageUrl.value = url
    status.value = 'ready'
  } catch (e) {
    if (token !== loadToken) return
    console.error('[ZoneMap] failed to load zone image', e)
    status.value = 'error'
  }
}

watch(() => props.slug, loadImage, { immediate: true })

// ─── Zoom & pan ──────────────────────────────────────────────────────
// The viewport is a scroll container; zoom widens the surface (in % of the
// viewport width) so pin/marker percent positions stay glued and their
// on-screen size stays constant.

const MIN_ZOOM = 0.2
const MAX_ZOOM = 8

const viewport = ref<HTMLElement | null>(null)
const image = ref<HTMLImageElement | null>(null)
const zoom = ref(1)
/** natural height / natural width of the loaded image. */
let imageAspect = 1

function clampZoom(value: number): number {
  return Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM)
}

/** Zoom at which the whole image fits in the viewport (never above 100% width). */
function fitZoom(): number {
  const vp = viewport.value
  if (!vp || vp.clientWidth === 0 || imageAspect === 0) return 1
  return clampZoom(Math.min(1, vp.clientHeight / (vp.clientWidth * imageAspect)))
}

function onImageLoad() {
  const img = image.value
  if (img && img.naturalWidth > 0) {
    imageAspect = img.naturalHeight / img.naturalWidth
  }
  zoom.value = fitZoom()
}

/** Rescales around a viewport-relative anchor so that point stays put. */
async function setZoom(value: number, anchor?: { x: number; y: number }) {
  const vp = viewport.value
  const next = clampZoom(value)
  const previous = zoom.value
  if (!vp || next === previous) {
    zoom.value = next
    return
  }
  const ax = anchor?.x ?? vp.clientWidth / 2
  const ay = anchor?.y ?? vp.clientHeight / 2
  const contentX = vp.scrollLeft + ax
  const contentY = vp.scrollTop + ay
  zoom.value = next
  await nextTick()
  const scale = next / previous
  vp.scrollLeft = contentX * scale - ax
  vp.scrollTop = contentY * scale - ay
}

function onWheel(event: WheelEvent) {
  const vp = viewport.value
  if (!vp) return
  const rect = vp.getBoundingClientRect()
  setZoom(
    zoom.value * Math.exp(-event.deltaY * 0.002),
    { x: event.clientX - rect.left, y: event.clientY - rect.top },
  )
}

const DRAG_THRESHOLD = 5

interface PanState {
  pointerId: number
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
  moved: boolean
}
let panState: PanState | null = null
const panning = ref(false)

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !viewport.value) return
  panState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: viewport.value.scrollLeft,
    scrollTop: viewport.value.scrollTop,
    moved: false,
  }
}

function onPointerMove(event: PointerEvent) {
  const vp = viewport.value
  if (!panState || !vp || event.pointerId !== panState.pointerId) return
  const dx = event.clientX - panState.startX
  const dy = event.clientY - panState.startY
  if (!panState.moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
    panState.moved = true
    panning.value = true
    // Capture only once an actual drag starts, so plain clicks keep their
    // native targets (pin buttons) instead of being retargeted to the viewport.
    vp.setPointerCapture(event.pointerId)
  }
  if (panState.moved) {
    vp.scrollLeft = panState.scrollLeft - dx
    vp.scrollTop = panState.scrollTop - dy
  }
}

function onPointerUp(event: PointerEvent) {
  const state = panState
  panState = null
  panning.value = false
  if (!state || event.pointerId !== state.pointerId) return
  if (state.moved || !image.value) return
  // Plain click: pins handle their own click; anywhere else on the image
  // reports the image-space position (used by the calibration tool).
  if (event.target instanceof Element && event.target.closest('.zone-map-pin')) return
  const rect = image.value.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  const u = (event.clientX - rect.left) / rect.width
  const v = (event.clientY - rect.top) / rect.height
  if (u < 0 || u > 1 || v < 0 || v > 1) return
  emit('image-click', { u, v })
}

function onPointerCancel() {
  panState = null
  panning.value = false
}

// Suppresses the pin's native click when a drag started on it.
function onPinClick(pin: MapPin) {
  emit('pin-click', pin)
}

// ─── Pins ────────────────────────────────────────────────────────────

interface PlacedPin {
  pin: MapPin
  /* CSS percentages, clamped to the image edges. */
  left: number
  top: number
  offMap: boolean
}

// Slight tolerance before flagging a pin as off-map: spawns can sit just
// outside the content-cropped image without the calibration being wrong.
const OFF_MAP_TOLERANCE = 0.02

const placedPins = computed<PlacedPin[]>(() => {
  const cal = props.calibration
  if (!cal) return []
  return props.pins.map((pin) => {
    const { u, v } = worldToImage(cal, pin.world)
    const offMap = u < -OFF_MAP_TOLERANCE || u > 1 + OFF_MAP_TOLERANCE
      || v < -OFF_MAP_TOLERANCE || v > 1 + OFF_MAP_TOLERANCE
    return {
      pin,
      left: Math.min(Math.max(u, 0), 1) * 100,
      top: Math.min(Math.max(v, 0), 1) * 100,
      offMap,
    }
  })
})

function pinTooltip(placed: PlacedPin): string {
  const lines = [placed.pin.label]
  if (placed.pin.sublabel) lines.push(placed.pin.sublabel)
  if (placed.offMap) lines.push(t('mapViewer.pin.offMap'))
  return lines.join('\n')
}
</script>

<template>
  <div class="zone-map">
    <div v-if="status !== 'ready'" class="zone-map-overlay">
      <template v-if="status === 'loading'">
        <i class="pi pi-spin pi-spinner zone-map-icon"></i>
        <span class="zone-map-label">{{ t('mapViewer.states.loading') }}</span>
      </template>
      <template v-else>
        <i class="pi pi-exclamation-triangle zone-map-icon"></i>
        <span class="zone-map-label">{{ t('mapViewer.states.imageError') }}</span>
      </template>
    </div>

    <template v-else>
      <div
        ref="viewport"
        class="zone-map-viewport"
        :class="{ 'zone-map-panning': panning, 'zone-map-capture': captureCursor }"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <div class="zone-map-surface" :style="{ width: `${zoom * 100}%` }">
          <img
            ref="image"
            :src="imageUrl"
            :alt="slug"
            class="zone-map-image"
            draggable="false"
            @load="onImageLoad"
          />
          <button
            v-for="placed in placedPins"
            :key="placed.pin.id"
            v-tooltip.top="pinTooltip(placed)"
            type="button"
            class="zone-map-pin"
            :class="{
              'zone-map-pin-selected': placed.pin.id === selectedPinId,
              'zone-map-pin-offmap': placed.offMap,
            }"
            :style="{ left: `${placed.left}%`, top: `${placed.top}%` }"
            @click.stop="onPinClick(placed.pin)"
          >
            <i class="pi pi-map-marker"></i>
          </button>
          <span
            v-for="marker in markers ?? []"
            :key="marker.id"
            class="zone-map-dot"
            :style="{ left: `${marker.point.u * 100}%`, top: `${marker.point.v * 100}%` }"
          >{{ marker.label }}</span>
        </div>
      </div>

      <div class="zone-map-controls">
        <Button
          v-tooltip.left="t('mapViewer.map.zoomIn')"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          @click="setZoom(zoom * 1.4)"
        />
        <Button
          v-tooltip.left="t('mapViewer.map.zoomOut')"
          icon="pi pi-minus"
          size="small"
          severity="secondary"
          @click="setZoom(zoom / 1.4)"
        />
        <Button
          v-tooltip.left="t('mapViewer.map.zoomFit')"
          icon="pi pi-arrows-alt"
          size="small"
          severity="secondary"
          @click="setZoom(fitZoom())"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.zone-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.zone-map-viewport {
  width: 100%;
  height: 100%;
  overflow: auto;
  cursor: grab;
  touch-action: none;
  border-radius: 0.5rem;
  background: var(--surface-input);
}

.zone-map-panning {
  cursor: grabbing;
}

.zone-map-capture {
  cursor: crosshair;
}

.zone-map-surface {
  position: relative;
  margin: 0 auto;
  line-height: 0;
}

.zone-map-image {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

/* Percent positioning keeps pins glued to the image under any zoom level;
   translate anchors the marker tip on the exact spot. */
.zone-map-pin {
  position: absolute;
  transform: translate(-50%, -100%);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: #f59e0b;
  font-size: 1.4rem;
  line-height: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  transition: transform 0.1s ease, color 0.1s ease;
}

.zone-map-pin:hover {
  transform: translate(-50%, -100%) scale(1.25);
}

.zone-map-pin-selected {
  color: #06b6d4;
  transform: translate(-50%, -100%) scale(1.35);
  z-index: 2;
}

.zone-map-pin-offmap {
  color: #ef4444;
  opacity: 0.75;
}

.zone-map-dot {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 1.1rem;
  height: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}

.zone-map-controls {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  z-index: 3;
}

.zone-map-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  height: 100%;
  min-height: 14rem;
  padding: 1rem;
  text-align: center;
  border: 1px dashed var(--border-input);
  border-radius: 0.5rem;
  background: var(--surface-input);
  color: var(--text-muted);
}

.zone-map-icon {
  font-size: 2.75rem;
  color: var(--text-placeholder);
}

.zone-map-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
