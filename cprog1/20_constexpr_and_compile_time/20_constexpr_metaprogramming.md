# Module 20: Compile-Time Metaprogramming (`constexpr` & `consteval`)

Why calculate math when your game is running if you can make the **compiler compute it at build time**? (●'◡'●)

---

## 1. `constexpr` & `consteval`

- `constexpr`: Can run at compile time if inputs are constant, or runtime if dynamic.
- `consteval` (C++20): **Guaranteed** to execute inside the compiler!

```cpp
constexpr uint32_t hash_str(const char* str) {
    uint32_t h = 5381;
    while (*str) h = ((h << 5) + h) + *str++;
    return h;
}

// Baked directly into assembly opcodes as a constant number! (*^▽^*)
constexpr uint32_t id = hash_str("USER_LOGIN");
```

---

## Hands-On Program

Open [`20_constexpr_demo.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/20_constexpr_and_compile_time/20_constexpr_demo.cpp) to see compile-time string hashing and precomputed power-of-two tables verified with `static_assert`! (o゜▽゜)o
