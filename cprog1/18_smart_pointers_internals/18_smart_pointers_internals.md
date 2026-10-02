# Module 18: Smart Pointers & Ownership Internals

In modern C++, writing raw `delete` is practically obsolete! Smart pointers manage heap ownership for you! (●'◡'●)

---

## 1. `std::unique_ptr<T>`: The Zero-Cost Wonder

`std::unique_ptr<T>` represents **Exclusive Ownership**.
- **Zero Memory Overhead:** `sizeof(unique_ptr<T>) == sizeof(T*)` (It's literally 8 bytes on 64-bit!).
- **Zero Runtime Overhead:** Compiles down to standard `free()` assembly!
- Can't be copied, only moved: `auto p2 = std::move(p1);` (o゜▽゜)o

---

## 2. `std::shared_ptr<T>`: Reference Counting

`std::shared_ptr<T>` uses an atomic **Control Block** on the heap to track active owners:

```
std::shared_ptr (16 Bytes)
+-------------------------+---------------------------------+
| ptr: T* (8 bytes)       | control_block: ControlBlock*    |
+-------------------------+---------------------------------+
```
When the last shared pointer goes out of scope, the memory is freed!

> Pro-tip: Always use `std::make_shared<T>()` to allocate the object and control block in a single heap chunk! (*^▽^*)

---

## 3. Ownership Philosophy Across Paradigms

| Paradigm | Pointer Strategy | Why? |
| :--- | :--- | :--- |
| **CPL / C-Style C++** | Raw owning pointers (`T*`), manual `free(p)` or `delete p` | No language-level ownership primitives; developer must maintain ownership invariants in documentation or memory. |
| **Google-Style C++** | Prefer `std::unique_ptr<T>`. Heavy skepticism toward `std::shared_ptr`. | Shared ownership creates non-deterministic lifecycles and hidden memory retention. Single-owner (`unique_ptr`) makes memory topology crystal clear. |
| **ISO C++ '26 Core Guidelines** | **Rule: Never use raw pointers for ownership.** Use `std::unique_ptr` for exclusive ownership, `std::shared_ptr` only when ownership is truly graph-shared. Use non-owning `T*` or `gsl::not_null<T*>` only for observation. | Complete elimination of memory leaks, dangling pointers, and double-free vulnerabilities at compile time. |

---

## Hands-On Program

Check out [`18_smart_pointers.cpp`](file:///c:/Users/kkhoie/Desktop/ktknaga/qurayshe.github.io/cprog1/18_smart_pointers_internals/18_smart_pointers.cpp) for ownership transfers, size comparisons, and custom C deleters! (*/ω＼*)
