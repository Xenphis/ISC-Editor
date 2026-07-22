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
    let db = state.pool.read().await;
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

/// Teleports on one map, for the map editor's zone tables panel. `game_tele`
/// has no zone column, so the optional bounds (the zone's WorldMapArea world
/// rectangle) scope the list spatially; all-NULL bounds mean map-wide.
#[tauri::command]
pub async fn get_game_teles_by_map(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    map: u16,
    search: Option<String>,
    limit: Option<i64>,
    min_x: Option<f32>,
    max_x: Option<f32>,
    min_y: Option<f32>,
    max_y: Option<f32>,
) -> Result<Vec<GameTele>, String> {
    let db = state.pool.read().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    let limit = limit.unwrap_or(500);

    // The bounds filter binds min_x twice: NULL disables it (map-wide list).
    let rows = match &search {
        Some(q) if !q.is_empty() => {
            let pattern = format!("%{}%", q);
            const SQL: &str = "SELECT * FROM game_tele WHERE map = ? \
                 AND (? IS NULL OR (position_x BETWEEN ? AND ? AND position_y BETWEEN ? AND ?)) \
                 AND (name LIKE ? OR id LIKE ?) ORDER BY name LIMIT ?";
            debug_sql!(app, debug, SQL,
                sqlx::query_as::<_, GameTele>(SQL)
                    .bind(map)
                    .bind(min_x)
                    .bind(min_x)
                    .bind(max_x)
                    .bind(min_y)
                    .bind(max_y)
                    .bind(&pattern)
                    .bind(&pattern)
                    .bind(limit)
                    .fetch_all(pool)
                    .await,
                map, min_x, min_x, max_x, min_y, max_y, &pattern, &pattern, limit
            ).map_err(|e| format!("Query failed: {}", e))?
        }
        _ => {
            const SQL: &str = "SELECT * FROM game_tele WHERE map = ? \
                 AND (? IS NULL OR (position_x BETWEEN ? AND ? AND position_y BETWEEN ? AND ?)) \
                 ORDER BY name LIMIT ?";
            debug_sql!(app, debug, SQL,
                sqlx::query_as::<_, GameTele>(SQL)
                    .bind(map)
                    .bind(min_x)
                    .bind(min_x)
                    .bind(max_x)
                    .bind(min_y)
                    .bind(max_y)
                    .bind(limit)
                    .fetch_all(pool)
                    .await,
                map, min_x, min_x, max_x, min_y, max_y, limit
            ).map_err(|e| format!("Query failed: {}", e))?
        }
    };

    Ok(rows)
}

#[tauri::command]
pub async fn get_game_tele(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    id: u32,
) -> Result<GameTele, String> {
    let db = state.pool.read().await;
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
    let db = state.pool.read().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    const SQL: &str = "INSERT INTO game_tele (id, position_x, position_y, position_z, orientation, map, name) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id), position_x = VALUES(position_x), position_y = VALUES(position_y), position_z = VALUES(position_z), orientation = VALUES(orientation), map = VALUES(map), name = VALUES(name)";
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
    let db = state.pool.read().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    const SQL: &str = "DELETE FROM game_tele WHERE id = ?";
    debug_sql!(app, debug, SQL,
        sqlx::query(SQL).bind(id).execute(pool).await,
        id
    ).map_err(|e| format!("Delete failed: {}", e))?;
    Ok(())
}
