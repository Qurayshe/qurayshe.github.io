/**
 * Module 02: Pointer Fundamentals & Pass-by-Reference
 *
 * Concepts demonstrated:
 * 1. The address-of operator (&) and dereference operator (*).
 * 2. Why pointers enable functions to mutate caller state (Pass-by-Reference).
 * 3. Generic pointers (void*) and safe casting.
 * 4. NULL pointer defensive checking.
 */

#include <stdio.h>
#include <stdint.h>

/* Pass-by-Value: Operates on local copies; cannot modify originals in main */
void swap_by_value(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
}

/* Pass-by-Reference (via Pointers): Operates directly on caller's memory */
void swap_by_pointer(int *a, int *b) {
    if (a == NULL || b == NULL) return; // Defensive NULL check
    int temp = *a; // Read value at address 'a'
    *a = *b;       // Write value at address 'b' into address 'a'
    *b = temp;     // Write 'temp' into address 'b'
}

/* Generic print function using void* and explicit type tag */
void print_raw_memory(const void *ptr, size_t num_bytes) {
    if (ptr == NULL) {
        printf("(null pointer)\n");
        return;
    }
    const uint8_t *bytes = (const uint8_t *)ptr;
    printf("Memory at %p: [ ", ptr);
    for (size_t i = 0; i < num_bytes; i++) {
        printf("0x%02X ", bytes[i]);
    }
    printf("]\n");
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. ADDRESSES AND DEREFERENCING                     \n");
    printf("====================================================\n");
    int target = 42;
    int *ptr = &target;

    printf("Variable 'target'  : value = %d, address = %p\n", target, (void*)&target);
    printf("Pointer  'ptr'     : value = %p, address = %p\n", (void*)ptr, (void*)&ptr);
    printf("Dereference '*ptr' : %d\n", *ptr);

    // Modifying the variable through the pointer
    *ptr = 999;
    printf("After '*ptr = 999', 'target' is now: %d\n\n", target);

    printf("====================================================\n");
    printf(" 2. PASS-BY-VALUE VS PASS-BY-POINTER (SWAP)         \n");
    printf("====================================================\n");
    int x = 10, y = 20;
    printf("Initial values       : x = %d, y = %d\n", x, y);

    swap_by_value(x, y);
    printf("After swap_by_value  : x = %d, y = %d (NO CHANGE!)\n", x, y);

    swap_by_pointer(&x, &y);
    printf("After swap_by_pointer: x = %d, y = %d (SWAPPED!)\n\n", x, y);

    printf("====================================================\n");
    printf(" 3. GENERIC VOID* POINTER & RAW MEMORY DUMP         \n");
    printf("====================================================\n");
    double pi = 3.141592653589793;
    uint32_t magic = 0xDEADBEEF;

    print_raw_memory(&x, sizeof(x));
    print_raw_memory(&pi, sizeof(pi));
    print_raw_memory(&magic, sizeof(magic));

    return 0;
}
