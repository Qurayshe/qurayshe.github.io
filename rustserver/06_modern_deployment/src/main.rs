use axum::{
    routing::get,
    Router,
};
use tokio::signal;
use tracing::{info, debug};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize standard tracing subscriber.
    // It reads the `RUST_LOG` environment variable for configuration
    // (e.g. `RUST_LOG=debug cargo run`)
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
              .unwrap_or_else(|_| "modern_deployment=debug,axum=info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting server setup");

    let app = Router::new().route("/", get(home));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    info!("Listening on {}", listener.local_addr().unwrap());

    // Instead of `axum::serve(listener, app).await`, we use `with_graceful_shutdown`
    // to tie the lifecycle of the server to the reception of OS Signals.
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("Server shutdown cleanly");
    Ok(())
}

async fn home() -> &'static str {
    // Emitting a tracing payload
    debug!("Home endpoint was accessed");
    "Welcome to the Production Ready Server!"
}

/// Awaits `CTRL+C` (SIGINT) on all platforms, or `SIGTERM` on Unix platforms.
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    // On windows `signal::unix::signal` is unavailable. We conditionally compile
    // a SIGTERM listener down only when we are running on Unix platforms.
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    // Block until one of the two shutdown signals is received
    tokio::select! {
        _ = ctrl_c => {
            info!("Received Ctrl-C, starting graceful shutdown");
        },
        _ = terminate => {
            info!("Received SIGTERM, starting graceful shutdown");
        },
    }
}
