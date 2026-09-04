# Module 21: Non-Owning Memory Views (`std::span` & `std::string_view`)

Stop passing `char* ptr, size_t len` pairs everywhere!
Memory views give you lightweight `[Pointer, Length]` slices with **zero heap allocations and zero copies**! (●'◡'●)

---

## 1. `std::string_view` (C++17)

A 16-byte view over any string:
```cpp
void parse(std::string_view str) {
    std::string_view token = str.substr(0, 4); // Zero-copy slice! q(≧▽≦q)
}
```

---

## 2. `std::span<T>` (C++20)

A non-owning view over any contiguous array (raw C array, `std::vector`, `std::array`):
```cpp
void process(std::span<const int> data) { ... }
```

---

## Hands-On Program

Open [`21_memory_views.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/21_views_and_zero_copy/21_memory_views.cpp) for zero-allocation token slicing across vectors and raw C arrays! (*^▽^*)
