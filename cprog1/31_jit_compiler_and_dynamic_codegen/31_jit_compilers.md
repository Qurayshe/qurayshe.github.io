# Module 31: JIT Compilers (V8, JVM) (Working Backwards)

How do JavaScript in Chrome (V8) and Java (JVM HotSpot) run at near-native C speed?
They use **Just-In-Time (JIT) Compilers**! (●'◡'●)

---

## 1. High-Level Concept: JIT Compilation

Code starts out running in an interpreter loop (Module 16).
When a function is called a lot ("hot loop"), the JIT engine compiles bytecode directly into **x86-64 machine code bytes in RAM** and jumps to it!

---

## 2. Low-Level Reality: Emitting Opcodes to Executable RAM

1. **Request Executable Pages:** Normal `malloc` has the No-Execute (NX) bit set (Module 13). The JIT calls `mmap(PROT_EXEC)` or `VirtualAlloc(PAGE_EXECUTE_READWRITE)`.
2. **Write CPU Opcode Bytes:**
   `0x8D, 0x04, 0x37` (`lea eax, [rdi + rsi]`)
   `0xC3` (`ret`)
3. **Cast to Function Pointer & Execute:**
   `int (*fn)(int, int) = (void*)exec_page;`
   `int ans = fn(10, 20);` -> CPU jumps straight into RAM! q(≧▽≦q)

---

## Hands-On Program

Open [`31_mini_jit_compiler.c`](file:///c:/Users/kkhoie/Downloads/cprog1/31_jit_compiler_and_dynamic_codegen/31_mini_jit_compiler.c) to see a real working JIT compiler generating machine code in memory and executing it! (*^▽^*)
