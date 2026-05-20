import { computed, reactive, ref, type Ref } from 'vue'
import {
  generateDiffQuery,
  generateFullQuery,
  getChangedFields,
  type FieldChange,
} from '@/composables/useQueryGenerator'
import type { SessionQuery } from '@/stores/moduleStore'
import type { SubTableManager, SubTableSnapshot } from '@/stores/SubTableManager'

export interface EntityEditorCache<T extends object> {
  formData: T
  originalValue: T
  subTables: Record<string, SubTableSnapshot>
}

export interface EntitySubTableBinding<T extends object, TLoaded = unknown> {
  manager: SubTableManager
  load?: (id: number) => Promise<TLoaded>
  mapLoaded?: (data: TLoaded, id: number, formData: T) => unknown
  commitWhenMissing?: boolean
  save?: (id: number, manager: SubTableManager, formData: T) => Promise<void>
}

export interface CreateEntityEditorStoreOptions<T extends object> {
  tableName: string
  primaryKey: keyof T & string
  createDefault: () => T
  load?: (id: number) => Promise<T>
  save?: (data: T) => Promise<void>
  delete?: (id: number) => Promise<void>
  subTables?: EntitySubTableBinding<T>[]
  getParentId?: (formData: T, editingId: number | null) => number
}

function cloneEntity<T extends object>(entity: T): T {
  return { ...entity }
}

export function createEntityEditorStore<T extends object>(options: CreateEntityEditorStoreOptions<T>) {
  const editing = ref(false)
  const editingId = ref<number | null>(null)
  const formData = reactive(options.createDefault()) as unknown as T
  const originalValue = ref<T | null>(null) as Ref<T | null>
  const editorDataLoaded = ref(false)
  const dirtyCache = ref<Map<number, EntityEditorCache<T>>>(new Map()) as Ref<Map<number, EntityEditorCache<T>>>
  const subTableBindings = options.subTables ?? []
  const subTables = subTableBindings.map(binding => binding.manager)

  let pendingOpen: Promise<void> | null = null
  let pendingOpenId: number | null = null

  const currentParentId = computed(() => {
    if (options.getParentId) {
      return options.getParentId(formData, editingId.value)
    }
    return Number((formData as Record<string, unknown>)[options.primaryKey])
  })

  const changedFields = computed<FieldChange[]>(() => {
    if (!originalValue.value) return []
    return getChangedFields(
      originalValue.value as unknown as Record<string, unknown>,
      formData as unknown as Record<string, unknown>,
      options.primaryKey,
    )
  })

  const hasChanges = computed(() => changedFields.value.length > 0)

  const diffQuery = computed(() => {
    if (!originalValue.value) return ''
    return generateDiffQuery(
      options.tableName,
      options.primaryKey,
      originalValue.value as unknown as Record<string, unknown>,
      formData as unknown as Record<string, unknown>,
    )
  })

  const fullQuery = computed(() => generateFullQuery(
    options.tableName,
    options.primaryKey,
    formData as unknown as Record<string, unknown>,
  ))

  const combinedDiffQuery = computed(() => {
    const parts: string[] = []
    if (diffQuery.value) {
      parts.push(diffQuery.value)
    }
    const parentId = currentParentId.value
    for (const subTable of subTables) {
      const sql = subTable.getSqlDiff(parentId)
      if (sql) {
        parts.push(sql)
      }
    }
    return parts.join('\n')
  })

  const combinedHasChanges = computed(() => {
    if (hasChanges.value) return true
    const parentId = currentParentId.value
    return subTables.some(subTable => Boolean(subTable.getSqlDiff(parentId)))
  })

  const combinedChangedFields = computed<FieldChange[]>(() => {
    const fields = [...changedFields.value]
    const parentId = currentParentId.value
    for (const subTable of subTables) {
      fields.push(...subTable.getChangedFields(parentId))
    }
    return fields
  })

  const combinedFullQuery = computed(() => fullQuery.value)

  function resetSubTables() {
    for (const subTable of subTables) {
      subTable.reset()
    }
  }

  function commitSubTables() {
    for (const subTable of subTables) {
      subTable.commit()
    }
  }

  function snapshotSubTables(): Record<string, SubTableSnapshot> {
    const snapshots: Record<string, SubTableSnapshot> = {}
    for (const subTable of subTables) {
      snapshots[subTable.tableName] = subTable.snapshot()
    }
    return snapshots
  }

  function resetEditorState() {
    Object.assign(formData, options.createDefault())
    originalValue.value = null
    editorDataLoaded.value = false
    resetSubTables()
  }

  function saveToCache() {
    if (editingId.value == null || !editorDataLoaded.value) return
    dirtyCache.value.set(editingId.value, {
      formData: cloneEntity(formData),
      originalValue: originalValue.value ? cloneEntity(originalValue.value) : cloneEntity(formData),
      subTables: snapshotSubTables(),
    })
  }

  function restoreFromCache(id: number): boolean {
    const cached = dirtyCache.value.get(id)
    if (!cached) return false

    Object.assign(formData, cached.formData)
    originalValue.value = cloneEntity(cached.originalValue)
    for (const subTable of subTables) {
      const snapshot = cached.subTables[subTable.tableName]
      if (snapshot) {
        subTable.restore(snapshot)
      }
    }
    editorDataLoaded.value = true
    return true
  }

  async function loadSubTables(id: number) {
    await Promise.all(subTableBindings.map(async binding => {
      if (!binding.load) return
      const data = await binding.load(id)
      if (data == null) {
        if (binding.commitWhenMissing) {
          binding.manager.commit()
        } else {
          binding.manager.reset()
        }
        return
      }
      binding.manager.load(binding.mapLoaded ? binding.mapLoaded(data, id, formData) : data)
    }))
  }

  async function openEditor(id: number | null) {
    if (pendingOpen && pendingOpenId === id) {
      return pendingOpen
    }

    const task = (async () => {
      saveToCache()
      editingId.value = id
      editing.value = true

      if (id != null && restoreFromCache(id)) {
        return
      }

      resetEditorState()

      if (id == null) {
        originalValue.value = cloneEntity(formData)
        commitSubTables()
        editorDataLoaded.value = true
        return
      }

      if (!options.load) {
        return
      }

      const data = await options.load(id)
      Object.assign(formData, data)
      originalValue.value = cloneEntity(data)
      await loadSubTables(id)
      editorDataLoaded.value = true
    })()

    pendingOpen = task.finally(() => {
      if (pendingOpen === task) {
        pendingOpen = null
        pendingOpenId = null
      }
    })
    pendingOpenId = id
    return pendingOpen
  }

  function closeEditor() {
    saveToCache()
    editing.value = false
  }

  function discardEditor() {
    if (editingId.value != null) {
      dirtyCache.value.delete(editingId.value)
    }
    editing.value = false
    editingId.value = null
    resetEditorState()
  }

  function discardChanges() {
    if (originalValue.value) {
      Object.assign(formData, originalValue.value)
    } else {
      Object.assign(formData, options.createDefault())
    }
    for (const subTable of subTables) {
      subTable.revert()
    }
  }

  function setFormData(data: T) {
    Object.assign(formData, data)
  }

  function setOriginalValue(data: T) {
    originalValue.value = cloneEntity(data)
  }

  function markEditorLoaded() {
    editorDataLoaded.value = true
  }

  function commitEditor() {
    originalValue.value = cloneEntity(formData)
    commitSubTables()
    if (editingId.value != null) {
      dirtyCache.value.delete(editingId.value)
    }
  }

  async function saveCurrent() {
    if (!options.save) return
    await options.save(cloneEntity(formData))
    const parentId = currentParentId.value
    await Promise.all(subTableBindings.map(binding => binding.save?.(parentId, binding.manager, formData)))
    commitEditor()
  }

  async function deleteCurrent(id = editingId.value) {
    if (!options.delete || id == null) return
    await options.delete(id)
    dirtyCache.value.delete(id)
    if (editingId.value === id) {
      discardEditor()
    }
  }

  function pushDiffQueriesForEntry(queries: SessionQuery[], id: number, original: T, current: T) {
    const query = generateDiffQuery(
      options.tableName,
      options.primaryKey,
      original as unknown as Record<string, unknown>,
      current as unknown as Record<string, unknown>,
    )
    if (query) {
      queries.push({ table: options.tableName, entry: id, query })
    }
  }

  function pushSubTableDiffQueriesForEntry(
    queries: SessionQuery[],
    id: number,
    snapshots: Record<string, SubTableSnapshot>,
  ) {
    for (const [tableName, snapshot] of Object.entries(snapshots)) {
      const subTable = subTables.find(candidate => candidate.tableName === tableName)
      if (!subTable) continue
      const currentSnapshot = subTable.snapshot()
      subTable.restore(snapshot)
      const sql = subTable.getSqlDiff(id)
      if (sql) {
        queries.push({ table: tableName, entry: id, query: sql })
      }
      subTable.restore(currentSnapshot)
    }
  }

  function getAllDiffQueries(): SessionQuery[] {
    const queries: SessionQuery[] = []

    if (editingId.value != null && editorDataLoaded.value && originalValue.value) {
      pushDiffQueriesForEntry(queries, editingId.value, originalValue.value, formData)
      for (const subTable of subTables) {
        const sql = subTable.getSqlDiff(editingId.value)
        if (sql) {
          queries.push({ table: subTable.tableName, entry: editingId.value, query: sql })
        }
      }
    }

    for (const [id, cached] of dirtyCache.value) {
      if (id === editingId.value && editorDataLoaded.value) {
        continue
      }
      pushDiffQueriesForEntry(queries, id, cached.originalValue, cached.formData)
      pushSubTableDiffQueriesForEntry(queries, id, cached.subTables)
    }

    return queries
  }

  return {
    editing,
    editingId,
    formData,
    originalValue,
    editorDataLoaded,
    dirtyCache,
    subTables,
    changedFields,
    hasChanges,
    diffQuery,
    fullQuery,
    combinedDiffQuery,
    combinedHasChanges,
    combinedChangedFields,
    combinedFullQuery,
    saveToCache,
    restoreFromCache,
    openEditor,
    closeEditor,
    discardEditor,
    discardChanges,
    resetEditorState,
    setFormData,
    setOriginalValue,
    markEditorLoaded,
    commitEditor,
    saveCurrent,
    deleteCurrent,
    getAllDiffQueries,
  }
}