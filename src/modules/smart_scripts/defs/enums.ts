import type { BitmaskOption, SelectOption } from '@/types/common'

// Shared option lists for SAI params, event_flags and event_phase_mask.
// Names follow SmartScriptMgr.h (TrinityCore 3.3.5) and stay in English.

export const event_flags_options: BitmaskOption[] = [
  { value: 0x001, hex: '0x001', name: 'Not repeatable', comment: 'Event can only trigger once' },
  { value: 0x002, hex: '0x002', name: 'Normal dungeon', comment: 'Only in 5-man normal (difficulty 0)' },
  { value: 0x004, hex: '0x004', name: 'Heroic dungeon', comment: 'Only in 5-man heroic (difficulty 1)' },
  { value: 0x008, hex: '0x008', name: 'Normal raid', comment: 'Only in 10-man normal (difficulty 2)' },
  { value: 0x010, hex: '0x010', name: 'Heroic raid', comment: 'Only in 25-man heroic (difficulty 3)' },
  { value: 0x080, hex: '0x080', name: 'Debug only', comment: 'Only triggers in debug build' },
  { value: 0x100, hex: '0x100', name: "Don't reset", comment: 'Event will not reset in SmartScript::OnReset()' },
  { value: 0x200, hex: '0x200', name: 'While charmed', comment: 'Event occurs even if AI owner is charmed' },
]

export const event_phase_options: BitmaskOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: 1 << i,
  hex: `0x${(1 << i).toString(16).toUpperCase().padStart(3, '0')}`,
  name: `Phase ${i + 1}`,
}))

export const react_state_options: SelectOption[] = [
  { value: 0, name: 'Passive' },
  { value: 1, name: 'Defensive' },
  { value: 2, name: 'Aggressive' },
]

export const summon_type_options: SelectOption[] = [
  { value: 1, name: 'Timed or dead despawn', comment: 'Despawns after duration or when creature dies' },
  { value: 2, name: 'Timed or corpse despawn', comment: 'Despawns after duration or when corpse disappears' },
  { value: 3, name: 'Timed despawn', comment: 'Despawns after duration' },
  { value: 4, name: 'Timed despawn out of combat', comment: 'Despawns after duration once out of combat' },
  { value: 5, name: 'Corpse despawn', comment: 'Despawns instantly on death' },
  { value: 6, name: 'Corpse timed despawn', comment: 'Despawns after duration once dead' },
  { value: 7, name: 'Dead despawn', comment: 'Despawns when creature disappears' },
  { value: 8, name: 'Manual despawn', comment: 'Despawns only on UnSummon()' },
]

export const cast_flags_options: BitmaskOption[] = [
  { value: 0x01, hex: '0x01', name: 'Interrupt previous', comment: 'Interrupt any spell currently being cast' },
  { value: 0x02, hex: '0x02', name: 'Triggered', comment: 'Instant cast, no mana/reagent cost' },
  { value: 0x20, hex: '0x20', name: 'Aura not present', comment: 'Only cast if target has no aura from the spell' },
  { value: 0x40, hex: '0x40', name: 'Combat move', comment: 'Prevent combat movement while casting, resume when out of mana/range' },
]

export const sheath_state_options: SelectOption[] = [
  { value: 0, name: 'Unarmed' },
  { value: 1, name: 'Melee' },
  { value: 2, name: 'Ranged' },
]

export const go_state_options: SelectOption[] = [
  { value: 0, name: 'Active (open)' },
  { value: 1, name: 'Ready (closed)' },
  { value: 2, name: 'Active alternative' },
]

export const power_type_options: SelectOption[] = [
  { value: 0, name: 'Mana' },
  { value: 1, name: 'Rage' },
  { value: 2, name: 'Focus' },
  { value: 3, name: 'Energy' },
  { value: 4, name: 'Happiness' },
  { value: 5, name: 'Rune' },
  { value: 6, name: 'Runic Power' },
]

/** For hostile target types: 0 = ignore power, N = powerType + 1 */
export const power_type_plus_one_options: SelectOption[] = [
  { value: 0, name: 'Ignore power' },
  ...power_type_options.map(o => ({ value: (o.value as number) + 1, name: `Max ${o.name}` })),
]

export const movement_type_options: SelectOption[] = [
  { value: 0, name: 'Idle' },
  { value: 1, name: 'Random' },
  { value: 2, name: 'Waypoint' },
  { value: 4, name: 'Confused' },
  { value: 5, name: 'Chase' },
  { value: 6, name: 'Home' },
  { value: 7, name: 'Flight' },
  { value: 8, name: 'Point' },
  { value: 9, name: 'Fleeing' },
  { value: 10, name: 'Distract' },
  { value: 11, name: 'Assistance' },
  { value: 13, name: 'Timed fleeing' },
  { value: 14, name: 'Follow' },
  { value: 15, name: 'Rotate' },
  { value: 16, name: 'Effect' },
]

export const hostility_mode_options: SelectOption[] = [
  { value: 0, name: 'Hostile targets' },
  { value: 1, name: 'Non-hostile targets' },
  { value: 2, name: 'Any target' },
]

export const respawn_condition_options: SelectOption[] = [
  { value: 0, name: 'None' },
  { value: 1, name: 'On map' },
  { value: 2, name: 'In zone' },
]

export const timer_update_type_options: SelectOption[] = [
  { value: 0, name: 'Out of combat' },
  { value: 1, name: 'In combat' },
  { value: 2, name: 'Always (irrespective of combat)' },
]

export const set_inst_data_type_options: SelectOption[] = [
  { value: 0, name: 'SetData' },
  { value: 1, name: 'SetBossState' },
]

export const charmed_moment_options: SelectOption[] = [
  { value: 0, name: 'On apply' },
  { value: 1, name: 'On remove' },
]

export const evade_destination_options: SelectOption[] = [
  { value: 0, name: 'Respawn position' },
  { value: 1, name: 'Last home position' },
]

export const spell_school_options: SelectOption[] = [
  { value: 0, name: 'Any school' },
  { value: 1, name: 'Physical' },
  { value: 2, name: 'Holy' },
  { value: 4, name: 'Fire' },
  { value: 8, name: 'Nature' },
  { value: 16, name: 'Frost' },
  { value: 32, name: 'Shadow' },
  { value: 64, name: 'Arcane' },
]
