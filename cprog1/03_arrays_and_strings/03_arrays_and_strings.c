/**
 * Module 03: Arrays, Pointer Arithmetic, and String Memory Mechanics
 *
 * Concepts demonstrated:
 * 1. Array-pointer decay and why arr[i] == *(arr + i).
 * 2. Pointer arithmetic step sizes for char vs int vs double.
 * 3. Null-terminated strings and building custom string functions from scratch.
 * 4. Multi-dimensional 2D array flat memory layout.
 */

#include <stdio.h>
#include <stdint.h>

/* Custom strlen implementation showing pointer arithmetic traversal */
size_t custom_strlen(const char *str) {
    if (str == NULL) return 0;
    const char *ptr = str;
    while (*ptr != '\0') {
        ptr++; // Advance 1 byte
    }
    return (size_t)(ptr - str); // Distance between pointers
}

/* Custom strcpy implementation */
void custom_strcpy(char *dest, const char *src) {
    if (dest == NULL || src == NULL) return;
    while (*src != '\0') {
        *dest = *src;
        dest++;
        src++;
    }
    *dest = '\0'; // Crucial: terminate the destination string!
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. ARRAY INDEXING VS POINTER ARITHMETIC            \n");
    printf("====================================================\n");
    int arr[5] = {100, 200, 300, 400, 500};
    int *p = arr; // Array decays to &arr[0]

    printf("arr address        : %p\n", (void*)arr);
    printf("&arr[0] address    : %p\n", (void*)&arr[0]);
    printf("arr[2] value       : %d\n", arr[2]);
    printf("*(arr + 2) value   : %d\n", *(arr + 2));
    printf("2[arr] value       : %d (Commutative syntax trick!)\n\n", 2[arr]);

    printf("====================================================\n");
    printf(" 2. STEP SIZES IN POINTER ARITHMETIC                \n");
    printf("====================================================\n");
    char   c_arr[2] = {'A', 'B'};
    int    i_arr[2] = {10, 20};
    double d_arr[2] = {1.1, 2.2};

    char   *c_ptr = c_arr;
    int    *i_ptr = i_arr;
    double *d_ptr = d_arr;

    printf("char*   step: ptr=%p -> ptr+1=%p (Delta = %td byte)\n",
           (void*)c_ptr, (void*)(c_ptr + 1), (uint8_t*)(c_ptr + 1) - (uint8_t*)c_ptr);
    printf("int*    step: ptr=%p -> ptr+1=%p (Delta = %td bytes)\n",
           (void*)i_ptr, (void*)(i_ptr + 1), (uint8_t*)(i_ptr + 1) - (uint8_t*)i_ptr);
    printf("double* step: ptr=%p -> ptr+1=%p (Delta = %td bytes)\n\n",
           (void*)d_ptr, (void*)(d_ptr + 1), (uint8_t*)(d_ptr + 1) - (uint8_t*)d_ptr);

    printf("====================================================\n");
    printf(" 3. STRING MEMORY & CUSTOM STRING FUNCTIONS         \n");
    printf("====================================================\n");
    char stack_buffer[32];
    const char *source = "Systems Programming";

    printf("Source string: \"%s\" (custom_strlen = %zu)\n", source, custom_strlen(source));
    custom_strcpy(stack_buffer, source);
    printf("Copied buffer: \"%s\"\n", stack_buffer);

    // Inspecting raw bytes including the null terminator
    printf("Raw buffer bytes: ");
    for (size_t i = 0; i <= custom_strlen(stack_buffer); i++) {
        if (stack_buffer[i] == '\0') {
            printf("[\\0:0x00] ");
        } else {
            printf("[%c:0x%02X] ", stack_buffer[i], (uint8_t)stack_buffer[i]);
        }
    }
    printf("\n\n");

    printf("====================================================\n");
    printf(" 4. 2D ARRAY FLAT MEMORY LAYOUT                     \n");
    printf("====================================================\n");
    int matrix[2][3] = {
        {11, 12, 13},
        {21, 22, 23}
    };

    printf("Matrix address: %p\n", (void*)matrix);
    int *flat_ptr = &matrix[0][0];
    printf("Accessing 2D elements linearly as flat memory:\n");
    for (int i = 0; i < 6; i++) {
        printf("flat_ptr[%d] = %d (Address: %p)\n", i, flat_ptr[i], (void*)&flat_ptr[i]);
    }

    return 0;
}
