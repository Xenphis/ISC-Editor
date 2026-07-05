import { markRaw, ref, type Ref } from 'vue'
import type { FieldChange } from '@/composables/useQueryGenerator'
import type { SubTableManager, SubTableSnapshot } from '@/stores/SubTableManager'
import type { SaiCondition, SmartScript } from './types'
import { buildSaiConditionsSql, buildSmartScriptsSql, type SaiOwnedKey } from './sql'
import { summarizeCondition, summarizeRow } from './summarize'

// SubTableManager over the whole SmartAI script set of a creature (entry
// script, per-guid scripts and owned timed actionlists). Unlike the generic
// managers, saving regenerates every owned script wholesale (DELETE +
// multi-row INSERT) so ids, links and conditions never desynchronize.

export interface SmartScriptsPayload {
  rows: SmartScript[]
  /** Scripts we own: the DELETE scope, including scripts that became empty */
  ownedKeys: SaiOwnedKey[]
}

interface SmartScriptsState {
  rows: SmartScript[]
  ownedKeys: SaiOwnedKey[]
}

function cloneState(state: SmartScriptsState): SmartScriptsState {
  return {
    rows: state.rows.map(r => ({ ...r })),
    ownedKeys: state.ownedKeys.map(k => ({ ...k })),
  }
}

function rowKey(row: SmartScript): string {
  return `${row.entryorguid}:${row.source_type}:${row.id}`
}

function rowsEqual(a: SmartScript, b: SmartScript): boolean {
  const keys = Object.keys(a) as (keyof SmartScript)[]
  return keys.every(k => a[k] === b[k])
}

export class SmartScriptsManager implements SubTableManager {
  readonly tableName = 'smart_scripts'
  readonly newEntries: Ref<SmartScript[]>
  readonly originalEntries: Ref<SmartScript[] | null>
  readonly ownedKeys: Ref<SaiOwnedKey[]>
  private originalOwnedKeys: SaiOwnedKey[] = []

  constructor() {
    this.newEntries = ref<SmartScript[]>([]) as Ref<SmartScript[]>
    this.originalEntries = ref<SmartScript[] | null>(null) as Ref<SmartScript[] | null>
    this.ownedKeys = ref<SaiOwnedKey[]>([]) as Ref<SaiOwnedKey[]>
    markRaw(this)
  }

  snapshot(): SubTableSnapshot {
    return {
      new: cloneState({ rows: this.newEntries.value, ownedKeys: this.ownedKeys.value }),
      original: cloneState({
        rows: this.originalEntries.value ?? this.newEntries.value,
        ownedKeys: this.originalOwnedKeys.length > 0 ? this.originalOwnedKeys : this.ownedKeys.value,
      }),
    }
  }

  restore(cached: SubTableSnapshot): void {
    const current = cloneState(cached.new as SmartScriptsState)
    const original = cloneState(cached.original as SmartScriptsState)
    this.newEntries.value = current.rows
    this.ownedKeys.value = current.ownedKeys
    this.originalEntries.value = original.rows
    this.originalOwnedKeys = original.ownedKeys
  }

  reset(): void {
    this.newEntries.value = []
    this.originalEntries.value = null
    this.ownedKeys.value = []
    this.originalOwnedKeys = []
  }

  load(data: unknown): void {
    const payload = data as SmartScriptsPayload
    this.newEntries.value = payload.rows.map(r => ({ ...r }))
    this.ownedKeys.value = payload.ownedKeys.map(k => ({ ...k }))
    this.commit()
  }

  commit(): void {
    this.originalEntries.value = this.newEntries.value.map(r => ({ ...r }))
    this.originalOwnedKeys = this.ownedKeys.value.map(k => ({ ...k }))
  }

  revert(): void {
    if (this.originalEntries.value) {
      this.newEntries.value = this.originalEntries.value.map(r => ({ ...r }))
      this.ownedKeys.value = this.originalOwnedKeys.map(k => ({ ...k }))
    } else {
      this.newEntries.value = []
      this.ownedKeys.value = []
    }
  }

  // Method accessors: components must use these instead of the refs —
  // Pinia's store typing unwraps Ref properties of exposed objects.
  getNewEntries(): SmartScript[] {
    return this.newEntries.value
  }

  setNewEntries(rows: SmartScript[]): void {
    this.newEntries.value = rows
  }

  getOwnedKeys(): SaiOwnedKey[] {
    return this.ownedKeys.value
  }

  addOwnedKey(key: SaiOwnedKey): void {
    const exists = this.ownedKeys.value.some(k => k.entryorguid === key.entryorguid && k.sourceType === key.sourceType)
    if (!exists) this.ownedKeys.value.push({ ...key })
  }

  /** Every key in the DELETE scope: owned keys plus any key present in rows. */
  getDeleteKeys(): SaiOwnedKey[] {
    const seen = new Set<string>()
    const keys: SaiOwnedKey[] = []
    const push = (entryorguid: number, sourceType: number) => {
      const key = `${entryorguid}:${sourceType}`
      if (!seen.has(key)) {
        seen.add(key)
        keys.push({ entryorguid, sourceType })
      }
    }
    for (const k of this.ownedKeys.value) push(k.entryorguid, k.sourceType)
    for (const k of this.originalOwnedKeys) push(k.entryorguid, k.sourceType)
    for (const r of this.newEntries.value) push(r.entryorguid, r.source_type)
    for (const r of this.originalEntries.value ?? []) push(r.entryorguid, r.source_type)
    return keys
  }

  hasDiff(): boolean {
    const original = this.originalEntries.value
    if (!original) return false
    const current = this.newEntries.value
    if (original.length !== current.length) return true
    return current.some((row, i) => {
      const orig = original[i]
      return !orig || !rowsEqual(row, orig)
    })
  }

  getSqlDiff(_parentId: number): string {
    if (!this.hasDiff()) return ''
    return buildSmartScriptsSql(this.getDeleteKeys(), this.newEntries.value)
  }

  getChangedFields(_parentId: number): FieldChange[] {
    const original = this.originalEntries.value
    if (!original || !this.hasDiff()) return []
    const changes: FieldChange[] = []
    const origMap = new Map(original.map(r => [rowKey(r), r]))
    const curMap = new Map(this.newEntries.value.map(r => [rowKey(r), r]))
    for (const [key, orig] of origMap) {
      if (!curMap.has(key)) {
        changes.push({ field: `sai_${key}`, oldValue: summarizeRow(orig).full, newValue: '(deleted)' })
      }
    }
    for (const [key, cur] of curMap) {
      const orig = origMap.get(key)
      if (!orig) {
        changes.push({ field: `sai_${key}`, oldValue: '(none)', newValue: summarizeRow(cur).full })
      } else if (!rowsEqual(orig, cur)) {
        changes.push({ field: `sai_${key}`, oldValue: summarizeRow(orig).full, newValue: summarizeRow(cur).full })
      }
    }
    return changes
  }
}

// ─── Conditions attached to SAI rows (SourceTypeOrReferenceId = 22) ──

function conditionRowKey(c: SaiCondition): string {
  return `${c.SourceEntry}:${c.SourceId}:${c.SourceGroup}`
}

function conditionsEqual(a: SaiCondition, b: SaiCondition): boolean {
  const keys = Object.keys(a) as (keyof SaiCondition)[]
  return keys.every(k => a[k] === b[k])
}

export class SaiConditionsManager implements SubTableManager {
  readonly tableName = 'conditions'
  readonly newEntries: Ref<SaiCondition[]>
  readonly originalEntries: Ref<SaiCondition[] | null>
  /** Delete scope follows the scripts manager so both stay in sync. */
  private readonly scripts: SmartScriptsManager

  constructor(scripts: SmartScriptsManager) {
    this.scripts = scripts
    this.newEntries = ref<SaiCondition[]>([]) as Ref<SaiCondition[]>
    this.originalEntries = ref<SaiCondition[] | null>(null) as Ref<SaiCondition[] | null>
    markRaw(this)
  }

  snapshot(): SubTableSnapshot {
    return {
      new: this.newEntries.value.map(c => ({ ...c })),
      original: (this.originalEntries.value ?? this.newEntries.value).map(c => ({ ...c })),
    }
  }

  restore(cached: SubTableSnapshot): void {
    this.newEntries.value = (cached.new as SaiCondition[]).map(c => ({ ...c }))
    this.originalEntries.value = (cached.original as SaiCondition[]).map(c => ({ ...c }))
  }

  reset(): void {
    this.newEntries.value = []
    this.originalEntries.value = null
  }

  load(data: unknown): void {
    this.newEntries.value = (data as SaiCondition[]).map(c => ({ ...c }))
    this.commit()
  }

  commit(): void {
    this.originalEntries.value = this.newEntries.value.map(c => ({ ...c }))
  }

  revert(): void {
    this.newEntries.value = (this.originalEntries.value ?? []).map(c => ({ ...c }))
  }

  getNewEntries(): SaiCondition[] {
    return this.newEntries.value
  }

  setNewEntries(rows: SaiCondition[]): void {
    this.newEntries.value = rows
  }

  /** Conditions gating the given SAI row (SourceGroup = id + 1). */
  getForRow(row: SmartScript): SaiCondition[] {
    return this.newEntries.value.filter(c =>
      c.SourceEntry === row.entryorguid
      && c.SourceId === row.source_type
      && c.SourceGroup === row.id + 1)
  }

  addCondition(condition: SaiCondition): void {
    this.newEntries.value.push(condition)
  }

  removeCondition(condition: SaiCondition): void {
    const index = this.newEntries.value.indexOf(condition)
    if (index >= 0) this.newEntries.value.splice(index, 1)
  }

  /** Drop the conditions of deleted SAI rows. */
  removeForRows(rows: SmartScript[]): void {
    const keys = new Set(rows.map(r => `${r.entryorguid}:${r.source_type}:${r.id + 1}`))
    this.newEntries.value = this.newEntries.value.filter(c => !keys.has(conditionRowKey(c)))
  }

  /**
   * Re-point SourceGroup after a renumbering. `mapping` goes from the old
   * condition key "entryorguid:sourceType:oldId" to the new row id.
   */
  remapGroups(mapping: Map<string, number>): void {
    for (const condition of this.newEntries.value) {
      const oldKey = `${condition.SourceEntry}:${condition.SourceId}:${condition.SourceGroup - 1}`
      const newId = mapping.get(oldKey)
      if (newId !== undefined && newId !== condition.SourceGroup - 1) {
        condition.SourceGroup = newId + 1
      }
    }
  }

  hasDiff(): boolean {
    const original = this.originalEntries.value
    if (!original) return false
    const current = this.newEntries.value
    if (original.length !== current.length) return true
    return current.some((row, i) => {
      const orig = original[i]
      return !orig || !conditionsEqual(row, orig)
    })
  }

  getSqlDiff(_parentId: number): string {
    if (!this.hasDiff()) return ''
    return buildSaiConditionsSql(this.scripts.getDeleteKeys(), this.newEntries.value)
  }

  getChangedFields(_parentId: number): FieldChange[] {
    const original = this.originalEntries.value
    if (!original || !this.hasDiff()) return []
    const changes: FieldChange[] = []
    const summarizeAll = (list: SaiCondition[]) => list.map(summarizeCondition).join(' / ')
    const origKeys = new Map<string, SaiCondition[]>()
    const curKeys = new Map<string, SaiCondition[]>()
    for (const c of original) {
      const key = conditionRowKey(c)
      origKeys.set(key, [...(origKeys.get(key) ?? []), c])
    }
    for (const c of this.newEntries.value) {
      const key = conditionRowKey(c)
      curKeys.set(key, [...(curKeys.get(key) ?? []), c])
    }
    for (const [key, list] of origKeys) {
      if (!curKeys.has(key)) {
        changes.push({ field: `sai_cond_${key}`, oldValue: summarizeAll(list), newValue: '(deleted)' })
      }
    }
    for (const [key, list] of curKeys) {
      const orig = origKeys.get(key)
      if (!orig) {
        changes.push({ field: `sai_cond_${key}`, oldValue: '(none)', newValue: summarizeAll(list) })
      } else if (orig.length !== list.length || list.some((c, i) => {
        const o = orig[i]
        return !o || !conditionsEqual(c, o)
      })) {
        changes.push({ field: `sai_cond_${key}`, oldValue: summarizeAll(orig), newValue: summarizeAll(list) })
      }
    }
    return changes
  }
}
