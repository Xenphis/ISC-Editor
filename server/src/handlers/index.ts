import * as connection from './connection.js'
import * as debugHandlers from './debug.js'
import * as npc from './npc.js'
import * as addon from './addon.js'
import * as creature from './creature.js'
import * as creatureAddon from './creature_addon.js'
import * as creatureMovementOverride from './creature_movement_override.js'
import * as creatureText from './creature_text.js'
import * as creatureTextLocale from './creature_text_locale.js'
import * as creatureClasslevelstats from './creature_classlevelstats.js'
import * as creatureQuestitem from './creature_questitem.js'
import * as creatureOnkillReputation from './creature_onkill_reputation.js'
import * as equip from './equip.js'
import * as spell from './spell.js'
import * as resistance from './resistance.js'
import * as locale from './locale.js'
import * as movement from './movement.js'
import * as gameobjectTemplate from './gameobject_template.js'
import * as gameobjectTemplateAddon from './gameobject_template_addon.js'
import * as gameobjectAddon from './gameobject_addon.js'
import * as gameobjectOverrides from './gameobject_overrides.js'
import * as gameobjectSpawn from './gameobject_spawn.js'
import * as gameobjectLoot from './gameobject_loot.js'
import * as gossipMenu from './gossip_menu.js'
import * as gossipMenuOption from './gossip_menu_option.js'
import * as gossipMenuOptionLocale from './gossip_menu_option_locale.js'
import * as item from './item.js'
import * as npcText from './npc_text.js'
import * as npcTextLocale from './npc_text_locale.js'
import * as accessRequirement from './access_requirement.js'
import * as quest from './quest.js'
import * as questTemplateAddon from './quest_template_addon.js'
import * as questTemplateLocale from './quest_template_locale.js'
import * as trainer from './trainer.js'

type Handler = (params: Record<string, any>) => Promise<any>

export const handlers: Record<string, Handler> = {
  // Connection
  connect_db: connection.connect_db,
  disconnect_db: connection.disconnect_db,

  // Debug
  set_debug_mode: debugHandlers.set_debug_mode,
  get_debug_mode: debugHandlers.get_debug_mode,

  // NPC / creature_template
  get_npcs: npc.get_npcs,
  get_npc: npc.get_npc,
  save_npc: npc.save_npc,
  delete_npc: npc.delete_npc,

  // Addon (creature_template_addon)
  get_npc_addon: addon.get_npc_addon,
  save_npc_addon: addon.save_npc_addon,

  // Equip
  get_npc_equip: equip.get_npc_equip,
  save_npc_equip: equip.save_npc_equip,

  // Spells
  get_npc_spells: spell.get_npc_spells,
  save_npc_spells: spell.save_npc_spells,

  // Resistances
  get_npc_resistances: resistance.get_npc_resistances,
  save_npc_resistances: resistance.save_npc_resistances,

  // Locales (creature_template_locale)
  get_npc_locales: locale.get_npc_locales,
  save_npc_locales: locale.save_npc_locales,

  // Movement (creature_template_movement)
  get_npc_movement: movement.get_npc_movement,
  save_npc_movement: movement.save_npc_movement,

  // Creature spawns
  get_creature_spawns: creature.get_creature_spawns,
  save_creature_spawn: creature.save_creature_spawn,
  delete_creature_spawn: creature.delete_creature_spawn,

  // Creature addon
  get_creature_addon: creatureAddon.get_creature_addon,
  save_creature_addon: creatureAddon.save_creature_addon,

  // Creature movement override
  get_creature_movement_override: creatureMovementOverride.get_creature_movement_override,
  save_creature_movement_override: creatureMovementOverride.save_creature_movement_override,

  // Creature text
  get_creature_texts: creatureText.get_creature_texts,
  save_creature_texts: creatureText.save_creature_texts,

  // Creature text locale
  get_creature_text_locales: creatureTextLocale.get_creature_text_locales,
  save_creature_text_locales: creatureTextLocale.save_creature_text_locales,

  // Creature classlevelstats
  get_creature_classlevelstats: creatureClasslevelstats.get_creature_classlevelstats,
  get_creature_classlevelstat: creatureClasslevelstats.get_creature_classlevelstat,
  save_creature_classlevelstat: creatureClasslevelstats.save_creature_classlevelstat,

  // Creature questitem
  get_creature_questitem: creatureQuestitem.get_creature_questitem,
  save_creature_questitem: creatureQuestitem.save_creature_questitem,

  // Creature onkill reputation
  get_creature_onkill_reputation: creatureOnkillReputation.get_creature_onkill_reputation,
  save_creature_onkill_reputation: creatureOnkillReputation.save_creature_onkill_reputation,

  // Gameobject template
  get_gameobjects: gameobjectTemplate.get_gameobjects,
  get_gameobject: gameobjectTemplate.get_gameobject,
  save_gameobject: gameobjectTemplate.save_gameobject,
  delete_gameobject: gameobjectTemplate.delete_gameobject,

  // Gameobject template addon
  get_gameobject_addon: gameobjectTemplateAddon.get_gameobject_addon,
  save_gameobject_addon: gameobjectTemplateAddon.save_gameobject_addon,

  // Gameobject spawn addon
  get_gameobject_spawn_addon: gameobjectAddon.get_gameobject_spawn_addon,
  save_gameobject_spawn_addon: gameobjectAddon.save_gameobject_spawn_addon,

  // Gameobject overrides
  get_gameobject_overrides: gameobjectOverrides.get_gameobject_overrides,
  save_gameobject_overrides: gameobjectOverrides.save_gameobject_overrides,

  // Gameobject spawns
  get_gameobject_spawns: gameobjectSpawn.get_gameobject_spawns,
  save_gameobject_spawn: gameobjectSpawn.save_gameobject_spawn,
  delete_gameobject_spawn: gameobjectSpawn.delete_gameobject_spawn,

  // Gameobject loot
  get_gameobject_loot: gameobjectLoot.get_gameobject_loot,
  save_gameobject_loot: gameobjectLoot.save_gameobject_loot,

  // Gossip menu
  get_gossip_menu_ids: gossipMenu.get_gossip_menu_ids,
  get_next_custom_gossip_menu_id: gossipMenu.get_next_custom_gossip_menu_id,
  get_gossip_menu: gossipMenu.get_gossip_menu,
  save_gossip_menu: gossipMenu.save_gossip_menu,

  // Gossip menu options
  get_gossip_menu_options: gossipMenuOption.get_gossip_menu_options,
  save_gossip_menu_options: gossipMenuOption.save_gossip_menu_options,

  // Gossip menu option locales
  get_gossip_menu_option_locales: gossipMenuOptionLocale.get_gossip_menu_option_locales,
  save_gossip_menu_option_locales: gossipMenuOptionLocale.save_gossip_menu_option_locales,

  // NPC text
  get_npc_texts: npcText.get_npc_texts,
  save_npc_texts: npcText.save_npc_texts,

  // NPC text locale
  get_npc_text_locales: npcTextLocale.get_npc_text_locales,
  save_npc_text_locales: npcTextLocale.save_npc_text_locales,

  // Items
  get_items: item.get_items,
  get_item: item.get_item,
  save_item: item.save_item,
  delete_item: item.delete_item,

  // Access requirement
  get_access_requirements: accessRequirement.get_access_requirements,
  get_access_requirement: accessRequirement.get_access_requirement,
  save_access_requirement: accessRequirement.save_access_requirement,
  delete_access_requirement: accessRequirement.delete_access_requirement,

  // Quests
  get_quests: quest.get_quests,
  get_quest: quest.get_quest,
  save_quest: quest.save_quest,
  delete_quest: quest.delete_quest,

  // Quest template addon
  get_quest_addon: questTemplateAddon.get_quest_addon,
  save_quest_addon: questTemplateAddon.save_quest_addon,

  // Quest template locale
  get_quest_locales: questTemplateLocale.get_quest_locales,
  save_quest_locales: questTemplateLocale.save_quest_locales,

  // Trainer
  get_trainers: trainer.get_trainers,
  get_trainer: trainer.get_trainer,
  save_trainer: trainer.save_trainer,
  delete_trainer: trainer.delete_trainer,
  get_trainer_spells: trainer.get_trainer_spells,
  save_trainer_spells: trainer.save_trainer_spells,
  get_creature_default_trainers: trainer.get_creature_default_trainers,
  save_creature_default_trainers: trainer.save_creature_default_trainers,
}
