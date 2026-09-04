/**
 * Module 15: CPU Hardware Intrinsics & Cycle-Level Profiling
 *
 * Concepts demonstrated:
 * 1. Single-cycle bit counting with __builtin_popcount, __builtin_clz, and __builtin_ctz.
 * 2. Hardware cycle timing using CPU timestamp instructions (RDTSC on x86).
 * 3. Portable fallback implementations when hardware intrinsics are unavailable.
 */

#include <stdio.h>
#include <stdint.h>

#if defined(_MSC_VER)
#include <intrin.h>
#elif defined(__GNUC__) || defined(__clang__)
#include <x86intrin.h>
#endif

/* Portable software fallback for population count (Hamming weight) */
int software_popcount(uint32_t x) {
    int count = 0;
    while (x) {
        count += (x & 1);
        x >>= 1;
    }
    return count;
}

/* Fast hardware popcount wrapper */
int fast_popcount(uint32_t x) {
#if defined(__GNUC__) || defined(__clang__)
    return __builtin_popcount(x);
#elif defined(_MSC_VER)
    return (int)__popcnt(x);
#else
    return software_popcount(x);
#endif
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. HARDWARE BIT MANIPULATION INTRINSICS            \n");
    printf("====================================================\n");
    uint32_t val = 0b00001000100000000000000000010111; // 0x08800017

    printf("Value in Hex: 0x%08X\n", val);
    printf("Population count (Set bits) : %d\n", fast_popcount(val));

#if defined(__GNUC__) || defined(__clang__)
    printf("Leading zeros  (__builtin_clz): %d\n", __builtin_clz(val));
    printf("Trailing zeros (__builtin_ctz): %d\n\n", __builtin_ctz(val));
#else
    printf("Leading/Trailing zero intrinsics available on GCC/Clang.\n\n");
#endif

    printf("====================================================\n");
    printf(" 2. CPU CYCLE BENCHMARKING (RDTSC)                  \n");
    printf("====================================================\n");
#if (defined(__i386__) || defined(__x86_64__) || defined(_M_IX86) || defined(_M_X64)) && (defined(__GNUC__) || defined(__clang__))
    uint64_t start_cycles = __rdtsc();

    // Workload loop
    volatile uint64_t accumulator = 0;
    for (int i = 0; i < 10000; i++) {
        accumulator += i;
    }

    uint64_t end_cycles = __rdtsc();
    printf("Elapsed CPU cycles for 10,000 iterations: %llu cycles\n",
           (unsigned long long)(end_cycles - start_cycles));
#else
    printf("RDTSC cycle counter is architecture-specific (x86/x64).\n");
#endif

    return 0;
}
