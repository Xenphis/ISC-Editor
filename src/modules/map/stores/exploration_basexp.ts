import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { ExplorationBasexp } from '../types/exploration_basexp'
import type { FieldChange } from '@/composables/useQueryGenerator'
import type { SessionQuery } from '@/stores/moduleStore'
import * as mapService from '../service'

// ─── SQL helpers (primary key: level) ────────────────────────────────

function escapeVal(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  return `'${String(v).replace(/'/g, "''")}'`
}

const EDITABLE_KEYS: (keyof ExplorationBasexp)[] = ['basexp']

function normalize(v: unknown): unknown {
  return v === undefined || v === '' ? null : v
}

export function generateDiffQuery(original: ExplorationBasexp, current: ExplorationBasexp): string {
  const sets: string[] = []
  for (const key of EDITABLE_KEYS) {
    if (normalize(original[key]) !== normalize(current[key])) {
      sets.push(`\`${key}\` = ${escapeVal(current[key])}`)
    }
  }
  if (sets.length === 0) return ''
  return `UPDATE \`exploration_basexp\` SET ${sets.join(', ')} WHERE \`level\` = ${current.level};`
}

export function generateFullQuery(row: ExplorationBasexp): string {
  const cols: (keyof ExplorationBasexp)[] = ['level', 'basexp']
  const colNames = cols.map(c => `\`${c}\``).join(', ')
  const vals = cols.map(c => escapeVal(row[c])).join(', ')
  const del = `DELETE FROM \`exploration_basexp\` WHERE \`level\` = ${row.level};`
  const ins = `INSERT INTO \`exploration_basexp\` (${colNames}) VALUES (${vals});`
  return del + '\n' + ins
}

export function getChangedFields(original: ExplorationBasexp, current: ExplorationBasexp): FieldChange[] {
  const changes: FieldChange[] = []
  for (const key of EDITABLE_KEYS) {
    if (normalize(original[key]) !== normalize(current[key])) {
      changes.push({ field: key, oldValue: original[key], newValue: current[key] })
    }
  }
  return changes
}

// ─── Default factory ─────────────────────────────────────────────────

function createDefault(): ExplorationBasexp {
  return {
    level: 0,
    basexp: 0,
  }
}

// ─── Store ───────────────────────────────────────────────────────────

export const useExplorationBasexpStore = defineStore('explorationBasexpModule', () => {
  // --- List state ---
  const entries = ref<ExplorationBasexp[]>([])
  const loading = ref(false)
  const currentSearch = ref('')
  const listLoaded = ref(false)

  // --- Editor state ---
  const formData = reactive<ExplorationBasexp>(createDefault())
  const originalValue = ref<ExplorationBasexp | null>(null)
  const editorDataLoaded = ref(false)

  // ─── Actions ─────────────────────────────────────────────────────

  async function fetchEntries(search?: string, limit?: number, offset?: number) {
    loading.value = true
    try {
      const result = await mapService.getExplorationBasexps(search, limit, offset)
      entries.value = result.data
      currentSearch.value = search || ''
      listLoaded.value = true
      return result
    } finally {
      loading.value = false
    }
  }

  async function openEditor(level: number) {
    editorDataLoaded.value = false
    try {
      const data = await mapService.getExplorationBasexp(level)
      Object.assign(formData, data)
      originalValue.value = structuredClone(data)
      editorDataLoaded.value = true
    } catch (error) {
      console.error('Failed to load exploration basexp:', error)
      throw error
    }
  }

  function openNew() {
    Object.assign(formData, createDefault())
    originalValue.value = null
    editorDataLoaded.value = true
  }

  async function saveEntry() {
    await mapService.saveExplorationBasexp(formData)
    if (listLoaded.value) {
      await fetchEntries(currentSearch.value)
    }
  }

  async function deleteEntry(level: number) {
    await mapService.deleteExplorationBasexp(level)
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
    return [{ table: 'exploration_basexp', entry: formData.level, query }]
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
