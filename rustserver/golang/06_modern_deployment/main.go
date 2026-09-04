package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// Initialize standard structured JSON logger.
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))

	slog.SetDefault(logger)

	slog.Info("Starting server setup", slog.String("version", "v1.0.0"))

	mux := http.NewServeMux()
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		// Outputting JSON logs inside handlers
		slog.Debug("Home endpoint was accessed", 
			slog.String("path", r.URL.Path), 
			slog.String("client", r.RemoteAddr),
		)
		
		fmt.Fprint(w, "Welcome to the Production Ready Server!")
	})

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	// Because `server.ListenAndServe()` blocks forever, 
	// we start it in a separate Goroutine so the main Goroutine continues executing.
	go func() {
		slog.Info("Listening", slog.String("addr", server.Addr))
		
		err := server.ListenAndServe()
		
		// When we call `server.Shutdown()` later on, ListenAndServe will exit
		// and return the specific error http.ErrServerClosed. That is an expected error!
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("ListenAndServe failed fatally", slog.Any("error", err))
			os.Exit(1)
		}
	}()

	// Context channel logic for Graceful Shutdown
	quit := make(chan os.Signal, 1)

	// We notify the strictly buffered `quit` channel if we receive a termination signal
	// os.Interrupt usually means CTRL+C
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	// Block the main thread until a signal is received
	s := <-quit
	slog.Info("Received OS signal, starting graceful shutdown", slog.String("signal", s.String()))

	// Create a context specifying the absolute maximum time we will wait 
	// for active connections to finish before killing them.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel() // ensuring context cancellation frees resources

	// `server.Shutdown()` will:
	// 1. Immediately kill the base listener (stop accepting new connections).
	// 2. Wait until all active requests (Goroutines) finish returning a response.
	// 3. Close connection and return out of the `Shutdown` call.
	err := server.Shutdown(ctx)
	if err != nil {
		slog.Error("Server forced to shutdown aggressively", slog.Any("error", err))
	} else {
		slog.Info("Server shutdown cleanly")
	}
}
