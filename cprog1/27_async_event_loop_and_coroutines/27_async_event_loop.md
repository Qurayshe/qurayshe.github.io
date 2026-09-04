# Module 27: Async/Await & Event Loops (Working Backwards)

In Node.js and Python `asyncio`, a single thread can handle 50,000 open connections without breaking a sweat! How? (●'◡'●)

---

## 1. High-Level Concept: Async / Await

```javascript
async function getData() {
    let res = await fetch("/api"); // Pauses here
    console.log(res);              // Resumes when data arrives! (*^▽^*)
}
```

---

## 2. Low-Level Reality: Non-Blocking I/O & State Machines

### The Kernel Engine: `epoll` (Module 11)
Instead of blocking on `read()`, the thread puts sockets in `O_NONBLOCK` mode and asks the kernel: *"Tell me which of these 50,000 sockets have data ready!"*

### How `async/await` is Compiled:
The compiler secretly converts your async function into a **C State Machine struct**:
```c
struct Coroutine {
    int state; // 0: start, 1: waiting, 2: done
    void* local_vars;
};
```
When you hit `await`, the function saves its state and **returns immediately** to the event loop so other tasks can run! q(≧▽≦q)

---

## Hands-On Program

Open [`27_micro_event_loop.c`](file:///c:/Users/kkhoie/Downloads/cprog1/27_async_event_loop_and_coroutines/27_micro_event_loop.c) for a complete, single-threaded async event loop and coroutines in C! (≧∇≦)ﾉ
