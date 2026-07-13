<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ZoneMap from '../components/ZoneMap.vue'
import type { CalibrationPointDraft, ImagePoint, MapMarker, MapPin } from '../types'
import { CalibrationError, computeCalibration } from '../service'
import { ZONE_IMAGE_SLUGS } from '../data/zone-images'
import { BAKED_CALIBRATIONS } from '../data/zone-calibration'
import { useMapViewerStore } from '../store'

const { t } = useI18n()
const store = useMapViewerStore()

const selectedSlug = ref<string>(ZONE_IMAGE_SLUGS[0] ?? '')

const zoneOptions = ZONE_IMAGE_SLUGS.map(slug => ({ slug, label: slug }))

type SlotId = 'a' | 'b'

function emptySlot(): CalibrationPointDraft {
  return { image: null, worldX: null, worldY: null }
}

function cloneSlot(slot: CalibrationPointDraft): CalibrationPointDraft {
  return {
    image: slot.image ? { ...slot.image } : null,
    worldX: slot.worldX,
    worldY: slot.worldY,
  }
}

const slots = ref<Record<SlotId, CalibrationPointDraft>>({
  a: emptySlot(),
  b: emptySlot(),
})
/** Which slot the next image click fills; null = clicks ignored. */
const capturing = ref<SlotId | null>(null)

const testPoint = ref<{ worldX: number | null, worldY: number | null }>({ worldX: null, worldY: null })

const errorKey = ref<string | null>(null)
const signWarning = ref(false)

const calibrationStatus = computed<'override' | 'baked' | 'none'>(() => {
  if (store.overrides[selectedSlug.value]) return 'override'
  if (BAKED_CALIBRATIONS[selectedSlug.value]) return 'baked'
  return 'none'
})

const effectiveCalibration = computed(() => (
  store.effectiveCalibrations[selectedSlug.value] ?? null
))

/** Restores the zone's saved reference points (if any) so it can be recalibrated. */
function loadZone(slug: string) {
  const saved = store.samples[slug]
  slots.value = saved
    ? { a: cloneSlot(saved.a), b: cloneSlot(saved.b) }
    : { a: emptySlot(), b: emptySlot() }
  capturing.value = null
  testPoint.value = { worldX: null, worldY: null }
  errorKey.value = null
  signWarning.value = false
}

watch(selectedSlug, loadZone, { immediate: true })

// Persist the reference points as they are entered, keyed by zone.
watch(slots, (value) => {
  store.setSamples(selectedSlug.value, {
    a: cloneSlot(value.a),
    b: cloneSlot(value.b),
  })
}, { deep: true })

function clearPoints() {
  slots.value = { a: emptySlot(), b: emptySlot() }
  capturing.value = null
  errorKey.value = null
  signWarning.value = false
}

function onImageClick(point: ImagePoint) {
  if (!capturing.value) return
  slots.value[capturing.value].image = point
  capturing.value = null
}

/** Reference/test markers previewed through the regular pin pipeline. */
const previewPins = computed<MapPin[]>(() => {
  const pins: MapPin[] = []
  const cal = effectiveCalibration.value

  for (const id of ['a', 'b'] as const) {
    const slot = slots.value[id]
    if (slot.worldX !== null && slot.worldY !== null && cal) {
      pins.push({
        id: `ref-${id}`,
        label: t('mapViewer.calibrate.refPin', { id: id.toUpperCase() }),
        sublabel: `${slot.worldX}, ${slot.worldY}`,
        world: { x: slot.worldX, y: slot.worldY },
        map: 0,
        zoneId: 0,
      })
    }
  }
  if (testPoint.value.worldX !== null && testPoint.value.worldY !== null && cal) {
    pins.push({
      id: 'test-point',
      label: t('mapViewer.calibrate.testPin'),
      sublabel: `${testPoint.value.worldX}, ${testPoint.value.worldY}`,
      world: { x: testPoint.value.worldX, y: testPoint.value.worldY },
      map: 0,
      zoneId: 0,
    })
  }
  return pins
})

/** Raw clicked positions, shown as plain dots (independent from any calibration). */
const clickedMarkers = computed<MapMarker[]>(() => (
  (['a', 'b'] as const)
    .filter(id => slots.value[id].image !== null)
    .map(id => ({
      id: `click-${id}`,
      label: id.toUpperCase(),
      point: slots.value[id].image as ImagePoint,
    }))
))

const canCompute = computed(() => {
  const { a, b } = slots.value
  return a.image !== null && a.worldX !== null && a.worldY !== null
    && b.image !== null && b.worldX !== null && b.worldY !== null
})

function compute() {
  errorKey.value = null
  signWarning.value = false
  const { a, b } = slots.value
  if (!canCompute.value) {
    errorKey.value = 'mapViewer.calibrate.errors.incomplete'
    return
  }
  try {
    const result = computeCalibration(
      { world: { x: a.worldX as number, y: a.worldY as number }, image: a.image as ImagePoint },
      { world: { x: b.worldX as number, y: b.worldY as number }, image: b.image as ImagePoint },
    )
    signWarning.value = result.signWarning
    store.setOverride(selectedSlug.value, result.calibration)
  } catch (e) {
    if (e instanceof CalibrationError) {
      errorKey.value = e.code === 'sameWorld'
        ? 'mapViewer.calibrate.errors.sameWorld'
        : 'mapViewer.calibrate.errors.samePixel'
    } else {
      throw e
    }
  }
}

const exportSnippet = computed(() => {
  const cal = store.overrides[selectedSlug.value]
  if (!cal) return ''
  const fmt = (n: number) => Number(n.toPrecision(8))
  return `'${selectedSlug.value}': { ax: ${fmt(cal.ax)}, bx: ${fmt(cal.bx)}, ay: ${fmt(cal.ay)}, by: ${fmt(cal.by)} },`
})

async function copySnippet() {
  if (!exportSnippet.value) return
  try {
    await navigator.clipboard.writeText(exportSnippet.value)
  } catch {
    /* clipboard unavailable — the textarea stays selectable */
  }
}

function clearOverride() {
  store.clearOverride(selectedSlug.value)
  errorKey.value = null
  signWarning.value = false
}
</script>

<template>
  <div class="calibrate-page">
    <div class="calibrate-header">
      <h2>{{ t('mapViewer.calibrate.title') }}</h2>
      <p>{{ t('mapViewer.calibrate.intro') }}</p>
    </div>

    <div class="calibrate-layout">
      <div class="calibrate-sidebar">
        <div class="calibrate-field">
          <label>{{ t('mapViewer.calibrate.zone') }}</label>
          <Select
            v-model="selectedSlug"
            :options="zoneOptions"
            optionLabel="label"
            optionValue="slug"
            filter
          />
          <span class="calibrate-status" :class="`calibrate-status-${calibrationStatus}`">
            {{ t(`mapViewer.calibrate.status.${calibrationStatus}`) }}
          </span>
        </div>

        <div v-for="id in (['a', 'b'] as const)" :key="id" class="calibrate-sample">
          <h4>{{ t('mapViewer.calibrate.point', { id: id.toUpperCase() }) }}</h4>
          <Button
            size="small"
            :severity="capturing === id ? 'warn' : 'secondary'"
            :label="capturing === id
              ? t('mapViewer.calibrate.captureActive')
              : t('mapViewer.calibrate.capture')"
            icon="pi pi-crosshairs"
            @click="capturing = capturing === id ? null : id"
          />
          <span class="calibrate-capture-value">
            {{ slots[id].image
              ? `${(slots[id].image!.u * 100).toFixed(2)} %, ${(slots[id].image!.v * 100).toFixed(2)} %`
              : t('mapViewer.calibrate.notCaptured') }}
          </span>
          <div class="calibrate-coords">
            <div class="calibrate-field">
              <label>{{ t('mapViewer.calibrate.worldX') }}</label>
              <InputNumber v-model="slots[id].worldX" :maxFractionDigits="4" :useGrouping="false" />
            </div>
            <div class="calibrate-field">
              <label>{{ t('mapViewer.calibrate.worldY') }}</label>
              <InputNumber v-model="slots[id].worldY" :maxFractionDigits="4" :useGrouping="false" />
            </div>
          </div>
        </div>

        <div class="calibrate-actions">
          <Button
            :label="t('mapViewer.calibrate.compute')"
            icon="pi pi-calculator"
            :disabled="!canCompute"
            @click="compute"
          />
          <Button
            severity="secondary"
            outlined
            icon="pi pi-eraser"
            :label="t('mapViewer.calibrate.clearPoints')"
            @click="clearPoints"
          />
        </div>

        <span v-if="errorKey" class="calibrate-error">
          <i class="pi pi-exclamation-triangle"></i> {{ t(errorKey) }}
        </span>
        <span v-if="signWarning" class="calibrate-warning">
          <i class="pi pi-exclamation-circle"></i> {{ t('mapViewer.calibrate.errors.signWarning') }}
        </span>

        <div class="calibrate-sample">
          <h4>{{ t('mapViewer.calibrate.testPoint') }}</h4>
          <div class="calibrate-coords">
            <div class="calibrate-field">
              <label>{{ t('mapViewer.calibrate.worldX') }}</label>
              <InputNumber v-model="testPoint.worldX" :maxFractionDigits="4" :useGrouping="false" />
            </div>
            <div class="calibrate-field">
              <label>{{ t('mapViewer.calibrate.worldY') }}</label>
              <InputNumber v-model="testPoint.worldY" :maxFractionDigits="4" :useGrouping="false" />
            </div>
          </div>
        </div>

        <div v-if="exportSnippet" class="calibrate-export">
          <h4>{{ t('mapViewer.calibrate.export') }}</h4>
          <p>{{ t('mapViewer.calibrate.exportHint') }}</p>
          <Textarea :modelValue="exportSnippet" readonly rows="3" class="calibrate-export-text" />
          <div class="calibrate-export-actions">
            <Button
              size="small"
              icon="pi pi-copy"
              :label="t('mapViewer.calibrate.copy')"
              @click="copySnippet"
            />
            <Button
              size="small"
              severity="danger"
              outlined
              icon="pi pi-trash"
              :label="t('mapViewer.calibrate.clearOverride')"
              @click="clearOverride"
            />
          </div>
        </div>
      </div>

      <div class="calibrate-map">
        <!-- The clicked reference spots render as raw dots (independent of the
             computed transform): after Compute, each reprojected pin should
             land back on its dot. -->
        <ZoneMap
          :slug="selectedSlug"
          :calibration="effectiveCalibration"
          :pins="previewPins"
          :markers="clickedMarkers"
          :captureCursor="capturing !== null"
          @image-click="onImageClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.calibrate-page {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow: auto;
}

.calibrate-header h2 {
  margin: 0 0 0.25rem;
}

.calibrate-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.calibrate-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.calibrate-sidebar {
  flex: 0 0 20rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calibrate-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.calibrate-field label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.calibrate-status {
  font-size: 0.75rem;
}

.calibrate-status-baked { color: var(--success); }
.calibrate-status-override { color: var(--warn); }
.calibrate-status-none { color: var(--text-placeholder); }

.calibrate-sample {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--border-input);
  border-radius: 0.5rem;
  background: var(--surface-input);
}

.calibrate-sample h4 {
  margin: 0;
  font-size: 0.85rem;
}

.calibrate-capture-value {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.calibrate-coords {
  display: flex;
  gap: 0.75rem;
}

.calibrate-coords .calibrate-field {
  flex: 1;
  min-width: 0;
}

.calibrate-error {
  color: var(--danger);
  font-size: 0.8rem;
}

.calibrate-warning {
  color: var(--warn);
  font-size: 0.8rem;
}

.calibrate-export {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--border-input);
  border-radius: 0.5rem;
}

.calibrate-export h4 {
  margin: 0;
  font-size: 0.85rem;
}

.calibrate-export p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.calibrate-export-text {
  font-family: monospace;
  font-size: 0.75rem;
  width: 100%;
}

.calibrate-export-actions {
  display: flex;
  gap: 0.5rem;
}

.calibrate-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Bounded viewport so ZoneMap's internal zoom/pan has room to work in. */
.calibrate-map {
  flex: 1 1 auto;
  min-width: 0;
  height: calc(100vh - 16rem);
  min-height: 24rem;
  position: sticky;
  top: 0;
}
</style>
