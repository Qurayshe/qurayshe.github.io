# Module 05: Dynamic Memory Allocation & Custom Allocators

Stack memory is fast, but it vanishes when functions return. The **Heap** is where memory lives as long as you want! (●'◡'●)

---

## 1. The Standard Dynamic Toolkit (`<stdlib.h>`)

- `malloc(size)`: Grabs raw bytes from the heap (uninitialized).
- `calloc(n, size)`: Grabs bytes and zeroes them out for you! (*^▽^*)
- `realloc(ptr, new_size)`: Resizes an existing allocation.
- `free(ptr)`: Returns memory back to the OS.

---

## 2. The Classic Memory Bug Hall of Fame

1. **Memory Leak:** Allocating and losing the pointer. Memory stays held hostage!
2. **Dangling Pointer:** A pointer pointing to memory you already freed.
3. **Use-After-Free (UAF):** Dereferencing a dangling pointer (major security bug!).
4. **Double Free:** Freeing the same pointer twice. (Always set `ptr = NULL;` after freeing! (*/ω＼*))

---

## 3. The Secret Weapon: Arena Allocators (Bump Allocators)

Calling `malloc` thousands of times per second causes heap fragmentation and slow syscalls.
Game engines and high-perf systems use **Arena Allocators**:
1. Pre-allocate one big buffer (e.g. 1 MB).
2. Allocate by simply bumping an offset forward (blazing fast O(1)!).
3. Free **everything at once** by resetting `offset = 0;`! (o゜▽゜)o

```
Arena Buffer (64 KB):
+-------------------+--------------------+--------------------------------+
| Chunk 1 (8B)      | Chunk 2 (64B)      | Free Unused Space              |
+-------------------+--------------------+--------------------------------+
                                         ^
                                    arena.offset (Bumps forward!)
```

---

## 4. Side-by-Side: Naive Heap vs Linear Arena

To see why arenas are so much faster, let's compare the naive approach against the arena technique side by side:

### The "Bad" Approach: Naive `malloc` / `free`
```c
// BAD: 1,000 separate syscalls, 1,000 metadata headers (16B each),
// and freeing out of order leaves fragmented "swiss cheese" holes!
for (int i = 0; i < 1000; i++) {
    Entity *e = (Entity *)malloc(sizeof(Entity)); // Slow lock & heap search
    process(e);
    if (should_drop(e)) {
        free(e); // Leaves an isolated hole in the heap!
    }
}
// Problem: If you lose even one pointer, you leak memory forever! (*/ω＼*)
```

### The "Good" Technique: Linear Arena Bump Allocator
```c
// GOOD: 1 single pre-allocation, 0 per-object metadata headers,
// zero fragmentation, and instant O(1) bulk reset!
Arena arena = arena_init(1024 * 1024); // 1 MB buffer

for (int i = 0; i < 1000; i++) {
    Entity *e = (Entity *)arena_alloc(&arena, sizeof(Entity)); // Just bumps an offset!
    process(e);
}

// Instant O(1) cleanup: All 1,000 entities freed in 0 nanoseconds!
arena_reset(&arena); // offset = 0 (●'◡'●)
```

### Live Memory Layout Comparison

```
BAD: Naive Heap after random free() calls (Fragmentation & Metadata Overhead)
[16B Hdr][Entity 1][16B Hdr][ HOLE ][16B Hdr][Entity 3][16B Hdr][ LEAK (Lost Ptr!) ]
                               ^
                  Scattered unusable gaps!

GOOD: Linear Arena Memory Space (Contiguous & Zero Fragmentation)
[Entity 1][Entity 2][Entity 3][ Unallocated Free Buffer Capacity...           ]
                              ^
                         arena.offset (Bumps forward cleanly!)
```

<div class="memory-interactive-sim" data-sim="arena"></div>

---

## 5. The Path to Production: What's Missing?

Our minimal arena in [`05_simple_arena.c`](#systems/05_dynamic_memory) is fast and sweet, but in production game engines and high-throughput servers, three real-world issues immediately come up:
1. **Alignment:** SIMD registers (AVX/SSE) and GPU buffers require addresses aligned to 16, 32, or 256 bytes.
2. **Growing Capacity:** What happens when the fixed buffer runs out? You need a chunked arena that links a new block instead of aborting.
3. **Multi-Threading:** Multiple worker threads bumping the same offset causes race conditions without mutex locking or thread-local storage.

We explore all three engineering-grade upgrades and C++ polymorphic memory resources in [Module 22: PMR & Custom Allocators](#systems/22_pmr_and_custom_allocators)! (*^▽^*)

---

## Hands-On Programs

1. [`05_heap_memory.c`](#systems/05_dynamic_memory): Safe dynamic array vector implementation.
2. [`05_simple_arena.c`](#systems/05_dynamic_memory): A complete, super-fast Arena Allocator in ~70 lines of clean C!
