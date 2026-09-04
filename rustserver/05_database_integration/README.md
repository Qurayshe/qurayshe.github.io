# 05 - Database Integration

This example integrates an asynchronous relational database using `sqlx`. Because this is an example rust server lesson, we use a transient in-memory `SQLite` database. However, this seamlessly scales out to Postgres or MySQL.

## Key Concepts
* Database Connection Pooling via `sqlx::SqlitePool`.
* Injecting the Database Pool into your Axum router's shared state.
* Query execution without blocking the Tokio runtime.
* Extracting query parameters.

## SQLx Queries
SQLx provides macros (`sqlx::query!`, etc.) to compile-time check your queries. In this sandbox environment, since we use an in-memory database that is dynamically initialized, we use `sqlx::query` without the macro form for dynamic query execution. In real applications, you typically provide a `.env` file referencing your real DB to get static verification!

## Running
Run `cargo run` from this directory.
It exposes a JSON API: 
* `GET /users`: List users in the DB.
* `POST /users`: Supply `{"name": "Alice"}` to add a new user.
