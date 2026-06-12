import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { InstanceTemplate } from '../types/instance_template'
import type { InstanceSpawnGroup } from '../types/instance_spawn_groups'
import type { InstanceEncounter } from '../types/instance_encounters'
import type { FieldChange } from '@/composables/useQueryGenerator'
import type { SessionQuery } from '@/stores/moduleStore'
import * as mapService from '../service'
import {
  generateDiffQuery as tplDiff,
  generateFullQuery as tplFull,
  getChangedFields as tplChanged,
} from './instance_template'
import {
  generateDiffQuery as sgDiff,
  generateFullQuery as sgFull,
} from './instance_spawn_groups'
import {
  generateDiffQuery as encDiff,
  generateFullQuery as encFull,
} from './instance_encounters'

// ─── Row identity (synthetic uid to diff child collections) ──────────

let uidCounter = 1
function nextUid(): number {
  return uidCounter++
}

type WithUid<T> = T & { _uid: number }

function tag<T>(rows: T[]): WithUid<T>[] {
  return rows.map(r => ({ ...r, _uid: nextUid() }))
}

function strip<T>(row: WithUid<T>): T {
  const { _uid, ...rest } = row as WithUid<T> & Record<string, unknown>
  return rest as unknown as T
}

// ─── Child DELETE helpers (composite / simple keys) ──────────────────

function spawnGroupDelete(row: InstanceSpawnGroup): string {
  return `DELETE FROM \`instance_spawn_groups\` WHERE \`instanceMapId\` = ${row.instanceMapId} ` +
    `AND \`bossStateId\` = ${row.bossStateId} AND \`bossStates\` = ${row.bossStates} ` +
    `AND \`spawnGroupId\` = ${row.spawnGroupId};`
}

function encounterDelete(row: InstanceEncounter): string {
  return `DELETE FROM \`instance_encounters\` WHERE \`entry\` = ${row.entry};`
}

function rowsEqual<T extends object>(a: T, b: T): boolean {
  const keys = Object.keys(a) as (keyof T)[]
  return keys.every(k => k === '_uid' || a[k] === b[k])
}

// ─── Default factories ───────────────────────────────────────────────

function createTemplate(): InstanceTemplate {
  return { map: 0, parent: 0, script: '', allowMount: 0 }
}

function newSpawnGroup(map: number): WithUid<InstanceSpawnGroup> {
  return { _uid: nextUid(), instanceMapId: map, bossStateId: 0, bossStates: 0, spawnGroupId: 0, flags: 0 }
}

function newEncounter(): WithUid<InstanceEncounter> {
  return { _uid: nextUid(), entry: 0, creditType: 0, creditEntry: 0, lastEncounterDungeon: 0, comment: '' }
}

// ─── Store ───────────────────────────────────────────────────────────

export const useInstanceStore = defineStore('instanceModule', () => {
  // --- List state (instance_template rows = the instances) ---
  const entries = ref<InstanceTemplate[]>([])
  const loading = ref(false)
  const currentSearch = ref('')
  const listLoaded = ref(false)

  // --- Editor state ---
  const isNew = ref(false)
  const editorDataLoaded = ref(false)

  // Template tab
  const template = reactive<InstanceTemplate>(createTemplate())
  const originalTemplate = ref<InstanceTemplate | null>(null)

  // Spawn groups tab
  const spawnGroups = ref<WithUid<InstanceSpawnGroup>[]>([])
  const originalSpawnGroups = ref<InstanceSpawnGroup[]>([])

  // Encounters tab
  const encounters = ref<WithUid<InstanceEncounter>[]>([])
  const originalEncounters = ref<InstanceEncounter[]>([])

  // ─── List actions ────────────────────────────────────────────────

  async function fetchEntries(search?: string, limit?: number, offset?: number) {
    loading.value = true
    try {
      const result = await mapService.getInstanceTemplates(search, limit, offset)
      entries.value = result.data
      currentSearch.value = search || ''
      listLoaded.value = true
      return result
    } finally {
      loading.value = false
    }
  }

  // ─── Editor actions ──────────────────────────────────────────────

  async function openEditor(map: number) {
    editorDataLoaded.value = false
    isNew.value = false
    try {
      const [tpl, sgs, encs] = await Promise.all([
        mapService.getInstanceTemplate(map),
        mapService.getInstanceSpawnGroupsByMap(map),
        mapService.getInstanceEncountersByMap(map),
      ])
      Object.assign(template, tpl)
      originalTemplate.value = structuredClone(tpl)
      spawnGroups.value = tag(sgs)
      originalSpawnGroups.value = structuredClone(sgs)
      encounters.value = tag(encs)
      originalEncounters.value = structuredClone(encs)
      editorDataLoaded.value = true
    } catch (error) {
      console.error('Failed to load instance:', error)
      throw error
    }
  }

  function openNew() {
    isNew.value = true
    Object.assign(template, createTemplate())
    originalTemplate.value = null
    spawnGroups.value = []
    originalSpawnGroups.value = []
    encounters.value = []
    originalEncounters.value = []
    editorDataLoaded.value = true
  }

  function addSpawnGroup() {
    spawnGroups.value.push(newSpawnGroup(template.map))
  }

  function removeSpawnGroup(index: number) {
    spawnGroups.value.splice(index, 1)
  }

  function addEncounter() {
    encounters.value.push(newEncounter())
  }

  function removeEncounter(index: number) {
    encounters.value.splice(index, 1)
  }

  // ─── Diff helpers ────────────────────────────────────────────────

  /** Per-table changes used for the SQL panel & the global SQL session. */
  function buildQueries(): { table: string; query: string }[] {
    const out: { table: string; query: string }[] = []

    // Template
    if (originalTemplate.value) {
      const q = tplDiff(originalTemplate.value, template)
      if (q) out.push({ table: 'instance_template', query: q })
    } else {
      out.push({ table: 'instance_template', query: tplFull(template) })
    }

    // Spawn groups
    const curSg = spawnGroups.value
    const origSg = originalSpawnGroups.value
    // removed
    for (const orig of origSg) {
      const stillThere = curSg.some(c => rowsEqual(strip(c), orig))
      const sameKey = curSg.some(c =>
        c.instanceMapId === orig.instanceMapId && c.bossStateId === orig.bossStateId &&
        c.bossStates === orig.bossStates && c.spawnGroupId === orig.spawnGroupId)
      if (!stillThere && !sameKey) {
        out.push({ table: 'instance_spawn_groups', query: spawnGroupDelete(orig) })
      }
    }
    // added / changed
    for (const cur of curSg) {
      const plain = strip(cur)
      const orig = origSg.find(o =>
        o.instanceMapId === cur.instanceMapId && o.bossStateId === cur.bossStateId &&
        o.bossStates === cur.bossStates && o.spawnGroupId === cur.spawnGroupId)
      if (!orig) {
        out.push({ table: 'instance_spawn_groups', query: sgFull(plain) })
      } else if (!rowsEqual(orig, plain)) {
        const q = sgDiff(orig, plain)
        if (q) out.push({ table: 'instance_spawn_groups', query: q })
      }
    }

    // Encounters
    const curEnc = encounters.value
    const origEnc = originalEncounters.value
    for (const orig of origEnc) {
      const sameKey = curEnc.some(c => c.entry === orig.entry)
      if (!sameKey) out.push({ table: 'instance_encounters', query: encounterDelete(orig) })
    }
    for (const cur of curEnc) {
      const plain = strip(cur)
      const orig = origEnc.find(o => o.entry === cur.entry)
      if (!orig) {
        out.push({ table: 'instance_encounters', query: encFull(plain) })
      } else if (!rowsEqual(orig, plain)) {
        const q = encDiff(orig, plain)
        if (q) out.push({ table: 'instance_encounters', query: q })
      }
    }

    return out
  }

  function diffQueryText(): string {
    return buildQueries().map(q => q.query).join('\n')
  }

  function changedFields(): FieldChange[] {
    const fields: FieldChange[] = []
    if (originalTemplate.value) {
      fields.push(...tplChanged(originalTemplate.value, template))
    }
    return fields
  }

  function hasChanges(): boolean {
    return buildQueries().length > 0
  }

  function getAllDiffQueries(): SessionQuery[] {
    if (!editorDataLoaded.value) return []
    return buildQueries().map(q => ({ table: q.table, entry: template.map, query: q.query }))
  }

  // ─── Persistence ─────────────────────────────────────────────────

  async function saveEntry() {
    // Template
    await mapService.saveInstanceTemplate(template)

    // Spawn groups: delete removed, upsert current
    for (const orig of originalSpawnGroups.value) {
      const sameKey = spawnGroups.value.some(c =>
        c.instanceMapId === orig.instanceMapId && c.bossStateId === orig.bossStateId &&
        c.bossStates === orig.bossStates && c.spawnGroupId === orig.spawnGroupId)
      if (!sameKey) {
        await mapService.deleteInstanceSpawnGroup(orig.instanceMapId, orig.bossStateId, orig.bossStates, orig.spawnGroupId)
      }
    }
    for (const cur of spawnGroups.value) {
      await mapService.saveInstanceSpawnGroup(strip(cur))
    }

    // Encounters: delete removed, upsert current
    for (const orig of originalEncounters.value) {
      const sameKey = encounters.value.some(c => c.entry === orig.entry)
      if (!sameKey) await mapService.deleteInstanceEncounter(orig.entry)
    }
    for (const cur of encounters.value) {
      await mapService.saveInstanceEncounter(strip(cur))
    }

    if (listLoaded.value) {
      await fetchEntries(currentSearch.value)
    }
  }

  async function deleteEntry(map: number) {
    await mapService.deleteInstanceTemplate(map)
    if (listLoaded.value) {
      await fetchEntries(currentSearch.value)
    }
  }

  return {
    // list
    entries,
    loading,
    currentSearch,
    listLoaded,
    fetchEntries,
    // editor
    isNew,
    editorDataLoaded,
    template,
    originalTemplate,
    spawnGroups,
    encounters,
    openEditor,
    openNew,
    addSpawnGroup,
    removeSpawnGroup,
    addEncounter,
    removeEncounter,
    diffQueryText,
    changedFields,
    hasChanges,
    getAllDiffQueries,
    saveEntry,
    deleteEntry,
  }
})
