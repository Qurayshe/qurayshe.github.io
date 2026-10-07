/**
 * Module 22: Production Arena Upgrades (Aligned, Chunked, and Thread-Safe)
 *
 * Concepts demonstrated:
 * 1. AlignedArena: Guaranteeing power-of-two alignment for SIMD and GPU data.
 * 2. ChunkedArena: Dynamic growth via chained chunk blocks without reallocation.
 * 3. ThreadSafeArena: Coarse-grained mutex synchronization.
 * 4. Thread-Local Arena: Zero-contention ultra-fast scratchpads for multi-threaded systems.
 */

#include <iostream>
#include <vector>
#include <cstdlib>
#include <cstdint>
#include <algorithm>
#include <mutex>
#include <thread>
#include <cassert>

// ============================================================================
// 1. ALIGNED ARENA ALLOCATOR
// ============================================================================

struct AlignedArena {
    uint8_t* ptr;
    size_t   cap;
    size_t   off;

    AlignedArena(size_t n)
        : ptr(static_cast<uint8_t*>(std::malloc(n))), cap(n), off(0) {}

    static size_t align_up(size_t offset, size_t alignment) {
        size_t mask = alignment - 1;
        return (offset + mask) & ~mask;
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

// ============================================================================
// 2. CHUNKED ARENA ALLOCATOR
// ============================================================================

struct Chunk {
    uint8_t* ptr;
    size_t   cap;
    size_t   off;

    Chunk(size_t n) : ptr(static_cast<uint8_t*>(std::malloc(n))), cap(n), off(0) {}
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
            // Allocate a new chunk when the current one is full
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

// ============================================================================
// 3. THREAD-SAFE ARENA ALLOCATORS
// ============================================================================

// A. Mutex-Protected Arena (Simple, Safe)
struct ThreadSafeArena {
    uint8_t* ptr;
    size_t   cap;
    size_t   off;
    std::mutex m;

    ThreadSafeArena(size_t n)
        : ptr(static_cast<uint8_t*>(std::malloc(n))), cap(n), off(0) {}

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

// B. Thread-Local Arena (Zero Contention, High-Speed)
thread_local AlignedArena tlsArena(1024 * 1024); // 1 MB scratchpad per thread

template<typename T>
T* tls_alloc() {
    return tlsArena.alloc<T>();
}

// ============================================================================
// DEMONSTRATION & VERIFICATION
// ============================================================================

struct alignas(64) CacheAlignedData {
    uint64_t counters[8];
};

int main() {
    std::cout << "====================================================\n";
    std::cout << " 1. ALIGNED ARENA DEMO                              \n";
    std::cout << "====================================================\n";
    {
        AlignedArena arena(4096);

        // Allocate a single byte
        uint8_t* b = arena.alloc<uint8_t>();
        *b = 0xAA;
        std::cout << "Allocated uint8_t at:         " << static_cast<void*>(b) << "\n";

        // Allocate a 64-byte cache-aligned structure
        auto* data = arena.alloc<CacheAlignedData>();
        std::cout << "Allocated CacheAlignedData at: " << static_cast<void*>(data)
                  << " (Alignment check: " << (reinterpret_cast<uintptr_t>(data) % 64 == 0 ? "PASSED (64-byte aligned)" : "FAILED") << ")\n";
        std::cout << "Current arena offset:         " << arena.off << " bytes\n\n";
    }

    std::cout << "====================================================\n";
    std::cout << " 2. CHUNKED ARENA DEMO                              \n";
    std::cout << "====================================================\n";
    {
        // Use tiny 128-byte chunks to trigger chunk growth quickly
        ChunkedArena arena(128);

        std::cout << "Initial chunk count: " << arena.chunks.size() << "\n";
        for (int i = 0; i < 10; i++) {
            // Each allocation is 32 bytes -> will exceed 128 bytes after 4 allocations
            void* p = arena.alloc(32);
            std::cout << "  Allocation #" << (i + 1) << " at " << p
                      << " (Total active chunks: " << arena.chunks.size() << ")\n";
        }
        std::cout << "Final chunks allocated: " << arena.chunks.size() << "\n\n";
    }

    std::cout << "====================================================\n";
    std::cout << " 3. THREAD-SAFE & THREAD-LOCAL ARENAS               \n";
    std::cout << "====================================================\n";
    {
        // A. Mutex arena tested across threads
        ThreadSafeArena sharedArena(8192);
        std::thread t1([&sharedArena]() {
            for (int i = 0; i < 50; i++) {
                int* p = sharedArena.alloc<int>();
                if (p) *p = i;
            }
        });
        std::thread t2([&sharedArena]() {
            for (int i = 0; i < 50; i++) {
                int* p = sharedArena.alloc<int>();
                if (p) *p = i + 100;
            }
        });
        t1.join();
        t2.join();
        std::cout << "Mutex ThreadSafeArena total bytes allocated: " << sharedArena.off << " bytes\n";

        // B. Thread-local arena tested in a worker thread
        std::thread t3([]() {
            int* localVal = tls_alloc<int>();
            *localVal = 42;
            std::cout << "Thread-local alloc in Worker Thread at: " << static_cast<void*>(localVal)
                      << " with value: " << *localVal << "\n";
            tlsArena.reset();
        });
        t3.join();
    }

    std::cout << "\nAll arena upgrades executed successfully! (o゜▽゜)o\n";
    return 0;
}

