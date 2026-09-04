# Module 31b: JIT Security ($W \oplus X$), Trampolines & Instruction Cache Flushing

In Module 31, we compiled machine code at runtime. But on hardened production operating systems (Linux PaX/grsecurity, macOS Apple Silicon, Windows Arbitrary Code Guard), your JIT will instantly crash with `SIGSEGV` or `Access Violation` unless you respect **$W \oplus X$ (Write XOR Execute)**! (●'◡'●)
Let's master **$W \oplus X$ Memory Lifecycle, Instruction Cache (I-Cache) Coherence, and JIT Trampolines**! q(≧▽≦q)

---

## 1. The $W \oplus X$ (Write XOR Execute) Security Policy

Modern OS kernels enforce:
> **"A memory page may be Writable ($W$) OR Executable ($X$), but NEVER BOTH simultaneously!"**

This prevents Buffer Overflow shellcode injection attacks. A modern JIT compiler must follow a strict 3-phase lifecycle:

```
[ Phase 1: JIT Code Generation ]
  mmap(PROT_READ | PROT_WRITE)  --->  Emit raw x86-64 / ARM64 opcodes into RAM buffer
                                           |
                                           v
[ Phase 2: Security Transition & Cache Flush ]
  1. __builtin___clear_cache()  --->  Flush CPU Data-Cache and Invalidate Instruction-Cache!
  2. mprotect(PROT_READ | PROT_EXEC)  --->  Lock memory as READ-ONLY + EXECUTABLE!
                                           |
                                           v
[ Phase 3: Fast Native Execution ]
  Call function pointer!        --->  CPU executes machine code at native 5 GHz speed! (o゜▽゜)o
```

---

## 2. D-Cache vs I-Cache Coherence (The Pipeline Hazard)

Modern CPUs have split L1 caches:
- **D-Cache (Data Cache)**: Connected to RAM load/store instructions.
- **I-Cache (Instruction Cache)**: Connected to the instruction fetch pipeline.

When your JIT writes new opcodes, they enter the **D-Cache**. The **I-Cache** might still have old, empty cache lines!
Without calling `__builtin___clear_cache(start, end)` (or `FlushInstructionCache()` on Windows), the CPU instruction decoder may execute stale garbage! (x_x)

---

## 3. JIT Trampolines

How does C code jump into a dynamically generated JIT function with arbitrary parameters?
A **Trampoline** is a tiny assembly stub that sets up registers according to the platform ABI, jumps to the JIT block, and restores stack frames upon return.

---

## Hands-On Program

Open [`31b_jit_trampolines.c`](file:///c:/Users/kkhoie/Downloads/cprog1/31_jit_compiler_and_dynamic_codegen/31b_jit_trampolines.c) to inspect a full $W \oplus X$ compliant dynamic compiler with I-Cache clearing! (*^▽^*)
