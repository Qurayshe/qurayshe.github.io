#define _GNU_SOURCE
#include <stdio.h>
#include <stdint.h>
#include <string.h>

/*
 * Module 01b: Linker Internals & Symbol Resolution
 *
 * Demonstrates:
 * 1. Weak vs Strong symbol resolution
 * 2. Section placements (.text, .rodata, .data, .bss)
 * 3. Inspecting pointer addresses across ELF segments
 */

// Initialized global -> Stored in .data section
int g_initialized_global = 0xDEADBEEF;

// Uninitialized global -> Placed in .bss section (zero-initialized at startup)
int g_uninitialized_global_bss;

// Read-only constant string -> Placed in .rodata section
const char* const g_rodata_string = "Hello from .rodata!";

// Weak default hook: Can be overridden by any strong symbol in another object file
__attribute__((weak)) void platform_hook(void) {
    printf("   [Platform Hook] Executing WEAK default implementation!\n");
}

void print_memory_sections(void) {
    printf("============================================================\n");
    printf(" [ELF Section Layout & Symbol Addresses]                    \n");
    printf("============================================================\n");

    printf(" .text   (Code segment):        %p  (fn: print_memory_sections)\n", (void*)print_memory_sections);
    printf(" .rodata (Read-only string):    %p  (\"%s\")\n", (void*)g_rodata_string, g_rodata_string);
    printf(" .data   (Initialized global):  %p  (val: 0x%X)\n", (void*)&g_initialized_global, g_initialized_global);
    printf(" .bss    (Zero-init global):    %p  (val: %d)\n", (void*)&g_uninitialized_global_bss, g_uninitialized_global_bss);

    int local_stack_var = 1234;
    printf(" Stack   (Local variable):      %p  (val: %d)\n", (void*)&local_stack_var, local_stack_var);
    printf("------------------------------------------------------------\n");
}

int main(void) {
    printf("=== Module 01b: Linker Internals & Symbol Resolution ===\n\n");

    print_memory_sections();

    printf("\nCalling platform_hook() [Weak Symbol Resolution Test]:\n");
    platform_hook();

    printf("\nNote how lower addresses hold .text/.rodata, followed by .data/.bss,\n");
    printf("while the Stack resides at much higher virtual memory addresses!\n");
    printf("\n[SUCCESS] Module 01b executed cleanly! (*^▽^*)\n");
    return 0;
}
