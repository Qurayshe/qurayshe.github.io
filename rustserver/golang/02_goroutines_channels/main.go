package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// A global channel we use to send jobs into a background worker pool
var jobChannel = make(chan string, 100)

func main() {
	// 1. Start a few background worker Goroutines
	for i := 1; i <= 3; i++ {
		go backgroundWorker(i, jobChannel)
	}

	http.HandleFunc("/process", func(w http.ResponseWriter, r *http.Request) {
		jobID := fmt.Sprintf("job-%d", time.Now().UnixNano())
		
		// 2. We send data to the channel. 
		// If the buffer is full, it blocks, otherwise it continues immediately. 
		jobChannel <- jobID
		
		log.Printf("Queued %s in the handler", jobID)
		
		fmt.Fprintf(w, "<h1>Job Queued!</h1><p>ID: %s</p><p>Check the server logs to see it processed.</p>", jobID)
	})

	fmt.Println("Concurrency Server running on http://localhost:8080")
	fmt.Println("Visit http://localhost:8080/process to queue background tasks")
	
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}

// this function acts as an isolated background worker running independently
func backgroundWorker(id int, jobs <-chan string) {
	for job := range jobs {
		log.Printf("[Worker %d] Started processing %s\n", id, job)
		
		// Simulate some heavy work
		time.Sleep(3 * time.Second)
		
		log.Printf("[Worker %d] Finished processing %s\n", id, job)
	}
}
