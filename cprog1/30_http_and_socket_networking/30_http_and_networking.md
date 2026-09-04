# Module 30: Web Frameworks & HTTP Parsers (Working Backwards)

When you write `@app.get("/api")` in Express or FastAPI, how does a raw network packet turn into a parsed request? (●'◡'●)

---

## 1. High-Level Concept: Web Routing

```python
@app.get("/api/users")
def get_users(req):
    return {"status": "ok"}
```

---

## 2. Low-Level Reality: Sockets & Zero-Copy String Slicing

1. The OS accepts a TCP connection and returns a **Socket File Descriptor** (Module 11).
2. The incoming stream is a raw byte stream:
   `POST /api/users HTTP/1.1\r\nHost: api.com\r\n\r\n{"id":1}`
3. Fast C parsers (like Node's `llhttp` or Nginx) **never allocate heap strings**. They use non-owning pointer slices (Module 03, 21) directly into the TCP socket buffer! (o゜▽゜)o

---

## Hands-On Program

Open [`30_raw_http_parser.c`](file:///c:/Users/kkhoie/Downloads/cprog1/30_http_and_socket_networking/30_raw_http_parser.c) to see a zero-copy HTTP/1.1 request parser in pure C! (≧∇≦)ﾉ
