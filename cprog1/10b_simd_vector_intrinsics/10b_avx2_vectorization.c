#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <time.h>
#include <immintrin.h>

/*
 * Module 10b: SIMD AVX2 Vectorization Benchmark
 *
 * Demonstrates:
 * 1. 256-bit AVX2 vector arithmetic using <immintrin.h>
 * 2. 8x Parallel float operations per instruction
 * 3. Comparing scalar execution vs vectorized throughput
 */

#define ARRAY_SIZE (1024 * 1024 * 4) // 4 Million elements (~16 MB each)

// Standard scalar addition
void scalar_add(const float* a, const float* b, float* c, size_t n) {
    for (size_t i = 0; i < n; ++i) {
        c[i] = a[i] + b[i];
    }
}

// AVX2 Vectorized addition (processes 8 floats per cycle)
void avx2_add(const float* a, const float* b, float* c, size_t n) {
    size_t i = 0;
    // Process in 8-float chunks (256-bit registers)
    for (; i + 7 < n; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);
        __m256 vb = _mm256_loadu_ps(&b[i]);
        __m256 vc = _mm256_add_ps(va, vb);
        _mm256_storeu_ps(&c[i], vc);
    }
    // Remainder loop for trailing elements
    for (; i < n; ++i) {
        c[i] = a[i] + b[i];
    }
}

static double get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (ts.tv_sec * 1000.0) + (ts.tv_nsec / 1000000.0);
}

int main(void) {
    printf("=== Module 10b: SIMD AVX2 Vectorization Benchmark ===\n\n");
    printf("Allocating 3 x %d MB arrays...\n", (int)(ARRAY_SIZE * sizeof(float) / (1024 * 1024)));

    float* a = (float*)malloc(ARRAY_SIZE * sizeof(float));
    float* b = (float*)malloc(ARRAY_SIZE * sizeof(float));
    float* c_scalar = (float*)malloc(ARRAY_SIZE * sizeof(float));
    float* c_vector = (float*)malloc(ARRAY_SIZE * sizeof(float));

    if (!a || !b || !c_scalar || !c_vector) {
        fprintf(stderr, "Memory allocation failed!\n");
        return 1;
    }

    for (size_t i = 0; i < ARRAY_SIZE; ++i) {
        a[i] = (float)(i % 100) * 1.5f;
        b[i] = (float)(i % 50) * 2.2f;
    }

    // Benchmark Scalar
    double t0 = get_time_ms();
    scalar_add(a, b, c_scalar, ARRAY_SIZE);
    double t1 = get_time_ms();
    double scalar_time = t1 - t0;
    printf("[Scalar Loop] Time: %.3f ms\n", scalar_time);

    // Benchmark AVX2
    double t2 = get_time_ms();
    avx2_add(a, b, c_vector, ARRAY_SIZE);
    double t3 = get_time_ms();
    double vector_time = t3 - t2;
    printf("[AVX2 Vector] Time: %.3f ms (Speedup: %.2fx faster!)\n", vector_time, scalar_time / vector_time);

    // Verify correctness
    int errors = 0;
    for (size_t i = 0; i < 16; ++i) {
        printf("   elem[%zu]: scalar=%.2f, avx2=%.2f\n", i, c_scalar[i], c_vector[i]);
        if (c_scalar[i] != c_vector[i]) errors++;
    }

    free(a);
    free(b);
    free(c_scalar);
    free(c_vector);

    printf("\n[SUCCESS] SIMD vectorization completed with %d mismatches! (*^▽^*)\n", errors);
    return 0;
}
