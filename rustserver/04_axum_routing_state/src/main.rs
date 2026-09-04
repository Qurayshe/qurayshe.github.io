use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock}; // RwLock allows concurrent reads

// Shared state!
// It holds a simple integer counter.
type SharedState = Arc<RwLock<AppState>>;

#[derive(Default)]
struct AppState {
    counter: usize,
}

#[derive(Serialize, Deserialize)]
struct CreateItem {
    name: String,
    description: Option<String>,
}

#[derive(Serialize)]
struct ItemResponse {
    message: String,
    item: CreateItem,
}

#[tokio::main]
async fn main() {
    // We instantiate the shared application state.
    let shared_state = Arc::new(RwLock::new(AppState::default()));

    // Build the router with different endpoints
    let app = Router::new()
        .route("/", get(hello_world))
        .route("/items", post(create_item))
        .route("/counter", get(get_counter).post(increment_counter))
        .with_state(shared_state); // Inject state into router

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080")
        .await
        .unwrap();

    println!("Axum server listening on http://127.0.0.1:8080");

    axum::serve(listener, app).await.unwrap();
}

async fn hello_world() -> &'static str {
    "Hello from Axum!"
}

// Extract JSON payloads
async fn create_item(Json(payload): Json<CreateItem>) -> Json<ItemResponse> {
    let message = format!("Item '{}' created successfully", payload.name);

    let response = ItemResponse {
        message,
        item: payload,
    };

    // Responds cleanly with an HTTP 200 JSON payload
    Json(response)
}

// Access the shared state
async fn get_counter(State(state): State<SharedState>) -> String {
    let value = state.read().unwrap().counter;
    format!("Current counter value is: {value}")
}

// Modify the shared state
async fn increment_counter(State(state): State<SharedState>) -> String {
    let mut data = state.write().unwrap();
    data.counter += 1;
    let new_val = data.counter;
    format!("Counter incremented to: {new_val}")
}
