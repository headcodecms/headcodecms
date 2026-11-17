//! Project members. `editor` reads and writes draft and publishes, `admin` also
//! manages members. Roles live only here, never in the token.

use anyhow::{Result, bail};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgConnection;
use uuid::Uuid;

use crate::kit::{
    auth::{Auth, Caller},
    db::Db,
};

#[derive(
    Clone,
    Copy,
    Debug,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Deserialize,
    Serialize,
    JsonSchema,
    sqlx::Type,
)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum Role {
    Editor,
    Admin,
}

impl Role {
    pub fn as_str(self) -> &'static str {
        match self {
            Role::Editor => "editor",
            Role::Admin => "admin",
        }
    }
}

#[derive(Serialize, JsonSchema, sqlx::FromRow)]
pub struct Member {
    email: String,
    role: Role,
    /// False while the invitation is open: the user has not used this project yet.
    joined: bool,
}

/// The caller's role in a project. An invitation for the caller's email is
/// redeemed on their first request, if the auth server reports the email as verified.
pub async fn role(db: &Db, auth: &Auth, project_id: Uuid, caller: &Caller) -> Result<Option<Role>> {
    let role = sqlx::query_scalar(
        "select role from members where project_id = $1 and iss = $2 and sub = $3",
    )
    .bind(project_id)
    .bind(&caller.iss)
    .bind(&caller.sub)
    .fetch_optional(db)
    .await?;
    if role.is_some() {
        return Ok(role);
    }
    let invited: bool = sqlx::query_scalar(
        "select exists (select 1 from members where project_id = $1 and sub is null)",
    )
    .bind(project_id)
    .fetch_one(db)
    .await?;
    if !invited {
        return Ok(None);
    }
    let user = auth.userinfo(&caller.token).await?;
    let (Some(email), true) = (user.email, user.email_verified) else {
        return Ok(None);
    };
    Ok(sqlx::query_scalar(
        "update members set iss = $2, sub = $3 \
         where project_id = $1 and sub is null and lower(email) = lower($4) returning role",
    )
    .bind(project_id)
    .bind(&caller.iss)
    .bind(&caller.sub)
    .bind(email)
    .fetch_optional(db)
    .await?)
}

pub async fn list(db: &Db, project_id: Uuid) -> Result<Vec<Member>> {
    Ok(sqlx::query_as(
        "select email, role, sub is not null as joined from members \
         where project_id = $1 order by role, lower(email)",
    )
    .bind(project_id)
    .fetch_all(db)
    .await?)
}

/// Adds a member (as an invitation) or changes the role of an existing one.
/// Run it in a transaction that starts with `lock`.
pub async fn grant(
    tx: &mut PgConnection,
    project_id: Uuid,
    email: &str,
    role: Role,
    actor: &str,
) -> Result<()> {
    sqlx::query(
        "insert into members (project_id, email, role) values ($1, $2, $3) \
         on conflict (project_id, lower(email)) do update set role = excluded.role",
    )
    .bind(project_id)
    .bind(email)
    .bind(role)
    .execute(&mut *tx)
    .await?;
    audit(
        tx,
        project_id,
        actor,
        "member_grant",
        json!({ "email": email, "role": role }),
    )
    .await
}

/// Removes a member or an open invitation. Run it in a transaction that starts with `lock`.
pub async fn revoke(
    tx: &mut PgConnection,
    project_id: Uuid,
    email: &str,
    actor: &str,
) -> Result<()> {
    let removed =
        sqlx::query("delete from members where project_id = $1 and lower(email) = lower($2)")
            .bind(project_id)
            .bind(email)
            .execute(&mut *tx)
            .await?;
    if removed.rows_affected() == 0 {
        bail!("{email} is not a member of this project.");
    }
    audit(
        tx,
        project_id,
        actor,
        "member_revoke",
        json!({ "email": email }),
    )
    .await
}

/// Serializes member changes per project, so two admins cannot remove each other at once.
pub async fn lock(tx: &mut PgConnection, project_id: Uuid) -> Result<()> {
    sqlx::query("select 1 from projects where id = $1 for update")
        .bind(project_id)
        .execute(tx)
        .await?;
    Ok(())
}

/// Fails if the project has no admin who has signed in, so it cannot lock itself out.
pub async fn check_admin(tx: &mut PgConnection, project_id: Uuid) -> Result<()> {
    let admins: i64 = sqlx::query_scalar(
        "select count(*) from members where project_id = $1 and role = 'admin' and sub is not null",
    )
    .bind(project_id)
    .fetch_one(tx)
    .await?;
    if admins == 0 {
        bail!("A project needs at least one admin; grant admin to someone else first.");
    }
    Ok(())
}

async fn audit(
    tx: &mut PgConnection,
    project_id: Uuid,
    actor: &str,
    action: &str,
    detail: serde_json::Value,
) -> Result<()> {
    sqlx::query(
        "insert into audit_log (project_id, actor, action, detail) values ($1, $2, $3, $4)",
    )
    .bind(project_id)
    .bind(actor)
    .bind(action)
    .bind(detail)
    .execute(tx)
    .await?;
    Ok(())
}
