use anyhow::{Context, Result, bail};
use headcode::{
    env, kit,
    kit::{db::Db, members::Role},
    router,
};
use uuid::Uuid;

/// The local development account, admin of the demo project with embedded Postgres.
const DEV_ADMIN: &str = "dev@headcode.local";

const USAGE: &str =
    "usage: headcode [serve | migrate | member add <project> <email> <editor|admin>]";

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().init();
    let args: Vec<String> = std::env::args().skip(1).collect();
    let args: Vec<&str> = args.iter().map(String::as_str).collect();
    let (db, embedded) = kit::db::connect().await?;
    kit::db::migrate(&db).await?;
    match args.as_slice() {
        [] | ["serve"] => {
            if embedded.is_some() {
                sqlx::query(
                    "insert into members (project_id, email, role) \
                     select id, $1, 'admin' from projects where slug = 'demo' on conflict do nothing",
                )
                .bind(DEV_ADMIN)
                .execute(&db)
                .await?;
            }
            serve(db).await
        }
        ["migrate"] => Ok(()),
        ["member", "add", project, email, role] => {
            let role = match *role {
                "editor" => Role::Editor,
                "admin" => Role::Admin,
                other => bail!("unknown role \"{other}\", use editor or admin"),
            };
            add_member(&db, project, email, role).await?;
            println!("{email} is {} of {project}", role.as_str());
            Ok(())
        }
        _ => bail!(USAGE),
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

/// Adds a member as an invitation, for the first admin of a project.
async fn add_member(db: &Db, project: &str, email: &str, role: Role) -> Result<()> {
    let project_id: Uuid = sqlx::query_scalar("select id from projects where slug = $1")
        .bind(project)
        .fetch_optional(db)
        .await?
        .with_context(|| format!("unknown project \"{project}\""))?;
    let mut tx = db.begin().await?;
    kit::members::lock(&mut tx, project_id).await?;
    kit::members::grant(&mut tx, project_id, email, role, "cli").await?;
    tx.commit().await?;
    Ok(())
}
