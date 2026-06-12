import { invoke } from '@tauri-apps/api/core'
import type { AccessRequirement } from './types/access_requirement'
import type { ExplorationBasexp } from './types/exploration_basexp'
import type { GameTele } from './types/game_tele'
import type { InstanceTemplate } from './types/instance_template'
import type { InstanceEncounter } from './types/instance_encounters'
import type { InstanceSpawnGroup } from './types/instance_spawn_groups'

export interface AccessRequirementListResult {
  data: AccessRequirement[]
  total: number
}

export async function getAccessRequirements(
  search?: string,
  limit?: number,
  offset?: number,
): Promise<AccessRequirementListResult> {
  return invoke('get_access_requirements', { search, limit, offset })
}

export async function getAccessRequirement(mapId: number, difficulty: number): Promise<AccessRequirement> {
  return invoke('get_access_requirement', { mapId, difficulty })
}

export async function saveAccessRequirement(data: AccessRequirement): Promise<void> {
  return invoke('save_access_requirement', { data })
}

export async function deleteAccessRequirement(mapId: number, difficulty: number): Promise<void> {
  return invoke('delete_access_requirement', { mapId, difficulty })
}

// ─── exploration_basexp ──────────────────────────────────────────────

export interface ExplorationBasexpListResult {
  data: ExplorationBasexp[]
  total: number
}

export async function getExplorationBasexps(
  search?: string,
  limit?: number,
  offset?: number,
): Promise<ExplorationBasexpListResult> {
  return invoke('get_exploration_basexps', { search, limit, offset })
}

export async function getExplorationBasexp(level: number): Promise<ExplorationBasexp> {
  return invoke('get_exploration_basexp', { level })
}

export async function saveExplorationBasexp(data: ExplorationBasexp): Promise<void> {
  return invoke('save_exploration_basexp', { data })
}

export async function deleteExplorationBasexp(level: number): Promise<void> {
  return invoke('delete_exploration_basexp', { level })
}

// ─── game_tele ───────────────────────────────────────────────────────

export interface GameTeleListResult {
  data: GameTele[]
  total: number
}

export async function getGameTeles(
  search?: string,
  limit?: number,
  offset?: number,
): Promise<GameTeleListResult> {
  return invoke('get_game_teles', { search, limit, offset })
}

export async function getGameTele(id: number): Promise<GameTele> {
  return invoke('get_game_tele', { id })
}

export async function saveGameTele(data: GameTele): Promise<void> {
  return invoke('save_game_tele', { data })
}

export async function deleteGameTele(id: number): Promise<void> {
  return invoke('delete_game_tele', { id })
}

// ─── instance_template ───────────────────────────────────────────────

export interface InstanceTemplateListResult {
  data: InstanceTemplate[]
  total: number
}

export async function getInstanceTemplates(
  search?: string,
  limit?: number,
  offset?: number,
): Promise<InstanceTemplateListResult> {
  return invoke('get_instance_templates', { search, limit, offset })
}

export async function getInstanceTemplate(map: number): Promise<InstanceTemplate> {
  return invoke('get_instance_template', { map })
}

export async function saveInstanceTemplate(data: InstanceTemplate): Promise<void> {
  return invoke('save_instance_template', { data })
}

export async function deleteInstanceTemplate(map: number): Promise<void> {
  return invoke('delete_instance_template', { map })
}

// ─── instance_encounters ─────────────────────────────────────────────

export interface InstanceEncounterListResult {
  data: InstanceEncounter[]
  total: number
}

export async function getInstanceEncounters(
  search?: string,
  limit?: number,
  offset?: number,
): Promise<InstanceEncounterListResult> {
  return invoke('get_instance_encounters', { search, limit, offset })
}

export async function getInstanceEncountersByMap(map: number): Promise<InstanceEncounter[]> {
  return invoke('get_instance_encounters_by_map', { map })
}

export async function getInstanceEncounter(entry: number): Promise<InstanceEncounter> {
  return invoke('get_instance_encounter', { entry })
}

export async function saveInstanceEncounter(data: InstanceEncounter): Promise<void> {
  return invoke('save_instance_encounter', { data })
}

export async function deleteInstanceEncounter(entry: number): Promise<void> {
  return invoke('delete_instance_encounter', { entry })
}

// ─── instance_spawn_groups ───────────────────────────────────────────

export interface InstanceSpawnGroupListResult {
  data: InstanceSpawnGroup[]
  total: number
}

export async function getInstanceSpawnGroups(
  search?: string,
  limit?: number,
  offset?: number,
): Promise<InstanceSpawnGroupListResult> {
  return invoke('get_instance_spawn_groups', { search, limit, offset })
}

export async function getInstanceSpawnGroupsByMap(map: number): Promise<InstanceSpawnGroup[]> {
  return invoke('get_instance_spawn_groups_by_map', { map })
}

export async function getInstanceSpawnGroup(
  instanceMapId: number,
  bossStateId: number,
  bossStates: number,
  spawnGroupId: number,
): Promise<InstanceSpawnGroup> {
  return invoke('get_instance_spawn_group', { instanceMapId, bossStateId, bossStates, spawnGroupId })
}

export async function saveInstanceSpawnGroup(data: InstanceSpawnGroup): Promise<void> {
  return invoke('save_instance_spawn_group', { data })
}

export async function deleteInstanceSpawnGroup(
  instanceMapId: number,
  bossStateId: number,
  bossStates: number,
  spawnGroupId: number,
): Promise<void> {
  return invoke('delete_instance_spawn_group', { instanceMapId, bossStateId, bossStates, spawnGroupId })
}
