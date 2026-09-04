# 02 - Goroutines & Channels

This project demonstrates how Go handles concurrency. Unlike other languages that use OS Threads explicitly (or complicated `async`/`await` macros), Go uses **Goroutines**. They are incredibly lightweight threads managed by the Go runtime.

## Key Concepts
* `go` keyword: Starts a new Goroutine.
* Channels (`make(chan Type)`): Used to pass data between Goroutines safely without requiring external locks (Mutexes). 
* Select statement: A powerful construct to multiplex across multiple channels simultaneously.
* `sync.WaitGroup`: A synchronization primitive to wait for a collection of Goroutines to finish executing.

## Architecture
In a Go web server, every incoming HTTP request automatically runs in its own Goroutine. In this example, we take it a step further: an endpoint will spawn background worker Goroutines to simulate heavy email processing while immediately returning a response back to the client.

## Running
Run `go run main.go` from this directory.
In a browser, open `http://localhost:8080/process` which returns a response immediately while background tasks continue processing in the terminal logs.
