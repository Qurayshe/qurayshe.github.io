# 05 - Database Integration

This example integrates a relational database using Go's standard `database/sql` interface. Similar to our Rust example we use an in-memory `SQLite` database via `github.com/mattn/go-sqlite3`. 

## Key Concepts
* `database/sql`: The standard interface for SQL databases in Go. It abstracts away the driver.
* Driver imports: Notice the `_ "github.com/mattn/go-sqlite3"` blank import. This triggers the driver initialization so `sql.Open("sqlite3",...)` finds it.
* Query execution without blocking: the standard `database/sql` handles connection pooling internally automatically. You execute queries synchronously from your handler Goroutine without worrying about OS thread starvation!
* `DB.Exec()`, `DB.QueryRow()`, `DB.Query()`.

## Running
Run `go run main.go` from this directory.
It exposes a JSON API: 
* `GET /users`: List users in the DB.
* `POST /users`: Supply `{"name": "Alice"}` to add a new user.
