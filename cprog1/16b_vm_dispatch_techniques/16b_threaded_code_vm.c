#define _GNU_SOURCE
#include <stdio.h>
#include <stdint.h>
#include <time.h>

/*
 * Module 16b: Switch Dispatch vs Direct Threaded Code Benchmark
 *
 * Demonstrates:
 * 1. Classic Switch Dispatch VM loop
 * 2. GCC/Clang Computed Goto (Labels as Values &&label) Direct Threaded VM
 * 3. Performance measurement over 20,000,000 bytecode iterations
 */

typedef enum {
    OP_INC = 0,
    OP_DEC = 1,
    OP_ADD = 2,
    OP_HALT = 3
} opcode_t;

#define NUM_OPS 20000000

static double get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (ts.tv_sec * 1000.0) + (ts.tv_nsec / 1000000.0);
}

// 1. Classic Switch Dispatch
int run_switch_vm(const uint8_t* bytecode, size_t len) {
    int acc = 0;
    const uint8_t* ip = bytecode;
    const uint8_t* end = bytecode + len;

    while (ip < end) {
        switch (*ip++) {
            case OP_INC:
                acc += 2;
                break;
            case OP_DEC:
                acc -= 1;
                break;
            case OP_ADD:
                acc += 5;
                break;
            case OP_HALT:
                return acc;
        }
    }
    return acc;
}

// 2. Direct Threaded Code (Computed Goto)
#if defined(__GNUC__) || defined(__clang__)
int run_threaded_vm(const uint8_t* bytecode, size_t len) {
    int acc = 0;
    const uint8_t* ip = bytecode;
    (void)len;

    static const void* const dispatch_table[] = {
        [OP_INC]  = &&do_inc,
        [OP_DEC]  = &&do_dec,
        [OP_ADD]  = &&do_add,
        [OP_HALT] = &&do_halt
    };

    #define DISPATCH() goto *dispatch_table[*ip++]

    DISPATCH();

do_inc:
    acc += 2;
    DISPATCH();

do_dec:
    acc -= 1;
    DISPATCH();

do_add:
    acc += 5;
    DISPATCH();

do_halt:
    return acc;

    #undef DISPATCH
}
#endif

int main(void) {
    printf("=== Module 16b: High-Performance VM Dispatch Benchmark ===\n\n");
    printf("Generating %d bytecode instructions...\n", NUM_OPS);

    static uint8_t bytecode[NUM_OPS + 1];
    for (int i = 0; i < NUM_OPS; ++i) {
        bytecode[i] = (i % 3); // Alternates INC, DEC, ADD
    }
    bytecode[NUM_OPS] = OP_HALT;

    // Benchmark Switch Dispatch
    double t0 = get_time_ms();
    int res1 = run_switch_vm(bytecode, NUM_OPS + 1);
    double t1 = get_time_ms();
    double switch_time = t1 - t0;
    printf("[Switch Dispatch]   Result: %d, Time: %.2f ms\n", res1, switch_time);

    #if defined(__GNUC__) || defined(__clang__)
    // Benchmark Direct Threading
    double t2 = get_time_ms();
    int res2 = run_threaded_vm(bytecode, NUM_OPS + 1);
    double t3 = get_time_ms();
    double threaded_time = t3 - t2;
    printf("[Direct Threaded]   Result: %d, Time: %.2f ms (%.2fx speedup!)\n", 
           res2, threaded_time, switch_time / threaded_time);
    #endif

    printf("\n[SUCCESS] Module 16b executed cleanly! (*^▽^*)\n");
    return 0;
}
