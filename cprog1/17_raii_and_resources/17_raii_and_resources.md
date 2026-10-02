# Module 17: RAII & Deterministic Resource Management

Tired of manually writing `fclose()` and `free()` everywhere?
RAII (Resource Acquisition Is Initialization) is the best superpower of modern C++! (●'◡'●)

---

## 1. The Core Rule of RAII

1. **Grab resource in Constructor** (`FileHandle file("data.bin");`)
2. **Release resource in Destructor** (`~FileHandle() { fclose(handle); }`)
3. **Let the stack do the work!** When the object goes out of scope, the destructor runs **automatically**, even during early returns or exceptions! q(≧▽≦q)

---

## 2. RAII Mutex Locks (`std::lock_guard`)

No more forgetting to unlock a mutex before returning:
```cpp
void thread_safe_work() {
    std::lock_guard<std::mutex> lock(mtx); // Locked!
    if (error_condition) return;          // Safely unlocked automatically! (*^▽^*)
}
```

---

## 3. Style Comparison: C-Style C++ vs. Google-Style vs. ISO Core Guidelines '26

| Paradigm | How It Handles Resources | Failure Modes & Risk |
| :--- | :--- | :--- |
| **CPL / C-Style C++** | Manual `Init()` & `Destroy()` functions, raw `malloc()`/`free()`, manual `goto cleanup;` | Forgotten `free()`, early return leaks, double-free crashes. |
| **Google-Style C++** | Strict RAII via `std::unique_ptr` with custom deleters (`std::unique_ptr<FILE, decltype(&fclose)>`), no exceptions (`-fno-exceptions`), explicit status returns (`absl::Status`). | Eliminates leaks; avoids hidden stack unwinding overhead. |
| **ISO C++ '26 Core Guidelines** | **Rule of Zero**: compose standard RAII wrappers (`std::fstream`, `std::unique_ptr`, `std::jthread`), monadic `std::expected` for status. | Zero boilerplate; impossible to leak resources or double-free. |

---

## Hands-On Program

Open [`17_raii_demo.cpp`](file:///c:/Users/kkhoie/Desktop/ktknaga/qurayshe.github.io/cprog1/17_raii_and_resources/17_raii_demo.cpp) to see custom scoped file handles and automatic stack unwinding! (≧∇≦)ﾉ
