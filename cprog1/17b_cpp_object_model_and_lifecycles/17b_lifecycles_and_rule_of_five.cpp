#include <iostream>
#include <vector>
#include <utility>
#include <cstring>

/*
 * Module 17b: C++ Object Lifecycles & The Rule of 5 Demo
 *
 * Demonstrates:
 * 1. Tracking constructor, copy, move, and destructor invocations
 * 2. Deep copying vs O(1) Pointer-stealing Move Semantics
 * 3. Self-assignment safety
 */

class TrackedBuffer {
private:
    char*  m_data{nullptr};
    size_t m_len{0};
    const char* m_name{"Unnamed"};

public:
    // 1. Parameterized Constructor
    TrackedBuffer(const char* name, const char* text) : m_name(name) {
        m_len = std::strlen(text);
        m_data = new char[m_len + 1];
        std::memcpy(m_data, text, m_len + 1);
        std::cout << " [CONSTRUCT] '" << m_name << "' created with heap string: \"" << m_data << "\"\n";
    }

    // 2. Destructor
    ~TrackedBuffer() {
        if (m_data) {
            std::cout << " [DESTROY]   '" << m_name << "' deleting memory (\"" << m_data << "\")\n";
            delete[] m_data;
            m_data = nullptr;
        } else {
            std::cout << " [DESTROY]   '" << m_name << "' (Empty / moved-from state)\n";
        }
    }

    // 3. Copy Constructor (Deep copy)
    TrackedBuffer(const TrackedBuffer& other) : m_data(nullptr), m_len(other.m_len), m_name("CopyConstructed") {
        m_data = new char[m_len + 1];
        std::memcpy(m_data, other.m_data, m_len + 1);
        std::cout << " [COPY-CTOR] Deep copied from '" << other.m_name << "' -> \"" << m_data << "\"\n";
    }

    // 4. Copy Assignment Operator
    TrackedBuffer& operator=(const TrackedBuffer& other) {
        std::cout << " [COPY-ASSIGN] Copying '" << other.m_name << "' into '" << m_name << "'\n";
        if (this != &other) {
            delete[] m_data;
            m_len = other.m_len;
            m_data = new char[m_len + 1];
            std::memcpy(m_data, other.m_data, m_len + 1);
        }
        return *this;
    }

    // 5. Move Constructor (Zero-copy steal)
    TrackedBuffer(TrackedBuffer&& other) noexcept 
        : m_data(other.m_data), m_len(other.m_len), m_name("MoveConstructed") {
        std::cout << " [MOVE-CTOR] Stole memory pointer from '" << other.m_name << "'!\n";
        other.m_data = nullptr;
        other.m_len = 0;
    }

    // 6. Move Assignment Operator
    TrackedBuffer& operator=(TrackedBuffer&& other) noexcept {
        std::cout << " [MOVE-ASSIGN] Moving '" << other.m_name << "' into '" << m_name << "'\n";
        if (this != &other) {
            delete[] m_data;
            m_data = other.m_data;
            m_len = other.m_len;
            other.m_data = nullptr;
            other.m_len = 0;
        }
        return *this;
    }

    void print() const {
        std::cout << "   -> Buffer '" << m_name << "' content: " 
                  << (m_data ? m_data : "(nullptr)") << "\n";
    }
};

int main() {
    std::cout << "=== Module 17b: C++ Object Lifecycles & Rule of 5 ===\n\n";

    {
        std::cout << "--- 1. Direct Construction ---\n";
        TrackedBuffer bufA("bufA", "High-Performance Systems");
        bufA.print();

        std::cout << "\n--- 2. Deep Copy Construction ---\n";
        TrackedBuffer bufB = bufA;
        bufB.print();

        std::cout << "\n--- 3. Move Construction (std::move) ---\n";
        TrackedBuffer bufC = std::move(bufA);
        std::cout << "After move:\n";
        bufA.print(); // Moved-from (nullptr)
        bufC.print(); // Owns the stolen memory

        std::cout << "\n--- 4. Leaving Scope (Destructors Fire!) ---\n";
    }

    std::cout << "\n[SUCCESS] Module 17b executed cleanly! (o゜▽゜)o\n";
    return 0;
}
