# Module 02: Pointers & The Call Stack

Pointers have a scary reputation on forum threads, but they're actually super simple once you picture memory as a giant row of numbered lockers! (●'◡'●)

---

## 1. What is Memory?

Think of your RAM as a giant array of 1-byte storage lockers. Every single locker has a numeric address:

```
Locker Address:  0x1000    0x1001    0x1002    0x1003    0x1004
               +---------+---------+---------+---------+---------+
Byte Value:    |  0x42   |  0x00   |  0x1A   |  0xFF   |  0x05   |
               +---------+---------+---------+---------+---------+
```

---

## 2. Virtual Address Space & Process Memory Layout

In modern operating systems, your C code never interacts directly with physical hardware addresses. Instead, the OS and CPU Memory Management Unit (MMU) provide each executing process with its own private **Virtual Address Space**.

On standard 64-bit platforms (such as Linux x86-64), this space is structured into standardized segments arranged from highest memory addresses down to lowest memory addresses:

<div class="concept-card memory-model-card">
  <h3 class="concept-title">Memory Layout Model</h3>
  <div class="memory-layout-diagram">
    <div class="mem-tier mem-kernel">Kernel Space (0xFFFFFFFF... OS Reserved)</div>
    <div class="mem-tier mem-stack">Stack (Grows Downward &bull; Fast LIFO &bull; Local Variables &bull; Frame Pointers)</div>
    <div class="mem-arrow">&darr; &uarr;</div>
    <div class="mem-tier mem-heap">Heap (Grows Upward &bull; Dynamic Allocation &bull; Arenas &bull; Free Lists)</div>
    <div class="mem-tier mem-bss">.bss / .data (Global / Static Variables)</div>
    <div class="mem-tier mem-text">.text / .rodata (Executable Machine Instructions & String Literals)</div>
  </div>
</div>

### Detailed Anatomy of the Memory Tiers:

1. **Kernel Space (`0xFFFFFFFF...` / Upper Canonical Memory):**
   - The highest range of virtual addresses is reserved strictly for the OS kernel, interrupt handlers, device drivers, and page table structures.
   - Code executing in user mode cannot access this memory. Any user-space pointer attempting to dereference a kernel address triggers an immediate hardware protection fault (`SIGSEGV` / Access Violation).

2. **Stack (Grows Downward):**
   - Stores active function call frames, local variables, parameters, and return addresses.
   - Managed automatically by hardware via the CPU Stack Pointer register (`%rsp` on x86-64). Allocation and deallocation are blazing fast (a single subtract or add on `%rsp`).
   - The stack has a fixed size (typically 8 MB on Linux). Infinite recursion exhausts this limit, resulting in a **Stack Overflow**.

3. **Unallocated Virtual Gap:**
   - Empty virtual address space separating the downward-growing Stack from the upward-growing Heap, allowing both dynamic regions to scale independently without collision.

4. **Heap (Grows Upward):**
   - Dynamic memory requested at runtime via `malloc()`, `calloc()`, `realloc()`, or custom allocators (arenas, pools).
   - Grows upward toward higher addresses via system calls like `brk`/`sbrk` or `mmap`.
   - Memory on the heap remains active until explicitly released via `free()`. Forgetting to free leads to memory leaks; using memory after freeing causes use-after-free bugs.

5. **`.bss` (Block Started by Symbol):**
   - Stores uninitialized global and static variables (and variables explicitly initialized to zero).
   - **Consumes 0 bytes on disk** in the compiled binary; the OS loader allocates and zeroes this region in RAM when the process starts.

6. **`.data` (Initialized Data):**
   - Stores explicitly initialized global and static variables with non-zero values (e.g. `int global_count = 100;`).
   - Stored directly inside the binary file on disk and mapped into read-write RAM at launch.

7. **`.text` & `.rodata` (Code & Read-Only Data):**
   - **`.text`**: The executable CPU machine instructions of your compiled functions.
   - **`.rodata`**: Read-only constants, such as string literals (`"Hello"`) and `const` lookup tables.
   - Mapped by the MMU with read-only permissions; attempting to write to `.text` or `.rodata` triggers an instant segmentation fault.

---

## 3. What is a Pointer?

A **pointer** is literally just a variable that holds the locker address of another variable! That's it! (o゜▽゜)o

```c
int x = 42;      // Lives at locker 0x7FFF0010 (Inside the Stack region!)
int *p = &x;     // 'p' holds the address number 0x7FFF0010
```

```
Variable:      p (Pointer)                x (Integer)
Address:     0x7FFF0000                 0x7FFF0010
Value:     [ 0x7FFF0010 ] ------------> [    42     ]
```

### The Two Big Operators:
- `&x` -> **Address-of:** "Hey, where does `x` live?"
- `*p` -> **Dereference:** "Go to the address inside `p` and read/write the value there!"

---

## 4. Generic Pointers: `void*`

A `void*` is a wildcard pointer. It can hold any address, but since the compiler doesn't know how big the target is, you can't dereference it until you cast it!
```c
void *generic = &x;
int val = *(int*)generic; // Cast required! (¬‿¬)
```

---

## 5. The Stack & Call Frames

Every time you call a function, the CPU pushes a **Stack Frame** (local variables, arguments, return address). When the function returns, poof, the frame is popped!

```
High Memory
+------------------------------------+
| main() frame                       |
|   - int main_var                   |
+------------------------------------+
| calculate() frame                  | <-- Function called!
|   - int arg1, arg2                 |
|   - Return address back to main    |
+------------------------------------+ <-- Stack pointer (RSP)
| (Available space)                  |
v Grows DOWNWARD                     |
Low Memory
```

> Watch out for the classic oopsie: (╯°□°)╯︵ ┻━┻
> Never return a pointer to a local stack variable! Once the function returns, that memory is wiped/reused!

---

## Hands-On Programs

1. [`02_pointer_basics.c`](#systems/02_memory_and_pointers): Dereferencing, swapping via pass-by-reference, and generic memory dumping.
2. [`02_stack_inspection.c`](#systems/02_memory_and_pointers): Live inspection of stack growth direction and frame addresses!
