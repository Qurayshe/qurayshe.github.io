/**
 * Module 05: Dynamic Memory Allocation, Resizing & Memory Safety
 *
 * Concepts demonstrated:
 * 1. Safe allocation using malloc/calloc and checking for NULL.
 * 2. Dynamic resizing using realloc without leaking memory on failure.
 * 3. Preventing use-after-free and double-free with defensive pointer nullification.
 * 4. Building a dynamic integer vector.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

typedef struct {
    int *data;
    size_t size;
    size_t capacity;
} IntVector;

/* Initialize vector */
IntVector vector_create(size_t initial_capacity) {
    IntVector vec;
    vec.size = 0;
    vec.capacity = (initial_capacity > 0) ? initial_capacity : 4;
    vec.data = (int *)malloc(vec.capacity * sizeof(int));
    if (vec.data == NULL) {
        fprintf(stderr, "Fatal: Out of memory!\n");
        exit(EXIT_FAILURE);
    }
    return vec;
}

/* Append item, resizing automatically when full */
void vector_push(IntVector *vec, int value) {
    if (vec->size >= vec->capacity) {
        size_t new_capacity = vec->capacity * 2;
        // Proper realloc pattern: NEVER assign directly to vec->data,
        // because if realloc fails, it returns NULL and leaks the original block!
        int *new_data = (int *)realloc(vec->data, new_capacity * sizeof(int));
        if (new_data == NULL) {
            fprintf(stderr, "Error: Failed to reallocate vector memory!\n");
            return;
        }
        vec->data = new_data;
        vec->capacity = new_capacity;
        printf("[Vector Resize] Capacity expanded to %zu elements (Address: %p)\n",
               vec->capacity, (void*)vec->data);
    }
    vec->data[vec->size++] = value;
}

/* Free allocated memory and nullify */
void vector_free(IntVector *vec) {
    if (vec->data != NULL) {
        free(vec->data);
        vec->data = NULL; // Defend against dangling pointer
    }
    vec->size = 0;
    vec->capacity = 0;
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. DYNAMIC VECTOR WITH SAFE REALLOCATION           \n");
    printf("====================================================\n");
    IntVector vec = vector_create(2);
    printf("Initial vector created with capacity %zu\n", vec.capacity);

    for (int i = 1; i <= 10; i++) {
        vector_push(&vec, i * 10);
    }

    printf("\nFinal vector elements (%zu items): ", vec.size);
    for (size_t i = 0; i < vec.size; i++) {
        printf("%d ", vec.data[i]);
    }
    printf("\n\n");

    printf("====================================================\n");
    printf(" 2. SAFE DEALLOCATION AND NULLIFICATION             \n");
    printf("====================================================\n");
    printf("Freeing vector memory...\n");
    vector_free(&vec);
    printf("vec.data is now: %p (Safe from Use-After-Free)\n", (void*)vec.data);

    // Freeing a NULL pointer is completely safe in C
    free(vec.data);
    printf("Calling free(NULL) completed safely without crashing.\n");

    return 0;
}
