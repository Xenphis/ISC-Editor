import type { SaiTypeDef } from '../types'
import { cooldownPair, p, repeatPair } from './paramKinds'
import {
  charmed_moment_options,
  hostility_mode_options,
  movement_type_options,
  respawn_condition_options,
  spell_school_options,
} from './enums'

// SMART_EVENT_* definitions (TrinityCore 3.3.5, SmartScriptMgr.h).
// Event rows use event_param1..4 only. Types missing here are handled by
// the generic fallback in ./index.ts until they get a full definition.

export const SAI_EVENTS: Record<number, SaiTypeDef> = {
  0: {
    id: 0, name: 'SMART_EVENT_UPDATE_IC', title: 'In combat (timer)',
    help: 'Fires on a timer while in combat.',
    params: [
      p(1, 'Initial min', 'ms', { help: 'Minimum delay before first trigger' }),
      p(2, 'Initial max', 'ms', { help: 'Maximum delay before first trigger' }),
      ...repeatPair(3, 4),
    ],
    template: 'In combat, after {p1}-{p2} (repeat {p3}-{p4})',
  },
  1: {
    id: 1, name: 'SMART_EVENT_UPDATE_OOC', title: 'Out of combat (timer)',
    help: 'Fires on a timer while out of combat.',
    params: [
      p(1, 'Initial min', 'ms'),
      p(2, 'Initial max', 'ms'),
      ...repeatPair(3, 4),
    ],
    template: 'Out of combat, after {p1}-{p2} (repeat {p3}-{p4})',
  },
  2: {
    id: 2, name: 'SMART_EVENT_HEALTH_PCT', title: 'Health %',
    help: 'Fires when own health is within the given percent range.',
    params: [
      p(1, 'HP min', 'percent'),
      p(2, 'HP max', 'percent'),
      ...repeatPair(3, 4),
    ],
    template: 'HP between {p1} and {p2}',
  },
  3: {
    id: 3, name: 'SMART_EVENT_MANA_PCT', title: 'Mana %',
    help: 'Fires when own mana is within the given percent range.',
    params: [
      p(1, 'Mana min', 'percent'),
      p(2, 'Mana max', 'percent'),
      ...repeatPair(3, 4),
    ],
    template: 'Mana between {p1} and {p2}',
  },
  4: {
    id: 4, name: 'SMART_EVENT_AGGRO', title: 'On aggro',
    help: 'Fires when entering combat.', params: [],
  },
  5: {
    id: 5, name: 'SMART_EVENT_KILL', title: 'On kill',
    help: 'Fires when this creature kills a unit.',
    params: [
      ...cooldownPair(1, 2),
      p(3, 'Player only', 'bool'),
      p(4, 'Creature entry', 'creatureEntry', { help: 'Only fires for this victim entry (if Player only = no)' }),
    ],
    template: 'On kill',
  },
  6: { id: 6, name: 'SMART_EVENT_DEATH', title: 'On death', params: [] },
  7: { id: 7, name: 'SMART_EVENT_EVADE', title: 'On evade', params: [] },
  8: {
    id: 8, name: 'SMART_EVENT_SPELLHIT', title: 'On spell hit',
    help: 'Fires when hit by a spell.',
    params: [
      p(1, 'Spell ID', 'spellId', { help: '0 = any spell' }),
      p(2, 'School', 'enum', { options: spell_school_options }),
      ...cooldownPair(3, 4),
    ],
    template: 'Hit by spell {p1}',
  },
  9: {
    id: 9, name: 'SMART_EVENT_RANGE', title: 'Victim in range',
    help: 'Fires when the current victim is within the given distance range.',
    params: [
      p(1, 'Min distance', 'number'),
      p(2, 'Max distance', 'number'),
      ...repeatPair(3, 4),
    ],
    template: 'Victim between {p1} and {p2} yards',
  },
  10: {
    id: 10, name: 'SMART_EVENT_OOC_LOS', title: 'Unit in line of sight (OOC)',
    help: 'Fires when a unit enters line of sight while out of combat.',
    params: [
      p(1, 'Hostility', 'enum', { options: hostility_mode_options }),
      p(2, 'Max range', 'number'),
      ...cooldownPair(3, 4),
    ],
    template: '{p1} in LOS (max {p2} yd), out of combat',
  },
  11: {
    id: 11, name: 'SMART_EVENT_RESPAWN', title: 'On respawn',
    params: [
      p(1, 'Condition', 'enum', { options: respawn_condition_options }),
      p(2, 'Map ID', 'mapId'),
      p(3, 'Zone ID', 'zoneId'),
    ],
    template: 'On respawn',
  },
  13: {
    id: 13, name: 'SMART_EVENT_VICTIM_CASTING', title: 'Victim is casting',
    params: [
      ...repeatPair(1, 2),
      p(3, 'Spell ID', 'spellId', { help: '0 = any spell' }),
    ],
    template: 'Victim casting {p3}',
  },
  15: {
    id: 15, name: 'SMART_EVENT_FRIENDLY_IS_CC', title: 'Friendly is crowd-controlled',
    params: [
      p(1, 'Radius', 'number'),
      ...repeatPair(2, 3),
    ],
    template: 'Friendly CC within {p1} yd',
  },
  16: {
    id: 16, name: 'SMART_EVENT_FRIENDLY_MISSING_BUFF', title: 'Friendly missing buff',
    params: [
      p(1, 'Spell ID', 'spellId'),
      p(2, 'Radius', 'number'),
      ...repeatPair(3, 4),
    ],
    template: 'Friendly missing aura {p1} within {p2} yd',
  },
  17: {
    id: 17, name: 'SMART_EVENT_SUMMONED_UNIT', title: 'On summoned unit',
    help: 'Fires when this creature summons a unit.',
    params: [
      p(1, 'Creature entry', 'creatureEntry', { help: '0 = any summon' }),
      ...cooldownPair(2, 3),
    ],
    template: 'Summoned unit {p1}',
  },
  19: {
    id: 19, name: 'SMART_EVENT_ACCEPTED_QUEST', title: 'On quest accepted',
    params: [
      p(1, 'Quest ID', 'questId', { help: '0 = any quest' }),
      ...cooldownPair(2, 3),
    ],
    template: 'Quest {p1} accepted',
  },
  20: {
    id: 20, name: 'SMART_EVENT_REWARD_QUEST', title: 'On quest rewarded',
    params: [
      p(1, 'Quest ID', 'questId', { help: '0 = any quest' }),
      ...cooldownPair(2, 3),
    ],
    template: 'Quest {p1} rewarded',
  },
  21: { id: 21, name: 'SMART_EVENT_REACHED_HOME', title: 'On reached home', params: [] },
  22: {
    id: 22, name: 'SMART_EVENT_RECEIVE_EMOTE', title: 'On received emote',
    params: [
      p(1, 'Text emote ID', 'emoteId'),
      ...cooldownPair(2, 3),
    ],
    template: 'Received emote {p1}',
  },
  23: {
    id: 23, name: 'SMART_EVENT_HAS_AURA', title: 'Has aura',
    params: [
      p(1, 'Spell ID', 'spellId'),
      p(2, 'Stack amount', 'number', { help: '0 = any stack count' }),
      ...repeatPair(3, 4),
    ],
    template: 'Has aura {p1}',
  },
  24: {
    id: 24, name: 'SMART_EVENT_TARGET_BUFFED', title: 'Victim has aura',
    params: [
      p(1, 'Spell ID', 'spellId'),
      p(2, 'Stack amount', 'number'),
      ...repeatPair(3, 4),
    ],
    template: 'Victim has aura {p1}',
  },
  25: {
    id: 25, name: 'SMART_EVENT_RESET', title: 'On reset',
    help: 'Called after combat ends, on respawn and on spawn.', params: [],
  },
  26: {
    id: 26, name: 'SMART_EVENT_IC_LOS', title: 'Unit in line of sight (IC)',
    params: [
      p(1, 'Hostility', 'enum', { options: hostility_mode_options }),
      p(2, 'Max range', 'number'),
      ...cooldownPair(3, 4),
    ],
    template: '{p1} in LOS (max {p2} yd), in combat',
  },
  27: {
    id: 27, name: 'SMART_EVENT_PASSENGER_BOARDED', title: 'Passenger boarded',
    params: [...cooldownPair(1, 2)],
  },
  28: {
    id: 28, name: 'SMART_EVENT_PASSENGER_REMOVED', title: 'Passenger removed',
    params: [...cooldownPair(1, 2)],
  },
  29: {
    id: 29, name: 'SMART_EVENT_CHARMED', title: 'On charmed',
    params: [p(1, 'Moment', 'enum', { options: charmed_moment_options })],
    template: 'Charmed ({p1})',
  },
  31: {
    id: 31, name: 'SMART_EVENT_SPELLHIT_TARGET', title: 'Own spell hits target',
    params: [
      p(1, 'Spell ID', 'spellId', { help: '0 = any spell' }),
      p(2, 'School', 'enum', { options: spell_school_options }),
      ...cooldownPair(3, 4),
    ],
    template: 'Own spell {p1} hits target',
  },
  32: {
    id: 32, name: 'SMART_EVENT_DAMAGED', title: 'On damaged',
    params: [
      p(1, 'Min damage', 'number'),
      p(2, 'Max damage', 'number'),
      ...cooldownPair(3, 4),
    ],
    template: 'Damaged ({p1}-{p2})',
  },
  33: {
    id: 33, name: 'SMART_EVENT_DAMAGED_TARGET', title: 'On damaging target',
    params: [
      p(1, 'Min damage', 'number'),
      p(2, 'Max damage', 'number'),
      ...cooldownPair(3, 4),
    ],
    template: 'Dealt {p1}-{p2} damage',
  },
  34: {
    id: 34, name: 'SMART_EVENT_MOVEMENTINFORM', title: 'On movement inform',
    help: 'Fires when a movement of the given type finishes.',
    params: [
      p(1, 'Movement type', 'enum', { options: movement_type_options, help: '0 = any type' }),
      p(2, 'Point ID', 'pointId'),
    ],
    template: '{p1} movement finished (point {p2})',
  },
  35: {
    id: 35, name: 'SMART_EVENT_SUMMON_DESPAWNED', title: 'On summon despawned',
    params: [
      p(1, 'Creature entry', 'creatureEntry'),
      ...cooldownPair(2, 3),
    ],
    template: 'Summon {p1} despawned',
  },
  36: { id: 36, name: 'SMART_EVENT_CORPSE_REMOVED', title: 'On corpse removed', params: [] },
  37: { id: 37, name: 'SMART_EVENT_AI_INIT', title: 'On AI init', params: [] },
  38: {
    id: 38, name: 'SMART_EVENT_DATA_SET', title: 'On data set',
    help: 'Fires when SetData is called on this creature (by scripts or SAI action 45).',
    params: [
      p(1, 'Data field', 'number'),
      p(2, 'Data value', 'number'),
      ...cooldownPair(3, 4),
    ],
    template: 'Data {p1} set to {p2}',
  },
  40: {
    id: 40, name: 'SMART_EVENT_WAYPOINT_REACHED', title: 'On waypoint reached',
    params: [
      p(1, 'Point ID', 'pointId', { help: '0 = any point' }),
      p(2, 'Path ID', 'pathId', { help: '0 = any path' }),
    ],
    template: 'Waypoint {p1} reached (path {p2})',
  },
  46: {
    id: 46, name: 'SMART_EVENT_AREATRIGGER_ONTRIGGER', title: 'On areatrigger',
    params: [p(1, 'Trigger ID', 'number')],
    template: 'Areatrigger {p1}',
  },
  52: {
    id: 52, name: 'SMART_EVENT_TEXT_OVER', title: 'On text over',
    help: 'Fires when a creature_text of the given group has finished (duration elapsed).',
    params: [
      p(1, 'Group ID', 'textGroupId'),
      p(2, 'Creature entry', 'creatureEntry', { help: '0 = any' }),
    ],
    template: 'Text group {p1} over',
  },
  53: {
    id: 53, name: 'SMART_EVENT_RECEIVE_HEAL', title: 'On received heal',
    params: [
      p(1, 'Min heal', 'number'),
      p(2, 'Max heal', 'number'),
      ...cooldownPair(3, 4),
    ],
    template: 'Healed ({p1}-{p2})',
  },
  54: { id: 54, name: 'SMART_EVENT_JUST_SUMMONED', title: 'On just summoned', params: [] },
  55: {
    id: 55, name: 'SMART_EVENT_WAYPOINT_PAUSED', title: 'On waypoint paused',
    params: [
      p(1, 'Point ID', 'pointId', { help: '0 = any point' }),
      p(2, 'Path ID', 'pathId', { help: '0 = any path' }),
    ],
  },
  56: {
    id: 56, name: 'SMART_EVENT_WAYPOINT_RESUMED', title: 'On waypoint resumed',
    params: [
      p(1, 'Point ID', 'pointId'),
      p(2, 'Path ID', 'pathId'),
    ],
  },
  57: {
    id: 57, name: 'SMART_EVENT_WAYPOINT_STOPPED', title: 'On waypoint stopped',
    params: [
      p(1, 'Point ID', 'pointId'),
      p(2, 'Path ID', 'pathId'),
    ],
  },
  58: {
    id: 58, name: 'SMART_EVENT_WAYPOINT_ENDED', title: 'On waypoint path ended',
    params: [
      p(1, 'Point ID', 'pointId'),
      p(2, 'Path ID', 'pathId'),
    ],
  },
  59: {
    id: 59, name: 'SMART_EVENT_TIMED_EVENT_TRIGGERED', title: 'On timed event',
    help: 'Fires when the timed event created by action 67 triggers.',
    params: [p(1, 'Event ID', 'number')],
    template: 'Timed event {p1}',
  },
  60: {
    id: 60, name: 'SMART_EVENT_UPDATE', title: 'On update (timer)',
    help: 'Fires on a timer regardless of combat state.',
    params: [
      p(1, 'Initial min', 'ms'),
      p(2, 'Initial max', 'ms'),
      ...repeatPair(3, 4),
    ],
    template: 'Every {p3}-{p4} (first after {p1}-{p2})',
  },
  61: {
    id: 61, name: 'SMART_EVENT_LINK', title: 'Linked action',
    help: 'Placeholder event: fires immediately after the row that links to it.',
    params: [],
    template: 'then',
  },
  62: {
    id: 62, name: 'SMART_EVENT_GOSSIP_SELECT', title: 'On gossip option selected',
    params: [
      p(1, 'Menu ID', 'number'),
      p(2, 'Option ID', 'number'),
    ],
    template: 'Gossip option {p2} (menu {p1}) selected',
  },
  63: { id: 63, name: 'SMART_EVENT_JUST_CREATED', title: 'On just created', params: [] },
  64: {
    id: 64, name: 'SMART_EVENT_GOSSIP_HELLO', title: 'On gossip hello',
    help: 'Fires when a player opens gossip / right-clicks the creature.',
    params: [],
  },
  65: { id: 65, name: 'SMART_EVENT_FOLLOW_COMPLETED', title: 'On follow completed', params: [] },
  67: {
    id: 67, name: 'SMART_EVENT_IS_BEHIND_TARGET', title: 'Is behind target',
    params: [...cooldownPair(1, 2)],
  },
  68: {
    id: 68, name: 'SMART_EVENT_GAME_EVENT_START', title: 'On game event start',
    params: [p(1, 'Game event ID', 'number')],
    template: 'Game event {p1} starts',
  },
  69: {
    id: 69, name: 'SMART_EVENT_GAME_EVENT_END', title: 'On game event end',
    params: [p(1, 'Game event ID', 'number')],
    template: 'Game event {p1} ends',
  },
  70: {
    id: 70, name: 'SMART_EVENT_GO_LOOT_STATE_CHANGED', title: 'On GO loot state changed',
    params: [p(1, 'Loot state', 'number')],
  },
  71: {
    id: 71, name: 'SMART_EVENT_GO_EVENT_INFORM', title: 'On GO event inform',
    params: [p(1, 'Event ID', 'number')],
  },
  72: {
    id: 72, name: 'SMART_EVENT_ACTION_DONE', title: 'On action done',
    params: [p(1, 'Event ID', 'number')],
  },
  73: { id: 73, name: 'SMART_EVENT_ON_SPELLCLICK', title: 'On spellclick', params: [] },
  74: {
    id: 74, name: 'SMART_EVENT_FRIENDLY_HEALTH_PCT', title: 'Friendly health %',
    params: [
      p(1, 'HP min', 'percent'),
      p(2, 'HP max', 'percent'),
      ...repeatPair(3, 4),
    ],
    template: 'Friendly HP between {p1} and {p2}',
  },
  75: {
    id: 75, name: 'SMART_EVENT_DISTANCE_CREATURE', title: 'Creature in distance',
    params: [
      p(1, 'Creature GUID', 'guid', { help: '0 = use entry instead' }),
      p(2, 'Creature entry', 'creatureEntry', { help: '0 = use GUID instead' }),
      p(3, 'Distance', 'number'),
      p(4, 'Repeat', 'ms'),
    ],
    template: 'Creature {p2} within {p3} yd',
  },
  76: {
    id: 76, name: 'SMART_EVENT_DISTANCE_GAMEOBJECT', title: 'GameObject in distance',
    params: [
      p(1, 'GO GUID', 'guid', { help: '0 = use entry instead' }),
      p(2, 'GO entry', 'gobEntry', { help: '0 = use GUID instead' }),
      p(3, 'Distance', 'number'),
      p(4, 'Repeat', 'ms'),
    ],
    template: 'GameObject {p2} within {p3} yd',
  },
  77: {
    id: 77, name: 'SMART_EVENT_COUNTER_SET', title: 'On counter set',
    help: 'Fires when the counter (set by action 63) reaches the given value.',
    params: [
      p(1, 'Counter ID', 'number'),
      p(2, 'Value', 'number'),
      ...cooldownPair(3, 4),
    ],
    template: 'Counter {p1} = {p2}',
  },
}
