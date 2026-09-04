# Module 15: CPU Intrinsics & Cycle Counting

Need to execute specialized silicon instructions without writing full assembly files? Compiler intrinsics are here to save the day! (●'◡'●)

---

## 1. Hardware Bit Manipulation Intrinsics

- `__builtin_popcount(x)`: Counts set 1-bits in a **single CPU clock cycle** (`POPCNT` instruction)!
- `__builtin_clz(x)`: Counts leading zeros (super fast log2!).
- `__builtin_ctz(x)`: Counts trailing zeros.

---

## 2. Hardware Cycle Counting (`RDTSC`)

On x86 CPUs, `__rdtsc()` reads the processor timestamp counter—giving you nano-benchmark profiling down to the exact clock cycle! (o゜▽゜)o

---

## Hands-On Program

Open [`15_intrinsics_and_cycles.c`](file:///c:/Users/kkhoie/Downloads/cprog1/15_inline_assembly_and_intrinsics/15_intrinsics_and_cycles.c) for single-cycle bit counting and cycle-accurate benchmarks! (≧∇≦)ﾉ
