# Module 19: Move Semantics & Rvalue References (`&&`)

Ever had to copy a 10 MB buffer just to pass it to a function?
**Move Semantics** lets you steal heap pointers from temporary objects in O(1) time! (●'◡'●)

---

## 1. Lvalues vs Rvalues

- **Lvalue:** An object with a name and persistent memory address (`int x = 10;`).
- **Rvalue (`&&`):** A temporary object about to be destroyed (`create_buffer()`).

---

## 2. Copy vs. Move (Pointer Theft!)

### Deep Copy (Slow O(N)):
`malloc` a second buffer, `memcpy` all bytes... (╯°□°)╯︵ ┻━┻

### Move Constructor (Instant O(1)):
```cpp
Buffer(Buffer&& other) noexcept {
    data = other.data;    // 1. Steal the pointer!
    size = other.size;
    other.data = nullptr; // 2. Clear source so it won't double-free! q(≧▽≦q)
    other.size = 0;
}
```

---

## Hands-On Program

Open [`19_move_semantics.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/19_move_semantics_and_rvalues/19_move_semantics.cpp) to watch O(1) pointer theft in action! (≧∇≦)ﾉ
