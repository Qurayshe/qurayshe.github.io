# Module 15b: x86-64 ABI, Calling Conventions & Stack Frames

When function `A()` calls `B(1, 2, 3, 4, 5, 6, 7)`, where do the arguments go in silicon? (●'◡'●)
Welcome to the **Application Binary Interface (ABI)**! This is the ironclad contract between the compiler, operating system, and hardware registers! q(≧▽≦q)

---

## 1. System V (Linux/macOS) vs Microsoft x64 (Windows)

The x86-64 world is split into two major calling conventions:

| Feature | System V AMD64 ABI (Linux, BSD, macOS) | Microsoft x64 ABI (Windows) |
| :--- | :--- | :--- |
| **Integer Arg 1** | `%rdi` | `%rcx` |
| **Integer Arg 2** | `%rsi` | `%rdx` |
| **Integer Arg 3** | `%rdx` | `%r8` |
| **Integer Arg 4** | `%rcx` | `%r9` |
| **Integer Arg 5** | `%r8` | Stack (Pushed onto stack) |
| **Integer Arg 6** | `%r9` | Stack |
| **Float/SIMD Args** | `%xmm0` - `%xmm7` | `%xmm0` - `%xmm3` |
| **Return Value** | `%rax` (Int) / `%xmm0` (Float) | `%rax` (Int) / `%xmm0` (Float) |
| **Shadow Space** | None | **32 bytes** reserved on stack above return address! |
| **Red Zone** | **128 bytes** below `%rsp` (leaf functions can use without decrementing `%rsp`) | None |

---

## 2. Caller-Saved vs Callee-Saved Registers

```
+-------------------------------------------------------------------+
| Caller-Saved (Volatile / Scratch):                                |
|   %rax, %rcx, %rdx, %rsi, %rdi, %r8, %r9, %r10, %r11              |
|   -> If caller needs these values across a 'call', caller MUST     |
|      push/save them first! Callee is free to clobber them!        |
+-------------------------------------------------------------------+
| Callee-Saved (Non-Volatile / Preserved):                          |
|   %rbx, %rsp, %rbp, %r12, %r13, %r14, %r15                        |
|   -> If a function uses these, it MUST save them (push) and       |
|      restore them (pop) before 'ret'!                             |
+-------------------------------------------------------------------+
```

---

## 3. The 16-Byte Stack Alignment Rule

On modern x86-64, hardware SIMD instructions (like `movaps`) crash the CPU with a General Protection Fault (`#GP`) if memory is not aligned to 16 bytes.
Therefore, the ABI mandates:
> **The stack pointer `%rsp` MUST be a multiple of 16 immediately before any `call` instruction!**

When `call` pushes the 8-byte return address, inside the function entry `%rsp % 16 == 8`. Standard prologue `push %rbp` restores alignment to 16 bytes! (o゜▽゜)o

---

## Hands-On Program

Open [`15b_abi_and_stack_frames.c`](file:///c:/Users/kkhoie/Downloads/cprog1/15b_x64_abi_calling_conventions/15b_abi_and_stack_frames.c) to inspect inline assembly register capture, stack alignment checks, and register parameter passing! (*^▽^*)
