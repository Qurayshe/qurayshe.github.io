/**
 * Module 24: High-Performance Lock-Free SPSC Ring Buffer Queue
 *
 * Concepts demonstrated:
 * 1. Single-Producer Single-Consumer (SPSC) thread queue without locks or mutexes.
 * 2. Cache-line alignment (alignas(64)) to prevent false sharing between head and tail.
 * 3. Acquire-Release atomic memory order semantics.
 * 4. Streaming 1,000,000 items between concurrent threads with sub-microsecond latency.
 */

#include <iostream>
#include <atomic>
#include <thread>
#include <chrono>
#include <array>
#include <optional>
#include <cstdint>

template <typename T, size_t Capacity>
class LockFreeSPSCQueue {
    static_assert((Capacity & (Capacity - 1)) == 0, "Capacity must be a power of 2!");

private:
    std::array<T, Capacity> buffer;

    // Cache line isolation: alignas(64) ensures head and tail live in separate cache lines!
    alignas(64) std::atomic<size_t> tail{0}; // Written by Producer
    alignas(64) std::atomic<size_t> head{0}; // Written by Consumer

public:
    // Producer: Push item into queue
    bool push(const T& item) {
        size_t current_tail = tail.load(std::memory_order_relaxed);
        size_t current_head = head.load(std::memory_order_acquire);

        // Full check
        if ((current_tail - current_head) >= Capacity) {
            return false; // Queue is full
        }

        // Store data at ring index
        buffer[current_tail & (Capacity - 1)] = item;

        // Publish new tail to consumer with release memory order
        tail.store(current_tail + 1, std::memory_order_release);
        return true;
    }

    // Consumer: Pop item from queue
    std::optional<T> pop() {
        size_t current_head = head.load(std::memory_order_relaxed);
        size_t current_tail = tail.load(std::memory_order_acquire);

        // Empty check
        if (current_head == current_tail) {
            return std::nullopt; // Queue is empty
        }

        // Read data at ring index
        T item = buffer[current_head & (Capacity - 1)];

        // Publish new head to producer with release memory order
        head.store(current_head + 1, std::memory_order_release);
        return item;
    }
};

constexpr size_t TOTAL_MESSAGES = 1'000'000;
LockFreeSPSCQueue<int, 1024> queue;

void producer_thread() {
    for (int i = 1; i <= (int)TOTAL_MESSAGES; i++) {
        while (!queue.push(i)) {
            // Spin / Yield when full
            std::this_thread::yield();
        }
    }
}

void consumer_thread(uint64_t* sum_out) {
    uint64_t sum = 0;
    size_t count = 0;
    while (count < TOTAL_MESSAGES) {
        auto item = queue.pop();
        if (item) {
            sum += *item;
            count++;
        } else {
            // Spin / Yield when empty
            std::this_thread::yield();
        }
    }
    *sum_out = sum;
}

int main() {
    std::cout << "====================================================\n";
    std::cout << " LOCK-FREE SPSC QUEUE (1,000,000 Messages Streaming)\n";
    std::cout << "====================================================\n";

    uint64_t consumer_sum = 0;
    auto start = std::chrono::high_resolution_clock::now();

    std::thread producer(producer_thread);
    std::thread consumer(consumer_thread, &consumer_sum);

    producer.join();
    consumer.join();

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> elapsed = end - start;

    std::cout << "Processed " << TOTAL_MESSAGES << " messages in "
              << elapsed.count() << " seconds\n";
    std::cout << "Throughput : " << (double)TOTAL_MESSAGES / elapsed.count() / 1'000'000.0
              << " Million msgs/sec!\n";
    std::cout << "Verification sum: " << consumer_sum << "\n";

    return 0;
}
