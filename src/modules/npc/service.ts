import { invoke } from '@tauri-apps/api/core'
import type { CreatureTemplate } from '@/modules/npc/types/creature_template/creature_template'
import type { CreatureTemplateAddon } from '@/modules/npc/types/creature_template/creature_template_addon'
import type { Creature } from '@/modules/npc/types/creature/creature'
import type { CreatureEquipTemplate } from '@/modules/npc/types/creature_template/creature_equip_template'
import type { CreatureTemplateSpell } from '@/modules/npc/types/creature_template/creature_template_spell'
import type { CreatureTemplateLocale } from '@/modules/npc/types/creature_template/creature_template_locale'
import type { CreatureTemplateMovement } from '@/modules/npc/types/creature_template/creature_template_movement'
import type { CreatureTemplateResistance } from '@/modules/npc/types/creature_template/creature_template_resistance'
import type { CreatureAddon } from '@/modules/npc/types/creature/creature_addon'
import type { CreatureMovementOverride } from '@/modules/npc/types/creature/creature_movement_override'
import type { CreatureText } from '@/modules/npc/types/creature_template/creature_text'
import type { CreatureTextLocale } from '@/modules/npc/types/creature_template/creature_text_locale'
import type { CreatureClassLevelStats } from '@/modules/npc/types/creature_classlevelstats'
import type { Trainer } from '@/modules/npc/types/trainer/trainer'
import type { TrainerSpell } from '@/modules/npc/types/trainer/trainer_spell'
import type { CreatureDefaultTrainer } from '@/modules/npc/types/trainer/creature_default_trainer'

export interface NpcListResult {
  data: CreatureTemplate[]
  total: number
}

export async function getNpcs(
  search?: string,
  limit?: number,
  offset?: number
): Promise<NpcListResult> {
  return invoke('get_npcs', { search, limit, offset })
}

export async function getNpc(entry: number): Promise<CreatureTemplate> {
  return invoke('get_npc', { entry })
}

export async function saveNpc(data: CreatureTemplate): Promise<void> {
  return invoke('save_npc', { data })
}

export async function deleteNpc(entry: number): Promise<void> {
  return invoke('delete_npc', { entry })
}

export async function getNpcResistances(entry: number): Promise<CreatureTemplateResistance[]> {
  return invoke('get_npc_resistances', { entry })
}

export async function saveNpcResistances(entry: number, resistances: CreatureTemplateResistance[]): Promise<void> {
  return invoke('save_npc_resistances', { entry, resistances })
}

export async function getNpcMovement(entry: number): Promise<CreatureTemplateMovement | null> {
  return invoke('get_npc_movement', { entry })
}

export async function saveNpcMovement(entry: number, movement: CreatureTemplateMovement): Promise<void> {
  return invoke('save_npc_movement', { entry, movement })
}

export async function getNpcLocales(entry: number): Promise<CreatureTemplateLocale[]> {
  return invoke('get_npc_locales', { entry })
}

export async function saveNpcLocales(entry: number, locales: CreatureTemplateLocale[]): Promise<void> {
  return invoke('save_npc_locales', { entry, locales })
}

export async function getNpcAddon(entry: number): Promise<CreatureTemplateAddon | null> {
  return invoke('get_npc_addon', { entry })
}

export async function saveNpcAddon(entry: number, addon: CreatureTemplateAddon): Promise<void> {
  return invoke('save_npc_addon', { entry, addon })
}

export async function getCreatureSpawns(id: number): Promise<Creature[]> {
  return invoke('get_creature_spawns', { id })
}

export async function saveCreatureSpawn(creature: Creature): Promise<void> {
  return invoke('save_creature_spawn', { creature })
}

export async function deleteCreatureSpawn(guid: number): Promise<void> {
  return invoke('delete_creature_spawn', { guid })
}

export async function getNpcEquip(entry: number): Promise<CreatureEquipTemplate[]> {
  return invoke('get_npc_equip', { entry })
}

export async function saveNpcEquip(entry: number, equips: CreatureEquipTemplate[]): Promise<void> {
  return invoke('save_npc_equip', { entry, equips })
}

export async function getNpcSpells(entry: number): Promise<CreatureTemplateSpell[]> {
  return invoke('get_npc_spells', { entry })
}

export async function saveNpcSpells(entry: number, spells: CreatureTemplateSpell[]): Promise<void> {
  return invoke('save_npc_spells', { entry, spells })
}

export async function getCreatureTexts(entry: number): Promise<CreatureText[]> {
  return invoke('get_creature_texts', { entry })
}

export async function saveCreatureTexts(entry: number, texts: CreatureText[]): Promise<void> {
  return invoke('save_creature_texts', { entry, texts })
}

export async function getCreatureTextLocales(entry: number): Promise<CreatureTextLocale[]> {
  return invoke('get_creature_text_locales', { entry })
}

export async function saveCreatureTextLocales(entry: number, locales: CreatureTextLocale[]): Promise<void> {
  return invoke('save_creature_text_locales', { entry, locales })
}

export async function getCreatureAddon(guid: number): Promise<CreatureAddon | null> {
  return invoke('get_creature_addon', { guid })
}

export async function saveCreatureAddon(guid: number, addon: CreatureAddon): Promise<void> {
  return invoke('save_creature_addon', { guid, addon })
}


export async function getCreatureMovementOverride(spawnId: number): Promise<CreatureMovementOverride | null> {
  return invoke('get_creature_movement_override', { spawnId })
}

export async function saveCreatureMovementOverride(spawnId: number, movement: CreatureMovementOverride): Promise<void> {
  return invoke('save_creature_movement_override', { spawnId, movement })
}

// ─── creature_classlevelstats ─────────────────────────────────────────────────

export async function getCreatureClassLevelStats(): Promise<CreatureClassLevelStats[]> {
  return invoke('get_creature_classlevelstats')
}

export async function getCreatureClassLevelStat(level: number, classId: number): Promise<CreatureClassLevelStats> {
  return invoke('get_creature_classlevelstat', { level, classId })
}

export async function saveCreatureClassLevelStat(data: CreatureClassLevelStats): Promise<void> {
  return invoke('save_creature_classlevelstat', { data })
}

// ─── trainer ─────────────────────────────────────────────────────────────────

export async function getTrainers(): Promise<Trainer[]> {
  return invoke('get_trainers')
}

export async function getTrainer(id: number): Promise<Trainer> {
  return invoke('get_trainer', { id })
}

export async function saveTrainer(data: Trainer): Promise<void> {
  return invoke('save_trainer', { data })
}

export async function deleteTrainer(id: number): Promise<void> {
  return invoke('delete_trainer', { id })
}

export async function getTrainerSpells(trainerId: number): Promise<TrainerSpell[]> {
  return invoke('get_trainer_spells', { trainerId })
}

export async function saveTrainerSpells(trainerId: number, spells: TrainerSpell[]): Promise<void> {
  return invoke('save_trainer_spells', { trainerId, spells })
}

export async function getCreatureDefaultTrainers(trainerId: number): Promise<CreatureDefaultTrainer[]> {
  return invoke('get_creature_default_trainers', { trainerId })
}

export async function saveCreatureDefaultTrainers(trainerId: number, entries: CreatureDefaultTrainer[]): Promise<void> {
  return invoke('save_creature_default_trainers', { trainerId, entries })
}
