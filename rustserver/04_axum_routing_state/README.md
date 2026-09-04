# 04 - Axum Framework (Routing & State)

This project adopts Axum (`axum`), an ergonomic and highly modular web framework built with the `tokio`, `tower`, and `hyper` ecosystems. Most modern web backends prefer a mature framework instead of re-implementing raw HTTP parsing.

## Key Concepts
* Routing (`axum::Router`).
* Extractors: Extracting path variables, JSON payloads, query parameters.
* Handlers: Asynchronous functions that process incoming requests.
* Shared Application State (`axum::extract::State`).
* JSON Serialization / Deserialization via `serde`.

## Why Axum?
Axum focuses on "Extractor" macros. You just declare that a handler needs a `String` JSON payload, and axum performs the unmarshaling for you. The type system heavily guards you from typical router misconfigurations.

## Endpoints
* `GET /`: Returns a basic string response.
* `POST /items`: Returns the JSON payload it was sent.
* `GET /counter`: Displays a shared Application state mutable counter.
* `POST /counter`: Increments the shared state globally.
