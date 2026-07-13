<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { open } from '@tauri-apps/plugin-dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import ToggleButton from 'primevue/togglebutton'
import { useMapEditorStore } from '../store'
import { loadClient } from '../service'
import type { CreatureSpawnMarker, MinimapMapInfo, PickedPosition, WorldPosition } from '../types'
import WorldMap from '../components/WorldMap.vue'
import WorldScene3D from '../components/WorldScene3D.vue'
import SpawnInfoPanel from '../components/SpawnInfoPanel.vue'

const { t } = useI18n()
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
    if (!store.maps.some(m => m.id === store.lastMapId)) {
      // Sensible default: the biggest map is a continent.
      const biggest = [...store.maps].sort((a, b) => b.tileCount - a.tileCount)[0]
      store.lastMapId = biggest?.id ?? ''
    }
  } catch (e) {
    store.maps = []
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

/** Native folder picker; loads the client right away on selection. */
async function browse() {
  const dir = await open({
    directory: true,
    multiple: false,
    title: t('mapEditor.clientPath.browseTitle'),
    defaultPath: store.clientPath.trim() || undefined,
  })
  if (typeof dir === 'string') {
    store.clientPath = dir
    void load()
  }
}

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

    <div class="editor-toolbar">
      <InputText
        v-model="store.clientPath"
        class="client-path"
        :placeholder="t('mapEditor.clientPath.placeholder')"
        :disabled="loading"
        @keyup.enter="load"
      />
      <Button
        icon="pi pi-folder-open"
        severity="secondary"
        :aria-label="t('mapEditor.clientPath.browse')"
        v-tooltip.bottom="t('mapEditor.clientPath.browse')"
        :disabled="loading"
        @click="browse"
      />
      <Button
        :label="t('mapEditor.clientPath.load')"
        icon="pi pi-refresh"
        :loading="loading"
        :disabled="!store.clientPath.trim()"
        @click="load"
      />
      <Select
        v-if="store.maps.length > 0"
        v-model="store.lastMapId"
        :options="store.maps"
        optionLabel="name"
        optionValue="id"
        :placeholder="t('mapEditor.map')"
        filter
        class="map-select"
      >
        <template #option="{ option }">
          <span>{{ option.name }}</span>
          <span class="map-option-tiles">{{ t('mapEditor.tiles', { count: option.tileCount }) }}</span>
        </template>
      </Select>
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
        class="editor-map"
        @cursor="cursor = $event"
        @center="viewCenter = $event"
        @pick="picked = $event"
      />
      <WorldScene3D
        v-else-if="selectedMap"
        :key="selectedMap.id"
        :map="selectedMap"
        :initialPosition="viewCenter"
        :showSpawns="store.showSpawns"
        :moveArmed="moveArmed"
        class="editor-map"
        @pick="picked = $event"
        @select-spawn="onSelectSpawn"
        @move-spawn="onMoveSpawn"
      />
      <div v-else class="editor-empty">
        <i class="pi pi-map" style="font-size: 3rem; color: #334155"></i>
        <p>{{ loading ? t('mapEditor.states.loading') : t('mapEditor.states.noClient') }}</p>
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
  background: linear-gradient(to right, #60a5fa, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.editor-description {
  color: #94a3b8;
  font-size: 0.95rem;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.client-path {
  flex: 1;
  min-width: 16rem;
}

.map-select {
  min-width: 14rem;
}

.map-option-tiles {
  color: #64748b;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.cursor-coords {
  font-variant-numeric: tabular-nums;
  color: #94a3b8;
  font-size: 0.9rem;
  white-space: nowrap;
}

.picked-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.3rem 0.15rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(51, 65, 85, 0.8);
  background: rgba(30, 41, 59, 0.6);
  color: #e2e8f0;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.picked-chip .pi-map-marker {
  color: #22d3ee;
  font-size: 0.85rem;
}

.editor-error {
  color: #f87171;
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
  border: 2px dashed rgba(51, 65, 85, 0.5);
  border-radius: 1rem;
  color: #475569;
  font-size: 0.95rem;
}
</style>
