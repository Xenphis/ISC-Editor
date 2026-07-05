import type { SaiTypeDef } from '../types'
import { p } from './paramKinds'
import {
  cast_flags_options,
  evade_destination_options,
  go_state_options,
  power_type_options,
  react_state_options,
  set_inst_data_type_options,
  sheath_state_options,
  summon_type_options,
  timer_update_type_options,
} from './enums'

// SMART_ACTION_* definitions (TrinityCore 3.3.5, SmartScriptMgr.h).
// Action rows use action_param1..6. Types missing here are handled by the
// generic fallback in ./index.ts until they get a full definition.

export const SAI_ACTIONS: Record<number, SaiTypeDef> = {
  0: { id: 0, name: 'SMART_ACTION_NONE', title: 'Do nothing', params: [] },
  1: {
    id: 1, name: 'SMART_ACTION_TALK', title: 'Say text',
    help: 'Plays a creature_text group of the target (or of self).',
    params: [
      p(1, 'Text group', 'textGroupId', { help: 'GroupID from creature_text' }),
      p(2, 'Duration', 'ms', { help: 'Delay before TEXT_OVER event fires' }),
      p(3, 'Use talk target', 'bool', { help: 'Talk target instead of self as the talker' }),
    ],
    template: 'Say text group {p1}',
  },
  2: {
    id: 2, name: 'SMART_ACTION_SET_FACTION', title: 'Set faction',
    params: [p(1, 'Faction ID', 'factionId', { help: '0 = restore default faction' })],
    template: 'Set faction {p1}',
  },
  3: {
    id: 3, name: 'SMART_ACTION_MORPH_TO_ENTRY_OR_MODEL', title: 'Morph',
    help: 'Morph to the model of a creature entry OR to a model ID. Both 0 = demorph.',
    params: [
      p(1, 'Creature entry', 'creatureEntry'),
      p(2, 'Model ID', 'modelId'),
    ],
    template: 'Morph (entry {p1} / model {p2})',
  },
  4: {
    id: 4, name: 'SMART_ACTION_SOUND', title: 'Play sound',
    params: [
      p(1, 'Sound ID', 'soundId'),
      p(2, 'Only self', 'bool'),
    ],
    template: 'Play sound {p1}',
  },
  5: {
    id: 5, name: 'SMART_ACTION_PLAY_EMOTE', title: 'Play emote',
    params: [p(1, 'Emote ID', 'emoteId')],
    template: 'Play emote {p1}',
  },
  6: {
    id: 6, name: 'SMART_ACTION_FAIL_QUEST', title: 'Fail quest',
    params: [p(1, 'Quest ID', 'questId')],
    template: 'Fail quest {p1}',
  },
  7: {
    id: 7, name: 'SMART_ACTION_OFFER_QUEST', title: 'Offer quest',
    params: [
      p(1, 'Quest ID', 'questId'),
      p(2, 'Add directly', 'bool', { help: 'Add quest to log without offering' }),
    ],
    template: 'Offer quest {p1}',
  },
  8: {
    id: 8, name: 'SMART_ACTION_SET_REACT_STATE', title: 'Set react state',
    params: [p(1, 'State', 'enum', { options: react_state_options })],
    template: 'Set react state {p1}',
  },
  9: {
    id: 9, name: 'SMART_ACTION_ACTIVATE_GOBJECT', title: 'Activate GameObject',
    params: [],
  },
  10: {
    id: 10, name: 'SMART_ACTION_RANDOM_EMOTE', title: 'Random emote',
    params: [
      p(1, 'Emote 1', 'emoteId'),
      p(2, 'Emote 2', 'emoteId'),
      p(3, 'Emote 3', 'emoteId'),
      p(4, 'Emote 4', 'emoteId'),
      p(5, 'Emote 5', 'emoteId'),
      p(6, 'Emote 6', 'emoteId'),
    ],
    template: 'Random emote',
  },
  11: {
    id: 11, name: 'SMART_ACTION_CAST', title: 'Cast spell',
    params: [
      p(1, 'Spell ID', 'spellId'),
      p(2, 'Cast flags', 'bitmask', { bitmask: cast_flags_options }),
    ],
    template: 'Cast {p1}',
  },
  12: {
    id: 12, name: 'SMART_ACTION_SUMMON_CREATURE', title: 'Summon creature',
    help: 'Summons at target position (or own position if target has no coords).',
    params: [
      p(1, 'Creature entry', 'creatureEntry'),
      p(2, 'Summon type', 'enum', { options: summon_type_options, default: 1 }),
      p(3, 'Duration', 'ms'),
      p(4, 'Attack invoker', 'bool'),
    ],
    template: 'Summon creature {p1} ({p2})',
  },
  13: {
    id: 13, name: 'SMART_ACTION_THREAT_SINGLE_PCT', title: 'Modify threat (single)',
    params: [
      p(1, 'Increase %', 'percent'),
      p(2, 'Decrease %', 'percent'),
    ],
    template: 'Threat single +{p1}/-{p2}',
  },
  14: {
    id: 14, name: 'SMART_ACTION_THREAT_ALL_PCT', title: 'Modify threat (all)',
    params: [
      p(1, 'Increase %', 'percent'),
      p(2, 'Decrease %', 'percent'),
    ],
    template: 'Threat all +{p1}/-{p2}',
  },
  15: {
    id: 15, name: 'SMART_ACTION_CALL_AREAEXPLOREDOREVENTHAPPENS', title: 'Quest explore/event credit',
    params: [p(1, 'Quest ID', 'questId')],
    template: 'Quest credit {p1}',
  },
  17: {
    id: 17, name: 'SMART_ACTION_SET_EMOTE_STATE', title: 'Set emote state',
    params: [p(1, 'Emote ID', 'emoteId')],
    template: 'Set emote state {p1}',
  },
  18: {
    id: 18, name: 'SMART_ACTION_SET_UNIT_FLAG', title: 'Set unit flag',
    params: [
      p(1, 'Flags', 'number', { help: 'Raw UNIT_FLAGS value to add' }),
      p(2, 'Flags type', 'bool', { help: 'no = UNIT_FIELD_FLAGS, yes = UNIT_FIELD_FLAGS_2' }),
    ],
    template: 'Set unit flag {p1}',
  },
  19: {
    id: 19, name: 'SMART_ACTION_REMOVE_UNIT_FLAG', title: 'Remove unit flag',
    params: [
      p(1, 'Flags', 'number'),
      p(2, 'Flags type', 'bool'),
    ],
    template: 'Remove unit flag {p1}',
  },
  20: {
    id: 20, name: 'SMART_ACTION_AUTO_ATTACK', title: 'Toggle auto attack',
    params: [p(1, 'Allow attack', 'bool')],
    template: 'Auto attack: {p1}',
  },
  21: {
    id: 21, name: 'SMART_ACTION_ALLOW_COMBAT_MOVEMENT', title: 'Toggle combat movement',
    params: [p(1, 'Allow movement', 'bool')],
    template: 'Combat movement: {p1}',
  },
  22: {
    id: 22, name: 'SMART_ACTION_SET_EVENT_PHASE', title: 'Set event phase',
    params: [p(1, 'Phase', 'number', { help: '0 = all phases inactive' })],
    template: 'Set phase {p1}',
  },
  23: {
    id: 23, name: 'SMART_ACTION_INC_EVENT_PHASE', title: 'Increment event phase',
    params: [p(1, 'Value', 'number', { help: 'May be negative to decrement' })],
    template: 'Phase +{p1}',
  },
  24: {
    id: 24, name: 'SMART_ACTION_EVADE', title: 'Evade',
    params: [p(1, 'Destination', 'enum', { options: evade_destination_options })],
    template: 'Evade',
  },
  25: {
    id: 25, name: 'SMART_ACTION_FLEE_FOR_ASSIST', title: 'Flee for assist',
    params: [p(1, 'With emote', 'bool')],
    template: 'Flee for assist',
  },
  26: {
    id: 26, name: 'SMART_ACTION_CALL_GROUPEVENTHAPPENS', title: 'Quest group event credit',
    params: [p(1, 'Quest ID', 'questId')],
    template: 'Group quest credit {p1}',
  },
  27: { id: 27, name: 'SMART_ACTION_COMBAT_STOP', title: 'Stop combat', params: [] },
  28: {
    id: 28, name: 'SMART_ACTION_REMOVEAURASFROMSPELL', title: 'Remove aura',
    params: [
      p(1, 'Spell ID', 'spellId', { help: '0 = remove all auras' }),
      p(2, 'Charges', 'number', { help: '0 = remove the aura entirely' }),
    ],
    template: 'Remove aura {p1}',
  },
  29: {
    id: 29, name: 'SMART_ACTION_FOLLOW', title: 'Follow target',
    params: [
      p(1, 'Distance', 'number', { help: '0 = default follow distance' }),
      p(2, 'Angle', 'number', { help: '0 = default follow angle' }),
      p(3, 'End creature entry', 'creatureEntry'),
      p(4, 'Quest credit', 'number'),
      p(5, 'Credit type', 'bool', { help: 'no = monster credit, yes = event credit' }),
    ],
    template: 'Follow',
  },
  30: {
    id: 30, name: 'SMART_ACTION_RANDOM_PHASE', title: 'Random phase',
    params: [
      p(1, 'Phase 1', 'number'),
      p(2, 'Phase 2', 'number'),
      p(3, 'Phase 3', 'number'),
      p(4, 'Phase 4', 'number'),
      p(5, 'Phase 5', 'number'),
      p(6, 'Phase 6', 'number'),
    ],
    template: 'Random phase',
  },
  31: {
    id: 31, name: 'SMART_ACTION_RANDOM_PHASE_RANGE', title: 'Random phase (range)',
    params: [
      p(1, 'Phase min', 'number'),
      p(2, 'Phase max', 'number'),
    ],
    template: 'Random phase {p1}-{p2}',
  },
  32: { id: 32, name: 'SMART_ACTION_RESET_GOBJECT', title: 'Reset GameObject', params: [] },
  33: {
    id: 33, name: 'SMART_ACTION_CALL_KILLEDMONSTER', title: 'Kill credit',
    params: [p(1, 'Creature entry', 'creatureEntry')],
    template: 'Kill credit {p1}',
  },
  34: {
    id: 34, name: 'SMART_ACTION_SET_INST_DATA', title: 'Set instance data',
    params: [
      p(1, 'Field', 'number'),
      p(2, 'Data', 'number'),
      p(3, 'Type', 'enum', { options: set_inst_data_type_options }),
    ],
    template: 'Set instance data {p1} = {p2}',
  },
  36: {
    id: 36, name: 'SMART_ACTION_UPDATE_TEMPLATE', title: 'Update template',
    help: 'Transforms the creature into another creature_template entry.',
    params: [
      p(1, 'Creature entry', 'creatureEntry'),
      p(2, 'Update level', 'bool'),
    ],
    template: 'Update template to {p1}',
  },
  37: { id: 37, name: 'SMART_ACTION_DIE', title: 'Die', params: [] },
  38: { id: 38, name: 'SMART_ACTION_SET_IN_COMBAT_WITH_ZONE', title: 'Combat with zone', params: [] },
  39: {
    id: 39, name: 'SMART_ACTION_CALL_FOR_HELP', title: 'Call for help',
    params: [
      p(1, 'Radius', 'number'),
      p(2, 'With emote', 'bool'),
    ],
    template: 'Call for help ({p1} yd)',
  },
  40: {
    id: 40, name: 'SMART_ACTION_SET_SHEATH', title: 'Set sheath state',
    params: [p(1, 'Sheath', 'enum', { options: sheath_state_options })],
    template: 'Sheath: {p1}',
  },
  41: {
    id: 41, name: 'SMART_ACTION_FORCE_DESPAWN', title: 'Despawn',
    params: [p(1, 'Delay', 'ms')],
    template: 'Despawn after {p1}',
  },
  42: {
    id: 42, name: 'SMART_ACTION_SET_INVINCIBILITY_HP_LEVEL', title: 'Set invincibility HP',
    params: [
      p(1, 'Min HP value', 'number', { help: 'Flat HP floor (0 = use percent)' }),
      p(2, 'Min HP %', 'percent'),
    ],
    template: 'Invincible below {p1} HP / {p2}',
  },
  43: {
    id: 43, name: 'SMART_ACTION_MOUNT_TO_ENTRY_OR_MODEL', title: 'Mount',
    help: 'Mount the model of a creature entry OR a model ID. Both 0 = dismount.',
    params: [
      p(1, 'Creature entry', 'creatureEntry'),
      p(2, 'Model ID', 'modelId'),
    ],
    template: 'Mount (entry {p1} / model {p2})',
  },
  44: {
    id: 44, name: 'SMART_ACTION_SET_INGAME_PHASE_MASK', title: 'Set in-game phase mask',
    params: [p(1, 'Phase mask', 'number', { default: 1 })],
    template: 'Set phase mask {p1}',
  },
  45: {
    id: 45, name: 'SMART_ACTION_SET_DATA', title: 'Set data',
    help: 'Calls SetData on the target (triggers its DATA_SET event 38).',
    params: [
      p(1, 'Data field', 'number'),
      p(2, 'Data value', 'number'),
    ],
    template: 'Set data {p1} = {p2}',
  },
  47: {
    id: 47, name: 'SMART_ACTION_SET_VISIBILITY', title: 'Set visibility',
    params: [p(1, 'Visible', 'bool')],
    template: 'Visibility: {p1}',
  },
  48: {
    id: 48, name: 'SMART_ACTION_SET_ACTIVE', title: 'Set active object',
    params: [p(1, 'Active', 'bool')],
    template: 'Active: {p1}',
  },
  49: { id: 49, name: 'SMART_ACTION_ATTACK_START', title: 'Attack target', params: [] },
  50: {
    id: 50, name: 'SMART_ACTION_SUMMON_GO', title: 'Summon GameObject',
    params: [
      p(1, 'GO entry', 'gobEntry'),
      p(2, 'Despawn time', 'ms'),
    ],
    template: 'Summon GO {p1}',
  },
  51: { id: 51, name: 'SMART_ACTION_KILL_UNIT', title: 'Kill target', params: [] },
  52: {
    id: 52, name: 'SMART_ACTION_ACTIVATE_TAXI', title: 'Activate taxi path',
    params: [p(1, 'Taxi path ID', 'number')],
    template: 'Taxi path {p1}',
  },
  53: {
    id: 53, name: 'SMART_ACTION_WP_START', title: 'Start waypoint path',
    params: [
      p(1, 'Run', 'bool'),
      p(2, 'Path ID', 'pathId', { help: 'ID in the waypoints table' }),
      p(3, 'Repeat', 'bool'),
      p(4, 'Quest ID', 'questId'),
      p(5, 'Despawn time', 'ms'),
    ],
    template: 'Start waypoint path {p2}',
  },
  54: {
    id: 54, name: 'SMART_ACTION_WP_PAUSE', title: 'Pause waypoint path',
    params: [p(1, 'Duration', 'ms')],
    template: 'Pause path for {p1}',
  },
  55: {
    id: 55, name: 'SMART_ACTION_WP_STOP', title: 'Stop waypoint path',
    params: [
      p(1, 'Despawn time', 'ms'),
      p(2, 'Quest ID', 'questId'),
      p(3, 'Fail quest', 'bool'),
    ],
    template: 'Stop waypoint path',
  },
  56: {
    id: 56, name: 'SMART_ACTION_ADD_ITEM', title: 'Give item',
    params: [
      p(1, 'Item ID', 'itemId'),
      p(2, 'Count', 'number', { default: 1 }),
    ],
    template: 'Give item {p1} x{p2}',
  },
  57: {
    id: 57, name: 'SMART_ACTION_REMOVE_ITEM', title: 'Remove item',
    params: [
      p(1, 'Item ID', 'itemId'),
      p(2, 'Count', 'number', { default: 1 }),
    ],
    template: 'Remove item {p1} x{p2}',
  },
  59: {
    id: 59, name: 'SMART_ACTION_SET_RUN', title: 'Set run/walk',
    params: [p(1, 'Run', 'bool')],
    template: 'Run: {p1}',
  },
  60: {
    id: 60, name: 'SMART_ACTION_SET_FLY', title: 'Set flying',
    params: [p(1, 'Fly', 'bool')],
    template: 'Fly: {p1}',
  },
  61: {
    id: 61, name: 'SMART_ACTION_SET_SWIM', title: 'Set swimming',
    params: [p(1, 'Swim', 'bool')],
    template: 'Swim: {p1}',
  },
  62: {
    id: 62, name: 'SMART_ACTION_TELEPORT', title: 'Teleport',
    help: 'Teleports the target (players use target coords of this row).',
    params: [p(1, 'Map ID', 'mapId')],
    template: 'Teleport to map {p1}',
  },
  63: {
    id: 63, name: 'SMART_ACTION_SET_COUNTER', title: 'Set counter',
    params: [
      p(1, 'Counter ID', 'number'),
      p(2, 'Value', 'number'),
      p(3, 'Reset', 'bool'),
    ],
    template: 'Counter {p1} = {p2}',
  },
  64: {
    id: 64, name: 'SMART_ACTION_STORE_TARGET_LIST', title: 'Store target list',
    params: [p(1, 'Storage ID', 'number')],
    template: 'Store targets as #{p1}',
  },
  65: { id: 65, name: 'SMART_ACTION_WP_RESUME', title: 'Resume waypoint path', params: [] },
  66: {
    id: 66, name: 'SMART_ACTION_SET_ORIENTATION', title: 'Set orientation',
    help: 'Turns toward the target (or to target_o when target is Position).',
    params: [],
    template: 'Turn to target',
  },
  67: {
    id: 67, name: 'SMART_ACTION_CREATE_TIMED_EVENT', title: 'Create timed event',
    params: [
      p(1, 'Event ID', 'number'),
      p(2, 'Initial min', 'ms'),
      p(3, 'Initial max', 'ms'),
      p(4, 'Repeat min', 'ms'),
      p(5, 'Repeat max', 'ms'),
      p(6, 'Chance', 'percent', { default: 100 }),
    ],
    template: 'Create timed event {p1}',
  },
  68: {
    id: 68, name: 'SMART_ACTION_PLAYMOVIE', title: 'Play movie',
    params: [p(1, 'Movie ID', 'number')],
    template: 'Play movie {p1}',
  },
  69: {
    id: 69, name: 'SMART_ACTION_MOVE_TO_POS', title: 'Move to position',
    params: [
      p(1, 'Point ID', 'pointId'),
      p(2, 'Use transport', 'bool'),
      p(3, 'Disable pathfinding', 'bool'),
    ],
    template: 'Move to position (point {p1})',
  },
  71: {
    id: 71, name: 'SMART_ACTION_EQUIP', title: 'Change equipment',
    params: [
      p(1, 'Equipment ID', 'number', { help: 'ID from creature_equip_template (0 = use slot params)' }),
      p(2, 'Slot mask', 'number'),
    ],
    template: 'Equip set {p1}',
  },
  72: { id: 72, name: 'SMART_ACTION_CLOSE_GOSSIP', title: 'Close gossip', params: [] },
  73: {
    id: 73, name: 'SMART_ACTION_TRIGGER_TIMED_EVENT', title: 'Trigger timed event',
    params: [p(1, 'Event ID', 'number')],
    template: 'Trigger timed event {p1}',
  },
  74: {
    id: 74, name: 'SMART_ACTION_REMOVE_TIMED_EVENT', title: 'Remove timed event',
    params: [p(1, 'Event ID', 'number')],
    template: 'Remove timed event {p1}',
  },
  75: {
    id: 75, name: 'SMART_ACTION_ADD_AURA', title: 'Add aura',
    params: [p(1, 'Spell ID', 'spellId')],
    template: 'Add aura {p1}',
  },
  78: { id: 78, name: 'SMART_ACTION_CALL_SCRIPT_RESET', title: 'Reset script', params: [] },
  79: {
    id: 79, name: 'SMART_ACTION_SET_RANGED_MOVEMENT', title: 'Set ranged movement',
    params: [
      p(1, 'Attack distance', 'number'),
      p(2, 'Attack angle', 'number'),
    ],
    template: 'Ranged movement ({p1} yd)',
  },
  80: {
    id: 80, name: 'SMART_ACTION_CALL_TIMED_ACTIONLIST', title: 'Run timed actionlist',
    params: [
      p(1, 'Actionlist ID', 'actionlistId', { help: 'entryorguid of the source_type 9 script (usually entry*100+n)' }),
      p(2, 'Timer type', 'enum', { options: timer_update_type_options }),
      p(3, 'Allow override', 'bool', { help: 'Allow a new actionlist to interrupt this one' }),
    ],
    template: 'Run actionlist {p1}',
  },
  81: {
    id: 81, name: 'SMART_ACTION_SET_NPC_FLAG', title: 'Set NPC flags',
    params: [p(1, 'Flags', 'number')],
    template: 'Set NPC flags {p1}',
  },
  82: {
    id: 82, name: 'SMART_ACTION_ADD_NPC_FLAG', title: 'Add NPC flags',
    params: [p(1, 'Flags', 'number')],
    template: 'Add NPC flags {p1}',
  },
  83: {
    id: 83, name: 'SMART_ACTION_REMOVE_NPC_FLAG', title: 'Remove NPC flags',
    params: [p(1, 'Flags', 'number')],
    template: 'Remove NPC flags {p1}',
  },
  84: {
    id: 84, name: 'SMART_ACTION_SIMPLE_TALK', title: 'Say text (no TEXT_OVER)',
    params: [p(1, 'Text group', 'textGroupId')],
    template: 'Say text group {p1} (simple)',
  },
  85: {
    id: 85, name: 'SMART_ACTION_INVOKER_CAST', title: 'Invoker casts spell',
    help: 'The event invoker casts the spell on the target.',
    params: [
      p(1, 'Spell ID', 'spellId'),
      p(2, 'Cast flags', 'bitmask', { bitmask: cast_flags_options }),
    ],
    template: 'Invoker casts {p1}',
  },
  86: {
    id: 86, name: 'SMART_ACTION_CROSS_CAST', title: 'Cross cast',
    help: 'A separate caster (defined by params 3-5 as a target type) casts on this row\'s target.',
    params: [
      p(1, 'Spell ID', 'spellId'),
      p(2, 'Cast flags', 'bitmask', { bitmask: cast_flags_options }),
      p(3, 'Caster target type', 'number'),
      p(4, 'Caster target param 1', 'number'),
      p(5, 'Caster target param 2', 'number'),
      p(6, 'Caster target param 3', 'number'),
    ],
    template: 'Cross cast {p1}',
  },
  87: {
    id: 87, name: 'SMART_ACTION_CALL_RANDOM_TIMED_ACTIONLIST', title: 'Run random actionlist',
    params: [
      p(1, 'Actionlist 1', 'actionlistId'),
      p(2, 'Actionlist 2', 'actionlistId'),
      p(3, 'Actionlist 3', 'actionlistId'),
      p(4, 'Actionlist 4', 'actionlistId'),
      p(5, 'Actionlist 5', 'actionlistId'),
      p(6, 'Actionlist 6', 'actionlistId'),
    ],
    template: 'Run random actionlist',
  },
  88: {
    id: 88, name: 'SMART_ACTION_CALL_RANDOM_RANGE_TIMED_ACTIONLIST', title: 'Run random actionlist (range)',
    params: [
      p(1, 'Actionlist min', 'actionlistId'),
      p(2, 'Actionlist max', 'actionlistId'),
    ],
    template: 'Run random actionlist {p1}-{p2}',
  },
  89: {
    id: 89, name: 'SMART_ACTION_RANDOM_MOVE', title: 'Random movement',
    params: [p(1, 'Radius', 'number')],
    template: 'Random move ({p1} yd)',
  },
  90: {
    id: 90, name: 'SMART_ACTION_SET_UNIT_FIELD_BYTES_1', title: 'Set UNIT_FIELD_BYTES_1',
    params: [
      p(1, 'Bytes', 'number'),
      p(2, 'Type', 'number'),
    ],
  },
  91: {
    id: 91, name: 'SMART_ACTION_REMOVE_UNIT_FIELD_BYTES_1', title: 'Remove UNIT_FIELD_BYTES_1',
    params: [
      p(1, 'Bytes', 'number'),
      p(2, 'Type', 'number'),
    ],
  },
  92: {
    id: 92, name: 'SMART_ACTION_INTERRUPT_SPELL', title: 'Interrupt spell',
    params: [
      p(1, 'With delayed', 'bool'),
      p(2, 'Spell ID', 'spellId', { help: '0 = current spell' }),
      p(3, 'With instant', 'bool'),
    ],
    template: 'Interrupt spell {p2}',
  },
  93: {
    id: 93, name: 'SMART_ACTION_SEND_GO_CUSTOM_ANIM', title: 'GO custom animation',
    params: [p(1, 'Animation ID', 'number')],
  },
  94: {
    id: 94, name: 'SMART_ACTION_SET_DYNAMIC_FLAG', title: 'Set dynamic flags',
    params: [p(1, 'Flags', 'number')],
  },
  95: {
    id: 95, name: 'SMART_ACTION_ADD_DYNAMIC_FLAG', title: 'Add dynamic flags',
    params: [p(1, 'Flags', 'number')],
  },
  96: {
    id: 96, name: 'SMART_ACTION_REMOVE_DYNAMIC_FLAG', title: 'Remove dynamic flags',
    params: [p(1, 'Flags', 'number')],
  },
  97: {
    id: 97, name: 'SMART_ACTION_JUMP_TO_POS', title: 'Jump to position',
    params: [
      p(1, 'Speed XY', 'number'),
      p(2, 'Speed Z', 'number'),
    ],
    template: 'Jump to position',
  },
  98: {
    id: 98, name: 'SMART_ACTION_SEND_GOSSIP_MENU', title: 'Send gossip menu',
    params: [
      p(1, 'Menu ID', 'number'),
      p(2, 'NPC text ID', 'number'),
    ],
    template: 'Send gossip menu {p1}',
  },
  99: {
    id: 99, name: 'SMART_ACTION_GO_SET_LOOT_STATE', title: 'Set GO loot state',
    params: [p(1, 'State', 'number')],
  },
  100: {
    id: 100, name: 'SMART_ACTION_SEND_TARGET_TO_TARGET', title: 'Send stored targets to target',
    params: [p(1, 'Storage ID', 'number')],
  },
  101: { id: 101, name: 'SMART_ACTION_SET_HOME_POS', title: 'Set home position', params: [] },
  102: {
    id: 102, name: 'SMART_ACTION_SET_HEALTH_REGEN', title: 'Toggle health regen',
    params: [p(1, 'Regenerate', 'bool')],
    template: 'Health regen: {p1}',
  },
  103: {
    id: 103, name: 'SMART_ACTION_SET_ROOT', title: 'Set rooted',
    params: [p(1, 'Rooted', 'bool')],
    template: 'Root: {p1}',
  },
  104: {
    id: 104, name: 'SMART_ACTION_SET_GO_FLAG', title: 'Set GO flags',
    params: [p(1, 'Flags', 'number')],
  },
  105: {
    id: 105, name: 'SMART_ACTION_ADD_GO_FLAG', title: 'Add GO flags',
    params: [p(1, 'Flags', 'number')],
  },
  106: {
    id: 106, name: 'SMART_ACTION_REMOVE_GO_FLAG', title: 'Remove GO flags',
    params: [p(1, 'Flags', 'number')],
  },
  107: {
    id: 107, name: 'SMART_ACTION_SUMMON_CREATURE_GROUP', title: 'Summon creature group',
    params: [
      p(1, 'Group ID', 'number', { help: 'ID from creature_summon_groups' }),
      p(2, 'Attack invoker', 'bool'),
    ],
    template: 'Summon group {p1}',
  },
  108: {
    id: 108, name: 'SMART_ACTION_SET_POWER', title: 'Set power',
    params: [
      p(1, 'Power type', 'enum', { options: power_type_options }),
      p(2, 'Value', 'number'),
    ],
    template: 'Set {p1} to {p2}',
  },
  109: {
    id: 109, name: 'SMART_ACTION_ADD_POWER', title: 'Add power',
    params: [
      p(1, 'Power type', 'enum', { options: power_type_options }),
      p(2, 'Value', 'number'),
    ],
    template: 'Add {p2} {p1}',
  },
  110: {
    id: 110, name: 'SMART_ACTION_REMOVE_POWER', title: 'Remove power',
    params: [
      p(1, 'Power type', 'enum', { options: power_type_options }),
      p(2, 'Value', 'number'),
    ],
    template: 'Remove {p2} {p1}',
  },
  111: {
    id: 111, name: 'SMART_ACTION_GAME_EVENT_STOP', title: 'Stop game event',
    params: [p(1, 'Game event ID', 'number')],
  },
  112: {
    id: 112, name: 'SMART_ACTION_GAME_EVENT_START', title: 'Start game event',
    params: [p(1, 'Game event ID', 'number')],
  },
  113: {
    id: 113, name: 'SMART_ACTION_START_CLOSEST_WAYPOINT', title: 'Start closest waypoint',
    params: [
      p(1, 'Waypoint 1', 'pathId'),
      p(2, 'Waypoint 2', 'pathId'),
      p(3, 'Waypoint 3', 'pathId'),
      p(4, 'Waypoint 4', 'pathId'),
      p(5, 'Waypoint 5', 'pathId'),
      p(6, 'Waypoint 6', 'pathId'),
    ],
  },
  114: { id: 114, name: 'SMART_ACTION_MOVE_OFFSET', title: 'Move by offset', params: [] },
  115: {
    id: 115, name: 'SMART_ACTION_RANDOM_SOUND', title: 'Random sound',
    params: [
      p(1, 'Sound 1', 'soundId'),
      p(2, 'Sound 2', 'soundId'),
      p(3, 'Sound 3', 'soundId'),
      p(4, 'Sound 4', 'soundId'),
      p(5, 'Only self', 'bool'),
    ],
    template: 'Random sound',
  },
  116: {
    id: 116, name: 'SMART_ACTION_SET_CORPSE_DELAY', title: 'Set corpse delay',
    params: [p(1, 'Delay', 'number', { help: 'Seconds' })],
  },
  117: {
    id: 117, name: 'SMART_ACTION_DISABLE_EVADE', title: 'Toggle evade',
    params: [p(1, 'Disable evade', 'bool')],
    template: 'Evade disabled: {p1}',
  },
  118: {
    id: 118, name: 'SMART_ACTION_GO_SET_GO_STATE', title: 'Set GO state',
    params: [p(1, 'State', 'enum', { options: go_state_options })],
    template: 'GO state: {p1}',
  },
  120: {
    id: 120, name: 'SMART_ACTION_FLEE', title: 'Flee',
    params: [p(1, 'Duration', 'ms')],
    template: 'Flee for {p1}',
  },
  121: {
    id: 121, name: 'SMART_ACTION_ADD_THREAT', title: 'Add threat',
    params: [
      p(1, 'Increase', 'number'),
      p(2, 'Decrease', 'number'),
    ],
  },
  122: {
    id: 122, name: 'SMART_ACTION_LOAD_EQUIPMENT', title: 'Load equipment',
    params: [p(1, 'Equipment ID', 'number')],
  },
  123: {
    id: 123, name: 'SMART_ACTION_TRIGGER_RANDOM_TIMED_EVENT', title: 'Trigger random timed event',
    params: [
      p(1, 'Event ID min', 'number'),
      p(2, 'Event ID max', 'number'),
    ],
  },
  124: { id: 124, name: 'SMART_ACTION_REMOVE_ALL_GAMEOBJECTS', title: 'Remove all GameObjects', params: [] },
  126: {
    id: 126, name: 'SMART_ACTION_PAUSE_MOVEMENT', title: 'Pause movement',
    params: [
      p(1, 'Movement slot', 'number'),
      p(2, 'Duration', 'ms'),
      p(3, 'Force', 'bool'),
    ],
    template: 'Pause movement for {p2}',
  },
}
