# Go Server Development Lesson Plan

Welcome to the Go Server Development guide! This lesson plan is designed to take you from the fundamentals of Go networking up to building a modern, production-ready web server using standard library tools and modern Go features.

## Course Structure

This folder is organized into a series of numbered projects, each building upon the concepts learned in the previous ones.

### `01_hello_world` (The Basics)
- **Concepts:** Standard library networking (`net/http`), basic handlers.
- **Description:** Go's standard library is incredibly powerful. We start by building a concurrent HTTP server completely from scratch using only the standard library. Unlike other languages, Go's `net/http` is production-ready out of the box.

### `02_goroutines_channels` (Concurrency)
- **Concepts:** Goroutines, Channels, `sync.WaitGroup`.
- **Description:** We explore Go's famous concurrency model. We will simulate background processing and use channels to communicate between goroutines safely without locks.

### `03_routing_middleware` (Routing & Interceptors)
- **Concepts:** `http.ServeMux` (Go 1.22+ routing), Middleware patterns.
- **Description:** We improve our basic server by using the enhanced routing features introduced in Go 1.22 (method and path matching) and write a middleware function to log incoming requests.

### `04_json_api` (Data Serialization)
- **Concepts:** JSON encoding/decoding (`encoding/json`), Struct tags, HTTP methods.
- **Description:** We build a JSON REST API. We'll learn how to unmarshal incoming JSON payloads into Go structs and marshal Go structs back into JSON responses.

### `05_database_integration` (Persistence)
- **Concepts:** `database/sql`, SQLite integration.
- **Description:** We integrate a relational database using Go's standard `database/sql` interface. We'll perform basic CRUD operations using an in-memory SQLite database.

### `06_modern_deployment` (Production Ready)
- **Concepts:** Structured logging (`log/slog`), Graceful shutdown (`context`, `os/signal`).
- **Description:** This builds the server up to production grade. We use Go 1.21's new structured logging package (`log/slog`) and implement graceful OS signal handling to safely shut down the server without interrupting active connections.
