<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MinimapMapInfo, PickedPosition, WorldPosition } from '../types'
import { MIN_ZOOM, NATIVE_ZOOM, latLngToWorld, tileUrlTemplate } from '../service'

/**
 * Leaflet viewport over the `minimap://` tile pyramid.
 *
 * CRS.Simple with latLng = (-adtRow, adtCol): at zoom 8 (native) one 256px
 * tile is exactly one ADT cell, and leaflet's own {z}/{x}/{y} template maps
 * 1:1 onto the backend pyramid. North is up.
 */

const props = defineProps<{
  map: MinimapMapInfo
}>()

const emit = defineEmits<{
  (e: 'cursor', world: WorldPosition | null): void
  /** Fired after each pan/zoom with the view center (seeds the 3D view). */
  (e: 'center', world: WorldPosition): void
  /** Right-click: world position under the pointer (no height in 2D). */
  (e: 'pick', position: PickedPosition): void
}>()

/** Initial zoom floor: fitting a whole continent would sit at zoom 4 and make
 * the very first display render thousands of BLPs before anything shows. */
const INITIAL_MIN_ZOOM = 6

const container = ref<HTMLDivElement>()
let leafletMap: L.Map | null = null
let tileLayer: L.TileLayer | null = null

function tileBounds(info: MinimapMapInfo): L.LatLngBounds {
  // Cells [minX..maxX]×[minY..maxY] — +1 because a cell spans one unit.
  return L.latLngBounds(
    [-(info.maxY + 1), info.minX],
    [-info.minY, info.maxX + 1],
  )
}

function showMap(info: MinimapMapInfo) {
  if (!leafletMap) return
  tileLayer?.remove()

  const bounds = tileBounds(info)
  tileLayer = L.tileLayer(tileUrlTemplate(info.id), {
    minZoom: MIN_ZOOM,
    maxZoom: NATIVE_ZOOM + 2, // upscaled beyond native for close inspection
    minNativeZoom: MIN_ZOOM,
    maxNativeZoom: NATIVE_ZOOM,
    noWrap: true,
    bounds,
    keepBuffer: 2,
  }).addTo(leafletMap)

  leafletMap.setMaxBounds(bounds.pad(0.5))
  leafletMap.fitBounds(bounds)
  if (leafletMap.getZoom() < INITIAL_MIN_ZOOM) {
    leafletMap.setView(bounds.getCenter(), INITIAL_MIN_ZOOM)
  }
}

onMounted(() => {
  if (!container.value) return
  leafletMap = L.map(container.value, {
    crs: L.CRS.Simple,
    attributionControl: false,
    minZoom: MIN_ZOOM,
    maxZoom: NATIVE_ZOOM + 2,
    zoomControl: true,
    maxBoundsViscosity: 0.8,
  })
  leafletMap.on('mousemove', (event: L.LeafletMouseEvent) => {
    emit('cursor', latLngToWorld(event.latlng))
  })
  leafletMap.on('mouseout', () => emit('cursor', null))
  leafletMap.on('moveend', () => {
    if (leafletMap) emit('center', latLngToWorld(leafletMap.getCenter()))
  })
  leafletMap.on('contextmenu', (event: L.LeafletMouseEvent) => {
    emit('pick', { ...latLngToWorld(event.latlng), z: null })
  })
  showMap(props.map)
})

watch(
  () => props.map,
  info => showMap(info),
)

onBeforeUnmount(() => {
  leafletMap?.remove()
  leafletMap = null
  tileLayer = null
})
</script>

<template>
  <div ref="container" class="world-map"></div>
</template>

<style scoped>
.world-map {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 0.75rem;
  border: 1px solid rgba(51, 65, 85, 0.5);
  /* Ocean cells have no minimap tile: show a deep-sea backdrop instead. */
  background: #060d1f;
}

/* Leaflet's default controls are white; align them with the slate theme.
 * The map DOM is created by leaflet at runtime, hence :deep(). */
.world-map :deep(.leaflet-control-zoom a) {
  background: #1e293b;
  color: #e2e8f0;
  border-color: rgba(51, 65, 85, 0.8);
}

.world-map :deep(.leaflet-control-zoom a:hover) {
  background: #334155;
}
</style>
