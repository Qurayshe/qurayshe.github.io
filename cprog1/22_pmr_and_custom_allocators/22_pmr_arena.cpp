/**
 * Module 22: Polymorphic Memory Resources (std::pmr) & Arena Allocators
 *
 * Concepts demonstrated:
 * 1. Using std::pmr::monotonic_buffer_resource as a modern C++ Arena.
 * 2. Backing std::pmr::vector with a stack-allocated byte array (Zero Heap!).
 * 3. O(1) bulk deallocation of all vector elements without heap traversal.
 */

#include <iostream>
#include <vector>
#include <memory_resource>
#include <array>

int main() {
    std::cout << "====================================================\n";
    std::cout << " 1. STACK-BACKED MONOTONIC ARENA ALLOCATOR (PMR)    \n";
    std::cout << "====================================================\n";
    // 512-byte buffer allocated purely on the local STACK
    std::array<std::byte, 512> stack_buffer{};
    std::cout << "Stack buffer allocated at: " << (void*)stack_buffer.data()
              << " (" << stack_buffer.size() << " bytes)\n\n";

    {
        // Monotonic Arena Resource backed by the stack buffer
        std::pmr::monotonic_buffer_resource arena(
            stack_buffer.data(),
            stack_buffer.size(),
            std::pmr::null_memory_resource() // Disallow heap fallbacks!
        );

        // Vector that allocates directly inside our stack arena:
        std::pmr::vector<int> numbers(&arena);

        for (int i = 1; i <= 8; i++) {
            numbers.push_back(i * 10);
        }

        std::cout << "Vector contents: ";
        for (int val : numbers) {
            std::cout << val << " ";
        }
        std::cout << "\n";
        std::cout << "Vector internal buffer resides at: " << (void*)numbers.data() << "\n";
        std::cout << "--> Pointer is INSIDE the stack buffer range! ZERO heap allocations!\n\n";
    }

    std::cout << "====================================================\n";
    std::cout << " 2. NESTED PMR ALLOCATIONS                          \n";
    std::cout << "====================================================\n";
    std::array<std::byte, 1024> nested_buffer{};
    std::pmr::monotonic_buffer_resource string_arena(nested_buffer.data(), nested_buffer.size());

    // Vector of strings where BOTH the vector AND the strings use the same arena!
    std::pmr::vector<std::pmr::string> words(&string_arena);
    words.emplace_back("Low-Level", &string_arena);
    words.emplace_back("Systems", &string_arena);
    words.emplace_back("Programming", &string_arena);

    for (const auto& w : words) {
        std::cout << "  Word: \"" << w << "\" at " << (void*)w.data() << "\n";
    }

    return 0;
}
