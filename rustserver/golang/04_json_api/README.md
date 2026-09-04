# 04 - REST JSON API

This project builds a simple JSON REST API. You'll learn how to handle JSON payloads natively in Go.

## Key Concepts
* `encoding/json` standard library.
* Struct tags (`json:"first_name"`).
* Handlers setting response headers correctly (`Content-Type: application/json`).
* `json.NewDecoder` vs `json.Unmarshal`.
* `json.NewEncoder(w).Encode(response)` vs `json.Marshal`. 

## Best Practices
We use `json.NewDecoder(r.Body)` because it directly streams the body from the network into memory instead of allocating the entire body strictly into a slice before decoding. Likewise, `json.NewEncoder(w)` directly writes back to the HTTP stream.

## Running
Run `go run main.go` from this directory.
You can list users via a `GET` request, and create one via a `POST` request:

**Create user:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Alice","role":"Admin"}' \
  http://localhost:8080/users
```

**List users:**
```bash
curl http://localhost:8080/users
```
