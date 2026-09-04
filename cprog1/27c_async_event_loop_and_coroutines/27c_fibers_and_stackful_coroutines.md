# Module 27c: Fibers, Green Threads & Stackful Coroutines

How do languages like **Go (Goroutines) and Erlang (Actors)** spin up **100,000 concurrent tasks** with negligible CPU overhead? (●'◡'●)
Unlike OS threads which require expensive kernel context switches and 8MB stacks, **Fibers (Stackful Coroutines)** run entirely in user-space with lightweight 4KB stacks! q(≧▽≦q)

---

## 1. Stackless vs Stackful Coroutines

| Feature | Stackless (C++20 `co_await`, Python `async/await`, JS) | Stackful (Go Goroutines, Fibers, Lua Coroutines) |
| :--- | :--- | :--- |
| **Stack Allocation** | No separate stack; variables live in compiler heap frame. | Owns a dedicated miniature stack (e.g. 4KB-64KB). |
| **Yield Location** | Can ONLY yield from top-level `async` function. | Can yield from **deeply nested function calls**! |
| **Mechanics** | Compiler transforms function into a `switch`-case state machine. | Fast CPU register swap (`RSP`, `RBP`, `RIP`) in ~10 nanoseconds! |

---

## 2. The Mechanics of a User-Space Context Switch

When switching from Fiber A to Fiber B:
1. Push callee-saved registers (`RBX, RBP, R12-R15`) onto Fiber A's stack.
2. Save Fiber A's current stack pointer `%rsp` into Fiber A's control block.
3. Load Fiber B's saved stack pointer into `%rsp`!
4. Pop Fiber B's saved registers and execute `ret` to resume Fiber B!

```
[ Fiber A Stack ]                            [ Fiber B Stack ]
+---------------------+                      +---------------------+
| Saved Registers     |                      | Saved Registers     |
| Return Address (RIP)|                      | Return Address (RIP)|
+---------------------+                      +---------------------+
          ^                                            ^
          | (RSP swapped in silicon!)                  |
          +-----------------> %rsp <-------------------+
```

---

## Hands-On Program

Open [`27c_cooperative_fiber_scheduler.c`](file:///c:/Users/kkhoie/Downloads/cprog1/27c_async_event_loop_and_coroutines/27c_cooperative_fiber_scheduler.c) to inspect a working cooperative user-space coroutine scheduler! (*^▽^*)
