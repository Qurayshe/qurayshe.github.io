use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080").unwrap();
    println!("Server running on http://127.0.0.1:8080");

    for stream in listener.incoming() {
        let stream = stream.unwrap();
        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];

    // Read the request data
    stream.read(&mut buffer).unwrap();
    println!("Request received!");

    let contents = "<h1>Hello from the Rust Standard Library!</h1><p>You've successfully reached the basics of Rust server development.</p>";
    
    // Format the HTTP response
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{}",
        contents.len(),
        contents
    );

    // Send the response back to the client
    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}
