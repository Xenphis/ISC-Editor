import type { SaiCondition, SmartScript } from './types'
import { SAI_EVENT_LINK, SAI_SOURCE_TYPE_TIMED_ACTIONLIST } from './types'
import { getActionDef, getEventDef, getTargetDef } from './defs'
import { getConditionDef } from './defs/conditions'
import { interpolateTemplate } from './defs/paramKinds'

// Sentence rendering for cards, table tooltips, changed-field labels and
// auto-generated comments. All output is English by design (TrinityCore
// technical vocabulary).

export interface RowSummary {
  event: string
  action: string
  target: string
  full: string
}

function eventValues(row: SmartScript): Record<number, number> {
  return { 1: row.event_param1, 2: row.event_param2, 3: row.event_param3, 4: row.event_param4 }
}

function actionValues(row: SmartScript): Record<number, number> {
  return {
    1: row.action_param1, 2: row.action_param2, 3: row.action_param3,
    4: row.action_param4, 5: row.action_param5, 6: row.action_param6,
  }
}

function targetValues(row: SmartScript): Record<number, number> {
  return { 1: row.target_param1, 2: row.target_param2, 3: row.target_param3 }
}

function summarizeFallback(prefix: string, values: Record<number, number>): string {
  const parts = Object.entries(values)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `p${k}: ${v}`)
  return parts.length > 0 ? `${prefix} (${parts.join(', ')})` : prefix
}

export function summarizeEvent(row: SmartScript): string {
  const def = getEventDef(row.event_type)
  if (def.isFallback) return summarizeFallback(`UNKNOWN EVENT ${row.event_type}`, eventValues(row))
  if (row.source_type === SAI_SOURCE_TYPE_TIMED_ACTIONLIST) {
    // Actionlist rows reuse event 0 params as a wait timer
    const min = row.event_param1
    const max = row.event_param2
    return min === max
      ? `Wait ${interpolateTemplate('{p1}', def.params, eventValues(row))}`
      : `Wait ${interpolateTemplate('{p1}-{p2}', def.params, eventValues(row))}`
  }
  if (!def.template) return def.title
  return interpolateTemplate(def.template, def.params, eventValues(row))
}

export function summarizeAction(row: SmartScript): string {
  const def = getActionDef(row.action_type)
  if (def.isFallback) return summarizeFallback(`UNKNOWN ACTION ${row.action_type}`, actionValues(row))
  if (!def.template) return def.title
  return interpolateTemplate(def.template, def.params, actionValues(row))
}

export function summarizeTarget(row: SmartScript): string {
  const def = getTargetDef(row.target_type)
  if (def.isFallback) return summarizeFallback(`UNKNOWN TARGET ${row.target_type}`, targetValues(row))
  if (def.usesCoords) {
    return `Position (${row.target_x.toFixed(1)}, ${row.target_y.toFixed(1)}, ${row.target_z.toFixed(1)})`
  }
  if (!def.template) return def.title
  return interpolateTemplate(def.template, def.params, targetValues(row))
}

export function summarizeRow(row: SmartScript): RowSummary {
  const event = summarizeEvent(row)
  const action = summarizeAction(row)
  const target = summarizeTarget(row)
  return { event, action, target, full: `${event} → ${action} → ${target}` }
}

export function summarizeCondition(condition: SaiCondition): string {
  const def = getConditionDef(condition.ConditionTypeOrReference)
  const values: Record<number, number> = {
    1: condition.ConditionValue1,
    2: condition.ConditionValue2,
    3: condition.ConditionValue3,
  }
  const text = def.template ? interpolateTemplate(def.template, def.params, values) : def.title
  const target = condition.ConditionTarget === 1 ? ' (on self)' : ''
  return condition.NegativeCondition ? `not (${text})${target}` : `${text}${target}`
}

/** "only if (A and B) or (C)" rendering for card footers. */
export function summarizeConditionGroups(conditions: SaiCondition[]): string {
  if (conditions.length === 0) return ''
  const byElseGroup = new Map<number, SaiCondition[]>()
  for (const condition of conditions) {
    const list = byElseGroup.get(condition.ElseGroup)
    if (list) {
      list.push(condition)
    } else {
      byElseGroup.set(condition.ElseGroup, [condition])
    }
  }
  const groups = [...byElseGroup.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, list]) => list.map(summarizeCondition).join(' and '))
  const body = groups.length > 1 ? groups.map(g => `(${g})`).join(' or ') : groups[0]
  return `only if ${body}`
}

/**
 * Keira3-style auto comment: "Npc Name - On Aggro - Cast Fireball".
 * Actionlist rows use "Actionlist" as the event part; linked rows use
 * "On Link". The per-row "auto" toggle is simply comment === buildComment().
 */
export function buildComment(ownerName: string, row: SmartScript): string {
  let eventPart: string
  if (row.source_type === SAI_SOURCE_TYPE_TIMED_ACTIONLIST) {
    eventPart = 'Actionlist'
  } else if (row.event_type === SAI_EVENT_LINK) {
    eventPart = 'On Link'
  } else {
    const def = getEventDef(row.event_type)
    eventPart = def.isFallback ? `Event ${row.event_type}` : def.title
  }
  const actionDef = getActionDef(row.action_type)
  const actionPart = actionDef.isFallback ? `Action ${row.action_type}` : summarizeAction(row)
  return `${ownerName} - ${eventPart} - ${actionPart}`
}
