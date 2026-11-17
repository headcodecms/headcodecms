//! Vercel Function: the same router as `headcode serve`, run by vercel_runtime.
use headcode::{env, kit, router};
use tower::ServiceBuilder;
use vercel_runtime::{Error, axum::VercelLayer, run};

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt().init();
    let (db, _) = kit::db::connect().await?;
    let app = router(
        db,
        &env("HEADCODE_URL", "http://localhost:3080"),
        &env("AUTH_ISSUER", "http://localhost:3081/api/auth"),
    )?;
    run(ServiceBuilder::new().layer(VercelLayer::new()).service(app)).await
}
