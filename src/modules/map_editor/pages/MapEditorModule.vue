<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import ToggleButton from 'primevue/togglebutton'
import EntityWorkspace from '@core/components/workspace/EntityWorkspace.vue'
import EntityListPanel from '@core/components/workspace/EntityListPanel.vue'
import { useMapEditorStore } from '../store'
import { loadClient } from '../service'
import { ZONES, ZONE_BY_ID } from '../data/zones'
import type {
  CreatureSpawnMarker,
  FocusPosition,
  MinimapMapInfo,
  PickedPosition,
  WorldPosition,
  ZoneDefinition,
} from '../types'
import WorldMap from '../components/WorldMap.vue'
import WorldScene3D from '../components/WorldScene3D.vue'
import SpawnInfoPanel from '../components/SpawnInfoPanel.vue'
import ZoneTablesPanel from '../components/ZoneTablesPanel.vue'

const { t, te } = useI18n()
const store = useMapEditorStore()

const loading = ref(false)
const error = ref('')
const cursor = ref<WorldPosition | null>(null)
const viewMode = ref<'2d' | '3d'>('2d')
const viewModes = [
  { label: '2D', value: '2d' as const },
  { label: '3D', value: '3d' as const },
]
/** Last 2D view center; seeds the 3D camera when toggling. */
const viewCenter = ref<WorldPosition | null>(null)
/** Position picked with right-click, shown in the toolbar with a copy action. */
const picked = ref<PickedPosition | null>(null)
const copied = ref(false)

// ── Zones ──────────────────────────────────────────────────────────────
// The zone list is the only navigation: selecting a zone switches the map.
const zoneSearch = ref('')

/** Localized zone name; a zone without a translation shows its raw id. */
function zoneName(zone: ZoneDefinition): string {
  const key = `mapEditor.zones.names.${zone.id}`
  return te(key) ? t(key) : zone.id
}

const filteredZones = computed(() => {
  const query = zoneSearch.value.trim().toLowerCase()
  const zones = query
    ? ZONES.filter(zone => zoneName(zone).toLowerCase().includes(query))
    : [...ZONES]
  // Continents in map order, zones alphabetically within each (per locale).
  return zones.sort((a, b) => a.map - b.map || zoneName(a).localeCompare(zoneName(b)))
})
const selectedZone = computed(() => ZONE_BY_ID.get(store.lastZoneId) ?? null)
/** Camera/view target; each assignment is a fresh object so the views re-trigger. */
const focusTarget = ref<FocusPosition | null>(null)
/** Selected table row position, shown as a dot on the 2D map. */
const rowMarker = ref<FocusPosition | null>(null)

/** A table row was selected: fly there and mark the spot. */
function onFly(target: { x: number; y: number; z: number }) {
  focusTarget.value = { ...target }
  rowMarker.value = { ...target }
}

function selectZone(zone: ZoneDefinition) {
  store.lastZoneId = zone.id
  focusTarget.value = { ...zone.origin }
  rowMarker.value = null
  // May remount the 3D view; initialPosition then reads focusTarget. A zone
  // whose map has no minimap data clears the map (dedicated empty state).
  const info = store.maps.find(m => m.mapId === zone.map)
  store.lastMapId = info?.id ?? ''
}

function onCenter(center: WorldPosition) {
  viewCenter.value = center
  // Panning away from the focused spot dissolves the focus: the 2D center
  // seeds the 3D camera again (the focus only carried its exact height).
  const focus = focusTarget.value
  if (focus && Math.hypot(center.x - focus.x, center.y - focus.y) > 5) {
    focusTarget.value = null
  }
}

function formatCoord(value: number): string {
  return value.toFixed(2)
}

const pickedText = computed(() => {
  if (!picked.value) return ''
  const parts = [formatCoord(picked.value.x), formatCoord(picked.value.y)]
  if (picked.value.z !== null) parts.push(formatCoord(picked.value.z))
  return parts.join(' ')
})

async function copyPicked() {
  if (!picked.value) return
  try {
    await navigator.clipboard.writeText(pickedText.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* clipboard unavailable: the value stays visible for manual copy */
  }
}

const selectedMap = computed<MinimapMapInfo | null>(
  () => store.maps.find(m => m.id === store.lastMapId) ?? null,
)

// Spawns need the DB map id (creature.map); a directory with no Map.dbc match
// can't be linked to spawns, so the toggle is disabled there.
const spawnsAvailable = computed(() => selectedMap.value?.mapId != null)

/** Spawn clicked in the 3D view; its repositioning drives the migration output. */
const selectedSpawn = ref<CreatureSpawnMarker | null>(null)
/** When armed, the next terrain right-click relocates the selected spawn. */
const moveArmed = ref(false)
/** New position captured after a move, kept for the UPDATE statement. */
const movedPosition = ref<{ x: number; y: number; z: number } | null>(null)
const sqlCopied = ref(false)

const migrationSql = computed(() => {
  if (!selectedSpawn.value || !movedPosition.value) return ''
  const p = movedPosition.value
  return `UPDATE creature SET position_x = ${p.x.toFixed(4)}, position_y = ${p.y.toFixed(4)}, position_z = ${p.z.toFixed(4)} WHERE guid = ${selectedSpawn.value.guid};`
})

function onSelectSpawn(spawn: CreatureSpawnMarker | null) {
  selectedSpawn.value = spawn
  moveArmed.value = false
  movedPosition.value = null
}

function onMoveSpawn(move: { guid: number; x: number; y: number; z: number }) {
  movedPosition.value = { x: move.x, y: move.y, z: move.z }
  moveArmed.value = false
}

function clearSelectedSpawn() {
  selectedSpawn.value = null
  moveArmed.value = false
  movedPosition.value = null
}

async function copyMigration() {
  if (!migrationSql.value) return
  try {
    await navigator.clipboard.writeText(migrationSql.value)
    sqlCopied.value = true
    setTimeout(() => (sqlCopied.value = false), 1500)
  } catch {
    /* clipboard unavailable: the statement stays visible for manual copy */
  }
}

// A center from another map would teleport the 3D camera into the void.
watch(() => store.lastMapId, () => {
  viewCenter.value = null
  cursor.value = null
  picked.value = null
  rowMarker.value = null
  clearSelectedSpawn()
})

// Leaving 3D or hiding spawns invalidates any current selection.
watch([viewMode, () => store.showSpawns], () => {
  if (viewMode.value !== '3d' || !store.showSpawns) clearSelectedSpawn()
})

async function load() {
  const path = store.clientPath.trim()
  if (!path || loading.value) return
  loading.value = true
  error.value = ''
  try {
    store.maps = await loadClient(path)
    if (selectedZone.value) {
      // Restore the persisted zone: map + camera back at its origin.
      selectZone(selectedZone.value)
    } else {
      // No zone yet: nothing to display (the map only follows the zone).
      store.lastMapId = ''
    }
  } catch (e) {
    store.maps = []
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

// The path is set in Settings; reload when it changes while the module is
// open. Debounced so typing in the Settings input doesn't spam the backend.
let pathReloadTimer: ReturnType<typeof setTimeout> | undefined
watch(() => store.clientPath, () => {
  clearTimeout(pathReloadTimer)
  pathReloadTimer = setTimeout(() => void load(), 800)
})

onMounted(() => {
  if (store.clientPath && store.maps.length === 0) {
    void load()
  }
})
</script>

<template>
  <div class="map-editor">
    <div class="editor-header">
      <div>
        <h2 class="editor-title">{{ t('mapEditor.title') }}</h2>
        <p class="editor-description">{{ t('mapEditor.description') }}</p>
      </div>
    </div>

    <EntityWorkspace storageKey="mapEditor" listWidth="240px" class="editor-workspace">
      <!-- Curated zones (data/zones.ts); selecting one drives map + camera. -->
      <template #list>
        <EntityListPanel
          :items="filteredZones"
          :idOf="zone => zone.id"
          :titleOf="zoneName"
          :metaOf="zone => t('mapEditor.zones.mapMeta', { map: zone.map })"
          :selectedId="store.lastZoneId || null"
          :showAdd="false"
          :searchPlaceholder="t('mapEditor.zones.searchPlaceholder')"
          @search="zoneSearch = $event"
          @select="selectZone"
        />
      </template>

      <template #editor>
        <div class="editor-toolbar">
          <SelectButton
            v-if="selectedMap"
            v-model="viewMode"
            :options="viewModes"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          />
          <ToggleButton
            v-if="selectedMap && viewMode === '3d'"
            v-model="store.showSpawns"
            :disabled="!spawnsAvailable"
            onIcon="pi pi-users"
            offIcon="pi pi-users"
            :onLabel="t('mapEditor.spawns.toggle')"
            :offLabel="t('mapEditor.spawns.toggle')"
            v-tooltip.bottom="spawnsAvailable ? t('mapEditor.spawns.toggleHint') : t('mapEditor.spawns.noMapId')"
          />
          <span v-if="cursor" class="cursor-coords">
            X {{ cursor.x.toFixed(1) }} · Y {{ cursor.y.toFixed(1) }}
          </span>
          <span v-if="picked" class="picked-chip">
            <i class="pi pi-map-marker"></i>
            <span class="picked-value">{{ pickedText }}</span>
            <Button
              :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
              text
              size="small"
              :aria-label="t('mapEditor.picked.copy')"
              v-tooltip.bottom="t('mapEditor.picked.copy')"
              @click="copyPicked"
            />
            <Button
              icon="pi pi-times"
              text
              size="small"
              :aria-label="t('mapEditor.picked.clear')"
              @click="picked = null"
            />
          </span>
        </div>

        <p v-if="error" class="editor-error">{{ t('mapEditor.states.error', { message: error }) }}</p>

        <div class="map-stage">
          <WorldMap
            v-if="selectedMap && viewMode === '2d'"
            :map="selectedMap"
            :focus="focusTarget"
            :marker="rowMarker"
            class="editor-map"
            @cursor="cursor = $event"
            @center="onCenter"
            @pick="picked = $event"
          />
          <WorldScene3D
            v-else-if="selectedMap"
            :key="selectedMap.id"
            :map="selectedMap"
            :initialPosition="focusTarget ?? viewCenter"
            :focus="focusTarget"
            :showSpawns="store.showSpawns"
            :moveArmed="moveArmed"
            class="editor-map"
            @pick="picked = $event"
            @select-spawn="onSelectSpawn"
            @move-spawn="onMoveSpawn"
          />
          <div v-else class="editor-empty">
            <i class="pi pi-map" style="font-size: 3rem; color: var(--text-placeholder)"></i>
            <p>
              {{
                loading
                  ? t('mapEditor.states.loading')
                  : store.maps.length === 0
                    ? t('mapEditor.states.noClient')
                    : selectedZone
                      ? t('mapEditor.states.noMinimap', { map: selectedZone.map })
                      : t('mapEditor.states.noZone')
              }}
            </p>
          </div>

          <!-- Selected-spawn panel floats over the map so it never reflows the view. -->
          <div v-if="viewMode === '3d' && selectedSpawn" class="spawn-overlay">
            <SpawnInfoPanel
              :spawn="selectedSpawn"
              v-model:moveArmed="moveArmed"
              :movedPosition="movedPosition"
              :migrationSql="migrationSql"
              :sqlCopied="sqlCopied"
              @copy-sql="copyMigration"
              @close="clearSelectedSpawn"
            />
          </div>
        </div>
      </template>

      <!-- Zone tables live off the DB map id alone, minimap or not. -->
      <template v-if="selectedZone" #inspector>
        <ZoneTablesPanel
          :map="selectedZone.map"
          :zoneId="selectedZone.zoneId"
          @fly="onFly"
        />
      </template>
    </EntityWorkspace>
  </div>
</template>

<style scoped>
.map-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 0;
}

.editor-title {
  font-size: 2rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.editor-description {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* Flex sizing beats the workspace's own height: 100% inside this column. */
.editor-workspace {
  flex: 1;
  min-height: 0;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cursor-coords {
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  font-size: 0.9rem;
  white-space: nowrap;
}

.picked-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.3rem 0.15rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-elevated);
  color: var(--text);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.picked-chip .pi-map-marker {
  color: var(--accent);
  font-size: 0.85rem;
}

.editor-error {
  color: var(--danger);
  font-size: 0.9rem;
}

.map-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}

.editor-map {
  flex: 1;
  min-height: 0;
}

/* Top-right, clear of the "streaming" chip; capped to the map height so the
   panel scrolls internally instead of pushing anything. */
.spawn-overlay {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  align-items: flex-start;
  pointer-events: none;
  z-index: 5;
}

.spawn-overlay > * {
  pointer-events: auto;
  max-height: 100%;
}

.editor-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex: 1;
  border: 2px dashed var(--border-input-soft);
  border-radius: 1rem;
  color: var(--text-placeholder);
  font-size: 0.95rem;
}
</style>
