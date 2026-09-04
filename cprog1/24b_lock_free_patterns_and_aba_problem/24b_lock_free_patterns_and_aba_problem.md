# Module 24b: Lock-Free Algorithms, CAS Loops & The ABA Problem

In Module 24, we built a Single-Producer Single-Consumer (SPSC) ring buffer with atomics. But what happens when **multiple threads simultaneously push and pop** without any mutex locks? (●'◡'●)
Welcome to **Multi-Producer Multi-Consumer (MPMC) Lock-Free Structures, CAS Loops, and the notorious ABA Problem**! q(≧▽≦q)

---

## 1. The CAS (Compare-And-Swap) Atomic Primitive

The foundational atomic primitive of lock-free programming is CAS:
```cpp
bool std::atomic<T>::compare_exchange_weak(T& expected, T desired);
```
In hardware (`cmpxchg` on x86), the CPU tests: *"Is memory still equal to `expected`? If yes, store `desired` atomically; if not, reload current memory into `expected`!"*

```cpp
void lock_free_push(Node* new_node) {
    new_node->next = head.load();
    // CAS loop: retry if another thread pushed in the meantime!
    while (!head.compare_exchange_weak(new_node->next, new_node)) {
        // Retry!
    }
}
```

---

## 2. The Infamous ABA Problem

Suppose a lock-free stack has nodes: `[A] -> [B] -> [C]`:

```
1. Thread 1 starts popping: reads Top = [A], observes Next = [B].
2. Thread 1 is preempted by the OS scheduler!
3. Thread 2 pops [A], pops [B], and frees memory for [B].
4. Thread 2 allocates a new node which happens to get memory address [A] again!
5. Thread 2 pushes [A] back on top: [A] -> [C].
6. Thread 1 wakes up: performs CAS(Top, [A], [B]).
   -> CAS succeeds because Top is [A]!
   -> But [B] was already FREED! Top now points to garbage/dangling pointer! BOOM! (x_x)
```

---

## 3. How to Solve ABA

| Technique | How It Works | Tradeoff |
| :--- | :--- | :--- |
| **Tagged Pointers (Double-word CAS)** | Packs a 64-bit pointer + 64-bit incrementing sequence counter into 128 bits (`cmpxchg16b`). | Simple & effective |
| **Hazard Pointers** | Readers publish thread-local pointers they are currently reading; memory cannot be freed until cleared. | Low overhead |
| **Epoch-Based Reclamation (EBR)** | Global epoch counter (e.g. RCU in Linux kernel); garbage is freed when all threads advance epoch. | Very high throughput |

---

## Hands-On Program

Open [`24b_lock_free_stack_aba.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/24b_lock_free_patterns_and_aba_problem/24b_lock_free_stack_aba.cpp) to observe a lock-free Treiber stack with atomic CAS loops in action! (*^▽^*)
