# Module 10b: SIMD Vector Intrinsics (SSE & AVX2 Vectorization)

Why do 1 calculation at a time when your CPU core can do **8 floating-point multiplications in a single clock cycle**? (●'◡'●)
Welcome to **SIMD (Single Instruction, Multiple Data)** hardware vectorization! q(≧▽≦q)

---

## 1. The Vector Register Hierarchy

CPUs have dedicated ultra-wide vector registers alongside regular 64-bit general-purpose registers:

```
+-----------------------------------------------------------------------+
| 512-bit: ZMM0 - ZMM31 (AVX-512) -> 16 floats (32-bit) / 8 doubles     |
+-----------------------------------------------------------------------+
| 256-bit: YMM0 - YMM15 (AVX / AVX2) -> 8 floats / 4 doubles / 8 ints   |
+-----------------------------------------------------------------------+
| 128-bit: XMM0 - XMM15 (SSE / SSE2) -> 4 floats / 2 doubles / 4 ints   |
+-----------------------------------------------------------------------+
```

---

## 2. Scalar vs Vectorized Execution

Suppose we add two float arrays of 8 elements:

### Scalar Loop (8 CPU Cycles):
```
Cycle 1: c[0] = a[0] + b[0]
Cycle 2: c[1] = a[1] + b[1]
...
Cycle 8: c[7] = a[7] + b[7]
```

### SIMD Vector (1 CPU Cycle!):
```
YMM0: [ a[7] | a[6] | a[5] | a[4] | a[3] | a[2] | a[1] | a[0] ]
                      +   (1 single _mm256_add_ps instruction!)
YMM1: [ b[7] | b[6] | b[5] | b[4] | b[3] | b[2] | b[1] | b[0] ]
                      =
YMM2: [ c[7] | c[6] | c[5] | c[4] | c[3] | c[2] | c[1] | c[0] ]
```

---

## 3. Essential Intel Intrinsics Cheat Sheet (`<immintrin.h>`)

| Intrinsic Function | CPU Instruction | What it Does |
| :--- | :--- | :--- |
| `_mm256_loadu_ps(ptr)` | `vmovups` | Loads 8 unaligned 32-bit floats into a YMM register |
| `_mm256_load_ps(ptr)` | `vmovaps` | Loads 8 aligned (32-byte boundary) floats (Faster!) |
| `_mm256_add_ps(a, b)` | `vaddps` | Parallel addition of 8 floats |
| `_mm256_mul_ps(a, b)` | `vmulps` | Parallel multiplication of 8 floats |
| `_mm256_fmadd_ps(a, b, c)`| `vfmadd132ps` | Fused Multiply-Add: `(a * b) + c` in 1 instruction with zero rounding error! |
| `_mm256_storeu_ps(ptr, val)`| `vmovups` | Writes YMM register back to RAM array |

---

## 4. Memory Alignment Matters!

AVX2 works best when data arrays are aligned to **32-byte boundaries** in RAM:
- Stack: `alignas(32) float buffer[1024];`
- Heap: `posix_memalign((void**)&ptr, 32, size)` or `aligned_alloc(32, size)`

---

## Hands-On Benchmark Program

Check out [`10b_avx2_vectorization.c`](file:///c:/Users/kkhoie/Downloads/cprog1/10b_simd_vector_intrinsics/10b_avx2_vectorization.c) to see scalar vs AVX2 dot-product and vector-add benchmarks running in real time! (o゜▽゜)o
