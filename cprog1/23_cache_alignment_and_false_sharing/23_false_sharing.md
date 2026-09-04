# Module 23: Cache Alignment & False Sharing

In multi-threaded code, False Sharing is the stealth performance killer that ruins multicore scaling! (●'◡'●)

---

## 1. What is False Sharing?

If Thread 1 (Core 1) writes to `var_a`, and Thread 2 (Core 2) writes to `var_b`, and both live inside the **same 64-byte CPU cache line**:
- Core 1 writes -> Core 2's cache line is invalidated! (⊙_⊙;)
- Core 2 writes -> Core 1's cache line is invalidated!
- The CPU cores waste all their cycles playing cache-line ping-pong! (╯°□°)╯︵ ┻━┻

---

## 2. The Solution: `alignas(64)`

```cpp
struct CleanCounters {
    alignas(64) uint64_t counter_a; // Cache Line 1
    alignas(64) uint64_t counter_b; // Cache Line 2
};
```
Now both CPU cores run at 100% speed with zero interference! q(≧▽≦q)

---

## Hands-On Program

Run the benchmark in [`23_false_sharing_benchmark.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/23_cache_alignment_and_false_sharing/23_false_sharing_benchmark.cpp) to watch cache padding double your multi-threaded throughput! (o゜▽゜)o
