import type { BitmaskOption, SelectOption } from '@/types/common'

// ─── smart_scripts row (TrinityCore 3.3.5 schema) ────────────────────

export interface SmartScript {
  entryorguid: number
  source_type: number
  id: number
  link: number
  event_type: number
  event_phase_mask: number
  event_chance: number
  event_flags: number
  event_param1: number
  event_param2: number
  event_param3: number
  event_param4: number
  action_type: number
  action_param1: number
  action_param2: number
  action_param3: number
  action_param4: number
  action_param5: number
  action_param6: number
  target_type: number
  target_param1: number
  target_param2: number
  target_param3: number
  target_x: number
  target_y: number
  target_z: number
  target_o: number
  comment: string
}

export const SAI_SOURCE_TYPE_CREATURE = 0
export const SAI_SOURCE_TYPE_TIMED_ACTIONLIST = 9

/** Event fired only as the target of another row's `link` column. */
export const SAI_EVENT_LINK = 61
/** Actionlist wait pseudo-event (source_type 9 rows use event 0 as a delay). */
export const SAI_EVENT_UPDATE_IC = 0

export const SAI_ACTION_SET_EVENT_PHASE = 22
export const SAI_ACTION_INC_EVENT_PHASE = 23
export const SAI_ACTION_CALL_TIMED_ACTIONLIST = 80
export const SAI_ACTION_CALL_RANDOM_TIMED_ACTIONLIST = 87
export const SAI_ACTION_CALL_RANDOM_RANGE_TIMED_ACTIONLIST = 88

export const smart_script_type_options: SelectOption[] = [
  { value: 0, name: 'CREATURE' },
  { value: 1, name: 'GAMEOBJECT' },
  { value: 2, name: 'AREATRIGGER' },
  { value: 3, name: 'EVENT' },
  { value: 4, name: 'GOSSIP' },
  { value: 5, name: 'QUEST' },
  { value: 6, name: 'SPELL' },
  { value: 7, name: 'TRANSPORT' },
  { value: 8, name: 'FACTION' },
  { value: 9, name: 'TIMED_ACTIONLIST' },
]

// ─── Metadata dictionary types ───────────────────────────────────────

/**
 * Semantic kind of a param. Drives the input widget and the display
 * formatting. The `*Id`/`*Entry` kinds render as plain numeric inputs in
 * v1 but are the extension point for future DB-search pickers.
 */
export type ParamKind =
  | 'number'
  | 'ms'
  | 'percent'
  | 'bool'
  | 'enum'
  | 'bitmask'
  | 'spellId'
  | 'creatureEntry'
  | 'gobEntry'
  | 'questId'
  | 'itemId'
  | 'emoteId'
  | 'soundId'
  | 'factionId'
  | 'modelId'
  | 'mapId'
  | 'zoneId'
  | 'textGroupId'
  | 'actionlistId'
  | 'pathId'
  | 'pointId'
  | 'guid'

export interface ParamDef {
  /** 1-based param index within its section (event/action/target) */
  index: 1 | 2 | 3 | 4 | 5 | 6
  label: string
  help?: string
  kind: ParamKind
  /** Required when kind === 'enum' */
  options?: SelectOption[]
  /** Required when kind === 'bitmask' */
  bitmask?: BitmaskOption[]
  /** Default value when creating a new row (0 if omitted) */
  default?: number
}

export interface SaiTypeDef {
  id: number
  /** Technical name matching SmartScriptMgr.h (kept in English by design) */
  name: string
  /** Short readable label used in card sentences */
  title: string
  help?: string
  params: ParamDef[]
  /**
   * Card sentence template with {p1}..{p6} placeholders (formatted through
   * formatParam). Falls back to `title` when omitted.
   */
  template?: string
  /** Target types that read target_x/y/z/o */
  usesCoords?: boolean
  /** True for types whose metadata is not specified yet (generic editing) */
  isFallback?: boolean
}

export interface ConditionTypeDef {
  id: number
  name: string
  title: string
  help?: string
  /** ConditionValue1..3 definitions (index 1..3) */
  params: ParamDef[]
  template?: string
}

// ─── Conditions (source 22 = SMART_EVENT) ────────────────────────────

export type { Conditions as SaiCondition } from '@/types/conditions/conditions'

export const CONDITION_SOURCE_SMART_EVENT = 22

export function createDefaultCondition(row: SmartScript, elseGroup: number): import('@/types/conditions/conditions').Conditions {
  return {
    SourceTypeOrReferenceId: CONDITION_SOURCE_SMART_EVENT,
    SourceGroup: row.id + 1,
    SourceEntry: row.entryorguid,
    SourceId: row.source_type,
    ElseGroup: elseGroup,
    ConditionTypeOrReference: 9,
    ConditionTarget: 0,
    ConditionValue1: 0,
    ConditionValue2: 0,
    ConditionValue3: 0,
    NegativeCondition: 0,
    ErrorType: 0,
    ErrorTextId: 0,
    ScriptName: '',
    Comment: '',
  }
}

export const condition_target_options: SelectOption[] = [
  { value: 0, name: 'Action invoker', comment: 'The unit that caused the event' },
  { value: 1, name: 'Object', comment: 'The scripted creature/object itself' },
]
