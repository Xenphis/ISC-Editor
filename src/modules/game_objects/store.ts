import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { GameObjectTemplate } from '@/modules/game_objects/types/gameobject_template/gameobject_template'
import { ReactiveSubTable, ArraySubTable, type SubTableManager, type SubTableSnapshot } from '@/stores/SubTableManager'
import { generateDiffQuery } from '@/composables/useQueryGenerator'
import type { SessionQuery } from '@/stores/moduleStore'
import type { CompositeKeyConfig } from '@/composables/useQueryGenerator'
import { escapeSQL } from '@/utils/sql'

// ─── Interfaces ──────────────────────────────────────────────────────

export interface AddonForm {
  faction: number
  flags: number
  mingold: number
  maxgold: number
  artkit0: number
  artkit1: number
  artkit2: number
  artkit3: number
}

export interface SpawnOverridesForm {
  faction: number
  flags: number
}

export interface SpawnAddonForm {
  parent_rotation0: number
  parent_rotation1: number
  parent_rotation2: number
  parent_rotation3: number
  invisibilityType: number
  invisibilityValue: number
}

export interface LootEntry {
  Item: number
  Reference: number
  Chance: number
  QuestRequired: boolean
  LootMode: number
  GroupId: number
  MinCount: number
  MaxCount: number
  Comment: string
}

// ─── Default factories ──────────────────────────────────────────────

export function createDefaultAddonForm(): AddonForm {
  return { faction: 0, flags: 0, mingold: 0, maxgold: 0, artkit0: 0, artkit1: 0, artkit2: 0, artkit3: 0 }
}

export function createDefaultSpawnOverridesForm(): SpawnOverridesForm {
  return { faction: 0, flags: 0 }
}

export function createDefaultSpawnAddonForm(): SpawnAddonForm {
  return { parent_rotation0: 0, parent_rotation1: 0, parent_rotation2: 0, parent_rotation3: 0, invisibilityType: 0, invisibilityValue: 0 }
}

function createDefaultForm(): GameObjectTemplate {
  return {
    entry: 0, type: 0, displayId: 0, name: '', IconName: '', castBarCaption: '', unk1: '',
    size: 1,
    Data0: 0, Data1: 0, Data2: 0, Data3: 0, Data4: 0, Data5: 0, Data6: 0, Data7: 0,
    Data8: 0, Data9: 0, Data10: 0, Data11: 0, Data12: 0, Data13: 0, Data14: 0, Data15: 0,
    Data16: 0, Data17: 0, Data18: 0, Data19: 0, Data20: 0, Data21: 0, Data22: 0, Data23: 0,
    AIName: '', ScriptName: '', StringId: null, VerifiedBuild: 0,
  }
}

// ─── Composite key configs ──────────────────────────────────────────

const lootConfig: Omit<CompositeKeyConfig<LootEntry>, 'parentId'> = {
  table: 'gameobject_loot_template',
  parentKey: 'Entry',
  childKey: 'Item',
  columns: ['Reference', 'Chance', 'QuestRequired', 'LootMode', 'GroupId', 'MinCount', 'MaxCount', 'Comment'],
  isEqual: (a, b) =>
    a.Reference === b.Reference && a.Chance === b.Chance && a.QuestRequired === b.QuestRequired &&
    a.LootMode === b.LootMode && a.GroupId === b.GroupId && a.MinCount === b.MinCount &&
    a.MaxCount === b.MaxCount && a.Comment === b.Comment,
  toSqlValues: (e) => [
    e.Reference, e.Chance, e.QuestRequired ? 1 : 0, e.LootMode,
    e.GroupId, e.MinCount, e.MaxCount, `'${escapeSQL(e.Comment)}'`,
  ],
}

// ─── EditorCache ─────────────────────────────────────────────────────

interface EditorCache {
  formData: GameObjectTemplate
  originalValue: GameObjectTemplate
  subTables: Record<string, SubTableSnapshot>
}

// ─── Store ──────────────────────────────────────────────────────────

export const useGameObjectModuleStore = defineStore('gameObjectModule', () => {
  // --- List state ---
  const gameObjects = ref<GameObjectTemplate[]>([])
  const loading = ref(false)
  const currentSearch = ref('')
  const listLoaded = ref(false)

  // --- Editor state ---
  const editing = ref(false)
  const editingEntry = ref<number | null>(null)
  const formData = reactive<GameObjectTemplate>(createDefaultForm())
  const originalValue = ref<GameObjectTemplate | null>(null)
  const editorDataLoaded = ref(false)

  // --- Sub-table managers ---
  const addon = new ReactiveSubTable<AddonForm>({
    tableName: 'gameobject_template_addon',
    primaryKey: 'entry',
    createDefault: createDefaultAddonForm,
  })

  const spawnOverrides = new ReactiveSubTable<SpawnOverridesForm>({
    tableName: 'gameobject_overrides',
    primaryKey: 'spawnId',
    createDefault: createDefaultSpawnOverridesForm,
  })

  const spawnAddon = new ReactiveSubTable<SpawnAddonForm>({
    tableName: 'gameobject_addon',
    primaryKey: 'guid',
    createDefault: createDefaultSpawnAddonForm,
  })

  const loot = new ArraySubTable<LootEntry>({
    tableName: 'gameobject_loot_template',
    compositeConfig: lootConfig,
    fieldPrefix: 'loot_item',
    summarize: (e) => `Item ${e.Item} (${e.Chance}%)`,
  })

  const subTables: SubTableManager[] = [addon, loot]

  // --- Multi-entry cache ---
  const dirtyCache = ref<Map<number, EditorCache>>(new Map())

  function saveToCache() {
    if (editingEntry.value != null && editorDataLoaded.value) {
      const subTableSnapshots: Record<string, SubTableSnapshot> = {}
      for (const st of subTables) {
        subTableSnapshots[st.tableName] = st.snapshot()
      }
      dirtyCache.value.set(editingEntry.value, {
        formData: { ...formData },
        originalValue: originalValue.value ? { ...originalValue.value } : { ...formData },
        subTables: subTableSnapshots,
      })
    }
  }

  function restoreFromCache(entry: number): boolean {
    const cached = dirtyCache.value.get(entry)
    if (cached) {
      Object.assign(formData, cached.formData)
      originalValue.value = { ...cached.originalValue }
      for (const st of subTables) {
        const snap = cached.subTables[st.tableName]
        if (snap) st.restore(snap)
      }
      editorDataLoaded.value = true
      return true
    }
    return false
  }

  function openEditor(entry: number | null) {
    saveToCache()
    editingEntry.value = entry
    editing.value = true

    if (entry != null && restoreFromCache(entry)) {
      return
    }

    editorDataLoaded.value = false
    originalValue.value = null
    Object.assign(formData, createDefaultForm())
    for (const st of subTables) {
      st.reset()
    }
  }

  function closeEditor() {
    saveToCache()
    editing.value = false
  }

  function discardEditor() {
    if (editingEntry.value != null) {
      dirtyCache.value.delete(editingEntry.value)
    }
    editing.value = false
    editingEntry.value = null
    originalValue.value = null
    editorDataLoaded.value = false
    Object.assign(formData, createDefaultForm())
    for (const st of subTables) {
      st.reset()
    }
  }

  function setFormData(data: GameObjectTemplate) {
    Object.assign(formData, data)
  }

  function setOriginalValue(data: GameObjectTemplate) {
    originalValue.value = { ...data }
  }

  function markEditorLoaded() {
    editorDataLoaded.value = true
  }

  function markListLoaded() {
    listLoaded.value = true
  }

  function setGameObjects(data: GameObjectTemplate[]) {
    gameObjects.value = data
  }

  function getAllDiffQueries(): SessionQuery[] {
    const queries: SessionQuery[] = []

    if (editingEntry.value != null && editorDataLoaded.value && originalValue.value) {
      const q = generateDiffQuery(
        'gameobject_template',
        'entry',
        originalValue.value as Record<string, unknown>,
        formData as unknown as Record<string, unknown>,
      )
      if (q) {
        queries.push({ table: 'gameobject_template', entry: editingEntry.value, query: q })
      }
      for (const st of subTables) {
        const sql = st.getSqlDiff(editingEntry.value)
        if (sql) {
          queries.push({ table: st.tableName, entry: editingEntry.value, query: sql })
        }
      }
    }

    for (const [entry, cached] of dirtyCache.value) {
      if (entry === editingEntry.value && editorDataLoaded.value) {
        continue
      }

      const q = generateDiffQuery(
        'gameobject_template',
        'entry',
        cached.originalValue as Record<string, unknown>,
        cached.formData as Record<string, unknown>,
      )
      if (q) {
        queries.push({ table: 'gameobject_template', entry, query: q })
      }

      for (const [tableName, snap] of Object.entries(cached.subTables)) {
        const st = subTables.find(s => s.tableName === tableName)
        if (!st) continue
        const currentSnap = st.snapshot()
        st.restore(snap)
        const sql = st.getSqlDiff(entry)
        if (sql) {
          queries.push({ table: tableName, entry, query: sql })
        }
        st.restore(currentSnap)
      }
    }

    return queries
  }

  return {
    gameObjects, loading, currentSearch, listLoaded,
    editing, editingEntry, formData, originalValue, editorDataLoaded,
    subTables,
    addon, loot, spawnAddon, spawnOverrides,
    dirtyCache,
    openEditor, closeEditor, discardEditor,
    setFormData, setOriginalValue,
    markEditorLoaded, markListLoaded, setGameObjects,
    getAllDiffQueries,
  }
})
