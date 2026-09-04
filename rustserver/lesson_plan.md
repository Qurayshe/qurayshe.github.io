# Rust Server Development Lesson Plan

Welcome to the Rust Server Development guide! This lesson plan is designed to take you from the fundamentals of Rust networking up to building a modern, production-ready web server using cutting-edge tools.

## Course Structure

This repository is organized into a series of numbered projects, each building upon the concepts learned in the previous ones.

### `01_hello_world` (The Basics)
- **Concepts:** Standard library networking (`std::net::TcpListener`), streams, basic HTTP parsing, and basic string manipulation.
- **Description:** We start by building a single-threaded server completely from scratch, just to understand how HTTP works over a raw TCP socket. There's no magical web framework here! 

### `02_multithreaded_server` (Concurrency)
- **Concepts:** Mutexes, Arcs, Threading (`std::thread`), channels (`mpsc`), and building a ThreadPool.
- **Description:** We improve our basic server by allowing it to handle concurrent connections. This introduces Rust's famous "fearless concurrency" and memory safety concepts by building a ThreadPool to dispatch connections.

### `03_async_basics` (Entering the Async Ecosystem)
- **Concepts:** `async`/`await`, the `tokio` runtime, and async ecosystem fundamentals.
- **Description:** Modern Rust web servers almost exclusively run on async runtimes. We rebuild our server using `tokio`, dropping the manual threadpool in favor of lightweight asynchronous tasks.

### `04_axum_routing_state` (Modern Frameworks)
- **Concepts:** The `axum` web framework, routing, shared application state, extractors, and JSON serialization (`serde`).
- **Description:** We step away from raw TCP and adopt `axum`, currently one of the most popular and ergonomic Web Frameworks backed by the `tokio` team. We'll build a JSON REST API with shared state.

### `05_database_integration` (Persistence)
- **Concepts:** Async databases using `sqlx`, compile-time SQL verification, and SQLite.
- **Description:** A server isn't very useful without a database. We integrate `sqlx` to execute queries against a SQLite database, showing how Rust ensures your SQL queries are valid at compile-time.

### `06_modern_deployment` (Production Ready)
- **Concepts:** Structured logging (`tracing`), graceful shutdown, error handling (`anyhow` / application domains), and extracting configuration.
- **Description:** This builds upon the `axum` server to make it production-ready. We add deep, structured logging pipelines via `tracing`, and implement graceful OS signal handling to safely shut down tasks.
