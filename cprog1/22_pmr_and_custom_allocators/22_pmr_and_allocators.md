# Module 22: Polymorphic Memory Resources (`std::pmr`)

Remember our C Arena Allocator from Module 05?
In C++17, PMR lets standard containers (`std::pmr::vector`) allocate directly inside your custom stack arenas! (●'◡'●)

---

## 1. Stack-Backed PMR Vectors

```cpp
std::array<std::byte, 1024> stack_buf;
std::pmr::monotonic_buffer_resource arena(stack_buf.data(), stack_buf.size());

// This vector allocates ZERO heap memory! Everything is on the stack! (*^▽^*)
std::pmr::vector<int> vec(&arena);
vec.push_back(42);
```

---

## Hands-On Program

Open [`22_pmr_arena.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/22_pmr_and_custom_allocators/22_pmr_arena.cpp) to see stack-backed vectors and nested arenas in action! (≧∇≦)ﾉ
