package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3" // Blank import required for driver registration
)

// A struct representing our row
type User struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type CreateUserRequest struct {
	Name string `json:"name"`
}

var db *sql.DB

func main() {
	var err error
	
	// 1. Open a database connection using the registered sqlite3 driver
	// An empty DSN or :memory: generates a transient in-memory database
	db, err = sql.Open("sqlite3", "file::memory:?cache=shared")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close() // defer closes resources immediately before the function exits

	// 2. Run initial schema migrations
	_, err = db.Exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL
		);
	`)
	if err != nil {
		log.Fatal("Failed to run migrations: ", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /users", handleListUsers)
	mux.HandleFunc("POST /users", handleCreateUser)

	fmt.Println("Server with Database running on http://localhost:8080")

	// 3. Start the Server
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func handleListUsers(w http.ResponseWriter, r *http.Request) {
	// Query returns a cursor (rows) over the results
	rows, err := db.Query("SELECT id, name FROM users")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User

	for rows.Next() {
		var u User
		// Scan reads from the current row into variables passed by pointer
		if err := rows.Scan(&u.ID, &u.Name); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Exec executes a prepared statement parameterized query natively handling SQL injection
	result, err := db.Exec("INSERT INTO users (name) VALUES (?)", req.Name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Determine the inserted ID
	id, _ := result.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(User{
		ID:   int(id),
		Name: req.Name,
	})
}
