# 01 - Hello World

This is the most basic Go HTTP server. Wait... where is the raw TCP socket work? 
In Go, the standard library `net/http` is so powerful and optimized that it's practically the only way servers are built. It handles pooling, multiplexing, and concurrent connections out of the box. Every incoming request is automatically handled in its own lightweight Goroutine.

## Key Concepts
* `net/http`: Used to start the server and handle requests.
* `http.HandleFunc`: A convenient way to register a function to handle a specific route.
* `http.ResponseWriter` & `*http.Request`: The core interfaces for interacting with an HTTP request and writing the response.

## How it works
1. We register a handler function for the `/` route.
2. We call `http.ListenAndServe(":8080", nil)` which binds to port 8080.
3. The server blocks and listens for connections, automatically spawning a goroutine for each request.

## Running
Run `go run main.go` from this directory, and open `http://localhost:8080` in your browser.
