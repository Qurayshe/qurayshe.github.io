# Module 05: Dynamic Memory Allocation & Custom Allocators

Stack memory is fast, but it vanishes when functions return. The **Heap** is where memory lives as long as you want! (●'◡'●)

---

## 1. The Standard Dynamic Toolkit (`<stdlib.h>`)

- `malloc(size)`: Grabs raw bytes from the heap (uninitialized).
- `calloc(n, size)`: Grabs bytes and zeroes them out for you! (*^▽^*)
- `realloc(ptr, new_size)`: Resizes an existing allocation.
- `free(ptr)`: Returns memory back to the OS.

---

## 2. The Classic Memory Bug Hall of Fame

1. **Memory Leak:** Allocating and losing the pointer. Memory stays held hostage!
2. **Dangling Pointer:** A pointer pointing to memory you already freed.
3. **Use-After-Free (UAF):** Dereferencing a dangling pointer (major security bug!).
4. **Double Free:** Freeing the same pointer twice. (Always set `ptr = NULL;` after freeing! (*/ω＼*))

---

## 3. The Secret Weapon: Arena Allocators (Bump Allocators)

Calling `malloc` thousands of times per second causes heap fragmentation and slow syscalls.
Game engines and high-perf systems use **Arena Allocators**:
1. Pre-allocate one big buffer (e.g. 1 MB).
2. Allocate by simply bumping an offset forward (blazing fast O(1)!).
3. Free **everything at once** by resetting `offset = 0;`! (o゜▽゜)o

```
Arena Buffer (64 KB):
+-------------------+--------------------+--------------------------------+
| Chunk 1 (8B)      | Chunk 2 (64B)      | Free Unused Space              |
+-------------------+--------------------+--------------------------------+
                                         ^
                                    arena.offset (Bumps forward!)
```

---

## Hands-On Programs

1. [`05_heap_memory.c`](file:///c:/Users/kkhoie/Downloads/cprog1/05_dynamic_memory/05_heap_memory.c): Safe dynamic array vector implementation.
2. [`05_simple_arena.c`](file:///c:/Users/kkhoie/Downloads/cprog1/05_dynamic_memory/05_simple_arena.c): A complete, super-fast Arena Allocator in ~70 lines of clean C!
