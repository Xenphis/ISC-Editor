use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct DbState {
    pub pool: Arc<Mutex<Option<MySqlPool>>>,
}

impl DbState {
    pub fn new() -> Self {
        Self {
            pool: Arc::new(Mutex::new(None)),
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
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))
}
