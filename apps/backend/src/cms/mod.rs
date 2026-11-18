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
use serde_json::{Value, json};
use sqlx::{Postgres, Transaction};
use uuid::Uuid;

use crate::cms::schema::{Compiled, Schema, Section};
use crate::kit::{
    auth::{Auth, Caller, Project},
    db::Db,
    members::{self, Member, Role},
};

mod schema;

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
    /// A global's slug, for example "home", or a collection item as "<collection>/<name>", for example "blog/hello".
    slug: String,
    /// "live" (default) or "draft".
    #[serde(default)]
    version: Version,
}

#[derive(Deserialize, JsonSchema)]
pub struct UpdateParams {
    /// A global's slug, for example "home", or a collection item as "<collection>/<name>", for example "blog/hello".
    slug: String,
    /// "draft" or "live". A live write changes only live; ask the user whether to apply it to draft too.
    version: Version,
    /// The entry's sections in page order; replaces the existing ones. Each must match its JSON Schema from schema_get.
    sections: Vec<Section>,
}

#[derive(Deserialize, JsonSchema)]
pub struct DeleteParams {
    /// The entry's slug.
    slug: String,
    /// "draft" or "live". Deletes only this version.
    version: Version,
}

#[derive(Deserialize, JsonSchema)]
pub struct PushParams {
    /// The schema, as written by the site's `pnpm schema`.
    schema: Schema,
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
    slug: String,
    sections: Value,
    #[schemars(with = "String")]
    updated_at: DateTime<Utc>,
    updated_by: Option<String>,
}

/// An entry without its sections.
#[derive(Serialize, JsonSchema, sqlx::FromRow)]
pub struct Listed {
    slug: String,
    #[schemars(with = "String")]
    updated_at: DateTime<Utc>,
    updated_by: Option<String>,
}

#[derive(Serialize, JsonSchema)]
pub struct Entries {
    entries: Vec<Listed>,
}

#[derive(Serialize, JsonSchema)]
pub struct Pushed {
    sections: usize,
    globals: usize,
    collections: usize,
    /// Entries that do not match the new schema; each must be fixed on its next save.
    invalid: Vec<Invalid>,
}

#[derive(Serialize, JsonSchema)]
pub struct Invalid {
    slug: String,
    version: String,
    problems: Vec<String>,
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
    instructions = "Headcode CMS. Call schema_get first: it lists the globals (single entries like \"home\"), the collections (items like \"blog/hello\") and the JSON Schema of each section. An entry is an ordered list of sections. Entries exist in draft and live. Write to draft unless the user asks for live; a live write changes only live, so ask whether to apply it to draft too. Everyone signed in can read live; draft and writes are for project members, managed by admins with member_grant and member_revoke."
)]
impl ServerHandler for Cms {}

#[tool_router]
impl Cms {
    #[tool(
        description = "Get this project's schema: globals, collections and the JSON Schema of each section.",
        annotations(read_only_hint = true)
    )]
    async fn schema_get(
        &self,
        Extension(parts): Extension<Parts>,
    ) -> Result<Json<Schema>, ErrorData> {
        let access = self.access(&parts).await?;
        let schema = self.schema(access.project_id).await?;
        Ok(Json(schema.schema().clone()))
    }

    #[tool(
        description = "Replace this project's schema. Admins only. It is saved even if existing entries do not match; they are listed and must be fixed on their next save.",
        annotations(destructive_hint = true, idempotent_hint = true)
    )]
    async fn schema_push(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<PushParams>,
    ) -> Result<Json<Pushed>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Admin, "push the schema")?;
        let schema = params.schema.compile().map_err(|problems| {
            refused(format!("The schema is invalid:\n{}", problems.join("\n")))
        })?;
        let mut tx = self.db.begin().await.map_err(internal)?;
        sqlx::query("update projects set schema = $2 where id = $1")
            .bind(access.project_id)
            .bind(sqlx::types::Json(schema.schema()))
            .execute(&mut *tx)
            .await
            .map_err(internal)?;
        let pushed = schema.schema();
        members::audit(
            &mut tx,
            access.project_id,
            &access.caller.sub,
            "schema_push",
            json!({
                "sections": pushed.sections.keys().collect::<Vec<_>>(),
                "globals": pushed.globals.iter().map(|g| &g.slug).collect::<Vec<_>>(),
                "collections": pushed.collections.iter().map(|c| &c.slug).collect::<Vec<_>>(),
            }),
        )
        .await
        .map_err(internal)?;
        tx.commit().await.map_err(internal)?;

        let entries: Vec<(String, String, Value)> = sqlx::query_as(
            "select slug, version, sections from entries where project_id = $1 order by slug, version",
        )
        .bind(access.project_id)
        .fetch_all(&self.db)
        .await
        .map_err(internal)?;
        let invalid = entries
            .into_iter()
            .filter_map(|(slug, version, sections)| {
                let problems = match serde_json::from_value::<Vec<Section>>(sections) {
                    Ok(sections) => schema.check(&slug, &sections),
                    Err(error) => vec![error.to_string()],
                };
                (!problems.is_empty()).then_some(Invalid {
                    slug,
                    version,
                    problems,
                })
            })
            .collect();
        Ok(Json(Pushed {
            sections: pushed.sections.len(),
            globals: pushed.globals.len(),
            collections: pushed.collections.len(),
            invalid,
        }))
    }

    #[tool(
        description = "List the entries of this project, without their sections; get one with entry_get.",
        annotations(read_only_hint = true)
    )]
    async fn entries_list(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<ListParams>,
    ) -> Result<Json<Entries>, ErrorData> {
        let access = self.access(&parts).await?;
        access.read(params.version)?;
        let entries = sqlx::query_as::<_, Listed>(
            "select slug, updated_at, updated_by from entries \
             where project_id = $1 and version = $2 order by slug",
        )
        .bind(access.project_id)
        .bind(params.version.as_str())
        .fetch_all(&self.db)
        .await
        .map_err(internal)?;
        Ok(Json(Entries { entries }))
    }

    #[tool(
        description = "Get one entry of this project with its sections.",
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
            "select slug, sections, updated_at, updated_by from entries \
             where project_id = $1 and version = $2 and slug = $3",
        )
        .bind(access.project_id)
        .bind(params.version.as_str())
        .bind(&params.slug)
        .fetch_optional(&self.db)
        .await
        .map_err(internal)?
        .map(Json)
        .ok_or_else(|| {
            ErrorData::invalid_params(
                format!("No entry {} in {}.", params.slug, params.version.as_str()),
                None,
            )
        })
    }

    #[tool(
        description = "Create or replace an entry in draft or live. Writes only the given version. The sections must match the schema.",
        annotations(destructive_hint = true, idempotent_hint = true)
    )]
    async fn entry_update(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<UpdateParams>,
    ) -> Result<Json<Entry>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "change entries")?;
        let schema = self.schema(access.project_id).await?;
        let problems = schema.check(&params.slug, &params.sections);
        if !problems.is_empty() {
            return Err(refused(format!(
                "The entry does not match the schema:\n{}",
                problems.join("\n")
            )));
        }
        let entry = sqlx::query_as::<_, Entry>(
            "insert into entries (project_id, version, slug, sections, updated_by) \
             values ($1, $2, $3, $4, $5) \
             on conflict (project_id, version, slug) do update \
             set sections = excluded.sections, updated_at = now(), updated_by = excluded.updated_by \
             returning slug, sections, updated_at, updated_by",
        )
        .bind(access.project_id)
        .bind(params.version.as_str())
        .bind(&params.slug)
        .bind(sqlx::types::Json(&params.sections))
        .bind(&access.caller.sub)
        .fetch_one(&self.db)
        .await
        .map_err(internal)?;
        Ok(Json(entry))
    }

    #[tool(
        description = "Delete an entry from draft or live. Deletes only the given version.",
        annotations(destructive_hint = true, idempotent_hint = true)
    )]
    async fn entry_delete(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<DeleteParams>,
    ) -> Result<Json<Entries>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "change entries")?;
        let deleted =
            sqlx::query("delete from entries where project_id = $1 and version = $2 and slug = $3")
                .bind(access.project_id)
                .bind(params.version.as_str())
                .bind(&params.slug)
                .execute(&self.db)
                .await
                .map_err(internal)?;
        if deleted.rows_affected() == 0 {
            return Err(refused(format!(
                "No entry {} in {}.",
                params.slug,
                params.version.as_str()
            )));
        }
        self.entries_list(
            Extension(parts),
            Parameters(ListParams {
                version: params.version,
            }),
        )
        .await
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

    /// The project's schema, compiled; writes need one.
    async fn schema(&self, project_id: Uuid) -> Result<Compiled, ErrorData> {
        let schema: Option<sqlx::types::Json<Schema>> =
            sqlx::query_scalar("select schema from projects where id = $1")
                .bind(project_id)
                .fetch_one(&self.db)
                .await
                .map_err(internal)?;
        let Some(schema) = schema else {
            return Err(refused(
                "This project has no schema yet; an admin pushes one with schema_push.".into(),
            ));
        };
        // The stored schema compiled once; a failure here is a bug, not the user's.
        schema
            .0
            .compile()
            .map_err(|problems| internal(problems.join("; ")))
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
