# 03 - Async Basics

This project transitions our basic server into the asynchronous world. Instead of managing threads manually and blocking them with `sleep` or heavy operations, we utilize the `tokio` runtime to manage asynchronous "tasks".

## Key Concepts
* `async` / `await` syntax.
* Run-time: `tokio`, the standard de-facto async runtime in Rust.
* `tokio::net::TcpListener` vs `std::net::TcpListener`.
* Spawning lightweight tasks with `tokio::spawn`.

## Why Async?
Rather than creating deep Call Stacks across many OS Threads (which takes significant system resources), an async runtime acts somewhat like a fast event loop over non-blocking sockets. This provides huge performance benefits for IO bound tasks, and lets a single thread handle thousands of concurrent requests.

## Running
Run `cargo run` and test out `http://127.0.0.1:8080/` and `http://127.0.0.1:8080/sleep` (which now uses a non-blocking `tokio::time::sleep`).
