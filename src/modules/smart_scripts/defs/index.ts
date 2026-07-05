import type { ParamDef, SaiTypeDef } from '../types'
import { SAI_EVENTS } from './events'
import { SAI_ACTIONS } from './actions'
import { SAI_TARGETS } from './targets'

export { SAI_EVENTS } from './events'
export { SAI_ACTIONS } from './actions'
export { SAI_TARGETS } from './targets'
export * from './enums'
export { formatParam, interpolateTemplate } from './paramKinds'

// Known type counts on the 3.3.5 branch (used to build the pickers even
// for types that only have a fallback definition so far).
export const SAI_EVENT_MAX = 91
export const SAI_ACTION_MAX = 159
export const SAI_TARGET_MAX = 31

const EVENT_PARAM_COUNT = 4
const ACTION_PARAM_COUNT = 6
const TARGET_PARAM_COUNT = 3

function genericParams(count: number): ParamDef[] {
  return Array.from({ length: count }, (_, i) => ({
    index: (i + 1) as ParamDef['index'],
    label: `Param ${i + 1}`,
    kind: 'number' as const,
  }))
}

/**
 * Fallback definition for types without full metadata yet: every param is
 * editable as a raw number so no data is ever hidden or lost.
 */
function fallbackDef(id: number, kind: 'EVENT' | 'ACTION' | 'TARGET', paramCount: number): SaiTypeDef {
  return {
    id,
    name: `${kind} ${id}`,
    title: `${kind.charAt(0)}${kind.slice(1).toLowerCase()} ${id}`,
    help: 'No metadata for this type yet — params are edited as raw values.',
    params: genericParams(paramCount),
    isFallback: true,
  }
}

export function getEventDef(type: number): SaiTypeDef {
  return SAI_EVENTS[type] ?? fallbackDef(type, 'EVENT', EVENT_PARAM_COUNT)
}

export function getActionDef(type: number): SaiTypeDef {
  return SAI_ACTIONS[type] ?? fallbackDef(type, 'ACTION', ACTION_PARAM_COUNT)
}

export function getTargetDef(type: number): SaiTypeDef {
  return SAI_TARGETS[type] ?? fallbackDef(type, 'TARGET', TARGET_PARAM_COUNT)
}

interface TypeOption {
  value: number
  label: string
  def: SaiTypeDef
}

function buildTypeOptions(defs: Record<number, SaiTypeDef>, max: number, getDef: (t: number) => SaiTypeDef): TypeOption[] {
  const options: TypeOption[] = []
  for (let i = 0; i < max; i++) {
    const def = getDef(i)
    options.push({ value: i, label: `${i} — ${defs[i] ? def.title : def.name}`, def })
  }
  return options
}

/** Options for the event/action/target type Selects (filterable). */
export const eventTypeOptions = buildTypeOptions(SAI_EVENTS, SAI_EVENT_MAX, getEventDef)
export const actionTypeOptions = buildTypeOptions(SAI_ACTIONS, SAI_ACTION_MAX, getActionDef)
export const targetTypeOptions = buildTypeOptions(SAI_TARGETS, SAI_TARGET_MAX, getTargetDef)
