/**
 * Module 32: Grand Unified Software Execution Tracer
 *
 * Concepts demonstrated:
 * 1. Simulating the complete lifecycle of program execution.
 * 2. Tracing the stages: OS Loader -> Memory Layout -> Execution Loop -> Syscall Exit.
 * 3. Inspecting real runtime addresses of Text, Data, BSS, Heap, and Stack.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

// Initialized Global (Data Segment)
int g_initialized_global = 100;

// Uninitialized Global (BSS Segment)
int g_uninitialized_global;

void sample_function(void) {
    // Code in Text Segment
}

int main(int argc, char *argv[]) {
    printf("====================================================\n");
    printf(" GRAND UNIFIED SOFTWARE STACK TRACER                \n");
    printf("====================================================\n");

    // 1. Stack Variable (Local frame)
    int stack_var = 42;

    // 2. Heap Variable (Dynamic allocation)
    int *heap_var = (int *)malloc(sizeof(int));
    *heap_var = 999;

    printf("Runtime Memory Map on your machine:\n\n");
    printf("  [ High Memory ] (0x%zX)\n", (uintptr_t)&argc);
    printf("  --------------------------------------------------\n");
    printf("  STACK Segment       (Locals) : &stack_var   = %p\n", (void*)&stack_var);
    printf("  STACK Segment       (Argv)   : &argv        = %p\n", (void*)&argv);
    printf("                              |\n");
    printf("                              v (Stack grows Downward)\n\n");
    printf("                              ^ (Heap grows Upward)\n");
    printf("                              |\n");
    printf("  HEAP Segment        (malloc) : heap_var     = %p\n", (void*)heap_var);
    printf("  BSS Segment         (Uninit) : &g_uninit    = %p\n", (void*)&g_uninitialized_global);
    printf("  DATA Segment        (Init)   : &g_init      = %p\n", (void*)&g_initialized_global);
    printf("  TEXT/CODE Segment   (Func)   : &sample_func = %p\n", (void*)&sample_function);
    printf("  TEXT/CODE Segment   (main)   : &main        = %p\n", (void*)&main);
    printf("  --------------------------------------------------\n");
    printf("  [ Low Memory  ] (0x00000000)\n\n");

    printf("Summary of Lifecycle:\n");
    printf("1. OS Executable Loader created Virtual Address space.\n");
    printf("2. libc initialized runtime and invoked main().\n");
    printf("3. Stack frames allocated and managed automatically.\n");
    printf("4. Heap memory allocated via MMU demand paging.\n");
    printf("5. All layers working in harmony from hardware silicon to user code!\n");

    free(heap_var);
    return 0;
}
