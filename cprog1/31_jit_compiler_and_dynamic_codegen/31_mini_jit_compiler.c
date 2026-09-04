/**
 * Module 31: Mini Just-In-Time (JIT) Compiler in C
 *
 * Concepts demonstrated:
 * 1. Requesting executable memory pages from the OS kernel (VirtualAlloc / mmap).
 * 2. Emitting raw x86-64 machine code bytes into RAM at runtime.
 * 3. Casting dynamically written memory to a C function pointer.
 * 4. How V8 (JavaScript) and JVM (Java) execute code at native C speed.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#if defined(_WIN32)
#include <windows.h>
#else
#include <sys/mman.h>
#endif

// Function pointer signature for JIT generated function: int func(int a, int b)
typedef int (*JitBinaryFunc)(int, int);

/* Allocate a page with READ, WRITE, and EXECUTE permissions */
void *allocate_executable_page(size_t size) {
#if defined(_WIN32)
    return VirtualAlloc(NULL, size, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
#else
    return mmap(NULL, size, PROT_READ | PROT_WRITE | PROT_EXEC,
                MAP_ANONYMOUS | MAP_PRIVATE, -1, 0);
#endif
}

void free_executable_page(void *ptr, size_t size) {
#if defined(_WIN32)
    (void)size;
    VirtualFree(ptr, 0, MEM_RELEASE);
#else
    munmap(ptr, size);
#endif
}

int main(void) {
    printf("====================================================\n");
    printf(" MINI JUST-IN-TIME (JIT) COMPILER (x86-64)          \n");
    printf("====================================================\n");

    size_t page_size = 4096;
    uint8_t *exec_memory = (uint8_t *)allocate_executable_page(page_size);
    if (!exec_memory) {
        fprintf(stderr, "Failed to allocate executable memory page!\n");
        return 1;
    }
    printf("Allocated executable page at address: %p\n\n", (void*)exec_memory);

#if defined(__x86_64__) || defined(_M_X64)
    /* Machine Code for x86-64 function:
     * On Windows (x64 ABI): arg1 is RCX (ECX), arg2 is RDX (EDX)
     * On Linux (System V ABI): arg1 is RDI (EDI), arg2 is RSI (ESI)
     */
#if defined(_WIN32)
    // Windows x64: add ecx, edx; mov eax, ecx; ret
    uint8_t jit_bytecode[] = {
        0x01, 0xD1,       // add ecx, edx   (ECX = ECX + EDX)
        0x89, 0xC8,       // mov eax, ecx   (EAX = ECX return value)
        0xC3              // ret            (return to caller)
    };
#else
    // Linux/POSIX x64: lea eax, [rdi + rsi]; ret
    uint8_t jit_bytecode[] = {
        0x8D, 0x04, 0x37, // lea eax, [rdi + rsi] (EAX = EDI + ESI)
        0xC3              // ret
    };
#endif

    // 1. Copy raw CPU machine opcodes into the executable RAM buffer
    memcpy(exec_memory, jit_bytecode, sizeof(jit_bytecode));

    printf("Emitted raw machine code bytes to memory:\n  [ ");
    for (size_t i = 0; i < sizeof(jit_bytecode); i++) {
        printf("0x%02X ", exec_memory[i]);
    }
    printf("]\n\n");

    // 2. Cast the RAM address to a callable C function pointer
    JitBinaryFunc dynamic_add = (JitBinaryFunc)exec_memory;

    // 3. Execute the dynamically generated function!
    int arg1 = 15;
    int arg2 = 27;
    printf("Calling JIT function dynamic_add(%d, %d)...\n", arg1, arg2);
    int result = dynamic_add(arg1, arg2);
    printf("--> JIT Execution Result: %d (Computed by CPU executing memory buffer!)\n", result);

#else
    printf("JIT bytecode execution in this example is formatted for x86-64 architectures.\n");
#endif

    free_executable_page(exec_memory, page_size);
    printf("\nExecutable memory page released cleanly.\n");

    return 0;
}
