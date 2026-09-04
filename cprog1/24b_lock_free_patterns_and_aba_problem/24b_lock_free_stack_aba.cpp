#include <iostream>
#include <atomic>
#include <thread>
#include <vector>

/*
 * Module 24b: Lock-Free Stack with Atomic CAS (Treiber Stack)
 *
 * Demonstrates:
 * 1. Multi-threaded Lock-free Stack using compare_exchange_weak loop
 * 2. Understanding CAS contention and retries
 * 3. Atomic memory ordering (release for push, acquire for pop)
 */

template <typename T>
class LockFreeStack {
private:
    struct Node {
        T data;
        Node* next;
        Node(T val) : data(val), next(nullptr) {}
    };

    std::atomic<Node*> m_head{nullptr};
    std::atomic<uint64_t> m_cas_retries{0};

public:
    ~LockFreeStack() {
        Node* curr = m_head.load();
        while (curr) {
            Node* next = curr->next;
            delete curr;
            curr = next;
        }
    }

    void push(T val) {
        Node* new_node = new Node(val);
        new_node->next = m_head.load(std::memory_order_relaxed);

        // Atomic CAS Loop: If another thread changed m_head, new_node->next is updated and retry!
        while (!m_head.compare_exchange_weak(
            new_node->next,
            new_node,
            std::memory_order_release,
            std::memory_order_relaxed)) {
            m_cas_retries.fetch_add(1, std::memory_order_relaxed);
        }
    }

    bool pop(T& result) {
        Node* old_head = m_head.load(std::memory_order_acquire);

        // Atomic CAS Loop for Pop
        while (old_head && !m_head.compare_exchange_weak(
            old_head,
            old_head->next,
            std::memory_order_acquire,
            std::memory_order_relaxed)) {
            m_cas_retries.fetch_add(1, std::memory_order_relaxed);
        }

        if (!old_head) return false;

        result = old_head->data;
        // In production code with memory reclamation (e.g. Hazard Pointers or EBR),
        // we defer deletion until safe. Here we delete for standalone demo simplicity.
        delete old_head;
        return true;
    }

    uint64_t get_cas_retries() const {
        return m_cas_retries.load();
    }
};

int main() {
    std::cout << "=== Module 24b: Lock-Free Stack & Atomic CAS Loops ===\n\n";

    LockFreeStack<int> stack;
    constexpr int NUM_THREADS = 4;
    constexpr int ITEMS_PER_THREAD = 10000;

    std::cout << "Launching " << NUM_THREADS << " threads pushing " 
              << ITEMS_PER_THREAD << " items each...\n";

    std::vector<std::thread> producers;
    for (int t = 0; t < NUM_THREADS; ++t) {
        producers.emplace_back([&stack, t]() {
            for (int i = 0; i < ITEMS_PER_THREAD; ++i) {
                stack.push(t * 100000 + i);
            }
        });
    }

    for (auto& th : producers) th.join();

    std::cout << "Push completed! Total CAS contention retries: " 
              << stack.get_cas_retries() << "\n";

    int popped_val;
    int count = 0;
    while (stack.pop(popped_val)) {
        count++;
    }

    std::cout << "Successfully popped " << count << " items lock-free!\n";
    std::cout << "\n[SUCCESS] Module 24b executed cleanly! (o゜▽゜)o\n";
    return 0;
}
