#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::State;
use crate::db::DbState;
use crate::debug::DebugState;
use crate::debug_sql;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SmartScript {
    pub entryorguid: i64,
    pub source_type: u8,
    pub id: u16,
    pub link: u16,
    pub event_type: u8,
    pub event_phase_mask: u16,
    pub event_chance: u8,
    pub event_flags: u16,
    pub event_param1: u32,
    pub event_param2: u32,
    pub event_param3: u32,
    pub event_param4: u32,
    pub action_type: u8,
    pub action_param1: u32,
    pub action_param2: u32,
    pub action_param3: u32,
    pub action_param4: u32,
    pub action_param5: u32,
    pub action_param6: u32,
    pub target_type: u8,
    pub target_param1: u32,
    pub target_param2: u32,
    pub target_param3: u32,
    pub target_x: f32,
    pub target_y: f32,
    pub target_z: f32,
    pub target_o: f32,
    pub comment: String,
}

/// (entryorguid, source_type) pair identifying one owned script.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartScriptKey {
    pub entryorguid: i64,
    #[serde(rename = "sourceType")]
    pub source_type: u8,
}

const SMART_SCRIPTS_COLUMNS: &str = "entryorguid, source_type, id, link, event_type, event_phase_mask, event_chance, event_flags, event_param1, event_param2, event_param3, event_param4, action_type, action_param1, action_param2, action_param3, action_param4, action_param5, action_param6, target_type, target_param1, target_param2, target_param3, target_x, target_y, target_z, target_o, comment";

#[tauri::command]
pub async fn get_smart_scripts(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    keys: Vec<i64>,
    types: Vec<u8>,
) -> Result<Vec<SmartScript>, String> {
    if keys.is_empty() || types.is_empty() {
        return Ok(Vec::new());
    }

    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    let key_placeholders = keys.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
    let type_placeholders = types.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
    let sql = format!(
        "SELECT * FROM smart_scripts WHERE entryorguid IN ({}) AND source_type IN ({}) ORDER BY entryorguid, id",
        key_placeholders, type_placeholders
    );
    let mut query = sqlx::query_as::<_, SmartScript>(&sql);
    for key in &keys {
        query = query.bind(key);
    }
    for source_type in &types {
        query = query.bind(source_type);
    }

    debug_sql!(app, debug, &sql,
        query.fetch_all(pool).await,
        &keys, &types
    ).map_err(|e| format!("Query failed: {}", e))
}

/// Timed actionlists in the conventional entry*100 window (source_type 9).
#[tauri::command]
pub async fn get_smart_scripts_range(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    min: i64,
    max: i64,
) -> Result<Vec<SmartScript>, String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;

    const SQL: &str = "SELECT * FROM smart_scripts WHERE source_type = 9 AND entryorguid BETWEEN ? AND ? ORDER BY entryorguid, id";
    debug_sql!(app, debug, SQL,
        sqlx::query_as::<_, SmartScript>(SQL)
        .bind(min)
        .bind(max)
        .fetch_all(pool)
        .await,
        min, max
    ).map_err(|e| format!("Query failed: {}", e))
}

/// Whole-script regeneration: deletes every owned (entryorguid, source_type)
/// script then re-inserts all rows, inside a single transaction.
#[tauri::command]
pub async fn save_smart_scripts(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    keys: Vec<SmartScriptKey>,
    scripts: Vec<SmartScript>,
) -> Result<(), String> {
    if keys.is_empty() {
        return Ok(());
    }

    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    let mut tx = pool.begin().await.map_err(|e| format!("Transaction failed: {}", e))?;

    let where_clause = keys.iter()
        .map(|_| "(entryorguid = ? AND source_type = ?)")
        .collect::<Vec<_>>()
        .join(" OR ");
    let sql_delete = format!("DELETE FROM smart_scripts WHERE {}", where_clause);
    let mut delete_query = sqlx::query(&sql_delete);
    for key in &keys {
        delete_query = delete_query.bind(key.entryorguid).bind(key.source_type);
    }
    debug_sql!(app, debug, &sql_delete,
        delete_query.execute(&mut *tx).await,
        keys.len()
    ).map_err(|e| format!("Delete failed: {}", e))?;

    let sql_insert = format!(
        "INSERT INTO smart_scripts ({}) VALUES ({})",
        SMART_SCRIPTS_COLUMNS,
        std::iter::repeat("?").take(28).collect::<Vec<_>>().join(", ")
    );
    for s in &scripts {
        debug_sql!(app, debug, &sql_insert,
            sqlx::query(&sql_insert)
            .bind(s.entryorguid)
            .bind(s.source_type)
            .bind(s.id)
            .bind(s.link)
            .bind(s.event_type)
            .bind(s.event_phase_mask)
            .bind(s.event_chance)
            .bind(s.event_flags)
            .bind(s.event_param1)
            .bind(s.event_param2)
            .bind(s.event_param3)
            .bind(s.event_param4)
            .bind(s.action_type)
            .bind(s.action_param1)
            .bind(s.action_param2)
            .bind(s.action_param3)
            .bind(s.action_param4)
            .bind(s.action_param5)
            .bind(s.action_param6)
            .bind(s.target_type)
            .bind(s.target_param1)
            .bind(s.target_param2)
            .bind(s.target_param3)
            .bind(s.target_x)
            .bind(s.target_y)
            .bind(s.target_z)
            .bind(s.target_o)
            .bind(&s.comment)
            .execute(&mut *tx)
            .await,
            s.entryorguid, s.source_type, s.id, &s.comment
        ).map_err(|e| format!("Insert failed: {}", e))?;
    }

    tx.commit().await.map_err(|e| format!("Commit failed: {}", e))?;
    log::info!("Saved {} smart_scripts rows across {} scripts", scripts.len(), keys.len());
    Ok(())
}
