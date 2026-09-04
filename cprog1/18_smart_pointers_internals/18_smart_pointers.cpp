/**
 * Module 18: Smart Pointer Mechanics & Memory Inspection
 *
 * Concepts demonstrated:
 * 1. std::unique_ptr for exclusive ownership with ZERO memory overhead.
 * 2. Transferring ownership using std::move.
 * 3. std::shared_ptr and std::weak_ptr with atomic reference counting.
 * 4. Custom deleters for C API interoperability (e.g. wrapping malloc/free).
 */

#include <iostream>
#include <memory>
#include <cstdlib>

struct DeviceNode {
    int id;
    DeviceNode(int i) : id(i) { std::cout << "  [DeviceNode] Constructed ID " << id << "\n"; }
    ~DeviceNode() { std::cout << "  [DeviceNode] Destroyed ID " << id << "\n"; }
};

// Custom deleter for wrapping C malloc memory with unique_ptr
struct FreeDeleter {
    void operator()(void* ptr) const {
        std::cout << "  [FreeDeleter] Calling C free() on " << ptr << "\n";
        std::free(ptr);
    }
};

int main() {
    std::cout << "====================================================\n";
    std::cout << " 1. SIZES OF RAW VS SMART POINTERS                  \n";
    std::cout << "====================================================\n";
    std::cout << "sizeof(DeviceNode*)                = " << sizeof(DeviceNode*) << " bytes\n";
    std::cout << "sizeof(std::unique_ptr<DeviceNode>)= " << sizeof(std::unique_ptr<DeviceNode>)
              << " bytes (ZERO Overhead!)\n";
    std::cout << "sizeof(std::shared_ptr<DeviceNode>)= " << sizeof(std::shared_ptr<DeviceNode>)
              << " bytes (Pointer + Control Block)\n\n";

    std::cout << "====================================================\n";
    std::cout << " 2. UNIQUE_PTR EXCLUSIVE OWNERSHIP & TRANSFERS      \n";
    std::cout << "====================================================\n";
    {
        auto u1 = std::make_unique<DeviceNode>(101);
        std::cout << "u1 address: " << u1.get() << "\n";

        // Transfer ownership to u2
        std::cout << "Moving u1 -> u2...\n";
        std::unique_ptr<DeviceNode> u2 = std::move(u1);
        std::cout << "u1 is now: " << (u1 ? "Valid" : "nullptr") << "\n";
        std::cout << "u2 owns ID: " << u2->id << " at " << u2.get() << "\n";
    } // u2 destroyed here!

    std::cout << "\n====================================================\n";
    std::cout << " 3. SHARED_PTR REFERENCE COUNTING                   \n";
    std::cout << "====================================================\n";
    {
        std::shared_ptr<DeviceNode> s1 = std::make_shared<DeviceNode>(202);
        std::cout << "s1 created. use_count = " << s1.use_count() << "\n";

        {
            std::shared_ptr<DeviceNode> s2 = s1; // Shared ownership
            std::cout << "s2 copied from s1. use_count = " << s1.use_count() << "\n";
            std::cout << "s2 points to ID: " << s2->id << "\n";
        } // s2 goes out of scope

        std::cout << "s2 destroyed. use_count = " << s1.use_count() << "\n";
    } // s1 goes out of scope -> DeviceNode 202 is destroyed

    std::cout << "\n====================================================\n";
    std::cout << " 4. UNIQUE_PTR WITH CUSTOM C FREE() DELETER         \n";
    std::cout << "====================================================\n";
    {
        int* raw_c_mem = (int*)std::malloc(sizeof(int) * 4);
        raw_c_mem[0] = 42;
        std::unique_ptr<int, FreeDeleter> c_wrapped(raw_c_mem);
        std::cout << "Wrapped C malloc buffer with unique_ptr. Val: " << *c_wrapped << "\n";
    } // FreeDeleter automatically frees the C memory here!

    return 0;
}
