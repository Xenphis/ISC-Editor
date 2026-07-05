<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import ZoneMap from './ZoneMap.vue'
import type { MapPin } from '../types'
import { groupPinsByZone } from '../service'
import { hasZoneImage } from '../data/zone-images'
import { useMapViewerStore } from '../store'

const props = defineProps<{
  pins: MapPin[]
  title?: string
  initialSelectedId?: string | null
}>()

const emit = defineEmits<{
  (e: 'pin-select', pinId: string): void
}>()

const visible = defineModel<boolean>('visible', { required: true })

const { t } = useI18n()
const store = useMapViewerStore()

const selectedSlug = ref<string | null>(null)
const selectedPinId = ref<string | null>(null)

const grouped = computed(() => groupPinsByZone(props.pins, store.effectiveCalibrations))

function prettifySlug(slug: string): string {
  return slug.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const zoneOptions = computed(() => (
  [...grouped.value.zones.entries()].map(([slug, pins]) => ({
    slug,
    label: `${prettifySlug(slug)} (${pins.length})`,
  }))
))

watch(visible, (open) => {
  if (!open) return
  selectedPinId.value = props.initialSelectedId ?? null

  // Default zone: the one holding the pre-selected pin, else the largest group.
  const zones = grouped.value.zones
  let slug: string | null = zones.keys().next().value ?? null
  if (selectedPinId.value) {
    for (const [zoneSlug, pins] of zones) {
      if (pins.some(pin => pin.id === selectedPinId.value)) {
        slug = zoneSlug
        break
      }
    }
  }
  selectedSlug.value = slug
})

const currentPins = computed(() => (
  selectedSlug.value ? grouped.value.zones.get(selectedSlug.value) ?? [] : []
))

const currentCalibration = computed(() => (
  selectedSlug.value ? store.effectiveCalibrations[selectedSlug.value] ?? null : null
))

const currentZoneAvailable = computed(() => (
  selectedSlug.value !== null
  && currentCalibration.value !== null
  && hasZoneImage(selectedSlug.value)
))

const excludedNotices = computed(() => {
  const notices: string[] = []
  if (grouped.value.unsupportedMap.length > 0) {
    notices.push(t('mapViewer.dialog.excludedUnsupported', { count: grouped.value.unsupportedMap.length }))
  }
  if (grouped.value.unresolved.length > 0) {
    notices.push(t('mapViewer.dialog.excludedUnresolved', { count: grouped.value.unresolved.length }))
  }
  return notices
})

function onPinClick(pin: MapPin) {
  selectedPinId.value = pin.id
  emit('pin-select', pin.id)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    maximizable
    :header="title ?? t('mapViewer.dialog.title')"
    :style="{ width: '95vw', height: '92vh' }"
    :contentStyle="{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflow: 'hidden' }"
  >
    <div class="map-dialog-toolbar">
      <template v-if="zoneOptions.length > 1">
        <label class="map-dialog-zone-label">{{ t('mapViewer.dialog.zoneLabel') }}</label>
        <Select
          v-model="selectedSlug"
          :options="zoneOptions"
          optionLabel="label"
          optionValue="slug"
          class="map-dialog-zone-select"
        />
      </template>
      <span v-for="notice in excludedNotices" :key="notice" class="map-dialog-notice">
        <i class="pi pi-info-circle"></i> {{ notice }}
      </span>
    </div>

    <div class="map-dialog-body">
      <div v-if="pins.length === 0" class="map-dialog-state">
        <i class="pi pi-map map-dialog-state-icon"></i>
        <span>{{ t('mapViewer.states.noSpawns') }}</span>
      </div>

      <div v-else-if="selectedSlug === null" class="map-dialog-state">
        <i class="pi pi-map map-dialog-state-icon"></i>
        <span>{{ t('mapViewer.states.noneOnSupportedMaps') }}</span>
      </div>

      <div v-else-if="!currentZoneAvailable" class="map-dialog-state">
        <i class="pi pi-map map-dialog-state-icon"></i>
        <span>{{ t('mapViewer.states.unavailable') }}</span>
        <span class="map-dialog-state-hint">{{ t('mapViewer.states.unavailableHint') }}</span>
      </div>

      <div v-else class="map-dialog-map-wrapper">
        <ZoneMap
          :slug="selectedSlug"
          :calibration="currentCalibration"
          :pins="currentPins"
          :selectedPinId="selectedPinId"
          class="map-dialog-map"
          @pin-click="onPinClick"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.map-dialog-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-bottom: 0.75rem;
}

.map-dialog-zone-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.map-dialog-zone-select {
  min-width: 16rem;
}

.map-dialog-notice {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.map-dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ZoneMap pans/zooms inside its own viewport; just give it the space. */
.map-dialog-map-wrapper {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  border-radius: 0.5rem;
}

.map-dialog-map {
  height: 100%;
}

.map-dialog-state {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1rem;
  text-align: center;
  border: 1px dashed var(--border-input);
  border-radius: 0.5rem;
  background: var(--surface-input);
  color: var(--text-muted);
}

.map-dialog-state-icon {
  font-size: 2.75rem;
  color: var(--text-placeholder);
}

.map-dialog-state-hint {
  font-size: 0.75rem;
  color: var(--text-placeholder);
}
</style>
