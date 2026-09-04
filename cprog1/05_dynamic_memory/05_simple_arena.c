/**
 * Module 05: Simple Linear Arena Allocator (Bump Allocator)
 *
 * Concepts demonstrated:
 * 1. Pre-allocating a contiguous buffer to avoid repeated malloc syscalls.
 * 2. O(1) lightning-fast allocation by incrementing an offset pointer.
 * 3. Proper memory alignment handling (aligning to 8-byte boundaries).
 * 4. O(1) instant deallocation of all objects at once (arena_reset).
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

typedef struct {
    uint8_t *buffer;
    size_t capacity;
    size_t offset;
} Arena;

/* Initialize an Arena with a fixed capacity */
Arena arena_init(size_t capacity) {
    Arena arena;
    arena.capacity = capacity;
    arena.offset = 0;
    arena.buffer = (uint8_t *)malloc(capacity);
    if (arena.buffer == NULL) {
        fprintf(stderr, "Fatal: Could not allocate arena backing buffer\n");
        exit(EXIT_FAILURE);
    }
    return arena;
}

/* Allocate bytes from the arena with 8-byte alignment */
void *arena_alloc(Arena *arena, size_t size) {
    // Calculate 8-byte aligned size
    size_t aligned_size = (size + 7) & ~((size_t)7);

    if (arena->offset + aligned_size > arena->capacity) {
        fprintf(stderr, "Arena out of memory! Requested %zu bytes, %zu remaining\n",
                aligned_size, arena->capacity - arena->offset);
        return NULL;
    }

    void *ptr = &arena->buffer[arena->offset];
    arena->offset += aligned_size;
    return ptr;
}

/* Instant O(1) wipe of all allocations without freeing backing buffer */
void arena_reset(Arena *arena) {
    arena->offset = 0;
}

/* Destroy the arena backing buffer completely */
void arena_destroy(Arena *arena) {
    if (arena->buffer) {
        free(arena->buffer);
        arena->buffer = NULL;
    }
    arena->capacity = 0;
    arena->offset = 0;
}

/* Sample data structure for testing */
typedef struct {
    int id;
    char name[28];
} Player;

int main(void) {
    printf("====================================================\n");
    printf(" 1. ARENA ALLOCATOR INITIALIZATION                  \n");
    printf("====================================================\n");
    // Create an arena with 1 KB (1024 bytes) of memory
    Arena arena = arena_init(1024);
    printf("Arena allocated: %zu bytes at buffer %p\n\n", arena.capacity, (void*)arena.buffer);

    printf("====================================================\n");
    printf(" 2. ALLOCATING MULTIPLE OBJECTS                     \n");
    printf("====================================================\n");
    Player *p1 = (Player *)arena_alloc(&arena, sizeof(Player));
    p1->id = 101;
    strcpy(p1->name, "Alice");
    printf("Allocated Player 1 at %p (Offset: %zu bytes)\n", (void*)p1, arena.offset);

    Player *p2 = (Player *)arena_alloc(&arena, sizeof(Player));
    p2->id = 102;
    strcpy(p2->name, "Bob");
    printf("Allocated Player 2 at %p (Offset: %zu bytes)\n", (void*)p2, arena.offset);

    int *scores = (int *)arena_alloc(&arena, 10 * sizeof(int));
    for (int i = 0; i < 10; i++) scores[i] = (i + 1) * 100;
    printf("Allocated int[10] at %p (Offset: %zu bytes)\n\n", (void*)scores, arena.offset);

    printf("Player 1: ID=%d, Name=%s\n", p1->id, p1->name);
    printf("Player 2: ID=%d, Name=%s\n", p2->id, p2->name);
    printf("Score[5]: %d\n\n", scores[5]);

    printf("====================================================\n");
    printf(" 3. O(1) INSTANT RESET (RECLAIM ALL MEMORY)         \n");
    printf("====================================================\n");
    printf("Used before reset: %zu / %zu bytes\n", arena.offset, arena.capacity);
    arena_reset(&arena);
    printf("Used after reset : %zu / %zu bytes (All memory reclaimed instantly!)\n\n",
           arena.offset, arena.capacity);

    arena_destroy(&arena);
    printf("Arena backing buffer destroyed successfully.\n");

    return 0;
}
