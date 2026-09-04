use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Async Server running on http://127.0.0.1:8080");

    loop {
        let (mut socket, _) = listener.accept().await?;

        // `tokio::spawn` creates a lightweight task that runs on the Tokio runtime
        // it doesn't map directly to an OS thread, making it much cheaper.
        tokio::spawn(async move {
            let mut buf = [0; 1024];

            // In a real app we'd decode this stream properly (like using hyper)
            // But here we are just demonstrating raw async reading
            let n = match socket.read(&mut buf).await {
                Ok(n) if n == 0 => return,
                Ok(n) => n,
                Err(e) => {
                    eprintln!("failed to read from socket; err = {:?}", e);
                    return;
                }
            };

            let request = String::from_utf8_lossy(&buf[..n]);
            let (status_line, content) = if request.starts_with("GET / ") || request.starts_with("GET / HTTP") {
                (
                    "HTTP/1.1 200 OK",
                    "<h1>Hello Async!</h1><p>Powered by Tokio.</p>".to_string(),
                )
            } else if request.starts_with("GET /sleep") {
                // Notice we use tokio::time::sleep, not std::thread::sleep
                // This doesn't block the OS thread, it just yields the task.
                sleep(Duration::from_secs(5)).await;
                (
                    "HTTP/1.1 200 OK",
                    "<h1>Woke up from async sleep!</h1>".to_string(),
                )
            } else {
                (
                    "HTTP/1.1 404 NOT FOUND",
                    "<h1>404 Not Found</h1>".to_string(),
                )
            };

            let response = format!(
                "{}\r\nContent-Length: {}\r\nContent-Type: text/html\r\n\r\n{}",
                status_line,
                content.len(),
                content
            );

            if let Err(e) = socket.write_all(response.as_bytes()).await {
                eprintln!("failed to write to socket; err = {:?}", e);
            }
        });
    }
}
