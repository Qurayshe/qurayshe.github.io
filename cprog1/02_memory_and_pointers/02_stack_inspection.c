/**
 * Module 02: Stack Memory Inspection & Growth Direction
 *
 * Concepts demonstrated:
 * 1. How local variables are placed in the stack frame.
 * 2. Determining whether the system stack grows downward or upward.
 * 3. Inspecting stack frame addresses across nested recursive function calls.
 */

#include <stdio.h>
#include <stdint.h>

void level_3(int depth) {
    int local_var_3 = 300;
    printf("[Level %d Frame] local_var_3 address: %p\n", depth, (void*)&local_var_3);
}

void level_2(int depth) {
    int local_var_2 = 200;
    printf("[Level %d Frame] local_var_2 address: %p\n", depth, (void*)&local_var_2);
    level_3(depth + 1);
}

void level_1(int depth) {
    int local_var_1 = 100;
    printf("[Level %d Frame] local_var_1 address: %p\n", depth, (void*)&local_var_1);
    level_2(depth + 1);
}

void test_stack_growth(int *parent_addr) {
    int child_var = 1;
    printf("Parent stack address: %p\n", (void*)parent_addr);
    printf("Child  stack address: %p\n", (void*)&child_var);

    if ((uintptr_t)&child_var < (uintptr_t)parent_addr) {
        printf("--> Stack grows DOWNWARD (High to Low address) - Standard x86/x64/ARM behavior.\n\n");
    } else {
        printf("--> Stack grows UPWARD (Low to High address).\n\n");
    }
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. STACK FRAME ADDRESSES ACROSS CALL DEPTH         \n");
    printf("====================================================\n");
    int main_local = 42;
    printf("[Level 0 Frame] main_local  address: %p\n", (void*)&main_local);
    level_1(1);
    printf("\n");

    printf("====================================================\n");
    printf(" 2. DETERMINING STACK GROWTH DIRECTION              \n");
    printf("====================================================\n");
    int root_var = 10;
    test_stack_growth(&root_var);

    printf("====================================================\n");
    printf(" 3. CONSECUTIVE LOCAL VARIABLES IN SAME FRAME       \n");
    printf("====================================================\n");
    int a = 1;
    int b = 2;
    int c = 3;
    printf("Local variable 'a' address: %p\n", (void*)&a);
    printf("Local variable 'b' address: %p (Distance: %td bytes)\n", (void*)&b, (uint8_t*)&b - (uint8_t*)&a);
    printf("Local variable 'c' address: %p (Distance: %td bytes)\n", (void*)&c, (uint8_t*)&c - (uint8_t*)&b);

    return 0;
}
