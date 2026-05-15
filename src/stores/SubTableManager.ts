import { reactive, ref, markRaw, type Ref, type UnwrapRef } from 'vue'
import { generateDiffQuery, getChangedFields, type FieldChange } from '@/composables/useQueryGenerator'
import { generateCompositeKeyDiffSql, type CompositeKeyConfig } from '@/composables/useQueryGenerator'

// ─── Common interface ────────────────────────────────────────────────

export interface SubTableSnapshot {
  new: unknown
  original: unknown
}

export interface SubTableManager {
  /** Table name for sessionChanges identification */
  readonly tableName: string
  /** Take a snapshot for the dirty cache */
  snapshot(): SubTableSnapshot
  /** Restore from a cached snapshot */
  restore(cached: SubTableSnapshot): void
  /** Reset to default values (new entry) */
  reset(): void
  /** Load data from DB: sets both draft (newEntry) and reference (originalEntry) */
  load(data: unknown): void
  /** Set original = current (after save) */
  commit(): void
  /** Revert draft to original values (keep original reference intact) */
  revert(): void
  /** Generate diff SQL for a given parent entry */
  getSqlDiff(parentId: number): string
  /** Get list of changed fields for display */
  getChangedFields(parentId: number): FieldChange[]
}

// ─── ReactiveSubTable: single-row sub-tables (movement, addon, resistance) ──

export interface ReactiveSubTableConfig<T extends object> {
  tableName: string
  primaryKey: string
  createDefault: () => T
  /** For resistance-like tables that need composite key SQL instead of UPDATE */
  compositeConfig?: Omit<CompositeKeyConfig<any>, 'parentId'>
  /** Convert reactive form to rows for composite key SQL (resistance only) */
  toRows?: (form: T) => any[]
}

export class ReactiveSubTable<T extends object> implements SubTableManager {
  readonly tableName: string
  readonly primaryKey: string
  /** The editable draft (v-model target) */
  readonly newEntry: UnwrapRef<T>
  /** The database reference (diff base) */
  readonly originalEntry: Ref<T | null>
  private readonly createDefault: () => T
  private readonly compositeConfig?: Omit<CompositeKeyConfig<any>, 'parentId'>
  private readonly toRows?: (form: T) => any[]

  constructor(config: ReactiveSubTableConfig<T>) {
    this.tableName = config.tableName
    this.primaryKey = config.primaryKey
    this.createDefault = config.createDefault
    this.compositeConfig = config.compositeConfig
    this.toRows = config.toRows
    this.newEntry = reactive<T>(config.createDefault()) as UnwrapRef<T>
    this.originalEntry = ref<T | null>(null) as Ref<T | null>
    markRaw(this)
  }

  snapshot(): SubTableSnapshot {
    return {
      new: { ...(this.newEntry as any) },
      original: this.originalEntry.value ? { ...this.originalEntry.value } : { ...(this.newEntry as any) },
    }
  }

  restore(cached: SubTableSnapshot): void {
    Object.assign(this.newEntry as any, cached.new)
    this.originalEntry.value = { ...(cached.original as T) }
  }

  reset(): void {
    this.originalEntry.value = null
    Object.assign(this.newEntry as any, this.createDefault())
  }

  load(data: T): void {
    this.setNewEntry(data)
    this.commit()
  }

  revert(): void {
    if (this.originalEntry.value) {
      Object.assign(this.newEntry as any, this.originalEntry.value)
    } else {
      Object.assign(this.newEntry as any, this.createDefault())
    }
  }

  commit(): void {
    this.originalEntry.value = { ...(this.newEntry as any) } as T
  }

  getOriginalEntry(): T | null {
    return this.originalEntry.value
  }

  setOriginalEntry(data: T): void {
    this.originalEntry.value = { ...data }
  }

  setNewEntry(data: Partial<T>): void {
    Object.assign(this.newEntry as any, data)
  }

  getSqlDiff(parentId: number): string {
    if (!this.originalEntry.value) {
      return ''
    }
    if (this.compositeConfig && this.toRows) {
      return generateCompositeKeyDiffSql(
        { ...this.compositeConfig, parentId },
        this.toRows(this.originalEntry.value),
        this.toRows(this.newEntry as unknown as T),
      )
    }
    // Inject the parent ID as the primary key value for the WHERE clause
    const originalWithKey = { ...this.originalEntry.value, [this.primaryKey]: parentId } as Record<string, unknown>
    const currentWithKey = { ...(this.newEntry as object), [this.primaryKey]: parentId } as Record<string, unknown>
    return generateDiffQuery(
      this.tableName,
      this.primaryKey,
      originalWithKey,
      currentWithKey,
    )
  }

  getChangedFields(_parentId: number): FieldChange[] {
    if (!this.originalEntry.value) {
      return []
    }
    if (this.compositeConfig && this.toRows) {
      const origRows = this.toRows(this.originalEntry.value)
      const curRows = this.toRows(this.newEntry as unknown as T)
      const changes: FieldChange[] = []
      const origMap = new Map(origRows.map((r: any) => [r[this.compositeConfig!.childKey], r]))
      const curMap = new Map(curRows.map((r: any) => [r[this.compositeConfig!.childKey], r]))
      for (const [key, orig] of origMap) {
        const cur = curMap.get(key)
        if (!cur || !this.compositeConfig!.isEqual(orig, cur)) {
          changes.push({ field: `${this.compositeConfig!.childKey}_${key}`, oldValue: orig, newValue: cur ?? '(deleted)' })
        }
      }
      for (const [key, cur] of curMap) {
        if (!origMap.has(key)) {
          changes.push({ field: `${this.compositeConfig!.childKey}_${key}`, oldValue: '(none)', newValue: cur })
        }
      }
      return changes
    }
    return getChangedFields(
      this.originalEntry.value as unknown as Record<string, unknown>,
      this.newEntry as unknown as Record<string, unknown>,
      this.primaryKey,
    )
  }
}

// ─── ArraySubTable: multi-row sub-tables (locales, equips, spells) ──

export interface ArraySubTableConfig<T extends Record<string, any>> {
  tableName: string
  compositeConfig: Omit<CompositeKeyConfig<T>, 'parentId'>
  /** Human-readable label for changed fields (e.g. "locale", "equip_set", "spell_slot") */
  fieldPrefix: string
  /** Function to produce a human-readable summary of an entry */
  summarize: (entry: T) => string
}

export class ArraySubTable<T extends Record<string, any>> implements SubTableManager {
  readonly tableName: string
  readonly newEntries: Ref<T[]>
  readonly originalEntries: Ref<T[] | null>
  private readonly compositeConfig: Omit<CompositeKeyConfig<T>, 'parentId'>
  private readonly childKey: keyof T & string
  private readonly fieldPrefix: string
  private readonly summarize: (entry: T) => string

  constructor(config: ArraySubTableConfig<T>) {
    this.tableName = config.tableName
    this.compositeConfig = config.compositeConfig
    this.childKey = config.compositeConfig.childKey
    this.fieldPrefix = config.fieldPrefix
    this.summarize = config.summarize
    this.newEntries = ref<T[]>([]) as Ref<T[]>
    this.originalEntries = ref<T[] | null>(null) as Ref<T[] | null>
    markRaw(this)
  }

  snapshot(): SubTableSnapshot {
    return {
      new: this.newEntries.value.map(e => ({ ...e })),
      original: this.originalEntries.value
        ? this.originalEntries.value.map(e => ({ ...e }))
        : this.newEntries.value.map(e => ({ ...e })),
    }
  }

  restore(cached: SubTableSnapshot): void {
    this.newEntries.value = (cached.new as T[]).map(e => ({ ...e }))
    this.originalEntries.value = (cached.original as T[]).map(e => ({ ...e }))
  }

  reset(): void {
    this.originalEntries.value = null
    this.newEntries.value = []
  }

  load(data: T[]): void {
    this.newEntries.value = data.map(e => ({ ...e }))
    this.commit()
  }

  revert(): void {
    if (this.originalEntries.value) {
      this.newEntries.value = this.originalEntries.value.map(e => ({ ...e }))
    } else {
      this.newEntries.value = []
    }
  }

  commit(): void {
    this.originalEntries.value = this.newEntries.value.map(e => ({ ...e }))
  }

  getOriginalEntries(): T[] | null {
    return this.originalEntries.value
  }

  setOriginalEntries(data: T[]): void {
    this.originalEntries.value = data.map(e => ({ ...e }))
  }

  getNewEntries(): T[] {
    return this.newEntries.value
  }

  setNewEntries(data: T[]): void {
    this.newEntries.value = data.map(e => ({ ...e }))
  }

  pushNewEntry(entry: T): void {
    this.newEntries.value.push(entry)
  }

  removeNewEntry(index: number): void {
    this.newEntries.value.splice(index, 1)
  }

  getSqlDiff(parentId: number): string {
    if (!this.originalEntries.value) {
      return ''
    }
    return generateCompositeKeyDiffSql(
      { ...this.compositeConfig, parentId },
      this.originalEntries.value,
      this.newEntries.value,
    )
  }

  getChangedFields(_parentId: number): FieldChange[] {
    if (!this.originalEntries.value) {
      return []
    }
    const changes: FieldChange[] = []
    const keyFn = this.compositeConfig.getUniqueKey || ((entry: T) => String(entry[this.childKey]))
    const origMap = new Map(this.originalEntries.value.map(o => [keyFn(o), o]))
    const curMap = new Map(this.newEntries.value.map(c => [keyFn(c), c]))
    for (const [key, orig] of origMap) {
      if (!curMap.has(key)) {
        changes.push({ field: `${this.fieldPrefix}_${key}`, oldValue: this.summarize(orig), newValue: '(deleted)' })
      }
    }
    for (const [key, cur] of curMap) {
      const orig = origMap.get(key)
      if (!orig) {
        changes.push({ field: `${this.fieldPrefix}_${key}`, oldValue: '(none)', newValue: this.summarize(cur) })
      } else if (!this.compositeConfig.isEqual(orig, cur)) {
        changes.push({ field: `${this.fieldPrefix}_${key}`, oldValue: this.summarize(orig), newValue: this.summarize(cur) })
      }
    }
    return changes
  }
}
