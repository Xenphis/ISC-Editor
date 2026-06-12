import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { GameTele } from '../types/game_tele'
import type { FieldChange } from '@/composables/useQueryGenerator'
import type { SessionQuery } from '@/stores/moduleStore'
import * as mapService from '../service'

// ─── SQL helpers (primary key: id) ───────────────────────────────────

function escapeVal(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  return `'${String(v).replace(/'/g, "''")}'`
}

const EDITABLE_KEYS: (keyof GameTele)[] = [
  'position_x', 'position_y', 'position_z', 'orientation', 'map', 'name',
]

function normalize(v: unknown): unknown {
  return v === undefined || v === '' ? null : v
}

export function generateDiffQuery(original: GameTele, current: GameTele): string {
  const sets: string[] = []
  for (const key of EDITABLE_KEYS) {
    if (normalize(original[key]) !== normalize(current[key])) {
      sets.push(`\`${key}\` = ${escapeVal(current[key])}`)
    }
  }
  if (sets.length === 0) return ''
  return `UPDATE \`game_tele\` SET ${sets.join(', ')} WHERE \`id\` = ${current.id};`
}

export function generateFullQuery(row: GameTele): string {
  const cols: (keyof GameTele)[] = [
    'id', 'position_x', 'position_y', 'position_z', 'orientation', 'map', 'name',
  ]
  const colNames = cols.map(c => `\`${c}\``).join(', ')
  const vals = cols.map(c => escapeVal(row[c])).join(', ')
  const del = `DELETE FROM \`game_tele\` WHERE \`id\` = ${row.id};`
  const ins = `INSERT INTO \`game_tele\` (${colNames}) VALUES (${vals});`
  return del + '\n' + ins
}

export function getChangedFields(original: GameTele, current: GameTele): FieldChange[] {
  const changes: FieldChange[] = []
  for (const key of EDITABLE_KEYS) {
    if (normalize(original[key]) !== normalize(current[key])) {
      changes.push({ field: key, oldValue: original[key], newValue: current[key] })
    }
  }
  return changes
}

// ─── Default factory ─────────────────────────────────────────────────

function createDefault(): GameTele {
  return {
    id: 0,
    position_x: 0,
    position_y: 0,
    position_z: 0,
    orientation: 0,
    map: 0,
    name: '',
  }
}

// ─── Store ───────────────────────────────────────────────────────────

export const useGameTeleStore = defineStore('gameTeleModule', () => {
  // --- List state ---
  const entries = ref<GameTele[]>([])
  const loading = ref(false)
  const currentSearch = ref('')
  const listLoaded = ref(false)

  // --- Editor state ---
  const formData = reactive<GameTele>(createDefault())
  const originalValue = ref<GameTele | null>(null)
  const editorDataLoaded = ref(false)

  // ─── Actions ─────────────────────────────────────────────────────

  async function fetchEntries(search?: string, limit?: number, offset?: number) {
    loading.value = true
    try {
      const result = await mapService.getGameTeles(search, limit, offset)
      entries.value = result.data
      currentSearch.value = search || ''
      listLoaded.value = true
      return result
    } finally {
      loading.value = false
    }
  }

  async function openEditor(id: number) {
    editorDataLoaded.value = false
    try {
      const data = await mapService.getGameTele(id)
      Object.assign(formData, data)
      originalValue.value = structuredClone(data)
      editorDataLoaded.value = true
    } catch (error) {
      console.error('Failed to load game tele:', error)
      throw error
    }
  }

  function openNew() {
    Object.assign(formData, createDefault())
    originalValue.value = null
    editorDataLoaded.value = true
  }

  async function saveEntry() {
    await mapService.saveGameTele(formData)
    if (listLoaded.value) {
      await fetchEntries(currentSearch.value)
    }
  }

  async function deleteEntry(id: number) {
    await mapService.deleteGameTele(id)
    if (listLoaded.value) {
      await fetchEntries(currentSearch.value)
    }
  }

  function getAllDiffQueries(): SessionQuery[] {
    if (!editorDataLoaded.value) return []
    const query = originalValue.value
      ? generateDiffQuery(originalValue.value, formData)
      : generateFullQuery(formData)
    if (!query) return []
    return [{ table: 'game_tele', entry: formData.id, query }]
  }

  return {
    entries,
    loading,
    currentSearch,
    listLoaded,
    formData,
    originalValue,
    editorDataLoaded,
    fetchEntries,
    openEditor,
    openNew,
    saveEntry,
    deleteEntry,
    getAllDiffQueries,
  }
})
