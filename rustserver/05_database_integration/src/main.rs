use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, Row, SqlitePool};

// Application state storing the SQLx Connection Pool
#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[derive(Serialize)]
struct User {
    id: i64,
    name: String,
}

#[derive(Deserialize)]
struct CreateUser {
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Create an in-memory SQLite database connection pool using sqlx
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect("sqlite::memory:")
        .await?;

    // 2. Run initial schema migrations (in a real app, use sqlx::migrate!)
    sqlx::query(
        "CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )",
    )
    .execute(&pool)
    .await?;

    let app_state = AppState { db: pool };

    let app = Router::new()
        .route("/users", get(list_users))
        .route("/users", post(create_user))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server with Database running on http://127.0.0.1:8080");

    axum::serve(listener, app).await?;
    Ok(())
}

async fn list_users(
    State(state): State<AppState>,
) -> Result<Json<Vec<User>>, (StatusCode, String)> {
    let rows = sqlx::query("SELECT id, name FROM users")
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let users = rows
        .into_iter()
        .map(|row| User {
            id: row.get("id"),
            name: row.get("name"),
        })
        .collect();

    Ok(Json(users))
}

async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<(StatusCode, Json<User>), (StatusCode, String)> {
    let result = sqlx::query("INSERT INTO users (name) VALUES (?)")
        .bind(&payload.name)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let id = result.last_insert_rowid();

    let new_user = User {
        id,
        name: payload.name,
    };

    Ok((StatusCode::CREATED, Json(new_user)))
}
