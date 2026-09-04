# Module 17b: The C++ Object Model, Lifecycles & The Rule of 5

Transitioning from C to C++? In C, memory is just raw bytes initialized with `malloc()` and cleaned with `free()`. But in C++, every object has a strict **Lifecycle** governed by constructors and destructors! (●'◡'●)
Mastering the **Rule of 5** is the foundational bridge to writing rock-solid modern C++! q(≧▽≦q)

---

## 1. C Structs vs C++ Classes: What's the Memory Difference?

**Zero!** In C++, a `struct` and a `class` have the exact same memory layout. The only difference is default visibility (`public` for struct, `private` for class).
If a C++ class has no virtual functions, it has **zero runtime overhead** compared to a raw C struct!

```
Raw C struct in RAM:
+-------------------+-------------------+
|  int id (4 bytes) | char* buf (8 bytes)|
+-------------------+-------------------+

C++ Class in RAM (Same exact byte offset!):
+-------------------+-------------------+
|  int id (4 bytes) | char* buf (8 bytes)|
+-------------------+-------------------+
```

---

## 2. The 5 Special Member Functions (Rule of 5)

If a class manages a raw resource (like heap memory, a file descriptor, or a socket), you must define the **Big 5**:

```cpp
class Buffer {
    size_t m_size;
    int*   m_data;

public:
    // 1. Destructor (Cleans up resource when variable leaves scope)
    ~Buffer() { delete[] m_data; }

    // 2. Copy Constructor (Deep copy: clones memory when passing by value)
    Buffer(const Buffer& other) : m_size(other.m_size), m_data(new int[other.m_size]) {
        std::copy(other.m_data, other.m_data + m_size, m_data);
    }

    // 3. Copy Assignment Operator (Handles 'a = b;' with self-assignment protection)
    Buffer& operator=(const Buffer& other) {
        if (this != &other) {
            delete[] m_data;
            m_size = other.m_size;
            m_data = new int[m_size];
            std::copy(other.m_data, other.m_data + m_size, m_data);
        }
        return *this;
    }

    // 4. Move Constructor (Steals heap pointer in O(1) from temporary rvalue!)
    Buffer(Buffer&& other) noexcept : m_size(other.m_size), m_data(other.m_data) {
        other.m_size = 0;
        other.m_data = nullptr; // Null out source so its destructor doesn't free our stolen memory!
    }

    // 5. Move Assignment Operator (Steals resource during 'a = std::move(b);')
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] m_data;
            m_size = other.m_size;
            m_data = other.m_data;
            other.m_size = 0;
            other.m_data = nullptr;
        }
        return *this;
    }
};
```

---

## 3. The Modern Rule of 0

Why write 50 lines of boilerplate if you don't have to?
> **Rule of 0**: Design your classes using modern standard types (`std::vector`, `std::string`, `std::unique_ptr`). The compiler will auto-generate all 5 special member functions with 100% memory safety! (≧∇≦)ﾉ

---

## Hands-On Program

Open [`17b_lifecycles_and_rule_of_five.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/17b_cpp_object_model_and_lifecycles/17b_lifecycles_and_rule_of_five.cpp) to trace every constructor, copy, move, and destructor call in real-time console output! (*^▽^*)
