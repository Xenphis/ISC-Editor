use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use std::sync::Arc;
use tokio::sync::RwLock;

// RwLock instead of Mutex: every command only needs a shared read of the
// pool (MySqlPool is itself thread-safe); the write lock is only taken on
// connect/disconnect.
pub struct DbState {
    pub pool: Arc<RwLock<Option<MySqlPool>>>,
}

impl DbState {
    pub fn new() -> Self {
        Self {
            pool: Arc::new(RwLock::new(None)),
        }
    }
}

pub async fn connect(
    host: &str,
    port: u16,
    user: &str,
    password: &str,
    database: &str,
) -> Result<MySqlPool, String> {
    let url = format!(
        "mysql://{}:{}@{}:{}/{}",
        user, password, host, port, database
    );

    log::info!("Connecting to: mysql://{}:***@{}:{}/{}", user, host, port, database);

    MySqlPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))
}
