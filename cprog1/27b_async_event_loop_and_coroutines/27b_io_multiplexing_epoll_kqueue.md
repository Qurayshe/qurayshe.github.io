# Module 27b: I/O Multiplexing, `epoll`, `kqueue` & The Reactor Pattern

How does Nginx or Node.js handle **1,000,000 concurrent network connections** on a single machine with only 4 CPU cores? (●'◡'●)
If you spawned 1 thread per connection, 1M threads with 8MB stacks would require **8 Terabytes of RAM**! (x_x)
Welcome to **Asynchronous I/O Multiplexing with `epoll` and the Reactor Pattern**! q(≧▽≦q)

---

## 1. The Evolution of Socket I/O

```
1. Blocking I/O (One thread per client)
   -> 10,000 threads = Context switch thrashing & RAM exhaustion!

2. select() / poll() (O(N) Scanning)
   -> User space passes an array of 10,000 file descriptors to the kernel every loop.
   -> Kernel scans all 10,000 items linearly to find the 2 that have data! Slow!

3. epoll (Linux) / kqueue (BSD/macOS) / IOCP (Windows) (O(1) Kernel Ready List)
   -> Sockets are registered once into a kernel Red-Black tree.
   -> When network packets arrive via NIC interrupt, kernel places the ready socket
      directly onto a Doubly-Linked Ready List!
   -> epoll_wait() returns ONLY the sockets with active data in O(1) time! (o゜▽゜)o
```

---

## 2. Level-Triggered (LT) vs Edge-Triggered (ET)

- **Level-Triggered (Default)**: `epoll_wait` keeps notifying you as long as there is unread data in the socket buffer.
- **Edge-Triggered (`EPOLLET`)**: `epoll_wait` notifies you **only once** when new data transitions onto the socket. You MUST read in a `while` loop until `EAGAIN` or `EWOULDBLOCK`! (Fastest, zero redundant wakeups!)

---

## 3. The Reactor Pattern

```
                 +-----------------------+
                 |   epoll_wait() Event  |
                 |      Demultiplexer    |
                 +-----------------------+
                             |
             +---------------+---------------+
             |                               |
             v                               v
    [ Read Handler ]                [ Write Handler ]
  (Non-blocking read)             (Non-blocking flush)
```

---

## Hands-On Program

Open [`27b_epoll_reactor_pattern.c`](file:///c:/Users/kkhoie/Downloads/cprog1/27b_async_event_loop_and_coroutines/27b_epoll_reactor_pattern.c) to inspect non-blocking pipe event registration and event loop dispatching! (*^▽^*)
