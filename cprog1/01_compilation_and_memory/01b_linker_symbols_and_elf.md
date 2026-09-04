# Module 01b: Linker Internals, Symbol Resolution & The ELF Object Format

Ever wondered why the linker throws `undefined reference to main` or `multiple definition of foo`? (●'◡'●)
In Module 01, we saw the high-level compilation pipeline. Now let's crack open the **Linker (`ld`)**, inspect how binary object files (`.o`) talk to each other, and deconstruct how the **ELF (Executable and Linkable Format)** binary structure works under the hood! q(≧▽≦q)

---

## 1. The Anatomy of an ELF Binary

On Linux/Unix systems, object files (`.o`), shared libraries (`.so`), and final executables are formatted as **ELF** (Windows uses PE/COFF, macOS uses Mach-O, but the fundamental concepts are identical).

```
+-------------------------------------------------------+
| ELF Header (Magic bytes: 0x7F 'E' 'L' 'F', ABI, Arch) |
+-------------------------------------------------------+
| Program Header Table (Tells OS loader where to map    |
| memory segments into virtual RAM: LOAD, DYNAMIC, etc) |
+-------------------------------------------------------+
| .text section (Executable machine instructions)       |
+-------------------------------------------------------+
| .rodata section (Read-only constants & string literals|
+-------------------------------------------------------+
| .data section (Initialized global & static variables) |
+-------------------------------------------------------+
| .bss section (Uninitialized globals - 0 in RAM, 0 B   |
| on disk!)                                             |
+-------------------------------------------------------+
| .symtab / .strtab (Symbol table & symbol string names)|
+-------------------------------------------------------+
| .rel.text / .rela.text (Relocation entries to patch)  |
+-------------------------------------------------------+
| Section Header Table (Locates all sections on disk)   |
+-------------------------------------------------------+
```

### Why is `.bss` 0 bytes on disk?
If you declare `int big_array[1000000];` (uninitialized global), storing 4 MB of zeros in your `.exe` file would waste disk space. The ELF header simply records: *"When loading this binary, allocate 4MB of anonymous RAM and zero-fill it!"* (¬‿¬)

---

## 2. Strong vs Weak Symbols

When multiple translation units (`.c` files) are compiled together, the linker must resolve symbols:

1. **Strong Symbol**: Functions and initialized global variables (`int x = 42;`).
2. **Weak Symbol**: Declared with `__attribute__((weak))` or uninitialized globals in older C standards.

### Resolution Rules:
- Multiple strong symbols with the same name -> **Linker Error (Multiple Definition)**!
- One strong symbol and one or more weak symbols -> **Strong symbol wins**!
- Multiple weak symbols -> Linker picks one arbitrarily.

```c
// Weak function default implementation
__attribute__((weak)) void custom_logger(const char* msg) {
    printf("[DEFAULT LOG]: %s\n", msg);
}

// If another .c file defines strong custom_logger(), the linker overrides this seamlessly!
```

---

## 3. Name Mangling & `extern "C"`

Why can C++ overload functions (`foo(int)` and `foo(double)`), but C cannot?
- **C Linker**: Emits the symbol name literally as `foo`.
- **C++ Compiler**: Mangles parameter types into the symbol name, e.g. `_Z3fooi` and `_Z3food`.

When C++ calls C code, you MUST use `extern "C"`:
```cpp
#ifdef __cplusplus
extern "C" {
#endif

void my_c_function(int a, int b);

#ifdef __cplusplus
}
#endif
```
This tells the C++ compiler: *"Do not mangle this function name! Emit pure C symbol convention!"* (≧∇≦)ﾉ

---

## 4. Dynamic Linking: GOT & PLT

How does your binary call `printf()` inside `libc.so` without knowing its memory address until runtime?
1. **PLT (Procedure Linkage Table)**: Small jump trampoline code inside `.text`.
2. **GOT (Global Offset Table)**: Table of pointers in `.data` that the dynamic linker (`ld.so`) fills with the real runtime address upon the first function call (Lazy Binding)!

---

## Hands-On Code Example

Check out [`01b_symbol_resolution.c`](file:///c:/Users/kkhoie/Downloads/cprog1/01_compilation_and_memory/01b_symbol_resolution.c) to inspect weak symbol overriding, section allocations, and symbol address relocations! (o゜▽゜)o
