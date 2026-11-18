use axum::{
    extract::{Path, Query, State},
    response::{IntoResponse, Response},
};
use chrono::{DateTime, Utc};
use http::request::Parts;
use http::{HeaderMap, StatusCode};
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
use sqlx::{PgConnection, Postgres, Transaction};
use uuid::Uuid;

use crate::cms::schema::{Compiled, Schema, Section};
use crate::kit::{
    auth::{Auth, Caller, Project},
    db::Db,
    members::{self, Member, Role},
    site,
};

pub mod schema;

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
pub struct RollbackParams {
    /// A snapshot id from snapshots_list.
    snapshot: i64,
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
pub struct Published {
    /// Entries now live.
    entries: usize,
    /// The snapshot of live before, for rollback.
    snapshot: i64,
    /// Whether the site confirmed it shows the new live state. If false, the
    /// site shows it once its cache expires (or has no revalidate URL set).
    site_refreshed: bool,
}

#[derive(Serialize, JsonSchema)]
pub struct RolledBack {
    /// Entries now live.
    entries: u64,
    /// The snapshot of live before the rollback, to undo it.
    snapshot: i64,
    /// Whether the site confirmed it shows the new live state.
    site_refreshed: bool,
}

#[derive(Serialize, JsonSchema, sqlx::FromRow)]
pub struct Snapshot {
    id: i64,
    /// "publish" or "rollback": the change that replaced this live state.
    reason: String,
    #[schemars(with = "String")]
    created_at: DateTime<Utc>,
    created_by: String,
    entries: i32,
}

#[derive(Serialize, JsonSchema)]
pub struct Snapshots {
    snapshots: Vec<Snapshot>,
}

#[derive(Serialize, JsonSchema, sqlx::FromRow)]
pub struct Change {
    slug: String,
    /// "new" (only in draft), "deleted" (only in live), "changed" (draft
    /// differs), or "live_newer" (live was changed after draft: publish would
    /// overwrite that change unless draft gets it too).
    status: String,
    #[schemars(with = "Option<String>")]
    draft_updated_at: Option<DateTime<Utc>>,
    #[schemars(with = "Option<String>")]
    live_updated_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, JsonSchema)]
pub struct Changes {
    changes: Vec<Change>,
}

#[derive(Serialize, JsonSchema)]
pub struct Preview {
    /// The site shows the draft at /preview/<token>/<path> to everyone with the link.
    token: String,
}

#[derive(Serialize, JsonSchema)]
pub struct Reset {
    /// Entries now in draft.
    entries: u64,
}

#[derive(Serialize, JsonSchema)]
pub struct Invalid {
    pub slug: String,
    pub version: String,
    pub problems: Vec<String>,
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
    instructions = "Headcode CMS. Call schema_get first: it lists the globals (single entries like \"home\"), the collections (items like \"blog/hello\") and the JSON Schema of each section. An entry is an ordered list of sections. Entries exist in draft and live. Write to draft unless the user asks for live; a live write changes only live, so ask whether to apply it to draft too. Everyone signed in can read live; draft and writes are for project members, managed by admins with member_grant and member_revoke. publish replaces live with the whole draft (changes_list shows what it would change; warn about live_newer entries); live is saved as a snapshot first, and rollback brings one of the 10 latest back. draft_reset discards the draft. preview_link gives the link that shows the draft on the site."
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
        let invalid = push_schema(&self.db, access.project_id, &schema, &access.caller.sub)
            .await
            .map_err(internal)?;
        let pushed = schema.schema();
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
        let mut sections = params.sections;
        let problems = schema.check(&params.slug, &sections);
        if !problems.is_empty() {
            return Err(refused(format!(
                "The entry does not match the schema:\n{}",
                problems.join("\n")
            )));
        }
        schema::assign_ids(&mut sections);
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
        .bind(sqlx::types::Json(&sections))
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
        description = "Publish: replace live with the whole draft. Refused if a draft entry does not match the schema. Live before is saved as a snapshot for rollback.",
        annotations(destructive_hint = true)
    )]
    async fn publish(
        &self,
        Extension(parts): Extension<Parts>,
    ) -> Result<Json<Published>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "publish")?;
        let schema = self.schema(access.project_id).await?;
        let mut tx = self.db.begin().await.map_err(internal)?;
        members::lock(&mut tx, access.project_id)
            .await
            .map_err(internal)?;
        let draft: Vec<(String, String, Value)> = sqlx::query_as(
            "select slug, version, sections from entries \
             where project_id = $1 and version = 'draft' order by slug",
        )
        .bind(access.project_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(internal)?;
        if draft.is_empty() {
            return Err(refused(
                "The draft is empty; there is nothing to publish.".into(),
            ));
        }
        let entries = draft.len();
        let invalid = invalid(&schema, draft);
        if !invalid.is_empty() {
            let lines: Vec<_> = invalid
                .iter()
                .map(|i| format!("{}: {}", i.slug, i.problems.join("; ")))
                .collect();
            return Err(refused(format!(
                "Not published; these draft entries do not match the schema:\n{}",
                lines.join("\n")
            )));
        }
        let snapshot = take_live(&mut tx, access.project_id, "publish", &access.caller.sub)
            .await
            .map_err(internal)?;
        sqlx::query(
            "insert into entries (project_id, version, slug, sections, updated_at, updated_by) \
             select project_id, 'live', slug, sections, updated_at, updated_by from entries \
             where project_id = $1 and version = 'draft'",
        )
        .bind(access.project_id)
        .execute(&mut *tx)
        .await
        .map_err(internal)?;
        members::audit(
            &mut tx,
            access.project_id,
            &access.caller.sub,
            "publish",
            json!({ "entries": entries, "snapshot": snapshot }),
        )
        .await
        .map_err(internal)?;
        tx.commit().await.map_err(internal)?;
        let site_refreshed = site::notify(&self.db, access.project_id, "publish", snapshot).await;
        Ok(Json(Published {
            entries,
            snapshot,
            site_refreshed,
        }))
    }

    #[tool(
        description = "List the snapshots of live (the 10 latest), newest first.",
        annotations(read_only_hint = true)
    )]
    async fn snapshots_list(
        &self,
        Extension(parts): Extension<Parts>,
    ) -> Result<Json<Snapshots>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "see the snapshots")?;
        let snapshots = sqlx::query_as::<_, Snapshot>(
            "select id, reason, created_at, created_by, jsonb_array_length(entries) as entries \
             from snapshots where project_id = $1 order by id desc",
        )
        .bind(access.project_id)
        .fetch_all(&self.db)
        .await
        .map_err(internal)?;
        Ok(Json(Snapshots { snapshots }))
    }

    #[tool(
        description = "Roll back: replace live with a snapshot. Draft is not changed. Live before is saved as a new snapshot, so a rollback can be undone.",
        annotations(destructive_hint = true)
    )]
    async fn rollback(
        &self,
        Extension(parts): Extension<Parts>,
        Parameters(params): Parameters<RollbackParams>,
    ) -> Result<Json<RolledBack>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "roll back")?;
        let mut tx = self.db.begin().await.map_err(internal)?;
        members::lock(&mut tx, access.project_id)
            .await
            .map_err(internal)?;
        let exists: bool = sqlx::query_scalar(
            "select exists (select 1 from snapshots where project_id = $1 and id = $2)",
        )
        .bind(access.project_id)
        .bind(params.snapshot)
        .fetch_one(&mut *tx)
        .await
        .map_err(internal)?;
        if !exists {
            return Err(refused(format!(
                "No snapshot {} in this project.",
                params.snapshot
            )));
        }
        let snapshot = take_live(&mut tx, access.project_id, "rollback", &access.caller.sub)
            .await
            .map_err(internal)?;
        let restored = sqlx::query(
            "insert into entries (project_id, version, slug, sections, updated_at, updated_by) \
             select $1, 'live', e.slug, e.sections, e.updated_at, e.updated_by \
             from snapshots s, jsonb_to_recordset(s.entries) \
             as e (slug text, sections jsonb, updated_at timestamptz, updated_by text) \
             where s.project_id = $1 and s.id = $2",
        )
        .bind(access.project_id)
        .bind(params.snapshot)
        .execute(&mut *tx)
        .await
        .map_err(internal)?;
        members::audit(
            &mut tx,
            access.project_id,
            &access.caller.sub,
            "rollback",
            json!({ "to": params.snapshot, "snapshot": snapshot }),
        )
        .await
        .map_err(internal)?;
        tx.commit().await.map_err(internal)?;
        let site_refreshed = site::notify(&self.db, access.project_id, "rollback", snapshot).await;
        Ok(Json(RolledBack {
            entries: restored.rows_affected(),
            snapshot,
            site_refreshed,
        }))
    }

    #[tool(
        description = "What publish would change: entries that differ between draft and live.",
        annotations(read_only_hint = true)
    )]
    async fn changes_list(
        &self,
        Extension(parts): Extension<Parts>,
    ) -> Result<Json<Changes>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "see the changes")?;
        let changes = sqlx::query_as::<_, Change>(
            "select coalesce(d.slug, l.slug) as slug, \
               case when l.slug is null then 'new' when d.slug is null then 'deleted' \
                    when l.updated_at > d.updated_at then 'live_newer' else 'changed' end as status, \
               d.updated_at as draft_updated_at, l.updated_at as live_updated_at \
             from (select * from entries where project_id = $1 and version = 'draft') d \
             full join (select * from entries where project_id = $1 and version = 'live') l \
               on l.slug = d.slug \
             where section_content(d.sections) is distinct from section_content(l.sections) \
             order by 1",
        )
        .bind(access.project_id)
        .fetch_all(&self.db)
        .await
        .map_err(internal)?;
        Ok(Json(Changes { changes }))
    }

    #[tool(
        description = "Discard the draft: replace it with live. Live is not changed.",
        annotations(destructive_hint = true)
    )]
    async fn draft_reset(
        &self,
        Extension(parts): Extension<Parts>,
    ) -> Result<Json<Reset>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "reset the draft")?;
        let mut tx = self.db.begin().await.map_err(internal)?;
        members::lock(&mut tx, access.project_id)
            .await
            .map_err(internal)?;
        sqlx::query("delete from entries where project_id = $1 and version = 'draft'")
            .bind(access.project_id)
            .execute(&mut *tx)
            .await
            .map_err(internal)?;
        let copied = sqlx::query(
            "insert into entries (project_id, version, slug, sections, updated_at, updated_by) \
             select project_id, 'draft', slug, sections, updated_at, updated_by from entries \
             where project_id = $1 and version = 'live'",
        )
        .bind(access.project_id)
        .execute(&mut *tx)
        .await
        .map_err(internal)?;
        members::audit(
            &mut tx,
            access.project_id,
            &access.caller.sub,
            "draft_reset",
            json!({ "entries": copied.rows_affected() }),
        )
        .await
        .map_err(internal)?;
        tx.commit().await.map_err(internal)?;
        Ok(Json(Reset {
            entries: copied.rows_affected(),
        }))
    }

    #[tool(
        description = "Get the preview token: the site shows the draft at /preview/<token>/<path> to everyone with the link.",
        annotations(read_only_hint = true)
    )]
    async fn preview_link(
        &self,
        Extension(parts): Extension<Parts>,
    ) -> Result<Json<Preview>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "see the preview link")?;
        let token = sqlx::query_scalar(
            "update projects set preview_token = coalesce(preview_token, \
               replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')) \
             where id = $1 returning preview_token",
        )
        .bind(access.project_id)
        .fetch_one(&self.db)
        .await
        .map_err(internal)?;
        Ok(Json(Preview { token }))
    }

    #[tool(
        description = "Rotate the preview token: links with the old token stop working.",
        annotations(destructive_hint = true)
    )]
    async fn preview_rotate(
        &self,
        Extension(parts): Extension<Parts>,
    ) -> Result<Json<Preview>, ErrorData> {
        let access = self.access(&parts).await?;
        access.require(Role::Editor, "rotate the preview link")?;
        let mut tx = self.db.begin().await.map_err(internal)?;
        let token = sqlx::query_scalar(
            "update projects set preview_token = \
               replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') \
             where id = $1 returning preview_token",
        )
        .bind(access.project_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(internal)?;
        members::audit(
            &mut tx,
            access.project_id,
            &access.caller.sub,
            "preview_rotate",
            json!({}),
        )
        .await
        .map_err(internal)?;
        tx.commit().await.map_err(internal)?;
        Ok(Json(Preview { token }))
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

#[derive(Deserialize)]
pub struct LiveQuery {
    prefix: Option<String>,
}

/// `GET /p/{project}/live?prefix=blog/`: the live entries with their sections,
/// open to everyone, for sites. Draft needs a token and goes through MCP.
pub async fn live_list(
    State(db): State<Db>,
    Path(project): Path<String>,
    Query(query): Query<LiveQuery>,
) -> Response {
    let prefix = query.prefix.unwrap_or_default();
    let entries = sqlx::query_as::<_, Entry>(
        "select e.slug, e.sections, e.updated_at, e.updated_by \
         from entries e join projects p on p.id = e.project_id \
         where p.slug = $1 and e.version = 'live' and starts_with(e.slug, $2) order by e.slug",
    )
    .bind(&project)
    .bind(&prefix)
    .fetch_all(&db)
    .await;
    match entries {
        Ok(entries) => axum::Json(json!({ "entries": entries })).into_response(),
        Err(error) => server_error(error),
    }
}

/// `GET /p/{project}/live/{slug}`: one live entry, or 404.
pub async fn live_get(
    State(db): State<Db>,
    Path((project, slug)): Path<(String, String)>,
) -> Response {
    get_entry(&db, &project, "live", &slug).await
}

/// `GET /p/{project}/draft?prefix=` with the header `x-headcode-preview:
/// <token>`: the draft entries, for the site's preview. 401 without the
/// project's preview token.
pub async fn draft_list(
    State(db): State<Db>,
    Path(project): Path<String>,
    headers: HeaderMap,
    Query(query): Query<LiveQuery>,
) -> Response {
    if !preview_allowed(&db, &project, &headers).await {
        return StatusCode::UNAUTHORIZED.into_response();
    }
    let entries = sqlx::query_as::<_, Entry>(
        "select e.slug, e.sections, e.updated_at, e.updated_by \
         from entries e join projects p on p.id = e.project_id \
         where p.slug = $1 and e.version = 'draft' and starts_with(e.slug, $2) order by e.slug",
    )
    .bind(&project)
    .bind(query.prefix.unwrap_or_default())
    .fetch_all(&db)
    .await;
    match entries {
        Ok(entries) => axum::Json(json!({ "entries": entries })).into_response(),
        Err(error) => server_error(error),
    }
}

/// `GET /p/{project}/draft/{slug}` with the preview token: one draft entry.
pub async fn draft_get(
    State(db): State<Db>,
    Path((project, slug)): Path<(String, String)>,
    headers: HeaderMap,
) -> Response {
    if !preview_allowed(&db, &project, &headers).await {
        return StatusCode::UNAUTHORIZED.into_response();
    }
    get_entry(&db, &project, "draft", &slug).await
}

async fn preview_allowed(db: &Db, project: &str, headers: &HeaderMap) -> bool {
    let Some(token) = headers
        .get("x-headcode-preview")
        .and_then(|value| value.to_str().ok())
    else {
        return false;
    };
    sqlx::query_scalar(
        "select exists (select 1 from projects where slug = $1 and preview_token = $2)",
    )
    .bind(project)
    .bind(token)
    .fetch_one(db)
    .await
    .unwrap_or(false)
}

async fn get_entry(db: &Db, project: &str, version: &str, slug: &str) -> Response {
    let entry = sqlx::query_as::<_, Entry>(
        "select e.slug, e.sections, e.updated_at, e.updated_by \
         from entries e join projects p on p.id = e.project_id \
         where p.slug = $1 and e.version = $2 and e.slug = $3",
    )
    .bind(project)
    .bind(version)
    .bind(slug)
    .fetch_optional(db)
    .await;
    match entry {
        Ok(Some(entry)) => axum::Json(entry).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(error) => server_error(error),
    }
}

fn server_error(error: sqlx::Error) -> Response {
    tracing::error!(%error, "internal error");
    StatusCode::INTERNAL_SERVER_ERROR.into_response()
}

/// Saves the schema and returns the entries that do not match it (they must
/// be fixed on their next save). For `schema_push` and `headcode schema`.
pub async fn push_schema(
    db: &Db,
    project_id: Uuid,
    schema: &Compiled,
    actor: &str,
) -> anyhow::Result<Vec<Invalid>> {
    let pushed = schema.schema();
    let mut tx = db.begin().await?;
    sqlx::query("update projects set schema = $2 where id = $1")
        .bind(project_id)
        .bind(sqlx::types::Json(pushed))
        .execute(&mut *tx)
        .await?;
    members::audit(
        &mut tx,
        project_id,
        actor,
        "schema_push",
        json!({
            "sections": pushed.sections.keys().collect::<Vec<_>>(),
            "globals": pushed.globals.iter().map(|g| &g.slug).collect::<Vec<_>>(),
            "collections": pushed.collections.iter().map(|c| &c.slug).collect::<Vec<_>>(),
        }),
    )
    .await?;
    tx.commit().await?;
    let entries: Vec<(String, String, Value)> = sqlx::query_as(
        "select slug, version, sections from entries where project_id = $1 order by slug, version",
    )
    .bind(project_id)
    .fetch_all(db)
    .await?;
    Ok(invalid(schema, entries))
}

/// Saves live as a snapshot and empties it, for publish and rollback. Only the
/// 10 latest snapshots are kept.
/// Run it in a transaction that starts with `members::lock`.
async fn take_live(
    tx: &mut PgConnection,
    project_id: Uuid,
    reason: &str,
    actor: &str,
) -> anyhow::Result<i64> {
    let id = sqlx::query_scalar(
        "insert into snapshots (project_id, reason, entries, created_by) \
         select $1, $2, coalesce(jsonb_agg(jsonb_build_object( \
           'slug', slug, 'sections', sections, 'updated_at', updated_at, 'updated_by', updated_by \
         ) order by slug), '[]'), $3 \
         from entries where project_id = $1 and version = 'live' returning id",
    )
    .bind(project_id)
    .bind(reason)
    .bind(actor)
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        "delete from snapshots where project_id = $1 and id not in \
         (select id from snapshots where project_id = $1 order by id desc limit 10)",
    )
    .bind(project_id)
    .execute(&mut *tx)
    .await?;
    sqlx::query("delete from entries where project_id = $1 and version = 'live'")
        .bind(project_id)
        .execute(&mut *tx)
        .await?;
    Ok(id)
}

/// The entries that do not match the schema, from (slug, version, sections) rows.
fn invalid(schema: &Compiled, entries: Vec<(String, String, Value)>) -> Vec<Invalid> {
    entries
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
        .collect()
}

fn internal(error: impl std::fmt::Display) -> ErrorData {
    tracing::error!(%error, "internal error");
    ErrorData::internal_error("internal error", None)
}

/// A rule said no; the message is for the user.
fn refused(message: String) -> ErrorData {
    ErrorData::invalid_request(message, None)
}
