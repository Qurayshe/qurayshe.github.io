# 03 - Routing & Middleware

This project explores `http.ServeMux` which was massively upgraded in Go 1.22. Historically people used third-party routing frameworks (like `gin`, `chi`, `gorilla/mux`) simply to match HTTP `METHOD` and path variables (`/users/{id}`). Go 1.22 brings this to the standard library natively.

## Key Concepts
* Routing (`http.NewServeMux()`): Advanced syntax mapping HTTP verbs (`GET`, `POST`) and wildcards.
* Middleware: A pattern utilizing Go's first-class functions to wrap handlers with shared functionality like logging, authentication, and headers.
* `http.HandlerFunc`: Higher order functions returning HTTP handlers.

## Upgraded Standard Library Routing
Go's `net/http` now explicitly supports patterns like:
- `GET /hello` (only matches GET)
- `/users/{id}` (wildcard matching)
- `POST /submit/`

## Running
Run `go run main.go` from this directory.
Endpoints available:
- `curl http://localhost:8080/`
- `curl http://localhost:8080/items/12345`  (Expect a custom path variable)
- `curl -X POST http://localhost:8080/submit` (Submit an item via POST)
