use chrono::{DateTime, Utc};
use http::request::Parts;
use rmcp::{
    ErrorData, ServerHandler,
    handler::server::{
        common::Extension,
        wrapper::{Json, Parameters},
    },
    schemars::{self, JsonSchema},
    tool, tool_handler, tool_router,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{Postgres, Transaction};
use uuid::Uuid;

use crate::kit::{
    auth::{Auth, Caller, Project},
    db::Db,
    members::{self, Member, Role},
};

/// The MCP tools for one request. Stateless: a new value per request, sharing the pool.
#[derive(Clone)]
pub struct Cms {
    db: Db,
    auth: Auth,
}

impl Cms {
    pub fn new(db: Db, auth: Auth) -> Self {
        Self { db, auth }
    }
}

#[derive(Clone, Copy, Default, PartialEq, Deserialize, Serialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
pub enum Version {
    Draft,
    #[default]
    Live,
}

impl Version {
    fn as_str(self) -> &'static str {
        match self {
            Version::Draft => "draft",
            Version::Live => "live",
        }
    }
}

#[derive(Deserialize, JsonSchema)]
pub struct ListParams {
    /// "live" (default) or "draft".
    #[serde(default)]
    version: Version,
}

#[derive(Deserialize, JsonSchema)]
pub struct GetParams {
    /// Page path, for example "/".
    path: String,
    /// "live" (default) or "draft".
    #[serde(default)]
    version: Version,
}

#[derive(Deserialize, JsonSchema)]
pub struct UpdateParams {
    /// Page path, for example "/".
    path: String,
    /// "draft" or "live". A live write changes only live; ask the user whether to apply it to draft too.
    version: Version,
    /// The page data as a JSON object; replaces the existing data.
    data: serde_json::Map<String, Value>,
}

#[derive(Deserialize, JsonSchema)]
pub struct GrantParams {
    /// The member's email address. The invitation is redeemed when they first use this project with that verified address.
    email: String,
    /// "editor" (draft, publish) or "admin" (also manages members).
    role: Role,
}

#[derive(Deserialize, JsonSchema)]
pub struct RevokeParams {
    /// The member's email address.
    email: String,
}

#[derive(Serialize, JsonSchema, sqlx::FromRow)]
pub struct Entry {
    path: String,
    data: Value,
    #[schemars(with = "String")]
    updated_at: DateTime<Utc>,
    updated_by: Option<String>,
}

#[derive(Serialize, JsonSchema)]
pub struct Entries {
    entries: Vec<Entry>,
}

#[derive(Serialize, JsonSchema)]
pub struct Members {
    members: Vec<Member>,
}

/// Who is calling which project, and with which role.
struct Access<'a> {
    project_id: Uuid,
    caller: &'a Caller,
    role: Option<Role>,
}

impl Access<'_> {
    fn require(&self, role: Role, action: &str) -> Result<(), ErrorData> {
        if self.role >= Some(role) {
            return Ok(());
        }
        let who = match role {
            Role::Editor => "members",
            Role::Admin => "admins",
        };
        Err(refused(format!(
            "Only {who} of this project can {action}. A project admin can add you with member_grant."
        )))
    }

    /// Everyone signed in reads live; draft is for members.
    fn read(&self, version: Version) -> Result<(), ErrorData> {
        match version {
            Version::Live => Ok(()),
            Version::Draft => self.require(Role::Editor, "read the draft"),
        }
    }
}

#[tool_handler(
    name = "headcode",
    instructions = "Headcode CMS. Pages exist in draft and live. Write to draft unless the user asks for live; a live write changes only live, so ask whether to apply it to draft too. Everyone signed in can read live; draft and writes are for project members, managed by admins with member_grant and member_revoke."
)]
impl ServerHandler for Cms {}

#[tool_router]
impl Cms {
    #[tool(
        description = "List the pages of this project with their data.",
        annotations(read_only_hint = true)
    )]
    async fn entries_list(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<ListParams>,
    ) -> Result<Json<Entries>, ErrorData> {
        let access = self.access(&parts).await?;
        access.read(params.version)?;
        let entries = sqlx::query_as::<_, Entry>(
            "select path, data, updated_at, updated_by from entries \
             where project_id = $1 and version = $2 order by path",
        )
        .bind(access.project_id)
        .bind(params.version.as_str())
        .fetch_all(&self.db)
        .await
        .map_err(internal)?;
        Ok(Json(Entries { entries }))
    }

    #[tool(
        description = "Get one page of this project by path.",
        annotations(read_only_hint = true)
    )]
    async fn entry_get(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<GetParams>,
    ) -> Result<Json<Entry>, ErrorData> {
        let access = self.access(&parts).await?;
        access.read(params.version)?;
        sqlx::query_as::<_, Entry>(
            "select path, data, updated_at, updated_by from entries \
             where project_id = $1 and version = $2 and path = $3",
        )
        .bind(access.project_id)
        .bind(params.version.as_str())
        .bind(&params.path)
        .fetch_optional(&self.db)
        .await
        .map_err(internal)?
        .map(Json)
        .ok_or_else(|| ErrorData::invalid_params(format!("No page at {}.", params.path), None))
    }

    #[tool(
        description = "Create or replace a page in draft or live. Writes only the given version.",
        annotations(destructive_hint = true, idempotent_hint = true)
    )]
    async fn entry_update(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<UpdateParams>,
    ) -> Result<Json<Entry>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "change pages")?;
        let entry = sqlx::query_as::<_, Entry>(
            "insert into entries (project_id, version, path, data, updated_by) \
             values ($1, $2, $3, $4, $5) \
             on conflict (project_id, version, path) do update \
             set data = excluded.data, updated_at = now(), updated_by = excluded.updated_by \
             returning path, data, updated_at, updated_by",
        )
        .bind(access.project_id)
        .bind(params.version.as_str())
        .bind(&params.path)
        .bind(Value::Object(params.data))
        .bind(&access.caller.sub)
        .fetch_one(&self.db)
        .await
        .map_err(internal)?;
        Ok(Json(entry))
    }

    #[tool(
        description = "List the members of this project and open invitations.",
        annotations(read_only_hint = true)
    )]
    async fn members_list(
        &self,
        Extension(parts): Extension<Parts>,
    ) -> Result<Json<Members>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "see the members")?;
        let members = members::list(&self.db, access.project_id)
            .await
            .map_err(internal)?;
        Ok(Json(Members { members }))
    }

    #[tool(
        description = "Add a member to this project by email, or change their role. Admins only.",
        annotations(destructive_hint = true, idempotent_hint = true)
    )]
    async fn member_grant(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<GrantParams>,
    ) -> Result<Json<Members>, ErrorData> {
        let access = self.access(&parts).await?;
        let mut tx = self.begin_member_change(&access).await?;
        members::grant(
            &mut tx,
            access.project_id,
            params.email.trim(),
            params.role,
            &access.caller.sub,
        )
        .await
        .map_err(internal)?;
        self.commit_member_change(tx, access.project_id).await
    }

    #[tool(
        description = "Remove a member or an open invitation from this project. Admins only.",
        annotations(destructive_hint = true, idempotent_hint = true)
    )]
    async fn member_revoke(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<RevokeParams>,
    ) -> Result<Json<Members>, ErrorData> {
        let access = self.access(&parts).await?;
        let mut tx = self.begin_member_change(&access).await?;
        let email = params.email.trim();
        let removed = members::revoke(&mut tx, access.project_id, email, &access.caller.sub)
            .await
            .map_err(internal)?;
        if !removed {
            return Err(refused(format!("{email} is not a member of this project.")));
        }
        self.commit_member_change(tx, access.project_id).await
    }
}

impl Cms {
    async fn access<'a>(&self, parts: &'a Parts) -> Result<Access<'a>, ErrorData> {
        let missing = |what| ErrorData::internal_error(format!("missing {what}"), None);
        let project = parts
            .extensions
            .get::<Project>()
            .ok_or_else(|| missing("project"))?;
        let caller = parts
            .extensions
            .get::<Caller>()
            .ok_or_else(|| missing("caller"))?;
        let project_id: Uuid = sqlx::query_scalar("select id from projects where slug = $1")
            .bind(&project.0)
            .fetch_optional(&self.db)
            .await
            .map_err(internal)?
            .ok_or_else(|| ErrorData::invalid_params("Unknown project.", None))?;
        let role = members::role(&self.db, &self.auth, project_id, caller)
            .await
            .map_err(internal)?;
        Ok(Access {
            project_id,
            caller,
            role,
        })
    }

    /// Locks the project's members and checks under the lock that the caller is
    /// still admin, so a role changed meanwhile counts.
    async fn begin_member_change(
        &self,
        access: &Access<'_>,
    ) -> Result<Transaction<'static, Postgres>, ErrorData> {
        let mut tx = self.db.begin().await.map_err(internal)?;
        members::lock(&mut tx, access.project_id)
            .await
            .map_err(internal)?;
        let role = members::joined_role(&mut *tx, access.project_id, access.caller)
            .await
            .map_err(internal)?;
        Access { role, ..*access }.require(Role::Admin, "manage members")?;
        Ok(tx)
    }

    /// Commits a member change if an admin is left, and returns the members.
    /// The list is read directly: after a self-revoke the caller is no member.
    async fn commit_member_change(
        &self,
        mut tx: Transaction<'static, Postgres>,
        project_id: Uuid,
    ) -> Result<Json<Members>, ErrorData> {
        let admins = members::admins(&mut tx, project_id)
            .await
            .map_err(internal)?;
        if admins == 0 {
            return Err(refused(
                "A project needs at least one admin; grant admin to someone else first.".into(),
            ));
        }
        tx.commit().await.map_err(internal)?;
        let members = members::list(&self.db, project_id)
            .await
            .map_err(internal)?;
        Ok(Json(Members { members }))
    }
}

fn internal(error: impl std::fmt::Display) -> ErrorData {
    tracing::error!(%error, "internal error");
    ErrorData::internal_error("internal error", None)
}

/// A rule said no; the message is for the user.
fn refused(message: String) -> ErrorData {
    ErrorData::invalid_request(message, None)
}
