# 06 - Modern Deployment

This final stage adds the crucial pieces required when dropping a Rust server into a modern deployment environment like a Kubernetes pod, or a standard Linux process. It adds structured logging via the `tracing` ecosystem, and handles precise graceful shutdowns when receiving system termination signals like `SIGTERM`.

## Highlights
* **Structured Logging**: Using `tracing`, not `println!`. In production, this can emit JSON lines for services like Loki or Datadog.
* **Graceful Shutdown**: Wrapping the web framework in a `tokio::signal` listener. This ensures that any in-flight asynchronous requests are allowed to finish before the server actually exits.
* **Environment Filters**: Reads your `RUST_LOG` environment variables to control logging levels without recompiling.

## Execution
Try starting the server with `RUST_LOG=debug cargo run`. Attempt to `curl` the endpoint, and you'll see deep structured spans showing detailed times of execution. Try hitting `CTRL+C`, and you will see the server cleanly shut down instead of aggressively aborting.
