/**
 * Module 19: Move Semantics, Rvalues, and O(1) Pointer Transfers
 *
 * Concepts demonstrated:
 * 1. Deep copy constructor vs O(1) pointer-stealing move constructor.
 * 2. Copy assignment vs Move assignment operators.
 * 3. std::move mechanics.
 * 4. Returning large heap containers by value without any copying penalty.
 */

#include <iostream>
#include <cstring>
#include <utility>

class MemoryBuffer {
private:
    int* data;
    size_t size;

public:
    // Standard Constructor
    explicit MemoryBuffer(size_t n) : size(n), data(new int[n]) {
        std::cout << "  [Constructed] Allocated " << size << " ints at " << (void*)data << "\n";
        for (size_t i = 0; i < size; i++) data[i] = (int)i;
    }

    // Destructor
    ~MemoryBuffer() {
        if (data) {
            std::cout << "  [Destroyed] Deallocated memory at " << (void*)data << "\n";
            delete[] data;
        } else {
            std::cout << "  [Destroyed] (Empty / Moved-From Object)\n";
        }
    }

    // 1. Deep Copy Constructor (Expensive O(N) allocation and copy)
    MemoryBuffer(const MemoryBuffer& other) : size(other.size), data(new int[other.size]) {
        std::cout << "  [DEEP COPY] Allocated NEW buffer at " << (void*)data
                  << " and copying " << size << " ints\n";
        std::memcpy(data, other.data, size * sizeof(int));
    }

    // 2. Move Constructor (Zero-cost O(1) pointer transfer)
    MemoryBuffer(MemoryBuffer&& other) noexcept : data(other.data), size(other.size) {
        std::cout << "  [MOVE CONSTRUCTOR] Stealing pointer " << (void*)data << " instantly!\n";
        other.data = nullptr; // Nullify source
        other.size = 0;
    }

    // 3. Move Assignment Operator
    MemoryBuffer& operator=(MemoryBuffer&& other) noexcept {
        std::cout << "  [MOVE ASSIGNMENT] Transferring pointer...\n";
        if (this != &other) {
            delete[] data;       // Free our existing buffer
            data = other.data;   // Steal other's buffer
            size = other.size;
            other.data = nullptr;
            other.size = 0;
        }
        return *this;
    }

    size_t get_size() const { return size; }
};

// Factory function returning by value (Move semantics / RVO eliminates all copies!)
MemoryBuffer create_huge_buffer() {
    MemoryBuffer temp(1000000); // 1 million integers
    return temp; // Moved out without copying!
}

int main() {
    std::cout << "====================================================\n";
    std::cout << " 1. COPYING VS MOVING (POINTER THEFT)               \n";
    std::cout << "====================================================\n";
    std::cout << "Creating buffer 'a'...\n";
    MemoryBuffer a(5);

    std::cout << "\nCreating buffer 'b' via Copy Constructor (Copying a):\n";
    MemoryBuffer b = a; // Deep copy

    std::cout << "\nCreating buffer 'c' via Move Constructor (Moving a):\n";
    MemoryBuffer c = std::move(a); // Steals 'a' buffer!

    std::cout << "\nAfter std::move, size of 'a' is: " << a.get_size()
              << ", size of 'c' is: " << c.get_size() << "\n\n";

    std::cout << "====================================================\n";
    std::cout << " 2. FACTORY RETURN BY VALUE (ZERO-COPY)             \n";
    std::cout << "====================================================\n";
    MemoryBuffer huge = create_huge_buffer();
    std::cout << "Received huge buffer of size: " << huge.get_size() << " elements.\n\n";

    std::cout << "Leaving main, destructors will run:\n";
    return 0;
}
