/**
 * Module 10: CPU Cache Locality Micro-Benchmark
 *
 * Concepts demonstrated:
 * 1. 64-byte Cache lines and hardware prefetching.
 * 2. Spatial locality: Row-major traversal (Cache-friendly, Stride 1).
 * 3. Cache thrashing: Column-major traversal (Cache-unfriendly, Stride N).
 * 4. Measuring real CPU elapsed wall-clock time differences.
 */

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stdint.h>

#define ROWS 4096
#define COLS 4096

// Flattened 2D array allocated on heap: 4096 * 4096 * 4 bytes = 64 MB (Larger than L3 cache!)
static int *matrix;

void initialize_matrix(void) {
    matrix = (int *)malloc((size_t)ROWS * COLS * sizeof(int));
    if (!matrix) {
        fprintf(stderr, "Out of memory!\n");
        exit(EXIT_FAILURE);
    }
    for (size_t i = 0; i < (size_t)ROWS * COLS; i++) {
        matrix[i] = 1;
    }
}

int main(void) {
    printf("====================================================\n");
    printf(" CPU CACHE LOCALITY BENCHMARK (Matrix Size: 64 MB)  \n");
    printf("====================================================\n");
    printf("Allocating 4096 x 4096 integers (64 MB)...\n");
    initialize_matrix();

    // 1. Benchmark Cache-Friendly: Row-Major Traversal (Sequential)
    printf("\nRunning Row-Major Traversal (Sequential Stride-1)...\n");
    clock_t start_row = clock();
    long long sum_row = 0;
    for (int r = 0; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            sum_row += matrix[r * COLS + c];
        }
    }
    clock_t end_row = clock();
    double time_row = (double)(end_row - start_row) / CLOCKS_PER_SEC;
    printf("Row-Major completed in: %.4f seconds (Sum = %lld)\n", time_row, sum_row);

    // 2. Benchmark Cache-Unfriendly: Column-Major Traversal (Jumping 16 KB per step)
    printf("\nRunning Column-Major Traversal (Cache-Thrashing Stride-N)...\n");
    clock_t start_col = clock();
    long long sum_col = 0;
    for (int c = 0; c < COLS; c++) {
        for (int r = 0; r < ROWS; r++) {
            sum_col += matrix[r * COLS + c];
        }
    }
    clock_t end_col = clock();
    double time_col = (double)(end_col - start_col) / CLOCKS_PER_SEC;
    printf("Column-Major completed in: %.4f seconds (Sum = %lld)\n\n", time_col, sum_col);

    // Speedup calculation
    if (time_row > 0.00001) {
        printf("--> Row-Major is %.2fx FASTER due to CPU L1/L2/L3 cache line reuse!\n",
               time_col / time_row);
    }

    free(matrix);
    return 0;
}
