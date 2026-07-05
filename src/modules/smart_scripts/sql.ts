import type { SaiCondition, SmartScript } from './types'
import { CONDITION_SOURCE_SMART_EVENT } from './types'
import { escapeSQL } from '@/utils/sql'

// Keira3-style full-regen SQL blocks: the whole script is deleted and
// re-inserted so row ids, links and conditions always stay consistent.

export interface SaiOwnedKey {
  entryorguid: number
  sourceType: number
}

export const SMART_SCRIPTS_COLUMNS = [
  'entryorguid', 'source_type', 'id', 'link',
  'event_type', 'event_phase_mask', 'event_chance', 'event_flags',
  'event_param1', 'event_param2', 'event_param3', 'event_param4',
  'action_type', 'action_param1', 'action_param2', 'action_param3',
  'action_param4', 'action_param5', 'action_param6',
  'target_type', 'target_param1', 'target_param2', 'target_param3',
  'target_x', 'target_y', 'target_z', 'target_o',
  'comment',
] as const

function rowValues(row: SmartScript): string {
  const nums = [
    row.entryorguid, row.source_type, row.id, row.link,
    row.event_type, row.event_phase_mask, row.event_chance, row.event_flags,
    row.event_param1, row.event_param2, row.event_param3, row.event_param4,
    row.action_type, row.action_param1, row.action_param2, row.action_param3,
    row.action_param4, row.action_param5, row.action_param6,
    row.target_type, row.target_param1, row.target_param2, row.target_param3,
    row.target_x, row.target_y, row.target_z, row.target_o,
  ]
  return `(${nums.join(', ')}, '${escapeSQL(row.comment ?? '')}')`
}

/** WHERE clause covering all owned script keys, grouped by source_type. */
export function buildDeleteWhere(keys: SaiOwnedKey[]): string {
  const bySourceType = new Map<number, number[]>()
  for (const key of keys) {
    const list = bySourceType.get(key.sourceType)
    if (list) {
      list.push(key.entryorguid)
    } else {
      bySourceType.set(key.sourceType, [key.entryorguid])
    }
  }
  const parts: string[] = []
  for (const [sourceType, entries] of [...bySourceType.entries()].sort((a, b) => a[0] - b[0])) {
    const unique = [...new Set(entries)].sort((a, b) => a - b)
    parts.push(`(\`source_type\` = ${sourceType} AND \`entryorguid\` IN (${unique.join(', ')}))`)
  }
  return parts.join(' OR ')
}

export function buildSmartScriptsSql(deleteKeys: SaiOwnedKey[], rows: SmartScript[]): string {
  if (deleteKeys.length === 0) return ''
  const lines: string[] = []
  lines.push(`DELETE FROM \`smart_scripts\` WHERE ${buildDeleteWhere(deleteKeys)};`)
  if (rows.length > 0) {
    const sorted = [...rows].sort((a, b) => {
      if (a.source_type !== b.source_type) return a.source_type - b.source_type
      if (a.entryorguid !== b.entryorguid) return a.entryorguid - b.entryorguid
      return a.id - b.id
    })
    const columns = SMART_SCRIPTS_COLUMNS.map(c => `\`${c}\``).join(', ')
    lines.push(`INSERT INTO \`smart_scripts\` (${columns}) VALUES`)
    lines.push(sorted.map(rowValues).join(',\n') + ';')
  }
  return lines.join('\n')
}

// ─── conditions (SourceTypeOrReferenceId = 22) ───────────────────────

export const CONDITIONS_COLUMNS = [
  'SourceTypeOrReferenceId', 'SourceGroup', 'SourceEntry', 'SourceId',
  'ElseGroup', 'ConditionTypeOrReference', 'ConditionTarget',
  'ConditionValue1', 'ConditionValue2', 'ConditionValue3',
  'NegativeCondition', 'ErrorType', 'ErrorTextId', 'ScriptName', 'Comment',
] as const

function conditionValues(row: SaiCondition): string {
  const nums = [
    row.SourceTypeOrReferenceId, row.SourceGroup, row.SourceEntry, row.SourceId,
    row.ElseGroup, row.ConditionTypeOrReference, row.ConditionTarget,
    row.ConditionValue1, row.ConditionValue2, row.ConditionValue3,
    row.NegativeCondition, row.ErrorType, row.ErrorTextId,
  ]
  return `(${nums.join(', ')}, '${escapeSQL(row.ScriptName ?? '')}', '${escapeSQL(row.Comment ?? '')}')`
}

export function buildSaiConditionsSql(deleteKeys: SaiOwnedKey[], rows: SaiCondition[]): string {
  if (deleteKeys.length === 0) return ''
  const bySourceId = new Map<number, number[]>()
  for (const key of deleteKeys) {
    const list = bySourceId.get(key.sourceType)
    if (list) {
      list.push(key.entryorguid)
    } else {
      bySourceId.set(key.sourceType, [key.entryorguid])
    }
  }
  const parts: string[] = []
  for (const [sourceId, entries] of [...bySourceId.entries()].sort((a, b) => a[0] - b[0])) {
    const unique = [...new Set(entries)].sort((a, b) => a - b)
    parts.push(`(\`SourceId\` = ${sourceId} AND \`SourceEntry\` IN (${unique.join(', ')}))`)
  }

  const lines: string[] = []
  lines.push(`DELETE FROM \`conditions\` WHERE \`SourceTypeOrReferenceId\` = ${CONDITION_SOURCE_SMART_EVENT} AND (${parts.join(' OR ')});`)
  if (rows.length > 0) {
    const sorted = [...rows].sort((a, b) => {
      if (a.SourceId !== b.SourceId) return a.SourceId - b.SourceId
      if (a.SourceEntry !== b.SourceEntry) return a.SourceEntry - b.SourceEntry
      if (a.SourceGroup !== b.SourceGroup) return a.SourceGroup - b.SourceGroup
      return a.ElseGroup - b.ElseGroup
    })
    const columns = CONDITIONS_COLUMNS.map(c => `\`${c}\``).join(', ')
    lines.push(`INSERT INTO \`conditions\` (${columns}) VALUES`)
    lines.push(sorted.map(conditionValues).join(',\n') + ';')
  }
  return lines.join('\n')
}
