# Module 12: Fixed-Size Pool & Free-List Allocators

Arenas are great for bulk freeing, but what if you need to create and destroy individual objects in arbitrary order without heap fragmentation? Enter Pool Allocators! (●'◡'●)

---

## 1. The Embedded Free-List Trick

A Fixed-Size Pool divides a memory buffer into equal slots (e.g. 64 bytes each).

The secret: **Unallocated slots themselves are used to store the linked list pointers!** Zero metadata overhead! q(≧▽≦q)

```
Free Pool (Slots store pointers to the next free slot):
[ Next -> Slot 1 ]   [ Next -> Slot 2 ]   [ Next -> Slot 3 ]   [ Next -> NULL ]
     Slot 0               Slot 1               Slot 2               Slot 3
       ^
  pool.free_list
```

---

## 2. Why Pools Rule:
- **Instant O(1) Alloc & Free:** Just pop/push from the free list head!
- **Zero External Fragmentation:** Holes can always be filled by any new object!

---

## Hands-On Program

Open [`12_pool_allocator.c`](file:///c:/Users/kkhoie/Downloads/cprog1/12_advanced_memory_allocators/12_pool_allocator.c) for a complete, industrial-grade Memory Pool implementation in pure C! (≧∇≦)ﾉ
