# 02 - Multithreaded Server

This project demonstrates how to scale our purely synchronous TCP server by adding concurrency. We create a `ThreadPool` to manage workers that process connections.

## Key Concepts
* Concurrency in Rust using `std::thread`.
* Message passing with channels `std::sync::mpsc`.
* Mutexes (`std::sync::Mutex`) and Atomically Reference Counted pointers (`std::sync::Arc`) for safely sharing mutable state across threads.
* Fearless concurrency!

## Architecture
This implementation utilizes a thread pool to avoid spawning an unbounded number of OS threads. Instead, a fixed number of worker threads pull from a shared job queue using channels.

## Running
Run `cargo run` from this directory.
In a browser, open `http://127.0.0.1:8080/`. You can also open `http://127.0.0.1:8080/sleep` which will explicitly block the thread for 5 seconds to demonstrate that other concurrent connections remain unblocked.
