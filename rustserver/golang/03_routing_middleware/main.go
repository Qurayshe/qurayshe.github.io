package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// Middleware pattern: Takes an http.Handler and returns a new http.Handler
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Continue executing the handler chain
		next.ServeHTTP(w, r)
		
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

// Ensure the Request Method isn't abused
func RequireJSONMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Content-Type") != "application/json" {
			// Middleware can reject early before reaching your handler!
			http.Error(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()

	// 1. Basic routing with HTTP Method constraints (Go 1.22 feature)
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Welcome to the API Root (GET only)")
	})

	// 2. Routing with Path Variables (Go 1.22 feature)
	mux.HandleFunc("GET /items/{id}", func(w http.ResponseWriter, r *http.Request) {
		// retrieve {id} natively
		id := r.PathValue("id")
		fmt.Fprintf(w, "You requested item ID: %s", id)
	})

	// 3. Routing a POST request
	mux.HandleFunc("POST /submit", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Successfully POSTed a submission")
	})

	// Wrap our MUX entirely inside the LoggingMiddleware
	handler := LoggingMiddleware(mux)

	fmt.Println("Routing Server running on http://localhost:8080")
	fmt.Println("Try: curl http://localhost:8080/items/42")

	err := http.ListenAndServe(":8080", handler)
	if err != nil {
		log.Fatal(err)
	}
}
