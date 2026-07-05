#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::State;
use crate::db::DbState;
use crate::debug::DebugState;
use crate::debug_sql;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Creature {
    pub guid: u32,
    pub id: u32,
    pub map: u16,
    pub zoneId: u16,
    pub areaId: u16,
    pub spawnMask: u8,
    pub phaseMask: u32,
    pub modelid: u32,
    pub equipment_id: i8,
    pub position_x: f32,
    pub position_y: f32,
    pub position_z: f32,
    pub orientation: f32,
    pub spawntimesecs: u32,
    pub wander_distance: f32,
    pub currentwaypoint: u32,
    pub curhealth: u32,
    pub curmana: u32,
    #[sqlx(rename = "MovementType")]
    pub MovementType: u8,
    pub npcflag: u32,
    pub unit_flags: u32,
    pub dynamicflags: u32,
    #[sqlx(rename = "ScriptName")]
    pub ScriptName: String,
    #[sqlx(rename = "StringId")]
    pub StringId: Option<String>,
    #[sqlx(rename = "VerifiedBuild")]
    pub VerifiedBuild: Option<i32>,
}

#[tauri::command]
pub async fn get_creature_spawns(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    id: u32,
) -> Result<Vec<Creature>, String> {
    let db = state.pool.read().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;

    const SQL: &str = "SELECT * FROM creature WHERE id = ? ORDER BY guid";
    debug_sql!(app, debug, SQL,
        sqlx::query_as::<_, Creature>(SQL)
        .bind(id)
        .fetch_all(pool)
        .await,
        id
    ).map_err(|e| format!("Query failed: {}", e))
}

#[tauri::command]
pub async fn save_creature_spawn(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    creature: Creature,
) -> Result<(), String> {
    let db = state.pool.read().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;

    const SQL: &str = "INSERT INTO creature (guid, id, map, zoneId, areaId, spawnMask, phaseMask, modelid, equipment_id, position_x, position_y, position_z, orientation, spawntimesecs, wander_distance, currentwaypoint, curhealth, curmana, MovementType, npcflag, unit_flags, dynamicflags, ScriptName, StringId, VerifiedBuild) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE guid = VALUES(guid), id = VALUES(id), map = VALUES(map), zoneId = VALUES(zoneId), areaId = VALUES(areaId), spawnMask = VALUES(spawnMask), phaseMask = VALUES(phaseMask), modelid = VALUES(modelid), equipment_id = VALUES(equipment_id), position_x = VALUES(position_x), position_y = VALUES(position_y), position_z = VALUES(position_z), orientation = VALUES(orientation), spawntimesecs = VALUES(spawntimesecs), wander_distance = VALUES(wander_distance), currentwaypoint = VALUES(currentwaypoint), curhealth = VALUES(curhealth), curmana = VALUES(curmana), MovementType = VALUES(MovementType), npcflag = VALUES(npcflag), unit_flags = VALUES(unit_flags), dynamicflags = VALUES(dynamicflags), ScriptName = VALUES(ScriptName), StringId = VALUES(StringId), VerifiedBuild = VALUES(VerifiedBuild)";
    debug_sql!(app, debug, SQL,
        sqlx::query(SQL)
        .bind(creature.guid)
        .bind(creature.id)
        .bind(creature.map)
        .bind(creature.zoneId)
        .bind(creature.areaId)
        .bind(creature.spawnMask)
        .bind(creature.phaseMask)
        .bind(creature.modelid)
        .bind(creature.equipment_id)
        .bind(creature.position_x)
        .bind(creature.position_y)
        .bind(creature.position_z)
        .bind(creature.orientation)
        .bind(creature.spawntimesecs)
        .bind(creature.wander_distance)
        .bind(creature.currentwaypoint)
        .bind(creature.curhealth)
        .bind(creature.curmana)
        .bind(creature.MovementType)
        .bind(creature.npcflag)
        .bind(creature.unit_flags)
        .bind(creature.dynamicflags)
        .bind(&creature.ScriptName)
        .bind(&creature.StringId)
        .bind(creature.VerifiedBuild)
        .execute(pool)
        .await,
        creature.guid, creature.id, creature.map, creature.zoneId, creature.areaId,
        creature.spawnMask, creature.phaseMask, creature.modelid, creature.equipment_id,
        creature.position_x, creature.position_y, creature.position_z, creature.orientation,
        creature.spawntimesecs, creature.wander_distance, creature.currentwaypoint,
        creature.curhealth, creature.curmana, creature.MovementType, creature.npcflag,
        creature.unit_flags, creature.dynamicflags, &creature.ScriptName, &creature.StringId,
        creature.VerifiedBuild
    ).map_err(|e| format!("Save failed: {}", e))?;

    log::info!("Saved creature spawn guid {}", creature.guid);
    Ok(())
}

#[tauri::command]
pub async fn delete_creature_spawn(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    guid: u32,
) -> Result<(), String> {
    let db = state.pool.read().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;

    const SQL: &str = "DELETE FROM creature WHERE guid = ?";
    let result = debug_sql!(app, debug, SQL,
        sqlx::query(SQL)
        .bind(guid)
        .execute(pool)
        .await,
        guid
    ).map_err(|e| format!("Delete failed: {}", e))?;

    if result.rows_affected() == 0 {
        return Err(format!("Creature spawn with guid {} not found", guid));
    }

    log::info!("Deleted creature spawn guid {}", guid);
    Ok(())
}
