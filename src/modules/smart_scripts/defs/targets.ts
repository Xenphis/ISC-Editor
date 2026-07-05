import type { SaiTypeDef } from '../types'
import { p } from './paramKinds'
import { power_type_plus_one_options } from './enums'

// SMART_TARGET_* definitions (TrinityCore 3.3.5, SmartScriptMgr.h).
// Target rows use target_param1..3 plus target_x/y/z/o for positions.

const hostileParams = [
  p(1, 'Max distance', 'number', { help: '0 = any distance' }),
  p(2, 'Player only', 'bool'),
  p(3, 'Power type', 'enum', { options: power_type_plus_one_options, help: 'Prefer target with the most of this power (0 = ignore)' }),
]

export const SAI_TARGETS: Record<number, SaiTypeDef> = {
  0: { id: 0, name: 'SMART_TARGET_NONE', title: 'None', params: [] },
  1: { id: 1, name: 'SMART_TARGET_SELF', title: 'Self', params: [] },
  2: { id: 2, name: 'SMART_TARGET_VICTIM', title: 'Current victim', help: 'Highest unit on the threat list.', params: [] },
  3: { id: 3, name: 'SMART_TARGET_HOSTILE_SECOND_AGGRO', title: 'Second on threat list', params: hostileParams },
  4: { id: 4, name: 'SMART_TARGET_HOSTILE_LAST_AGGRO', title: 'Last on threat list', params: hostileParams },
  5: { id: 5, name: 'SMART_TARGET_HOSTILE_RANDOM', title: 'Random on threat list', params: hostileParams },
  6: { id: 6, name: 'SMART_TARGET_HOSTILE_RANDOM_NOT_TOP', title: 'Random (not top threat)', params: hostileParams },
  7: { id: 7, name: 'SMART_TARGET_ACTION_INVOKER', title: 'Action invoker', help: 'The unit that caused the event.', params: [] },
  8: {
    id: 8, name: 'SMART_TARGET_POSITION', title: 'Position',
    help: 'Uses the target_x/y/z/o coordinates.', params: [], usesCoords: true,
  },
  9: {
    id: 9, name: 'SMART_TARGET_CREATURE_RANGE', title: 'Creature in range',
    params: [
      p(1, 'Creature entry', 'creatureEntry', { help: '0 = any creature' }),
      p(2, 'Min distance', 'number'),
      p(3, 'Max distance', 'number'),
    ],
  },
  10: {
    id: 10, name: 'SMART_TARGET_CREATURE_GUID', title: 'Creature by GUID',
    params: [
      p(1, 'Creature GUID', 'guid'),
      p(2, 'Creature entry', 'creatureEntry'),
    ],
  },
  11: {
    id: 11, name: 'SMART_TARGET_CREATURE_DISTANCE', title: 'Creature in distance',
    params: [
      p(1, 'Creature entry', 'creatureEntry', { help: '0 = any creature' }),
      p(2, 'Max distance', 'number'),
    ],
  },
  12: {
    id: 12, name: 'SMART_TARGET_STORED', title: 'Stored targets',
    help: 'Target list saved earlier with action 64 (Store target list).',
    params: [p(1, 'Storage ID', 'number')],
  },
  13: {
    id: 13, name: 'SMART_TARGET_GAMEOBJECT_RANGE', title: 'GameObject in range',
    params: [
      p(1, 'GO entry', 'gobEntry', { help: '0 = any GameObject' }),
      p(2, 'Min distance', 'number'),
      p(3, 'Max distance', 'number'),
    ],
  },
  14: {
    id: 14, name: 'SMART_TARGET_GAMEOBJECT_GUID', title: 'GameObject by GUID',
    params: [
      p(1, 'GO GUID', 'guid'),
      p(2, 'GO entry', 'gobEntry'),
    ],
  },
  15: {
    id: 15, name: 'SMART_TARGET_GAMEOBJECT_DISTANCE', title: 'GameObject in distance',
    params: [
      p(1, 'GO entry', 'gobEntry', { help: '0 = any GameObject' }),
      p(2, 'Max distance', 'number'),
    ],
  },
  16: {
    id: 16, name: 'SMART_TARGET_INVOKER_PARTY', title: "Invoker's party",
    params: [],
  },
  17: {
    id: 17, name: 'SMART_TARGET_PLAYER_RANGE', title: 'Players in range',
    params: [
      p(1, 'Min distance', 'number'),
      p(2, 'Max distance', 'number'),
    ],
  },
  18: {
    id: 18, name: 'SMART_TARGET_PLAYER_DISTANCE', title: 'Players in distance',
    params: [p(1, 'Max distance', 'number')],
  },
  19: {
    id: 19, name: 'SMART_TARGET_CLOSEST_CREATURE', title: 'Closest creature',
    params: [
      p(1, 'Creature entry', 'creatureEntry', { help: '0 = any creature' }),
      p(2, 'Max distance', 'number', { help: '0 = 100 yards' }),
      p(3, 'Dead', 'bool', { help: 'Search dead creatures instead of alive' }),
    ],
  },
  20: {
    id: 20, name: 'SMART_TARGET_CLOSEST_GAMEOBJECT', title: 'Closest GameObject',
    params: [
      p(1, 'GO entry', 'gobEntry', { help: '0 = any GameObject' }),
      p(2, 'Max distance', 'number', { help: '0 = 100 yards' }),
    ],
  },
  21: {
    id: 21, name: 'SMART_TARGET_CLOSEST_PLAYER', title: 'Closest player',
    params: [p(1, 'Max distance', 'number')],
  },
  22: {
    id: 22, name: 'SMART_TARGET_ACTION_INVOKER_VEHICLE', title: "Invoker's vehicle",
    params: [],
  },
  23: {
    id: 23, name: 'SMART_TARGET_OWNER_OR_SUMMONER', title: 'Owner or summoner',
    params: [],
  },
  24: {
    id: 24, name: 'SMART_TARGET_THREAT_LIST', title: 'Entire threat list',
    params: [p(1, 'Max distance', 'number', { help: '0 = any distance' })],
  },
  25: {
    id: 25, name: 'SMART_TARGET_CLOSEST_ENEMY', title: 'Closest enemy',
    params: [
      p(1, 'Max distance', 'number'),
      p(2, 'Player only', 'bool'),
    ],
  },
  26: {
    id: 26, name: 'SMART_TARGET_CLOSEST_FRIENDLY', title: 'Closest friendly',
    params: [
      p(1, 'Max distance', 'number'),
      p(2, 'Player only', 'bool'),
    ],
  },
  27: {
    id: 27, name: 'SMART_TARGET_LOOT_RECIPIENTS', title: 'Loot recipients',
    help: 'All players tagged for kill credit.', params: [],
  },
  28: {
    id: 28, name: 'SMART_TARGET_FARTHEST', title: 'Farthest target',
    params: [
      p(1, 'Max distance', 'number'),
      p(2, 'Player only', 'bool'),
      p(3, 'In line of sight', 'bool'),
    ],
  },
  29: {
    id: 29, name: 'SMART_TARGET_VEHICLE_PASSENGER', title: 'Vehicle passenger',
    params: [p(1, 'Seat mask', 'number', { help: '0 = all seats' })],
  },
  30: {
    id: 30, name: 'SMART_TARGET_CLOSEST_UNSPAWNED_GAMEOBJECT', title: 'Closest unspawned GO',
    params: [
      p(1, 'GO entry', 'gobEntry', { help: '0 = any GameObject' }),
      p(2, 'Max distance', 'number'),
    ],
  },
}
