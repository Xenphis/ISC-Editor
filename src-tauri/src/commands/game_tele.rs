#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::State;
use crate::db::DbState;
use crate::debug::DebugState;
use crate::debug_sql;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GameTele {
    pub id: u32,
    pub position_x: f32,
    pub position_y: f32,
    pub position_z: f32,
    pub orientation: f32,
    pub map: u16,
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct GameTeleListResult {
    pub data: Vec<GameTele>,
    pub total: i64,
}

#[tauri::command]
pub async fn get_game_teles(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    search: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<GameTeleListResult, String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let (data, total) = match &search {
        Some(q) if !q.is_empty() => {
            let pattern = format!("%{}%", q);
            const SQL_DATA: &str = "SELECT * FROM game_tele WHERE name LIKE ? OR id LIKE ? ORDER BY id LIMIT ? OFFSET ?";
            let rows: Vec<GameTele> = debug_sql!(app, debug, SQL_DATA,
                sqlx::query_as(SQL_DATA).bind(&pattern).bind(&pattern).bind(limit).bind(offset).fetch_all(pool).await,
                &pattern, &pattern, limit, offset
            ).map_err(|e| format!("Query failed: {}", e))?;
            const SQL_COUNT: &str = "SELECT COUNT(*) FROM game_tele WHERE name LIKE ? OR id LIKE ?";
            let count: (i64,) = debug_sql!(app, debug, SQL_COUNT,
                sqlx::query_as(SQL_COUNT).bind(&pattern).bind(&pattern).fetch_one(pool).await,
                &pattern, &pattern
            ).map_err(|e| format!("Count query failed: {}", e))?;
            (rows, count.0)
        }
        _ => {
            const SQL_DATA: &str = "SELECT * FROM game_tele ORDER BY id LIMIT ? OFFSET ?";
            let rows: Vec<GameTele> = debug_sql!(app, debug, SQL_DATA,
                sqlx::query_as(SQL_DATA).bind(limit).bind(offset).fetch_all(pool).await,
                limit, offset
            ).map_err(|e| format!("Query failed: {}", e))?;
            const SQL_COUNT: &str = "SELECT COUNT(*) FROM game_tele";
            let count: (i64,) = debug_sql!(app, debug, SQL_COUNT,
                sqlx::query_as(SQL_COUNT).fetch_one(pool).await
            ).map_err(|e| format!("Count query failed: {}", e))?;
            (rows, count.0)
        }
    };

    Ok(GameTeleListResult { data, total })
}

#[tauri::command]
pub async fn get_game_tele(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    id: u32,
) -> Result<GameTele, String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    const SQL: &str = "SELECT * FROM game_tele WHERE id = ?";
    debug_sql!(app, debug, SQL,
        sqlx::query_as::<_, GameTele>(SQL).bind(id).fetch_optional(pool).await,
        id
    ).map_err(|e| format!("Query failed: {}", e))?
    .ok_or_else(|| format!("Game tele for id={} not found", id))
}

#[tauri::command]
pub async fn save_game_tele(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    data: GameTele,
) -> Result<(), String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    const SQL: &str = "REPLACE INTO game_tele \
        (id, position_x, position_y, position_z, orientation, map, name) \
        VALUES (?, ?, ?, ?, ?, ?, ?)";
    debug_sql!(app, debug, SQL,
        sqlx::query(SQL)
            .bind(data.id)
            .bind(data.position_x)
            .bind(data.position_y)
            .bind(data.position_z)
            .bind(data.orientation)
            .bind(data.map)
            .bind(&data.name)
            .execute(pool)
            .await,
        data.id, data.position_x, data.position_y, data.position_z,
        data.orientation, data.map, &data.name
    ).map_err(|e| format!("Save failed: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn delete_game_tele(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    id: u32,
) -> Result<(), String> {
    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    const SQL: &str = "DELETE FROM game_tele WHERE id = ?";
    debug_sql!(app, debug, SQL,
        sqlx::query(SQL).bind(id).execute(pool).await,
        id
    ).map_err(|e| format!("Delete failed: {}", e))?;
    Ok(())
}
