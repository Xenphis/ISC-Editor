mod db;
mod debug;
mod commands;

use db::DbState;
use debug::{DebugState, set_debug_mode, get_debug_mode};
use commands::addon::{get_npc_addon, save_npc_addon};
use commands::connection::{connect_db, disconnect_db};
use commands::creature::{get_creature_spawns, save_creature_spawn, delete_creature_spawn};
use commands::creature_addon::{get_creature_addon, save_creature_addon};
use commands::creature_movement_override::{get_creature_movement_override, save_creature_movement_override};
use commands::creature_text::{get_creature_texts, save_creature_texts};
use commands::creature_text_locale::{get_creature_text_locales, save_creature_text_locales};
use commands::gameobject_template::{get_gameobjects, get_gameobject, save_gameobject, delete_gameobject};
use commands::gameobject_template_addon::{get_gameobject_addon, save_gameobject_addon};
use commands::gameobject_addon::{get_gameobject_spawn_addon, save_gameobject_spawn_addon};
use commands::gameobject_overrides::{get_gameobject_overrides, save_gameobject_overrides};
use commands::gameobject_spawn::{get_gameobject_spawns, save_gameobject_spawn, delete_gameobject_spawn};
use commands::gameobject_loot::{get_gameobject_loot, save_gameobject_loot};
use commands::equip::{get_npc_equip, save_npc_equip};
use commands::item::{get_items, get_item, save_item, delete_item};
use commands::spell::{get_npc_spells, save_npc_spells};
use commands::npc::{get_npcs, get_npc, save_npc, delete_npc};
use commands::locale::{get_npc_locales, save_npc_locales};
use commands::movement::{get_npc_movement, save_npc_movement};
use commands::resistance::{get_npc_resistances, save_npc_resistances};
use commands::access_requirement::{get_access_requirements, get_access_requirement, save_access_requirement, delete_access_requirement};
use commands::creature_classlevelstats::{get_creature_classlevelstats, get_creature_classlevelstat, save_creature_classlevelstat};
use commands::quest::{get_quests, get_quest, save_quest, delete_quest};
use commands::quest_template_addon::{get_quest_addon, save_quest_addon};
use commands::quest_template_locale::{get_quest_locales, save_quest_locales};
use commands::creature_questitem::{get_creature_questitem, save_creature_questitem};
use commands::trainer::{get_trainers, get_trainer, save_trainer, delete_trainer, get_trainer_spells, save_trainer_spells, get_creature_default_trainers, save_creature_default_trainers};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(DbState::new())
    .manage(DebugState::new())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
        app.handle().plugin(tauri_plugin_mcp_bridge::init())?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      connect_db,
      disconnect_db,
      get_npcs,
      get_npc,
      save_npc,
      delete_npc,
      get_npc_resistances,
      save_npc_resistances,
      get_npc_movement,
      save_npc_movement,
      get_npc_locales,
      save_npc_locales,
      get_npc_addon,
      save_npc_addon,
      get_creature_spawns,
      save_creature_spawn,
      delete_creature_spawn,
      get_npc_equip,
      save_npc_equip,
      get_npc_spells,
      save_npc_spells,
      get_creature_texts,
      save_creature_texts,
      get_creature_text_locales,
      save_creature_text_locales,
      get_creature_addon,
      save_creature_addon,
      get_creature_movement_override,
      save_creature_movement_override,
      get_gameobjects,
      get_gameobject,
      save_gameobject,
      delete_gameobject,
      get_gameobject_addon,
      save_gameobject_addon,
      get_gameobject_spawn_addon,
      save_gameobject_spawn_addon,
      get_gameobject_overrides,
      save_gameobject_overrides,
      get_gameobject_spawns,
      save_gameobject_spawn,
      delete_gameobject_spawn,
      get_gameobject_loot,
      save_gameobject_loot,
      get_items,
      get_item,
      save_item,
      delete_item,
      set_debug_mode,
      get_debug_mode,
      get_access_requirements,
      get_access_requirement,
      save_access_requirement,
      delete_access_requirement,
      get_quests,
      get_quest,
      save_quest,
      delete_quest,
      get_quest_addon,
      save_quest_addon,
      get_quest_locales,
      save_quest_locales,
      get_creature_classlevelstats,
      get_creature_classlevelstat,
      save_creature_classlevelstat,
      get_trainers,
      get_trainer,
      save_trainer,
      delete_trainer,
      get_trainer_spells,
      save_trainer_spells,
      get_creature_default_trainers,
      save_creature_default_trainers,
      get_creature_questitem,
      save_creature_questitem,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
