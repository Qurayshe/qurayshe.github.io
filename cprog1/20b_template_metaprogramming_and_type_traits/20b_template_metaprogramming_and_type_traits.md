# Module 20b: Template Metaprogramming, Type Traits & C++20 Concepts

Ever wonder how standard libraries provide zero-overhead type introspection and generate specialized machine code for every type without any runtime `if/else` checks? (●'◡'●)
Welcome to **Type Traits, `if constexpr`, and C++20 Concepts**! q(≧▽≦q)

---

## 1. Compile-Time Type Traits (`<type_traits>`)

In C++, types can be queried at build time using type traits:

```cpp
#include <type_traits>

template <typename T>
void inspect_type() {
    constexpr bool is_int = std::is_integral_v<T>;
    constexpr bool is_ptr = std::is_pointer_v<T>;
    constexpr bool is_trivial = std::is_trivially_copyable_v<T>;
}
```

---

## 2. Compile-Time Branching: `if constexpr` (C++17)

Unlike a regular runtime `if (condition)` which compiles both branches, `if constexpr` **discards the untaken branch entirely** during compilation!

```cpp
template <typename T>
void serialize(T value) {
    if constexpr (std::is_integral_v<T>) {
        // Only compiled if T is an integer type!
        std::cout << "Writing raw integer bytes: " << value << "\n";
    } else if constexpr (std::is_floating_point_v<T>) {
        // Only compiled if T is a float/double!
        std::cout << "Formatting IEEE 754 float: " << value << "\n";
    } else {
        static_assert(sizeof(T) == 0, "Unsupported type for serialization!");
    }
}
```

---

## 3. C++20 Concepts & Constraints

Concepts replace messy SFINAE template hacks with clean, expressive constraints:

```cpp
#include <concepts>

// Custom Concept requiring types to be numeric and sized <= 8 bytes
template <typename T>
concept SmallNumber = (std::integral<T> || std::floating_point<T>) && sizeof(T) <= 8;

template <SmallNumber T>
T fast_square(T x) {
    return x * x;
}
```
If you pass a string to `fast_square("abc")`, the compiler immediately gives a readable compiler error: *"Constraints not satisfied: type std::string does not satisfy SmallNumber"*! (≧∇≦)ﾉ

---

## Hands-On Program

Open [`20b_type_traits_and_concepts.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/20b_template_metaprogramming_and_type_traits/20b_type_traits_and_concepts.cpp) to see compile-time static type inspection and concept-constrained algorithms in action! (*^▽^*)
