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

## 3. Side-by-Side: Variable Malloc vs Fixed-Size Pool

### The "Bad" Approach: Variable-Size Heap Allocations
```c
// BAD: Allocating and freeing heterogeneous sizes (16B, 64B, 128B).
// Over time, small freed holes are too small to fit new larger objects,
// causing allocation failure (OOM) even when 50% of total memory is free!
void *p1 = malloc(16);
void *p2 = malloc(64);
void *p3 = malloc(16);
free(p2); // 64-byte gap

void *p4 = malloc(128); // Cannot fit in the 64-byte gap! Must allocate new memory! (*/ω＼*)
```

### The "Good" Technique: Fixed-Size Slot Pool with Free-List
```c
// GOOD: Every slot is the exact same size (e.g. 64B).
// Any freed slot is guaranteed to fit ANY new object.
// Zero external fragmentation!
Pool pool = pool_init(64, 100); // 100 slots of 64 bytes

void *p1 = pool_alloc(&pool); // Pops from free list in O(1)
void *p2 = pool_alloc(&pool);
pool_free(&pool, p1);         // Pushes p1 to free list in O(1)

void *p3 = pool_alloc(&pool); // Instantly reuses slot p1! (●'◡'●)
```

### Live Memory Layout Comparison

```
BAD: Naive Dynamic Heap (External Fragmentation Holes)
[ 16B Alloc ][ 64B Free Hole ][ 16B Alloc ][ 32B Free Hole ][ 64B Alloc ]
                     ^
       Cannot fit a new 128B object despite 96B free!

GOOD: Fixed-Size Slot Pool (100% Reusable Uniform Slots)
[ Slot 0: Used ][ Slot 1: Free (Next->3) ][ Slot 2: Used ][ Slot 3: Free (Next->NULL) ]
                     ^
         Guaranteed to fit any new entity in O(1)!
```

<div class="memory-interactive-sim" data-sim="pool"></div>

---

## Hands-On Program

Open [`12_pool_allocator.c`](#systems/12_advanced_memory_allocators) for a complete, industrial-grade Memory Pool implementation in pure C! (≧∇≦)ﾉ
