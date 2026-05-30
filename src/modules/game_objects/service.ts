import { invoke } from '@/utils/invoke'
import type { GameObjectTemplate } from '@/modules/game_objects/types/gameobject_template/gameobject_template'
import type { GameObjectTemplateAddon } from '@/modules/game_objects/types/gameobject_template/gameobject_template_addon'
import type { GameObject } from '@/modules/game_objects/types/gameobject/gameobject'
import type { GameObjectAddon } from '@/modules/game_objects/types/gameobject/gameobject_addon'
import type { GameObjectOverrides } from '@/modules/game_objects/types/gameobject/gameobject_overrides'
import type { GameObjectLootTemplate } from '@/modules/game_objects/types/gameobject_template/gameobject_loot_template'

export interface GameObjectListResult {
  data: GameObjectTemplate[]
  total: number
}

export async function getGameObjects(
  search?: string,
  limit?: number,
  offset?: number
): Promise<GameObjectListResult> {
  return invoke('get_gameobjects', { search, limit, offset })
}

export async function getGameObject(entry: number): Promise<GameObjectTemplate> {
  return invoke('get_gameobject', { entry })
}

export async function saveGameObject(data: GameObjectTemplate): Promise<void> {
  return invoke('save_gameobject', { data })
}

export async function deleteGameObject(entry: number): Promise<void> {
  return invoke('delete_gameobject', { entry })
}

export async function getGameObjectAddon(entry: number): Promise<GameObjectTemplateAddon | null> {
  return invoke('get_gameobject_addon', { entry })
}

export async function saveGameObjectAddon(entry: number, addon: GameObjectTemplateAddon): Promise<void> {
  return invoke('save_gameobject_addon', { entry, addon })
}

export async function getGameObjectSpawnAddon(guid: number): Promise<GameObjectAddon | null> {
  return invoke('get_gameobject_spawn_addon', { guid })
}

export async function saveGameObjectSpawnAddon(guid: number, addon: GameObjectAddon): Promise<void> {
  return invoke('save_gameobject_spawn_addon', { guid, addon })
}

export async function getGameObjectOverrides(spawnId: number): Promise<GameObjectOverrides | null> {
  return invoke('get_gameobject_overrides', { spawnId })
}

export async function saveGameObjectOverrides(spawnId: number, overrides: GameObjectOverrides): Promise<void> {
  return invoke('save_gameobject_overrides', { spawnId, overrides })
}

export async function getGameObjectSpawns(id: number): Promise<GameObject[]> {
  return invoke('get_gameobject_spawns', { id })
}

export async function saveGameObjectSpawn(spawn: GameObject): Promise<void> {
  return invoke('save_gameobject_spawn', { spawn })
}

export async function deleteGameObjectSpawn(guid: number): Promise<void> {
  return invoke('delete_gameobject_spawn', { guid })
}

export async function getGameObjectLoot(entry: number): Promise<GameObjectLootTemplate[]> {
  return invoke('get_gameobject_loot', { entry })
}

export async function saveGameObjectLoot(entry: number, loot: GameObjectLootTemplate[]): Promise<void> {
  return invoke('save_gameobject_loot', { entry, loot })
}
