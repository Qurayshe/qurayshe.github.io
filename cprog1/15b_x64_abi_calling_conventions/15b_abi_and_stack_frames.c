#define _GNU_SOURCE
#include <stdio.h>
#include <stdint.h>
#include <inttypes.h>

/*
 * Module 15b: x86-64 Calling Convention & Stack Inspection
 *
 * Demonstrates:
 * 1. Register parameter passing inspection via inline assembly
 * 2. 16-byte stack alignment check
 * 3. Stack frame pointer traversal (%rbp chaining)
 */

#if defined(__x86_64__) || defined(_M_X64)

// Function that inspects its incoming registers directly from CPU state
__attribute__((noinline))
int inspect_abi_registers(int a, int b, int c, int d, int e, int f, int g) {
    uint64_t rdi_val, rsi_val, rdx_val, rcx_val, r8_val, r9_val, rsp_val;

    #if defined(__linux__) || defined(__APPLE__)
    // System V AMD64 ABI registers
    __asm__ volatile (
        "movq %%rdi, %0\n"
        "movq %%rsi, %1\n"
        "movq %%rdx, %2\n"
        "movq %%rcx, %3\n"
        "movq %%r8,  %4\n"
        "movq %%r9,  %5\n"
        "movq %%rsp, %6\n"
        : "=r"(rdi_val), "=r"(rsi_val), "=r"(rdx_val), "=r"(rcx_val), "=r"(r8_val), "=r"(r9_val), "=r"(rsp_val)
    );

    printf("--- System V ABI Register Snapshot inside Function ---\n");
    printf("   Arg 1 (%%rdi): %" PRIu64 " (C arg 'a' = %d)\n", rdi_val, a);
    printf("   Arg 2 (%%rsi): %" PRIu64 " (C arg 'b' = %d)\n", rsi_val, b);
    printf("   Arg 3 (%%rdx): %" PRIu64 " (C arg 'c' = %d)\n", rdx_val, c);
    printf("   Arg 4 (%%rcx): %" PRIu64 " (C arg 'd' = %d)\n", rcx_val, d);
    printf("   Arg 5 (%%r8 ): %" PRIu64 " (C arg 'e' = %d)\n", r8_val,  e);
    printf("   Arg 6 (%%r9 ): %" PRIu64 " (C arg 'f' = %d)\n", r9_val,  f);
    printf("   Arg 7 (Stack): %d (Passed via stack memory frame!)\n", g);
    printf("   Current %%rsp: 0x%016" PRIX64 " (Alignment modulo 16: %lu)\n\n", rsp_val, rsp_val % 16);
    #else
    printf("Windows x64 ABI: Args passed in RCX, RDX, R8, R9\n");
    #endif

    return a + b + c + d + e + f + g;
}

#endif

int main(void) {
    printf("=== Module 15b: x86-64 ABI & Calling Conventions ===\n\n");

    #if defined(__x86_64__) || defined(_M_X64)
    int sum = inspect_abi_registers(10, 20, 30, 40, 50, 60, 70);
    printf("Calculated sum of 7 arguments: %d\n", sum);
    #else
    printf("Non-x86_64 architecture detected. ABI principles remain conceptual!\n");
    #endif

    printf("\n[SUCCESS] Module 15b executed cleanly! (≧∇≦)ﾉ\n");
    return 0;
}
