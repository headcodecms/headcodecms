use std::{path::PathBuf, time::Duration};

use anyhow::Result;
use postgresql_embedded::{PostgreSQL, Settings};
use sqlx::{
    PgPool,
    postgres::{PgConnectOptions, PgPoolOptions},
};

const EMBEDDED_PORT: u16 = 54329;
const DATABASE: &str = "headcode";

pub type Db = PgPool;

/// Connects to `DATABASE_URL`, or starts embedded Postgres in `storage/postgres` when it is unset.
/// The returned `PostgreSQL` keeps the embedded server alive; drop it to stop the server.
pub async fn connect() -> Result<(Db, Option<PostgreSQL>)> {
    let (url, embedded) = match std::env::var("DATABASE_URL") {
        Ok(url) => (url, None),
        Err(_) => {
            let postgres = start_embedded().await?;
            (postgres.settings().url(DATABASE), Some(postgres))
        }
    };
    // Idle connections keep a serverless database (Neon) awake; the server
    // closes them after 60 s so it can suspend.
    let options = url
        .parse::<PgConnectOptions>()?
        .options([("idle_session_timeout", "60s")]);
    // Connects on first use, so a cold start does not wait for the database.
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .connect_lazy_with(options);
    Ok((pool, embedded))
}

pub async fn migrate(db: &Db) -> Result<()> {
    sqlx::migrate!().run(db).await?;
    Ok(())
}

async fn start_embedded() -> Result<PostgreSQL> {
    let storage = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("storage");
    std::fs::create_dir_all(&storage)?;
    let settings = Settings {
        data_dir: storage.join("postgres"),
        password_file: storage.join(".pgpass"),
        port: EMBEDDED_PORT,
        password: "headcode".into(),
        temporary: false,
        ..Settings::default()
    };
    let mut postgres = PostgreSQL::new(settings);
    postgres.setup().await?;
    postgres.start().await?;
    if !postgres.database_exists(DATABASE).await? {
        postgres.create_database(DATABASE).await?;
    }
    tracing::info!("embedded postgres on {}", postgres.settings().url(DATABASE));
    Ok(postgres)
}
