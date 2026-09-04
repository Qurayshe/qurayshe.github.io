# Module 19b: Perfect Forwarding & Forwarding References (`std::forward`)

In Module 19, we learned about Move Semantics and `std::move`. But how do standard library factories like `std::make_unique<T>(args...)` or `vector::emplace_back(args...)` pass arguments into constructors without making a single unnecessary copy? (●'◡'●)
Welcome to **Universal References, Reference Collapsing, and `std::forward`**! q(≧▽≦q)

---

## 1. The Named Variable Problem

Once an rvalue gets passed into a function as a named parameter, **the parameter itself is an lvalue**!

```cpp
void sink(std::string&& s); // Accepts temporary rvalues

template <typename T>
void wrapper(T&& arg) {
    sink(arg); // ERROR! 'arg' has a variable name, so inside wrapper() it's an LVALUE!
}
```
If we pass an rvalue to `wrapper()`, calling `sink(arg)` fails to move it unless we preserve its original value category!

---

## 2. Reference Collapsing Rules

When templates deduce references to references, C++ applies **Reference Collapsing**:

| Deduced Type `T` | Parameter `T&&` | Collapses To |
| :--- | :--- | :--- |
| `int&` (Lvalue) | `int& &&` | `int&` (Lvalue reference!) |
| `const int&` (Const Lvalue) | `const int& &&` | `const int&` |
| `int` (Rvalue temporary) | `int&&` | `int&&` (Rvalue reference!) |

> **Rule**: An rvalue reference `&&` only remains an rvalue if **both** sides are `&&`!

---

## 3. `std::move` vs `std::forward<T>`

- `std::move(x)`: **Unconditional Cast** -> Always turns `x` into an rvalue `x&&`.
- `std::forward<T>(x)`: **Conditional Cast** -> If `T` was an lvalue, yields lvalue; if `T` was an rvalue, yields rvalue!

```cpp
template <typename T, typename... Args>
std::unique_ptr<T> my_make_unique(Args&&... args) {
    // Perfectly forwards each argument exactly as it was received!
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}
```

---

## Hands-On Program

Open [`19b_perfect_forwarding.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/19b_perfect_forwarding_and_universal_references/19b_perfect_forwarding.cpp) to observe how custom factory wrappers forward lvalues as lvalues and rvalues as rvalues! (*^▽^*)
