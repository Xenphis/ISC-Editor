use tauri::State;
use crate::db::{self, DbState};

#[tauri::command]
pub async fn connect_db(
    state: State<'_, DbState>,
    host: String,
    port: u16,
    user: String,
    password: String,
    database: String,
) -> Result<(), String> {
    let pool = db::connect(&host, port, &user, &password, &database).await?;

    let mut db = state.pool.lock().await;
    *db = Some(pool);

    log::info!("Connected to MySQL {}@{}:{}/{}", user, host, port, database);
    Ok(())
}

#[tauri::command]
pub async fn disconnect_db(state: State<'_, DbState>) -> Result<(), String> {
    let mut db = state.pool.lock().await;
    if let Some(pool) = db.take() {
        pool.close().await;
        log::info!("Disconnected from MySQL");
    }
    Ok(())
}
