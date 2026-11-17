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

use crate::kit::{
    auth::{Caller, Project},
    db::Db,
};

/// The MCP tools for one request. Stateless: a new value per request, sharing the pool.
#[derive(Clone)]
pub struct Cms {
    db: Db,
}

impl Cms {
    pub fn new(db: Db) -> Self {
        Self { db }
    }
}

#[derive(Clone, Copy, Default, Deserialize, Serialize, JsonSchema)]
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

#[tool_handler(
    name = "headcode",
    instructions = "Headcode CMS. Pages exist in draft and live. Write to draft unless the user asks for live; a live write changes only live, so ask whether to apply it to draft too."
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
        let project = project(&parts)?;
        let entries = sqlx::query_as::<_, Entry>(
            "select e.path, e.data, e.updated_at, e.updated_by from entries e \
             join projects p on p.id = e.project_id \
             where p.slug = $1 and e.version = $2 order by e.path",
        )
        .bind(&project.0)
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
        let project = project(&parts)?;
        sqlx::query_as::<_, Entry>(
            "select e.path, e.data, e.updated_at, e.updated_by from entries e \
             join projects p on p.id = e.project_id \
             where p.slug = $1 and e.version = $2 and e.path = $3",
        )
        .bind(&project.0)
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
        let project = project(&parts)?;
        let caller = parts
            .extensions
            .get::<Caller>()
            .ok_or_else(|| ErrorData::internal_error("missing caller", None))?;
        sqlx::query_as::<_, Entry>(
            "insert into entries (project_id, version, path, data, updated_by) \
             select id, $2, $3, $4, $5 from projects where slug = $1 \
             on conflict (project_id, version, path) do update \
             set data = excluded.data, updated_at = now(), updated_by = excluded.updated_by \
             returning path, data, updated_at, updated_by",
        )
        .bind(&project.0)
        .bind(params.version.as_str())
        .bind(&params.path)
        .bind(Value::Object(params.data))
        .bind(&caller.sub)
        .fetch_optional(&self.db)
        .await
        .map_err(internal)?
        .map(Json)
        .ok_or_else(|| ErrorData::invalid_params("Unknown project.", None))
    }
}

fn project(parts: &Parts) -> Result<&Project, ErrorData> {
    parts
        .extensions
        .get::<Project>()
        .ok_or_else(|| ErrorData::internal_error("missing project", None))
}

fn internal(error: impl std::fmt::Display) -> ErrorData {
    tracing::error!(%error, "database error");
    ErrorData::internal_error("database error", None)
}
