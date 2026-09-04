/**
 * Module 23: Cache Alignment, alignas(64) & Eliminating False Sharing
 *
 * Concepts demonstrated:
 * 1. CPU 64-byte cache line structure and alignof operator.
 * 2. Unpadded struct layout: adjacent variables sharing a cache line.
 * 3. alignas(64) cache-line padding to isolate variables across CPU cores.
 * 4. Multi-threaded benchmark measuring false sharing latency penalty.
 */

#include <iostream>
#include <thread>
#include <chrono>
#include <cstdint>

// Typical x86/ARM hardware cache line size: 64 bytes
constexpr size_t CACHE_LINE_SIZE = 64;

// Case 1: False Sharing Hazard (Both counters share the same 64-byte line)
struct FalseSharingCounters {
    uint64_t counter_a{0};
    uint64_t counter_b{0};
};

// Case 2: Padded to separate 64-byte cache lines
struct alignas(CACHE_LINE_SIZE) CleanCounters {
    alignas(CACHE_LINE_SIZE) uint64_t counter_a{0};
    alignas(CACHE_LINE_SIZE) uint64_t counter_b{0};
};

constexpr uint64_t ITERATIONS = 100'000'000;

void worker(uint64_t* counter) {
    for (uint64_t i = 0; i < ITERATIONS; i++) {
        (*counter)++;
    }
}

int main() {
    std::cout << "====================================================\n";
    std::cout << " 1. MEMORY LAYOUT & OFFSETS                         \n";
    std::cout << "====================================================\n";
    FalseSharingCounters unpadded;
    CleanCounters padded;

    std::cout << "Unpadded: &counter_a = " << (void*)&unpadded.counter_a
              << ", &counter_b = " << (void*)&unpadded.counter_b
              << " (Distance: " << (uint8_t*)&unpadded.counter_b - (uint8_t*)&unpadded.counter_a
              << " bytes -> SAME CACHE LINE!)\n";

    std::cout << "Padded  : &counter_a = " << (void*)&padded.counter_a
              << ", &counter_b = " << (void*)&padded.counter_b
              << " (Distance: " << (uint8_t*)&padded.counter_b - (uint8_t*)&padded.counter_a
              << " bytes -> SEPARATE CACHE LINES!)\n\n";

    std::cout << "====================================================\n";
    std::cout << " 2. MULTITHREADED BENCHMARK (100M Increments each)  \n";
    std::cout << "====================================================\n";

    // Test 1: False Sharing
    {
        std::cout << "Running Unpadded (False Sharing active)..." << std::flush;
        auto start = std::chrono::high_resolution_clock::now();
        std::thread t1(worker, &unpadded.counter_a);
        std::thread t2(worker, &unpadded.counter_b);
        t1.join();
        t2.join();
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> elapsed = end - start;
        std::cout << " Done in " << elapsed.count() << " seconds\n";
    }

    // Test 2: Clean Padded Lines
    {
        std::cout << "Running Padded (False Sharing eliminated)..." << std::flush;
        auto start = std::chrono::high_resolution_clock::now();
        std::thread t1(worker, &padded.counter_a);
        std::thread t2(worker, &padded.counter_b);
        t1.join();
        t2.join();
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> elapsed = end - start;
        std::cout << " Done in " << elapsed.count() << " seconds\n";
    }

    return 0;
}
