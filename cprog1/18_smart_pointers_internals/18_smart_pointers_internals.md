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

## Hands-On Program

Check out [`18_smart_pointers.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/18_smart_pointers_internals/18_smart_pointers.cpp) for ownership transfers, size comparisons, and custom C deleters! (*/ω＼*)
