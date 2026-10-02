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

## 3. Buffer Passing Across Paradigms

| Paradigm | How Contiguous Buffers are Passed | Pitfalls / Advantages |
| :--- | :--- | :--- |
| **CPL / C-Style C++** | `const char* str` (null-terminated) or `const int* buf, int len` | Out-of-bounds reads if length is wrong; `strlen()` is $O(N)$ runtime cost; buffer overrun attacks. |
| **Google-Style C++** | `absl::string_view` and `absl::Span<const T>` | $O(1)$ length check; bounds checked in debug mode (`ABSL_DCHECK`); seamless interoperability with Protobufs and strings. |
| **ISO C++ '26 Core Guidelines** | `std::string_view`, `std::span<const T, Extent>`, Ranges views | Fully standardized non-owning views; bounds-checked iteration; zero allocation overhead; works with C++26 Contracts. |

---

## Hands-On Program

Open [`21_memory_views.cpp`](#systems/21_views_and_zero_copy) for zero-allocation token slicing across vectors and raw C arrays! (*^▽^*)
