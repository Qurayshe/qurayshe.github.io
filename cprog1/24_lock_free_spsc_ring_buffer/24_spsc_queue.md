# Module 24: Capstone: Lock-Free SPSC Ring Buffer Queue

Mutex locks cause thread scheduling latency. In high-frequency trading and game audio, you want lock-free data streaming! (●'◡'●)

---

## 1. The SPSC Ring Buffer Architecture

A fixed-size circular array with atomic `head` and `tail` indices:
- Producer writes to `tail` with `memory_order_release`.
- Consumer reads from `head` with `memory_order_release`.
- `alignas(64)` separates `head` and `tail` to eliminate False Sharing!

```
Ring Buffer Slots (Capacity = 4):
[ Slot 0 ]    [ Slot 1 ]    [ Slot 2 ]    [ Slot 3 ]
    ^                          ^
   head                       tail
```

---

## Hands-On Program

Open [`24_spsc_ring_buffer.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/24_lock_free_spsc_ring_buffer/24_spsc_ring_buffer.cpp) to see 1,000,000 messages stream across threads with zero locks! (*^▽^*)
