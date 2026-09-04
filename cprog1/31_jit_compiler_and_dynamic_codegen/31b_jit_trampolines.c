#define _GNU_SOURCE
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#if defined(_WIN32)
#include <windows.h>
#else
#include <sys/mman.h>
#include <unistd.h>
#endif

/*
 * Module 31b: W^X Compliant JIT Compilation & I-Cache Flushing
 *
 * Demonstrates:
 * 1. Allocating PROT_READ | PROT_WRITE memory
 * 2. Emitting x86-64 machine code (int compute(int a, int b) => (a * 5) + b)
 * 3. Flushing Instruction Cache (__builtin___clear_cache)
 * 4. Transitioning protection to PROT_READ | PROT_EXEC via mprotect
 * 5. Executing safely and verifying result
 */

typedef int (*jit_func_t)(int a, int b);

int main(void) {
    printf("=== Module 31b: W^X JIT Compiler & I-Cache Invalidation ===\n\n");

    #if defined(__x86_64__) || defined(_M_X64)
    size_t page_size = 4096;

    #if !defined(_WIN32)
    // Phase 1: Allocate READ + WRITE memory (NOT EXECUTABLE yet!)
    uint8_t* code_mem = (uint8_t*)mmap(NULL, page_size, PROT_READ | PROT_WRITE, 
                                       MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (code_mem == MAP_FAILED) {
        perror("mmap");
        return 1;
    }
    printf("[Phase 1: Emit] Allocated RW memory at %p\n", (void*)code_mem);

    // Machine opcodes for: int func(int edi, int esi) { return edi * 5 + esi; }
    // lea eax, [rsi + rdi*4] ; add eax, edi -> eax = rsi + rdi*5 ; ret
    // System V AMD64: edi=a, esi=b, returns in eax
    uint8_t opcodes[] = {
        0x8D, 0x04, 0xBF, // lea (%rdi,%rdi,4),%eax  -> eax = a * 5
        0x01, 0xF0,       // add %esi,%eax            -> eax = (a * 5) + b
        0xC3              // ret
    };

    memcpy(code_mem, opcodes, sizeof(opcodes));
    printf("[Phase 1: Emit] Written %zu bytes of x86-64 machine opcodes.\n", sizeof(opcodes));

    // Phase 2: Instruction Cache Flush & W^X Transition
    #if defined(__GNUC__) || defined(__clang__)
    __builtin___clear_cache((char*)code_mem, (char*)code_mem + sizeof(opcodes));
    printf("[Phase 2: Security] Flushed CPU Instruction Cache (__builtin___clear_cache)!\n");
    #endif

    // Transition memory from READ_WRITE to READ_EXECUTE (Enforcing W^X!)
    if (mprotect(code_mem, page_size, PROT_READ | PROT_EXEC) != 0) {
        perror("mprotect");
        return 1;
    }
    printf("[Phase 2: Security] mprotect set memory to PROT_READ | PROT_EXEC (W^X Enforced!)\n");

    // Phase 3: Fast Native Execution
    jit_func_t jit_fn = (jit_func_t)(void*)code_mem;
    int a = 10;
    int b = 7;
    printf("\n[Phase 3: Run] Calling JIT function with args (%d, %d)...\n", a, b);
    int result = jit_fn(a, b);
    printf("   -> JIT Result: %d (Expected: %d)\n", result, (10 * 5) + 7);

    munmap(code_mem, page_size);
    #else
    printf("Windows x64 platform handling: VirtualAlloc -> VirtualProtect(PAGE_EXECUTE_READ) -> FlushInstructionCache\n");
    #endif

    #else
    printf("Non-x86_64 architecture detected. Concept applies identically on ARM64!\n");
    #endif

    printf("\n[SUCCESS] Module 31b executed cleanly! (*^▽^*)\n");
    return 0;
}
