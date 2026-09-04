use multithreaded_server::ThreadPool;
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::time::Duration;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080").unwrap();
    let pool = ThreadPool::new(4);
    println!("Multithreaded Server running on http://127.0.0.1:8080 (Pool size: 4)");

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&mut stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, content) = match &request_line[..] {
        "GET / HTTP/1.1" => (
            "HTTP/1.1 200 OK",
            "<h1>Hello, Concurrency!</h1><p>Processed by the thread pool.</p>",
        ),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            (
                "HTTP/1.1 200 OK",
                "<h1>Awake after sleeping!</h1><p>Notice other requests didn't block.</p>",
            )
        }
        _ => (
            "HTTP/1.1 404 NOT FOUND",
            "<h1>404!</h1><p>Not found</p>",
        ),
    };

    let response = format!(
        "{}\r\nContent-Length: {}\r\nContent-Type: text/html\r\n\r\n{}",
        status_line,
        content.len(),
        content
    );

    stream.write_all(response.as_bytes()).unwrap();
}
