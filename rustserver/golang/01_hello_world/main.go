package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// Register a handler function for the root path "/"
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Received a request!")
		
		// Write the HTTP response status code (optional, defaults to 200)
		w.WriteHeader(http.StatusOK)
		
		// Write the HTML body to the ResponseWriter
		fmt.Fprint(w, "<h1>Hello from the Go Standard Library!</h1><p>You've successfully reached the basics of Go server development.</p>")
	})

	fmt.Println("Server running on http://localhost:8080")
	
	// Start the server on port 8080
	// This will block forever unless an error occurs
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}
