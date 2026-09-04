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

## Hands-On Program

Open [`17_raii_demo.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/17_raii_and_resources/17_raii_demo.cpp) to see custom scoped file handles and automatic stack unwinding! (≧∇≦)ﾉ
