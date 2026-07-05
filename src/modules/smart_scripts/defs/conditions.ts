import type { ConditionTypeDef, ParamDef } from '../types'
import { p } from './paramKinds'

// CONDITION_* definitions (TrinityCore 3.3.5, ConditionMgr.h) for the
// conditions attached to SAI events (SourceTypeOrReferenceId = 22).
// Params map to ConditionValue1..3.

const comparisonOptions = [
  { value: 0, name: 'Equal' },
  { value: 1, name: 'Higher' },
  { value: 2, name: 'Lower' },
  { value: 3, name: 'Higher or equal' },
  { value: 4, name: 'Lower or equal' },
]

function comparison(index: ParamDef['index']): ParamDef {
  return p(index, 'Comparison', 'enum', { options: comparisonOptions })
}

export const SAI_CONDITION_TYPES: Record<number, ConditionTypeDef> = {
  1: {
    id: 1, name: 'CONDITION_AURA', title: 'Has aura',
    params: [
      p(1, 'Spell ID', 'spellId'),
      p(2, 'Effect index', 'number'),
    ],
    template: 'has aura {p1}',
  },
  2: {
    id: 2, name: 'CONDITION_ITEM', title: 'Has item',
    params: [
      p(1, 'Item ID', 'itemId'),
      p(2, 'Count', 'number', { default: 1 }),
      p(3, 'In bank too', 'bool'),
    ],
    template: 'has item {p1} x{p2}',
  },
  3: {
    id: 3, name: 'CONDITION_ITEM_EQUIPPED', title: 'Item equipped',
    params: [p(1, 'Item ID', 'itemId')],
    template: 'has item {p1} equipped',
  },
  4: {
    id: 4, name: 'CONDITION_ZONEID', title: 'In zone',
    params: [p(1, 'Zone ID', 'zoneId')],
    template: 'in zone {p1}',
  },
  5: {
    id: 5, name: 'CONDITION_REPUTATION_RANK', title: 'Reputation rank',
    params: [
      p(1, 'Faction ID', 'factionId'),
      p(2, 'Rank mask', 'number', { help: 'Bit N = rank N (1 = Hated ... 128 = Exalted)' }),
    ],
    template: 'reputation with {p1}',
  },
  6: {
    id: 6, name: 'CONDITION_TEAM', title: 'Team',
    params: [p(1, 'Team', 'enum', { options: [
      { value: 469, name: 'Alliance' },
      { value: 67, name: 'Horde' },
    ] })],
    template: 'is {p1}',
  },
  7: {
    id: 7, name: 'CONDITION_SKILL', title: 'Has skill',
    params: [
      p(1, 'Skill ID', 'number'),
      p(2, 'Skill value', 'number'),
    ],
    template: 'skill {p1} ≥ {p2}',
  },
  8: {
    id: 8, name: 'CONDITION_QUESTREWARDED', title: 'Quest rewarded',
    params: [p(1, 'Quest ID', 'questId')],
    template: 'quest {p1} rewarded',
  },
  9: {
    id: 9, name: 'CONDITION_QUESTTAKEN', title: 'Quest taken',
    params: [p(1, 'Quest ID', 'questId')],
    template: 'quest {p1} in progress',
  },
  10: {
    id: 10, name: 'CONDITION_DRUNKENSTATE', title: 'Drunken state',
    params: [p(1, 'State', 'enum', { options: [
      { value: 0, name: 'Sober' },
      { value: 1, name: 'Tipsy' },
      { value: 2, name: 'Drunk' },
      { value: 3, name: 'Smashed' },
    ] })],
    template: 'is {p1}',
  },
  12: {
    id: 12, name: 'CONDITION_ACTIVE_EVENT', title: 'Game event active',
    params: [p(1, 'Event ID', 'number')],
    template: 'game event {p1} active',
  },
  13: {
    id: 13, name: 'CONDITION_INSTANCE_INFO', title: 'Instance info',
    params: [
      p(1, 'Entry', 'number'),
      p(2, 'Data', 'number'),
      p(3, 'Type', 'enum', { options: [
        { value: 0, name: 'Data' },
        { value: 1, name: 'GUID data' },
        { value: 2, name: 'Boss state' },
        { value: 3, name: 'Data64' },
      ] }),
    ],
    template: 'instance data {p1} = {p2}',
  },
  14: {
    id: 14, name: 'CONDITION_QUEST_NONE', title: 'Quest not taken/rewarded',
    params: [p(1, 'Quest ID', 'questId')],
    template: 'quest {p1} not taken',
  },
  15: {
    id: 15, name: 'CONDITION_CLASS', title: 'Class',
    params: [p(1, 'Class mask', 'number', { help: '1 Warrior, 2 Paladin, 4 Hunter, 8 Rogue, 16 Priest, 32 DK, 64 Shaman, 128 Mage, 256 Warlock, 1024 Druid' })],
    template: 'class mask {p1}',
  },
  16: {
    id: 16, name: 'CONDITION_RACE', title: 'Race',
    params: [p(1, 'Race mask', 'number', { help: '1 Human, 2 Orc, 4 Dwarf, 8 Night Elf, 16 Undead, 32 Tauren, 64 Gnome, 128 Troll, 512 Blood Elf, 1024 Draenei' })],
    template: 'race mask {p1}',
  },
  17: {
    id: 17, name: 'CONDITION_ACHIEVEMENT', title: 'Has achievement',
    params: [p(1, 'Achievement ID', 'number')],
    template: 'has achievement {p1}',
  },
  18: {
    id: 18, name: 'CONDITION_TITLE', title: 'Has title',
    params: [p(1, 'Title ID', 'number')],
    template: 'has title {p1}',
  },
  20: {
    id: 20, name: 'CONDITION_GENDER', title: 'Gender',
    params: [p(1, 'Gender', 'enum', { options: [
      { value: 0, name: 'Male' },
      { value: 1, name: 'Female' },
    ] })],
    template: 'is {p1}',
  },
  21: {
    id: 21, name: 'CONDITION_UNIT_STATE', title: 'Unit state',
    params: [p(1, 'State', 'number')],
    template: 'unit state {p1}',
  },
  22: {
    id: 22, name: 'CONDITION_MAPID', title: 'On map',
    params: [p(1, 'Map ID', 'mapId')],
    template: 'on map {p1}',
  },
  23: {
    id: 23, name: 'CONDITION_AREAID', title: 'In area',
    params: [p(1, 'Area ID', 'zoneId')],
    template: 'in area {p1}',
  },
  24: {
    id: 24, name: 'CONDITION_CREATURE_TYPE', title: 'Creature type',
    params: [p(1, 'Type', 'number', { help: '1 Beast, 2 Dragonkin, 3 Demon, 4 Elemental, 6 Undead, 7 Humanoid...' })],
    template: 'creature type {p1}',
  },
  25: {
    id: 25, name: 'CONDITION_SPELL', title: 'Knows spell',
    params: [p(1, 'Spell ID', 'spellId')],
    template: 'knows spell {p1}',
  },
  26: {
    id: 26, name: 'CONDITION_PHASEMASK', title: 'Phase mask',
    params: [p(1, 'Phase mask', 'number')],
    template: 'in phase {p1}',
  },
  27: {
    id: 27, name: 'CONDITION_LEVEL', title: 'Level',
    params: [
      p(1, 'Level', 'number'),
      comparison(2),
    ],
    template: 'level {p2} {p1}',
  },
  28: {
    id: 28, name: 'CONDITION_QUEST_COMPLETE', title: 'Quest complete (not rewarded)',
    params: [p(1, 'Quest ID', 'questId')],
    template: 'quest {p1} complete',
  },
  29: {
    id: 29, name: 'CONDITION_NEAR_CREATURE', title: 'Near creature',
    params: [
      p(1, 'Creature entry', 'creatureEntry'),
      p(2, 'Distance', 'number'),
      p(3, 'Dead', 'bool'),
    ],
    template: 'creature {p1} within {p2} yd',
  },
  30: {
    id: 30, name: 'CONDITION_NEAR_GAMEOBJECT', title: 'Near GameObject',
    params: [
      p(1, 'GO entry', 'gobEntry'),
      p(2, 'Distance', 'number'),
    ],
    template: 'GO {p1} within {p2} yd',
  },
  31: {
    id: 31, name: 'CONDITION_OBJECT_ENTRY_GUID', title: 'Object entry/GUID',
    params: [
      p(1, 'Type ID', 'enum', { options: [
        { value: 3, name: 'Unit' },
        { value: 4, name: 'Player' },
        { value: 5, name: 'GameObject' },
        { value: 7, name: 'Corpse' },
      ] }),
      p(2, 'Entry', 'number', { help: '0 = any entry' }),
      p(3, 'GUID', 'guid', { help: '0 = any GUID' }),
    ],
    template: 'object is {p1} (entry {p2})',
  },
  32: {
    id: 32, name: 'CONDITION_TYPE_MASK', title: 'Object type mask',
    params: [p(1, 'Type mask', 'number', { help: '8 Unit, 16 Player, 32 GameObject, 128 Corpse' })],
    template: 'type mask {p1}',
  },
  33: {
    id: 33, name: 'CONDITION_RELATION_TO', title: 'Relation to target',
    params: [
      p(1, 'Compared target', 'number', { help: 'ConditionTarget index of the other object' }),
      p(2, 'Relation', 'enum', { options: [
        { value: 0, name: 'Self' },
        { value: 1, name: 'In party' },
        { value: 2, name: 'In raid or party' },
        { value: 3, name: 'Owned by' },
        { value: 4, name: 'Passenger of' },
        { value: 5, name: 'Created by' },
      ] }),
    ],
    template: 'relation {p2} to target {p1}',
  },
  34: {
    id: 34, name: 'CONDITION_REACTION_TO', title: 'Reaction to target',
    params: [
      p(1, 'Compared target', 'number'),
      p(2, 'Rank mask', 'number', { help: 'Bit N = reaction rank (2 Hostile, 8 Neutral, 16+ Friendly...)' }),
    ],
    template: 'reaction to target {p1}',
  },
  35: {
    id: 35, name: 'CONDITION_DISTANCE_TO', title: 'Distance to target',
    params: [
      p(1, 'Compared target', 'number'),
      p(2, 'Distance', 'number'),
      comparison(3),
    ],
    template: 'distance to target {p1} {p3} {p2} yd',
  },
  36: {
    id: 36, name: 'CONDITION_ALIVE', title: 'Is alive',
    params: [],
    template: 'is alive',
  },
  37: {
    id: 37, name: 'CONDITION_HP_VAL', title: 'HP value',
    params: [
      p(1, 'HP', 'number'),
      comparison(2),
    ],
    template: 'HP {p2} {p1}',
  },
  38: {
    id: 38, name: 'CONDITION_HP_PCT', title: 'HP percent',
    params: [
      p(1, 'HP %', 'percent'),
      comparison(2),
    ],
    template: 'HP {p2} {p1}',
  },
  40: {
    id: 40, name: 'CONDITION_IN_WATER', title: 'In water',
    params: [],
    template: 'is in water',
  },
  42: {
    id: 42, name: 'CONDITION_STAND_STATE', title: 'Stand state',
    params: [
      p(1, 'State type', 'enum', { options: [
        { value: 0, name: 'Exact state' },
        { value: 1, name: 'Any of category' },
      ] }),
      p(2, 'State', 'number', { help: '0 Stand, 1 Sit, 3 Sleep, 7 Kneel... (with type 1: 0 standing, 1 sitting)' }),
    ],
    template: 'stand state {p2}',
  },
  43: {
    id: 43, name: 'CONDITION_DAILY_QUEST_DONE', title: 'Daily quest done',
    params: [p(1, 'Quest ID', 'questId')],
    template: 'daily quest {p1} done',
  },
  44: {
    id: 44, name: 'CONDITION_CHARMED', title: 'Is charmed',
    params: [],
    template: 'is charmed',
  },
  45: {
    id: 45, name: 'CONDITION_PET_TYPE', title: 'Pet type',
    params: [p(1, 'Type mask', 'number')],
    template: 'pet type {p1}',
  },
  46: {
    id: 46, name: 'CONDITION_TAXI', title: 'On taxi',
    params: [],
    template: 'is on taxi',
  },
  47: {
    id: 47, name: 'CONDITION_QUESTSTATE', title: 'Quest state',
    params: [
      p(1, 'Quest ID', 'questId'),
      p(2, 'State mask', 'number', { help: '1 Not taken, 2 Complete, 8 In progress, 32 Failed, 64 Rewarded' }),
    ],
    template: 'quest {p1} state {p2}',
  },
}

const CONDITION_VALUE_COUNT = 3

export function getConditionDef(type: number): ConditionTypeDef {
  const def = SAI_CONDITION_TYPES[type]
  if (def) return def
  return {
    id: type,
    name: `CONDITION ${type}`,
    title: `Condition ${type}`,
    help: 'No metadata for this condition type yet — values are edited raw.',
    params: Array.from({ length: CONDITION_VALUE_COUNT }, (_, i) => ({
      index: (i + 1) as ParamDef['index'],
      label: `Value ${i + 1}`,
      kind: 'number' as const,
    })),
  }
}

export const conditionTypeOptions = Object.values(SAI_CONDITION_TYPES).map(def => ({
  value: def.id,
  label: `${def.id} — ${def.title}`,
}))
