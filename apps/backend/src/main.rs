use anyhow::{Result, bail};
use headcode::{env, kit, kit::db::Db, router};

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().init();
    let command = std::env::args().nth(1).unwrap_or_else(|| "serve".into());
    let (db, _embedded) = kit::db::connect().await?;
    kit::db::migrate(&db).await?;
    match command.as_str() {
        "migrate" => Ok(()),
        "serve" => serve(db).await,
        other => bail!("unknown command \"{other}\", use serve or migrate"),
    }
}

async fn serve(db: Db) -> Result<()> {
    let base_url = env("HEADCODE_URL", "http://localhost:3080");
    let issuer = env("AUTH_ISSUER", "http://localhost:3081/api/auth");
    let app = router(db, &base_url, &issuer)?;

    let port = env("PORT", "3080");
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}")).await?;
    tracing::info!("headcode on {base_url}, MCP at {base_url}/p/demo/mcp");
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    Ok(())
}
