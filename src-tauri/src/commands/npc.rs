#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::State;
use crate::db::DbState;
use crate::debug::DebugState;
use crate::debug_sql;

#[allow(non_snake_case)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CreatureTemplate {
    pub entry: u32,
    pub difficulty_entry_1: u32,
    pub difficulty_entry_2: u32,
    pub difficulty_entry_3: u32,
    #[sqlx(rename = "KillCredit1")]
    pub KillCredit1: u32,
    #[sqlx(rename = "KillCredit2")]
    pub KillCredit2: u32,
    pub modelid1: u32,
    pub modelid2: u32,
    pub modelid3: u32,
    pub modelid4: u32,
    pub name: String,
    pub subname: Option<String>,
    #[sqlx(rename = "IconName")]
    pub IconName: Option<String>,
    pub gossip_menu_id: u32,
    pub minlevel: u8,
    pub maxlevel: u8,
    pub exp: i16,
    pub faction: u16,
    pub npcflag: u32,
    pub speed_walk: f32,
    pub speed_run: f32,
    pub scale: f32,
    #[sqlx(rename = "rank")]
    pub rank: u8,
    pub dmgschool: i8,
    #[sqlx(rename = "BaseAttackTime")]
    pub BaseAttackTime: u32,
    #[sqlx(rename = "RangeAttackTime")]
    pub RangeAttackTime: u32,
    #[sqlx(rename = "BaseVariance")]
    pub BaseVariance: f32,
    #[sqlx(rename = "RangeVariance")]
    pub RangeVariance: f32,
    pub unit_class: u8,
    pub unit_flags: u32,
    pub unit_flags2: u32,
    pub dynamicflags: u32,
    pub family: i8,
    #[sqlx(rename = "type")]
    pub r#type: u8,
    pub type_flags: u32,
    pub lootid: u32,
    pub pickpocketloot: u32,
    pub skinloot: u32,
    #[sqlx(rename = "PetSpellDataId")]
    pub PetSpellDataId: u32,
    #[sqlx(rename = "VehicleId")]
    pub VehicleId: u32,
    pub mingold: u32,
    pub maxgold: u32,
    #[sqlx(rename = "AIName")]
    pub AIName: String,
    #[sqlx(rename = "MovementType")]
    pub MovementType: u8,
    #[sqlx(rename = "HoverHeight")]
    pub HoverHeight: f32,
    #[sqlx(rename = "HealthModifier")]
    pub HealthModifier: f32,
    #[sqlx(rename = "ManaModifier")]
    pub ManaModifier: f32,
    #[sqlx(rename = "ArmorModifier")]
    pub ArmorModifier: f32,
    #[sqlx(rename = "DamageModifier")]
    pub DamageModifier: f32,
    #[sqlx(rename = "ExperienceModifier")]
    pub ExperienceModifier: f32,
    #[sqlx(rename = "RacialLeader")]
    pub RacialLeader: u8,
    pub movementId: u32,
    #[sqlx(rename = "RegenHealth")]
    pub RegenHealth: u8,
    pub mechanic_immune_mask: u32,
    pub spell_school_immune_mask: u32,
    pub flags_extra: u32,
    #[sqlx(rename = "ScriptName")]
    pub ScriptName: String,
    #[sqlx(rename = "StringId")]
    pub StringId: Option<String>,
    #[sqlx(rename = "VerifiedBuild")]
    pub VerifiedBuild: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct NpcListResult {
    pub data: Vec<CreatureTemplate>,
    pub total: i64,
}

#[tauri::command]
pub async fn get_npcs(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    search: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<NpcListResult, String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;

    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let (data, total) = match &search {
        Some(q) if !q.is_empty() => {
            let pattern = format!("%{}%", q);
            const SQL_DATA: &str = "SELECT * FROM creature_template WHERE name LIKE ? OR entry LIKE ? ORDER BY entry LIMIT ? OFFSET ?";
            let rows: Vec<CreatureTemplate> = debug_sql!(app, debug, SQL_DATA,
                sqlx::query_as(SQL_DATA)
                .bind(&pattern)
                .bind(&pattern)
                .bind(limit)
                .bind(offset)
                .fetch_all(pool)
                .await,
                &pattern, &pattern, limit, offset
            ).map_err(|e| format!("Query failed: {}", e))?;

            const SQL_COUNT: &str = "SELECT COUNT(*) FROM creature_template WHERE name LIKE ? OR entry LIKE ?";
            let count: (i64,) = debug_sql!(app, debug, SQL_COUNT,
                sqlx::query_as(SQL_COUNT)
                .bind(&pattern)
                .bind(&pattern)
                .fetch_one(pool)
                .await,
                &pattern, &pattern
            ).map_err(|e| format!("Count query failed: {}", e))?;

            (rows, count.0)
        }
        _ => {
            const SQL_DATA: &str = "SELECT * FROM creature_template ORDER BY entry LIMIT ? OFFSET ?";
            let rows: Vec<CreatureTemplate> = debug_sql!(app, debug, SQL_DATA,
                sqlx::query_as(SQL_DATA)
                .bind(limit)
                .bind(offset)
                .fetch_all(pool)
                .await,
                limit, offset
            ).map_err(|e| format!("Query failed: {}", e))?;

            const SQL_COUNT: &str = "SELECT COUNT(*) FROM creature_template";
            let count: (i64,) = debug_sql!(app, debug, SQL_COUNT,
                sqlx::query_as(SQL_COUNT)
                .fetch_one(pool)
                .await
            ).map_err(|e| format!("Count query failed: {}", e))?;

            (rows, count.0)
        }
    };

    Ok(NpcListResult { data, total })
}

#[tauri::command]
pub async fn get_npc(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    entry: u32,
) -> Result<CreatureTemplate, String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;

    const SQL: &str = "SELECT * FROM creature_template WHERE entry = ?";
    debug_sql!(app, debug, SQL,
        sqlx::query_as::<_, CreatureTemplate>(SQL)
        .bind(entry)
        .fetch_optional(pool)
        .await,
        entry
    ).map_err(|e| format!("Query failed: {}", e))?
    .ok_or_else(|| format!("NPC with entry {} not found", entry))
}

#[tauri::command]
pub async fn save_npc(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    data: CreatureTemplate,
) -> Result<(), String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;

    const SQL: &str = "REPLACE INTO creature_template (
            entry, difficulty_entry_1, difficulty_entry_2, difficulty_entry_3,
            KillCredit1, KillCredit2, modelid1, modelid2, modelid3, modelid4,
            name, subname, IconName, gossip_menu_id, minlevel, maxlevel,
            exp, faction, npcflag, speed_walk, speed_run, scale, `rank`,
            dmgschool, BaseAttackTime, RangeAttackTime, BaseVariance, RangeVariance,
            unit_class, unit_flags, unit_flags2, dynamicflags, family, `type`,
            type_flags, lootid, pickpocketloot, skinloot, PetSpellDataId, VehicleId,
            mingold, maxgold, AIName, MovementType, HoverHeight,
            HealthModifier, ManaModifier, ArmorModifier, DamageModifier,
            ExperienceModifier, RacialLeader, movementId, RegenHealth,
            mechanic_immune_mask, spell_school_immune_mask, flags_extra,
            ScriptName, StringId, VerifiedBuild
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?
        )";
    debug_sql!(app, debug, SQL,
        sqlx::query(SQL)
        .bind(data.entry)
        .bind(data.difficulty_entry_1)
        .bind(data.difficulty_entry_2)
        .bind(data.difficulty_entry_3)
        .bind(data.KillCredit1)
        .bind(data.KillCredit2)
        .bind(data.modelid1)
        .bind(data.modelid2)
        .bind(data.modelid3)
        .bind(data.modelid4)
        .bind(&data.name)
        .bind(&data.subname)
        .bind(&data.IconName)
        .bind(data.gossip_menu_id)
        .bind(data.minlevel)
        .bind(data.maxlevel)
        .bind(data.exp)
        .bind(data.faction)
        .bind(data.npcflag)
        .bind(data.speed_walk)
        .bind(data.speed_run)
        .bind(data.scale)
        .bind(data.rank)
        .bind(data.dmgschool)
        .bind(data.BaseAttackTime)
        .bind(data.RangeAttackTime)
        .bind(data.BaseVariance)
        .bind(data.RangeVariance)
        .bind(data.unit_class)
        .bind(data.unit_flags)
        .bind(data.unit_flags2)
        .bind(data.dynamicflags)
        .bind(data.family)
        .bind(data.r#type)
        .bind(data.type_flags)
        .bind(data.lootid)
        .bind(data.pickpocketloot)
        .bind(data.skinloot)
        .bind(data.PetSpellDataId)
        .bind(data.VehicleId)
        .bind(data.mingold)
        .bind(data.maxgold)
        .bind(&data.AIName)
        .bind(data.MovementType)
        .bind(data.HoverHeight)
        .bind(data.HealthModifier)
        .bind(data.ManaModifier)
        .bind(data.ArmorModifier)
        .bind(data.DamageModifier)
        .bind(data.ExperienceModifier)
        .bind(data.RacialLeader)
        .bind(data.movementId)
        .bind(data.RegenHealth)
        .bind(data.mechanic_immune_mask)
        .bind(data.spell_school_immune_mask)
        .bind(data.flags_extra)
        .bind(&data.ScriptName)
        .bind(&data.StringId)
        .bind(data.VerifiedBuild)
        .execute(pool)
        .await,
        data.entry, data.difficulty_entry_1, data.difficulty_entry_2, data.difficulty_entry_3,
        data.KillCredit1, data.KillCredit2, data.modelid1, data.modelid2, data.modelid3, data.modelid4,
        &data.name, &data.subname, &data.IconName, data.gossip_menu_id, data.minlevel, data.maxlevel,
        data.exp, data.faction, data.npcflag, data.speed_walk, data.speed_run, data.scale, data.rank,
        data.dmgschool, data.BaseAttackTime, data.RangeAttackTime, data.BaseVariance, data.RangeVariance,
        data.unit_class, data.unit_flags, data.unit_flags2, data.dynamicflags, data.family, data.r#type,
        data.type_flags, data.lootid, data.pickpocketloot, data.skinloot, data.PetSpellDataId, data.VehicleId,
        data.mingold, data.maxgold, &data.AIName, data.MovementType, data.HoverHeight,
        data.HealthModifier, data.ManaModifier, data.ArmorModifier, data.DamageModifier,
        data.ExperienceModifier, data.RacialLeader, data.movementId, data.RegenHealth,
        data.mechanic_immune_mask, data.spell_school_immune_mask, data.flags_extra,
        &data.ScriptName, &data.StringId, data.VerifiedBuild
    ).map_err(|e| format!("Save failed: {}", e))?;

    log::info!("Saved NPC entry {}", data.entry);
    Ok(())
}

#[tauri::command]
pub async fn delete_npc(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    entry: u32,
) -> Result<(), String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;

    const SQL: &str = "DELETE FROM creature_template WHERE entry = ?";
    let result = debug_sql!(app, debug, SQL,
        sqlx::query(SQL)
        .bind(entry)
        .execute(pool)
        .await,
        entry
    ).map_err(|e| format!("Delete failed: {}", e))?;

    if result.rows_affected() == 0 {
        return Err(format!("NPC with entry {} not found", entry));
    }

    log::info!("Deleted NPC entry {}", entry);
    Ok(())
}
