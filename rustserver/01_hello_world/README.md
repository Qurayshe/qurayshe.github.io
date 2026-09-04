# 01 - Hello World

This is the most basic Rust HTTP server. It uses nothing but the standard library (`std::net`) to bind to a TCP socket, listen for incoming connections, parse a basic HTTP GET request, and send a hardcoded HTTP response back.

## Key Concepts
* `std::net::TcpListener`: Used to bind to a port and accept incoming TCP connections.
* `std::io::{Read, Write}`: Traits that provide methods for reading from and writing to streams (like `TcpStream`).
* Basic HTTP Protocol: We manually write the `HTTP/1.1 200 OK` status line and headers. 

## How it works
1. We bind the server to `127.0.0.1:8080`.
2. The server blocks while waiting for incoming connections.
3. Once a connection is established, it reads the request stream.
4. It ignores the request path and responds with a static HTML message.

## Running
Run `cargo run` from this directory, and open `http://127.0.0.1:8080` in your browser.
