package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// DTOs (Data Transfer Objects)
// The struct tags (`json:"..."`) map struct fields to JSON keys.
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateUserRequest struct {
	Name string `json:"name"`
	Role string `json:"role"`
}

type APIResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// In-Memory map to act as our database
// Notice the sync.Mutex; because Go HTTP handles requests concurrently
// across many goroutines, maps MUST be protected from concurrent reads/writes.
var (
	users DB
)

type DB struct {
	mu     sync.RWMutex
	data   map[int]User
	nextID int
}

func main() {
	// Initialize our in-memory storage
	users = DB{
		data:   make(map[int]User),
		nextID: 1,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /users", handleGetUsers)
	mux.HandleFunc("POST /users", handleCreateUser)

	fmt.Println("JSON API Server running on http://localhost:8080")
	fmt.Println("Try: curl http://localhost:8080/users")

	log.Fatal(http.ListenAndServe(":8080", mux))
}

func handleGetUsers(w http.ResponseWriter, r *http.Request) {
	// 1. Read lock because several goroutines might list users simultaneously
	users.mu.RLock()
	defer users.mu.RUnlock()

	userList := make([]User, 0, len(users.data))
	for _, u := range users.data {
		userList = append(userList, u)
	}

	// 2. Set the proper response headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	// 3. Encode the slice directly into the HTTP response buffer
	json.NewEncoder(w).Encode(APIResponse{
		Message: "Success",
		Data:    userList,
	})
}

func handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	
	// 1. Decode the JSON body from the Request stream natively
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Message: "Invalid JSON body"})
		return
	}

	if req.Name == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(APIResponse{Message: "Name is required"})
		return
	}

	// 2. Write lock because we are mutating the map
	users.mu.Lock()
	defer users.mu.Unlock()

	newUser := User{
		ID:        users.nextID,
		Name:      req.Name,
		Role:      req.Role,
		CreatedAt: time.Now(),
	}

	users.data[users.nextID] = newUser
	users.nextID++

	// 3. Send successful JSON response back
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(APIResponse{
		Message: "User created successfully",
		Data:    newUser,
	})
}
