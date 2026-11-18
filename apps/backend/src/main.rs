use anyhow::{Context, Result, anyhow, bail};
use headcode::{
    cms::{
        push_schema,
        schema::{Schema, Section},
    },
    env, kit,
    kit::{db::Db, members::Role},
    router,
};
use serde::Deserialize;
use uuid::Uuid;

/// The local development account, admin of the demo project with embedded Postgres.
const DEV_ADMIN: &str = "dev@headcode.local";

const USAGE: &str = "usage: headcode [serve | migrate | member add <project> <email> <editor|admin>
                 | schema <project> <schema.json> | seed <project> <entries.json>
                 | site <project> <revalidate-url>   (secret from REVALIDATE_SECRET)]";

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
        ["schema", project, file] => {
            let schema: Schema = serde_json::from_str(&std::fs::read_to_string(file)?)?;
            let schema = schema
                .compile()
                .map_err(|problems| anyhow!("the schema is invalid:\n{}", problems.join("\n")))?;
            let invalid = push_schema(&db, project_id(&db, project).await?, &schema, "cli").await?;
            println!("schema of {project} saved");
            for entry in invalid {
                println!(
                    "{} ({}) does not match: {}",
                    entry.slug,
                    entry.version,
                    entry.problems.join("; ")
                );
            }
            Ok(())
        }
        ["seed", project, file] => {
            let entries: Vec<Seed> = serde_json::from_str(&std::fs::read_to_string(file)?)?;
            let added = seed(&db, project_id(&db, project).await?, entries).await?;
            println!("{added} entries added to draft and live of {project}");
            Ok(())
        }
        ["site", project, url] => {
            let secret = std::env::var("REVALIDATE_SECRET")
                .context("set REVALIDATE_SECRET, the same value as in the site's env")?;
            sqlx::query(
                "update projects set revalidate_url = $2, revalidate_secret = $3 where slug = $1",
            )
            .bind(project)
            .bind(url)
            .bind(secret)
            .execute(&db)
            .await?;
            println!("{project} tells {url} about publish and rollback");
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

async fn project_id(db: &Db, project: &str) -> Result<Uuid> {
    sqlx::query_scalar("select id from projects where slug = $1")
        .bind(project)
        .fetch_optional(db)
        .await?
        .with_context(|| format!("unknown project \"{project}\""))
}

/// Adds a member as an invitation, for the first admin of a project.
async fn add_member(db: &Db, project: &str, email: &str, role: Role) -> Result<()> {
    let project_id = project_id(db, project).await?;
    let mut tx = db.begin().await?;
    kit::members::lock(&mut tx, project_id).await?;
    kit::members::grant(&mut tx, project_id, email, role, "cli").await?;
    tx.commit().await?;
    Ok(())
}

#[derive(Deserialize)]
struct Seed {
    slug: String,
    sections: Vec<Section>,
}

/// Adds the given entries to draft and live where the slug is new in both,
/// so a fresh project shows the site's default content. Safe to repeat.
async fn seed(db: &Db, project_id: Uuid, entries: Vec<Seed>) -> Result<usize> {
    let schema: Option<sqlx::types::Json<Schema>> =
        sqlx::query_scalar("select schema from projects where id = $1")
            .bind(project_id)
            .fetch_one(db)
            .await?;
    let schema = schema
        .context("the project has no schema; push one first")?
        .0
        .compile()
        .map_err(|problems| anyhow!(problems.join("; ")))?;
    let mut tx = db.begin().await?;
    kit::members::lock(&mut tx, project_id).await?;
    let mut added = 0;
    for mut entry in entries {
        headcode::cms::schema::assign_ids(&mut entry.sections);
        let problems = schema.check(&entry.slug, &entry.sections);
        if !problems.is_empty() {
            bail!(
                "{} does not match the schema: {}",
                entry.slug,
                problems.join("; ")
            );
        }
        let inserted = sqlx::query(
            "insert into entries (project_id, version, slug, sections, updated_by) \
             select $1, version, $2, $3, 'seed' from (values ('draft'), ('live')) as v (version) \
             where not exists (select 1 from entries where project_id = $1 and slug = $2)",
        )
        .bind(project_id)
        .bind(&entry.slug)
        .bind(sqlx::types::Json(&entry.sections))
        .execute(&mut *tx)
        .await?;
        added += usize::from(inserted.rows_affected() > 0);
    }
    tx.commit().await?;
    Ok(added)
}
