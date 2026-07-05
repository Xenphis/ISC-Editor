#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::State;
use crate::db::DbState;
use crate::debug::DebugState;
use crate::debug_sql;
use crate::commands::smart_scripts::SmartScriptKey;

/// CONDITION_SOURCE_TYPE_SMART_EVENT
const SMART_EVENT_SOURCE: i32 = 22;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ConditionRow {
    #[sqlx(rename = "SourceTypeOrReferenceId")]
    pub SourceTypeOrReferenceId: i32,
    #[sqlx(rename = "SourceGroup")]
    pub SourceGroup: u32,
    #[sqlx(rename = "SourceEntry")]
    pub SourceEntry: i32,
    #[sqlx(rename = "SourceId")]
    pub SourceId: i32,
    #[sqlx(rename = "ElseGroup")]
    pub ElseGroup: u32,
    #[sqlx(rename = "ConditionTypeOrReference")]
    pub ConditionTypeOrReference: i32,
    #[sqlx(rename = "ConditionTarget")]
    pub ConditionTarget: u8,
    #[sqlx(rename = "ConditionValue1")]
    pub ConditionValue1: u32,
    #[sqlx(rename = "ConditionValue2")]
    pub ConditionValue2: u32,
    #[sqlx(rename = "ConditionValue3")]
    pub ConditionValue3: u32,
    #[sqlx(rename = "NegativeCondition")]
    pub NegativeCondition: u8,
    #[sqlx(rename = "ErrorType")]
    pub ErrorType: u32,
    #[sqlx(rename = "ErrorTextId")]
    pub ErrorTextId: u32,
    #[sqlx(rename = "ScriptName")]
    pub ScriptName: String,
    #[sqlx(rename = "Comment")]
    pub Comment: Option<String>,
}

const CONDITIONS_COLUMNS: &str = "SourceTypeOrReferenceId, SourceGroup, SourceEntry, SourceId, ElseGroup, ConditionTypeOrReference, ConditionTarget, ConditionValue1, ConditionValue2, ConditionValue3, NegativeCondition, ErrorType, ErrorTextId, ScriptName, Comment";

/// Conditions gating SAI events (SourceTypeOrReferenceId = 22) for the
/// given script entryorguids.
#[tauri::command]
pub async fn get_smart_conditions(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    entries: Vec<i64>,
) -> Result<Vec<ConditionRow>, String> {
    if entries.is_empty() {
        return Ok(Vec::new());
    }

    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    let placeholders = entries.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
    let sql = format!(
        "SELECT * FROM conditions WHERE SourceTypeOrReferenceId = {} AND SourceEntry IN ({}) ORDER BY SourceEntry, SourceGroup, ElseGroup",
        SMART_EVENT_SOURCE, placeholders
    );
    let mut query = sqlx::query_as::<_, ConditionRow>(&sql);
    for entry in &entries {
        query = query.bind(entry);
    }

    debug_sql!(app, debug, &sql,
        query.fetch_all(pool).await,
        &entries
    ).map_err(|e| format!("Query failed: {}", e))
}

/// Wholesale regeneration of the SAI conditions of the owned scripts,
/// mirroring save_smart_scripts.
#[tauri::command]
pub async fn save_smart_conditions(
    state: State<'_, DbState>,
    app: tauri::AppHandle,
    debug: State<'_, DebugState>,
    keys: Vec<SmartScriptKey>,
    conditions: Vec<ConditionRow>,
) -> Result<(), String> {
    if keys.is_empty() {
        return Ok(());
    }

    let db = state.pool.lock().await;
    let pool = db.as_ref().ok_or("Not connected to database")?;
    let mut tx = pool.begin().await.map_err(|e| format!("Transaction failed: {}", e))?;

    let where_clause = keys.iter()
        .map(|_| "(SourceEntry = ? AND SourceId = ?)")
        .collect::<Vec<_>>()
        .join(" OR ");
    let sql_delete = format!(
        "DELETE FROM conditions WHERE SourceTypeOrReferenceId = {} AND ({})",
        SMART_EVENT_SOURCE, where_clause
    );
    let mut delete_query = sqlx::query(&sql_delete);
    for key in &keys {
        delete_query = delete_query.bind(key.entryorguid).bind(key.source_type as i32);
    }
    debug_sql!(app, debug, &sql_delete,
        delete_query.execute(&mut *tx).await,
        keys.len()
    ).map_err(|e| format!("Delete failed: {}", e))?;

    let sql_insert = format!(
        "INSERT INTO conditions ({}) VALUES ({})",
        CONDITIONS_COLUMNS,
        std::iter::repeat("?").take(15).collect::<Vec<_>>().join(", ")
    );
    for c in &conditions {
        debug_sql!(app, debug, &sql_insert,
            sqlx::query(&sql_insert)
            .bind(c.SourceTypeOrReferenceId)
            .bind(c.SourceGroup)
            .bind(c.SourceEntry)
            .bind(c.SourceId)
            .bind(c.ElseGroup)
            .bind(c.ConditionTypeOrReference)
            .bind(c.ConditionTarget)
            .bind(c.ConditionValue1)
            .bind(c.ConditionValue2)
            .bind(c.ConditionValue3)
            .bind(c.NegativeCondition)
            .bind(c.ErrorType)
            .bind(c.ErrorTextId)
            .bind(&c.ScriptName)
            .bind(&c.Comment)
            .execute(&mut *tx)
            .await,
            c.SourceEntry, c.SourceGroup, c.ConditionTypeOrReference
        ).map_err(|e| format!("Insert failed: {}", e))?;
    }

    tx.commit().await.map_err(|e| format!("Commit failed: {}", e))?;
    log::info!("Saved {} SAI conditions across {} scripts", conditions.len(), keys.len());
    Ok(())
}
