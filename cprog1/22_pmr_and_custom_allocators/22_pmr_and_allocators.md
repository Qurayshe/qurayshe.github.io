# Module 22: Polymorphic Memory Resources (`std::pmr`) & Custom Arenas

Remember our minimal C Arena Allocator from Module 05? (●'◡'●)
A minimal bump allocator is the foundation of high-performance memory management, but in real engineering projects, you want **three separate upgrades** to turn that minimal arena into a production workhorse:

1. **Aligned arena**  
2. **Chunked arena**  
3. **Thread-safe arena**

Each upgrade changes *how* the arena behaves, but the core idea (bump pointer allocation) stays the same!
Here is each one independently, keeping the code clean, minimal, and engineering-grade. (*^▽^*)

---

## 1. Aligned Arena
Alignment means every allocation starts at an address that satisfies `alignof(T)` or a user-specified byte alignment.

### Why it matters
- SIMD types (`__m128`, `float4`) require 16-byte alignment.
- GPU upload buffers often require 256-byte alignment.
- Cache line alignment reduces false sharing.
- Returning misaligned pointers causes undefined behavior (UB) and hardware exceptions on some architectures! (*/ω＼*)

### Minimal aligned bump allocator

```cpp
#include <cstdlib>
#include <cstdint>
#include <algorithm>

struct AlignedArena {
    uint8_t* ptr;
    size_t   cap;
    size_t   off;

    AlignedArena(size_t n)
        : ptr((uint8_t*)std::malloc(n)), cap(n), off(0) {}

    static size_t align_up(size_t off, size_t alignment) {
        size_t mask = alignment - 1;
        return (off + mask) & ~mask;
    }

    void* alloc(size_t bytes, size_t alignment = alignof(std::max_align_t)) {
        size_t aligned = align_up(off, alignment);
        if (aligned + bytes > cap) return nullptr;
        void* p = ptr + aligned;
        off = aligned + bytes;
        return p;
    }

    template<typename T>
    T* alloc() {
        return reinterpret_cast<T*>(alloc(sizeof(T), alignof(T)));
    }

    void reset() { off = 0; }

    ~AlignedArena() { std::free(ptr); }
};
```

### What changed?
- We added `align_up()` using bitwise arithmetic.
- Every allocation bumps to the next properly aligned offset.
- Zero fragmentation, still blazing fast O(1)! (o゜▽゜)o

### Side-by-Side: Misaligned Raw Packing vs Aligned Arena

#### The "Bad" Approach: Raw Unaligned Byte Packing
```cpp
// BAD: Packing types at arbitrary byte offsets.
// A double (8B) or SIMD vector (16B) placed at an odd address crosses
// cache lines or causes a hardware crash on strict architectures!
char* raw = (char*)malloc(1024);
int* pInt = (int*)(raw + 1);       // Offset 1: NOT 4-byte aligned! (Slow bus fetch)
double* pDbl = (double*)(raw + 5); // Offset 5: NOT 8-byte aligned! (Split cache line penalty)
// Offset 13: Hardware crash if loaded via SIMD _mm_load_ps (requires 16B alignment)! (*/ω＼*)
```

#### The "Good" Technique: Aligned Arena with `align_up`
```cpp
// GOOD: align_up() guarantees every pointer satisfies alignof(T).
// Hardware cache lines are respected and SIMD instructions run at peak silicon speed!
AlignedArena arena(1024);

int* pInt = arena.alloc<int>();       // Offset 0:  4-byte aligned!
double* pDbl = arena.alloc<double>(); // Offset 8:  8-byte aligned (with 4B padding)!
auto* pVec = arena.alloc<__m128>();   // Offset 16: 16-byte aligned for flawless AVX/SSE! (●'◡'●)
```

#### Live Memory Layout Comparison

```
BAD: Misaligned Raw Memory (Crosses 64-Byte Cache Line Boundary)
[ 1B ][  4B int  ][     8B double      ][   16B SIMD Vector (CROSSES CACHE LINE!)   ]
  ^        ^               ^                            ^
Off 0    Off 1           Off 5                        Off 13 (Hardware Fault!)

GOOD: Aligned Arena (Strict Hardware Alignment with Padding)
[ 1B ][ 3B Pad ][  4B int  ][     8B double      ][   16B SIMD Vector (Aligned)   ]
  ^                ^               ^                            ^
Off 0            Off 4           Off 8                        Off 16 (Peak Performance!)
```

<div class="memory-interactive-sim" data-sim="alignment"></div>

---

## 2. Chunked Arena
A chunked arena grows dynamically by allocating new blocks whenever the current one fills up.

### Why it matters
- You avoid one giant contiguous allocation up front.
- You can grow gracefully without reallocating or copying existing data.
- Essential for Abstract Syntax Trees (ASTs), Entity Component Systems (ECS), and scripting runtimes where total size is unpredictable.

### Minimal chunked arena

```cpp
#include <vector>
#include <cstdlib>
#include <cstdint>

struct Chunk {
    uint8_t* ptr;
    size_t   cap;
    size_t   off;

    Chunk(size_t n) : ptr((uint8_t*)std::malloc(n)), cap(n), off(0) {}
    ~Chunk() { std::free(ptr); }
};

struct ChunkedArena {
    std::vector<Chunk*> chunks;
    size_t chunkSize;

    ChunkedArena(size_t chunkSize = 1024 * 1024)
        : chunkSize(chunkSize)
    {
        chunks.push_back(new Chunk(chunkSize));
    }

    void* alloc(size_t bytes) {
        Chunk* c = chunks.back();
        if (c->off + bytes > c->cap) {
            // Allocate a fresh chunk when current runs out!
            c = new Chunk(chunkSize);
            chunks.push_back(c);
        }
        void* p = c->ptr + c->off;
        c->off += bytes;
        return p;
    }

    template<typename T>
    T* alloc() {
        return reinterpret_cast<T*>(alloc(sizeof(T)));
    }

    void reset() {
        for (auto* c : chunks) delete c;
        chunks.clear();
        chunks.push_back(new Chunk(chunkSize));
    }

    ~ChunkedArena() {
        for (auto* c : chunks) delete c;
    }
};
```

### What changed?
- The arena now owns a linked list/vector of **multiple blocks**.
- Allocation remains O(1) amortized.
- Resetting frees all chunks at once with no individual deletes needed! q(≧▽≦q)

---

## 3. Thread-Safe Arena
Thread safety means multiple threads can allocate concurrently without corrupting the bump pointer.

### Two approaches:
1. **Coarse-grained lock** (simple, safe, but can suffer contention)
2. **Thread-local arenas** (lock-free, zero contention, lightning fast)

---

### A. Mutex-protected arena (Simple)

```cpp
#include <mutex>
#include <cstdlib>
#include <cstdint>

struct ThreadSafeArena {
    uint8_t* ptr;
    size_t   cap;
    size_t   off;
    std::mutex m;

    ThreadSafeArena(size_t n)
        : ptr((uint8_t*)std::malloc(n)), cap(n), off(0) {}

    void* alloc(size_t bytes) {
        std::lock_guard<std::mutex> lock(m);
        if (off + bytes > cap) return nullptr;
        void* p = ptr + off;
        off += bytes;
        return p;
    }

    template<typename T>
    T* alloc() {
        return reinterpret_cast<T*>(alloc(sizeof(T)));
    }

    void reset() {
        std::lock_guard<std::mutex> lock(m);
        off = 0;
    }

    ~ThreadSafeArena() { std::free(ptr); }
};
```

* **Pros:** Very simple to understand and correct.
* **Cons:** Lock contention serializes allocations across CPU cores, slowing down hot loops in servers or game engines.

---

### B. Thread-local arenas (The Real-World Solution)

```cpp
// 1 MB dedicated scratchpad per thread with zero mutex locks! (≧∇≦)ﾉ
thread_local AlignedArena tlsArena(1 << 20);

template<typename T>
T* tls_alloc() {
    return tlsArena.alloc<T>();
}
```

* **Pros:** Completely zero contention between threads; each thread runs at full silicon speed!
* **Cons:** Memory is partitioned per-thread, so you manage resets per thread (e.g. at the end of each frame or request cycle).

This is exactly how high-performance game engines, software renderers, and distributed servers handle per-request memory! (●'◡'●)

---

## 4. Summary: The Production Upgrades

| Feature | What it solves | Example Pattern |
| :--- | :--- | :--- |
| **Aligned Arena** | Hardware requirements (SIMD, GPU buffers, cache-line alignment) | `alloc(bytes, alignment)` |
| **Chunked Arena** | Growing memory dynamically without giant monolithic reallocations | `chunks.push_back(new Chunk)` |
| **Thread-Safe Arena** | Concurrent thread safety without memory race conditions | Mutex lock or `thread_local` |

---

## 5. The Modern Standard: C++17 `std::pmr`

In C++17, Polymorphic Memory Resources (`std::pmr`) take the arena concept and bake it directly into standard containers!

Instead of writing custom vectors for your arena, you pass `std::pmr::monotonic_buffer_resource` to standard STL collections:

```cpp
#include <array>
#include <vector>
#include <memory_resource>

std::array<std::byte, 1024> stack_buf;
std::pmr::monotonic_buffer_resource arena(stack_buf.data(), stack_buf.size());

// This vector allocates ZERO heap memory! Everything stays on the stack arena! (*^▽^*)
std::pmr::vector<int> vec(&arena);
vec.push_back(42);
```

---

## Hands-On Programs

1. [`22_arena_upgrades.cpp`](#systems/22_pmr_and_custom_allocators): Complete, runnable C++ implementation comparing Aligned, Chunked, and Thread-Safe arena allocators!
2. [`22_pmr_arena.cpp`](#systems/22_pmr_and_custom_allocators): Stack-backed PMR vectors and nested string arenas in action! (*/ω＼*)
