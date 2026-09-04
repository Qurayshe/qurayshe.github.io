# 06 - Modern Deployment

This final stage adds the crucial pieces required when dropping a Go server into a modern deployment environment like a Kubernetes pod. It adds structured logging via the new `log/slog` standard library package (added in Go 1.21), and handles precise graceful shutdowns when receiving system termination signals like `SIGTERM`.

## Highlights
* **Structured Logging**: Using `log/slog`, not `log.Printf`. In production, this emits JSON lines that are indexable by observability tools like Loki or Datadog.
* **Graceful Shutdown**: Wrapping the web server in an OS Signal listener. When a shutdown signal is received, we call `server.Shutdown(ctx)`. This completely halts new incoming connections and waits for any active/in-flight Goroutine handlers to finish their requests before truly exiting the application.
* **Context**: Context propagation is an essential part of robust Go services. Here we use it with a timeout to forcefully kill hanging connections if they take longer than 10 seconds to finish.

## Execution
Run `go run main.go`. Attempt to hit the endpoint via `curl localhost:8080/`. You'll see structured JSON log spans. Try holding `CTRL+C`, and you will see the server wait for current connections before it returns cleanly.
