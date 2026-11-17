pub mod cms;
pub mod kit;

use std::sync::Arc;

use anyhow::{Context, Result};
use axum::{Router, middleware, routing::get};
use rmcp::transport::streamable_http_server::{
    StreamableHttpServerConfig, StreamableHttpService, session::never::NeverSessionManager,
};

use crate::{
    cms::Cms,
    kit::{auth::Auth, db::Db},
};

/// The whole HTTP surface. `headcode serve` and the Vercel Function both run
/// this router; only the way it is started differs.
pub fn router(db: Db, base_url: &str, issuer: &str) -> Result<Router> {
    let authority = base_url
        .parse::<http::Uri>()?
        .authority()
        .context("HEADCODE_URL needs a host")?
        .clone();
    let config = StreamableHttpServerConfig::default()
        .with_legacy_session_mode(false)
        .with_json_response(true)
        .with_allowed_hosts([authority.host(), authority.as_str()]);
    let auth = Auth::new(base_url, issuer);
    let tools_auth = auth.clone();
    let mcp = StreamableHttpService::new(
        move || Ok(Cms::new(db.clone(), tools_auth.clone())),
        Arc::new(NeverSessionManager::default()),
        config,
    );
    Ok(Router::new()
        .route_service("/p/{project}/mcp", mcp)
        .route_layer(middleware::from_fn_with_state(
            auth.clone(),
            kit::auth::require,
        ))
        .route(
            "/.well-known/oauth-protected-resource/p/{project}/mcp",
            get(kit::auth::metadata),
        )
        .route("/health", get(|| async { "ok" }))
        .with_state(auth))
}

pub fn env(name: &str, default: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| default.into())
}
