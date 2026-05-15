import { computed, type Ref } from 'vue'
import { update, insert, delete_ } from 'squel-ts'

type AnyRow = Record<string, unknown>

const SQUEL_CONFIG = {
  autoQuoteFieldNames: true,
  autoQuoteTableNames: true,
  nameQuoteCharacter: '`',
  tableAliasQuoteCharacter: '`',
  fieldAliasQuoteCharacter: '`',
}

// --- Value helpers ---

function escapeValue(value: unknown): string | number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  return String(value).replace(/'/g, "''")
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined || value === '') return null
  return value
}

function valuesAreEqual(a: unknown, b: unknown): boolean {
  const na = normalizeValue(a)
  const nb = normalizeValue(b)
  if (na === null && nb === null) return true
  if (na === null || nb === null) return false
  if (typeof na === 'number' && typeof nb === 'number') {
    if (Number.isInteger(na) && Number.isInteger(nb)) return na === nb
    return Math.abs(na - nb) < 1e-6
  }
  return na === nb
}

// --- SQL generation functions ---

export interface FieldChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

export function generateDiffQuery(
  table: string,
  primaryKey: string,
  originalRow: AnyRow,
  currentRow: AnyRow,
): string {
  let hasDiff = false
  const query = update(SQUEL_CONFIG).table(table)

  for (const key in originalRow) {
    if (key === primaryKey) continue
    if (!valuesAreEqual(originalRow[key], currentRow[key])) {
      hasDiff = true
      query.set(key, escapeValue(currentRow[key]))
    }
  }

  if (!hasDiff) return ''

  query.where(`\`${primaryKey}\` = ${originalRow[primaryKey]}`)
  return query.toString() + ';'
}

export function generateFullQuery(
  table: string,
  primaryKey: string,
  row: AnyRow,
): string {
  const delQuery = delete_(SQUEL_CONFIG)
    .from(table)
    .where(`\`${primaryKey}\` = ${row[primaryKey]}`)
    .toString()

  const insQuery = insert(SQUEL_CONFIG)
    .into(table)
    .setFieldsRows([row])
    .toString()

  return delQuery + ';\n' + insQuery + ';'
}

export function generateDeleteQuery(
  table: string,
  primaryKey: string,
  id: string | number,
): string {
  return delete_(SQUEL_CONFIG)
    .from(table)
    .where(`\`${primaryKey}\` = ${id}`)
    .toString() + ';'
}

export function getChangedFields(
  originalRow: AnyRow,
  currentRow: AnyRow,
  primaryKey: string,
): FieldChange[] {
  const changes: FieldChange[] = []
  for (const key in originalRow) {
    if (key === primaryKey) continue
    if (!valuesAreEqual(originalRow[key], currentRow[key])) {
      changes.push({
        field: key,
        oldValue: originalRow[key],
        newValue: currentRow[key],
      })
    }
  }
  return changes
}

// --- Composite key SQL generation (multi-row tables) ---

export interface CompositeKeyConfig<T> {
  table: string
  parentKey: string
  parentId: number
  childKey: keyof T & string
  columns: string[]
  isEqual: (a: T, b: T) => boolean
  toSqlValues: (entry: T) => (string | number | null)[]
  skipInsert?: (entry: T) => boolean
  /**
   * Optional function to generate a unique key for composite keys.
   * If not provided, childKey will be used as the unique identifier.
   * Use this for tables with multi-column composite keys (e.g., creature_text: GroupID + ID)
   */
  getUniqueKey?: (entry: T) => string
  /**
   * Optional function to build the WHERE clause for DELETE/UPDATE operations.
   * Used for multi-column composite keys.
   * If not provided, uses default: `parentKey = parentId AND childKey = entry[childKey]`
   */
  buildWhereClause?: (entry: T, parentId: number) => string
}

export function generateCompositeKeyDiffSql<T>(
  config: CompositeKeyConfig<T>,
  original: T[],
  current: T[],
): string {
  const { table, parentKey, parentId, childKey, columns, isEqual, toSqlValues, skipInsert, getUniqueKey, buildWhereClause } = config
  const lines: string[] = []
  const keyFn = getUniqueKey || ((entry: T) => String(entry[childKey]))
  const originalMap = new Map(original.map(o => [keyFn(o), o]))
  const currentMap = new Map(current.map(c => [keyFn(c), c]))

  // Build WHERE clause for deletion
  const getWhereClause = (entry: T): string => {
    if (buildWhereClause) {
      return buildWhereClause(entry, parentId)
    }
    // Default: single childKey
    const keyVal = typeof entry[childKey] === 'string' ? `'${entry[childKey]}'` : entry[childKey]
    return `\`${parentKey}\` = ${parentId} AND \`${childKey}\` = ${keyVal}`
  }

  // Deleted entries
  for (const [uniqueKey, origEntry] of originalMap) {
    if (!currentMap.has(uniqueKey)) {
      lines.push(`DELETE FROM \`${table}\` WHERE ${getWhereClause(origEntry)};`)
    }
  }

  // Added or modified entries
  for (const [uniqueKey, cur] of currentMap) {
    const orig = originalMap.get(uniqueKey)
    if (!orig || !isEqual(orig, cur)) {
      lines.push(`DELETE FROM \`${table}\` WHERE ${getWhereClause(cur)};`)
      if (!skipInsert || !skipInsert(cur)) {
        const colNames = [`\`${parentKey}\``, `\`${childKey}\``, ...columns.map(c => `\`${c}\``)].join(', ')
        const childKeyVal = typeof cur[childKey] === 'string' ? `'${cur[childKey]}'` : cur[childKey]
        const vals = [parentId, childKeyVal, ...toSqlValues(cur)].join(', ')
        lines.push(`INSERT INTO \`${table}\` (${colNames}) VALUES (${vals});`)
      }
    }
  }

  return lines.join('\n')
}

// --- Vue composable ---

export function useQueryGenerator<T extends object>(
  table: string,
  primaryKey: string,
  originalValue: Ref<T | null>,
  currentForm: T,
) {
  const changedFields = computed<FieldChange[]>(() => {
    if (!originalValue.value) return []
    return getChangedFields(
      originalValue.value as unknown as AnyRow,
      currentForm as unknown as AnyRow,
      primaryKey,
    )
  })

  const hasChanges = computed(() => changedFields.value.length > 0)

  const diffQuery = computed(() => {
    if (!originalValue.value) return ''
    return generateDiffQuery(
      table,
      primaryKey,
      originalValue.value as unknown as AnyRow,
      currentForm as unknown as AnyRow,
    )
  })

  const fullQuery = computed(() => {
    if (!originalValue.value) return ''
    return generateFullQuery(
      table,
      primaryKey,
      currentForm as unknown as AnyRow,
    )
  })

  return {
    diffQuery,
    fullQuery,
    hasChanges,
    changedFields,
  }
}
