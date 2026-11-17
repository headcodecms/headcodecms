use std::{
    sync::Arc,
    time::{Duration, Instant},
};

use anyhow::{Context, Result, bail};
use axum::{
    Json,
    extract::{Path, Request, State},
    http::{HeaderValue, StatusCode, header},
    middleware::Next,
    response::{IntoResponse, Response},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header, jwk::JwkSet};
use serde::Deserialize;
use serde_json::json;
use tokio::sync::RwLock;

const ALGORITHMS: [Algorithm; 3] = [Algorithm::EdDSA, Algorithm::ES256, Algorithm::RS256];
const JWKS_REFRESH: Duration = Duration::from_secs(30);

/// Verifies OAuth access tokens (RFC 9068) from one issuer against its JWKS.
/// Only `iss` and `sub` from the token reach the rest of the backend.
#[derive(Clone)]
pub struct Auth(Arc<Inner>);

struct Inner {
    base_url: String,
    issuer: String,
    jwks_url: String,
    userinfo_url: String,
    http: reqwest::Client,
    keys: RwLock<(JwkSet, Option<Instant>)>,
}

#[derive(Clone, Debug)]
pub struct Caller {
    pub iss: String,
    pub sub: String,
    /// The access token, to ask the auth server for the caller's email.
    pub token: String,
}

/// OIDC userinfo (scope `email`), used to redeem invitations.
#[derive(Deserialize)]
pub struct UserInfo {
    pub email: Option<String>,
    #[serde(default)]
    pub email_verified: bool,
}

/// The project slug from the MCP URL `/p/{project}/mcp`.
#[derive(Clone, Debug)]
pub struct Project(pub String);

#[derive(Deserialize)]
struct Claims {
    sub: String,
    // Required: only OAuth access tokens carry `azp`, session JWTs do not.
    #[allow(dead_code)]
    azp: String,
}

impl Auth {
    pub fn new(base_url: &str, issuer: &str) -> Self {
        Self(Arc::new(Inner {
            base_url: base_url.trim_end_matches('/').into(),
            issuer: issuer.into(),
            jwks_url: format!("{}/jwks", issuer.trim_end_matches('/')),
            userinfo_url: format!("{}/oauth2/userinfo", issuer.trim_end_matches('/')),
            http: reqwest::Client::new(),
            keys: RwLock::new((JwkSet { keys: vec![] }, None)),
        }))
    }

    pub fn resource(&self, project: &str) -> String {
        format!("{}/p/{project}/mcp", self.0.base_url)
    }

    fn metadata_url(&self, project: &str) -> String {
        format!(
            "{}/.well-known/oauth-protected-resource/p/{project}/mcp",
            self.0.base_url
        )
    }

    pub async fn verify(&self, token: &str, project: &str) -> Result<Caller> {
        let header = decode_header(token)?;
        if header.typ.as_deref() != Some("at+jwt") {
            bail!("not an access token");
        }
        if !ALGORITHMS.contains(&header.alg) {
            bail!("unsupported algorithm");
        }
        let kid = header.kid.context("missing kid")?;
        let key = self.key(&kid).await?;
        let mut validation = Validation::new(header.alg);
        validation.set_issuer(&[&self.0.issuer]);
        validation.set_audience(&[self.resource(project)]);
        validation.set_required_spec_claims(&["exp", "iss", "aud", "sub"]);
        let claims = decode::<Claims>(token, &key, &validation)?.claims;
        Ok(Caller {
            iss: self.0.issuer.clone(),
            sub: claims.sub,
            token: token.into(),
        })
    }

    pub async fn userinfo(&self, token: &str) -> Result<UserInfo> {
        Ok(self
            .0
            .http
            .get(&self.0.userinfo_url)
            .bearer_auth(token)
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?)
    }

    async fn key(&self, kid: &str) -> Result<DecodingKey> {
        {
            let keys = self.0.keys.read().await;
            if let Some(jwk) = keys.0.find(kid) {
                return Ok(DecodingKey::from_jwk(jwk)?);
            }
            if keys.1.is_some_and(|at| at.elapsed() < JWKS_REFRESH) {
                bail!("unknown kid");
            }
        }
        let fetched: JwkSet = self
            .0
            .http
            .get(&self.0.jwks_url)
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?;
        let mut keys = self.0.keys.write().await;
        *keys = (fetched, Some(Instant::now()));
        let jwk = keys.0.find(kid).context("unknown kid")?;
        Ok(DecodingKey::from_jwk(jwk)?)
    }
}

/// Middleware for `/p/{project}/mcp`: rejects requests without a valid token for this project
/// with an RFC 9728 challenge, and passes `Caller` and `Project` on to the MCP tools.
pub async fn require(
    State(auth): State<Auth>,
    Path(project): Path<String>,
    mut request: Request,
    next: Next,
) -> Response {
    let token = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));
    let Some(token) = token else {
        return challenge(&auth, &project, None);
    };
    match auth.verify(token, &project).await {
        Ok(caller) => {
            request.extensions_mut().insert(caller);
            request.extensions_mut().insert(Project(project));
            next.run(request).await
        }
        Err(error) => {
            tracing::info!(%error, "rejected access token");
            challenge(&auth, &project, Some("invalid_token"))
        }
    }
}

fn challenge(auth: &Auth, project: &str, error: Option<&str>) -> Response {
    let mut value = format!(
        "Bearer resource_metadata=\"{}\"",
        auth.metadata_url(project)
    );
    if let Some(error) = error {
        value.push_str(&format!(", error=\"{error}\""));
    }
    let mut response = (
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": error.unwrap_or("unauthorized") })),
    )
        .into_response();
    if let Ok(value) = HeaderValue::from_str(&value) {
        response
            .headers_mut()
            .insert(header::WWW_AUTHENTICATE, value);
    }
    response
}

/// RFC 9728 protected resource metadata for `/p/{project}/mcp`.
pub async fn metadata(State(auth): State<Auth>, Path(project): Path<String>) -> Response {
    Json(json!({
        "resource": auth.resource(&project),
        "authorization_servers": [auth.0.issuer],
        "bearer_methods_supported": ["header"],
        // `email` lets the backend redeem invitations by email address.
        "scopes_supported": ["openid", "profile", "email", "offline_access"],
        "resource_name": format!("Headcode {project}"),
    }))
    .into_response()
}
