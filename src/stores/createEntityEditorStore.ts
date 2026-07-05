import { computed, reactive, ref, type Ref } from 'vue'
import {
  generateDiffQuery,
  generateFullQuery,
  generateFullQueryStatements,
  getChangedFields,
  type FieldChange,
} from '@/composables/useQueryGenerator'
import { executeBatch } from '@/services/sql'
import type { SessionQuery } from '@/stores/moduleStore'
import type { SubTableManager, SubTableSnapshot } from '@/stores/SubTableManager'

export interface EntityEditorCache<T extends object> {
  formData: T
  originalValue: T
  subTables: Record<string, SubTableSnapshot>
}

export interface EntitySubTableBinding<T extends object, TLoaded = unknown> {
  manager: SubTableManager
  getParentId?: (formData: T, editingId: number | null) => number
  load?: (id: number, formData: T) => Promise<TLoaded>
  mapLoaded?: (data: TLoaded, id: number, formData: T) => unknown
  commitWhenMissing?: boolean
}

export interface CreateEntityEditorStoreOptions<T extends object> {
  tableName: string
  primaryKey: keyof T & string
  createDefault: () => T
  load?: (id: number) => Promise<T>
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

  function getBindingParentId(binding: EntitySubTableBinding<T>, data: T = formData, id: number | null = editingId.value): number {
    if (binding.getParentId) {
      return binding.getParentId(data, id)
    }
    if (options.getParentId) {
      return options.getParentId(data, id)
    }
    return Number((data as Record<string, unknown>)[options.primaryKey])
  }

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
    for (const binding of subTableBindings) {
      const sql = binding.manager.getSqlDiff(getBindingParentId(binding))
      if (sql) {
        parts.push(sql)
      }
    }
    return parts.join('\n')
  })

  const combinedHasChanges = computed(() => {
    if (hasChanges.value) return true
    return subTableBindings.some(binding => Boolean(binding.manager.getSqlDiff(getBindingParentId(binding))))
  })

  const combinedChangedFields = computed<FieldChange[]>(() => {
    const fields = [...changedFields.value]
    for (const binding of subTableBindings) {
      fields.push(...binding.manager.getChangedFields(getBindingParentId(binding)))
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
      const data = await binding.load(id, formData)
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

  /**
   * Collect all pending statements (main table + sub-tables) for the current
   * editor. Existing entities are updated field-by-field; new entities
   * (editingId == null) are written as a full DELETE + INSERT.
   */
  function collectSaveStatements(): string[] {
    const statements: string[] = []

    if (editingId.value != null && originalValue.value) {
      const diff = generateDiffQuery(
        options.tableName,
        options.primaryKey,
        originalValue.value as unknown as Record<string, unknown>,
        formData as unknown as Record<string, unknown>,
      )
      if (diff) {
        statements.push(diff)
      }
    } else {
      statements.push(...generateFullQueryStatements(
        options.tableName,
        options.primaryKey,
        formData as unknown as Record<string, unknown>,
      ))
    }

    for (const binding of subTableBindings) {
      statements.push(...binding.manager.getSqlDiffStatements(getBindingParentId(binding)))
    }

    return statements
  }

  // All statements run in a single backend transaction: a failure in any
  // sub-table save rolls back the whole entity instead of leaving the
  // database half-updated.
  async function saveCurrent() {
    const statements = collectSaveStatements()
    if (statements.length > 0) {
      await executeBatch(statements)
    }
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
    formSnapshot: T,
    snapshots: Record<string, SubTableSnapshot>,
  ) {
    for (const binding of subTableBindings) {
      const snapshot = snapshots[binding.manager.tableName]
      if (!snapshot) continue
      const currentSnapshot = binding.manager.snapshot()
      binding.manager.restore(snapshot)
      const sql = binding.manager.getSqlDiff(getBindingParentId(binding, formSnapshot, id))
      if (sql) {
        queries.push({ table: binding.manager.tableName, entry: id, query: sql })
      }
      binding.manager.restore(currentSnapshot)
    }
  }

  function getAllDiffQueries(): SessionQuery[] {
    const queries: SessionQuery[] = []

    if (editingId.value != null && editorDataLoaded.value && originalValue.value) {
      pushDiffQueriesForEntry(queries, editingId.value, originalValue.value, formData)
      for (const binding of subTableBindings) {
        const sql = binding.manager.getSqlDiff(getBindingParentId(binding))
        if (sql) {
          queries.push({ table: binding.manager.tableName, entry: editingId.value, query: sql })
        }
      }
    }

    for (const [id, cached] of dirtyCache.value) {
      if (id === editingId.value && editorDataLoaded.value) {
        continue
      }
      pushDiffQueriesForEntry(queries, id, cached.originalValue, cached.formData)
      pushSubTableDiffQueriesForEntry(queries, id, cached.formData, cached.subTables)
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