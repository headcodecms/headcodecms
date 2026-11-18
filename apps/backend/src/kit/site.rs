//! Tells the project's site that live changed, so it expires its cache. The
//! request is signed: `x-headcode-signature: sha256=<hex>` is the HMAC-SHA256
//! of `<timestamp>.<body>` with the project's secret, and
//! `x-headcode-timestamp` carries the timestamp (seconds since 1970).

use std::time::{Duration, SystemTime, UNIX_EPOCH};

use hmac::{Hmac, KeyInit, Mac};
use serde_json::json;
use sha2::Sha256;
use uuid::Uuid;

use crate::kit::db::Db;

/// True if the site confirmed; false if it has no URL set or did not answer.
pub async fn notify(db: &Db, project_id: Uuid, event: &str, snapshot: i64) -> bool {
    let site: Option<(Option<String>, Option<String>)> =
        sqlx::query_as("select revalidate_url, revalidate_secret from projects where id = $1")
            .bind(project_id)
            .fetch_optional(db)
            .await
            .ok()
            .flatten();
    let Some((Some(url), Some(secret))) = site else {
        return false;
    };
    let body = json!({ "event": event, "snapshot": snapshot }).to_string();
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or_default()
        .to_string();
    let Ok(mut mac) = Hmac::<Sha256>::new_from_slice(secret.as_bytes()) else {
        return false;
    };
    mac.update(format!("{timestamp}.{body}").as_bytes());
    let signature: String = mac
        .finalize()
        .into_bytes()
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    let sent = reqwest::Client::new()
        .post(&url)
        .timeout(Duration::from_secs(5))
        .header("content-type", "application/json")
        .header("x-headcode-timestamp", timestamp)
        .header("x-headcode-signature", format!("sha256={signature}"))
        .body(body)
        .send()
        .await;
    match sent {
        Ok(res) if res.status().is_success() => true,
        Ok(res) => {
            tracing::warn!(%url, status = %res.status(), "site revalidation refused");
            false
        }
        Err(error) => {
            tracing::warn!(%url, %error, "site revalidation failed");
            false
        }
    }
}
