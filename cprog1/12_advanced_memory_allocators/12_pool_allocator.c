/**
 * Module 12: Fixed-Size Block Memory Pool with Embedded Free-List
 *
 * Concepts demonstrated:
 * 1. O(1) allocation and O(1) deallocation without system malloc/free overhead.
 * 2. Embedded Free-List: Free nodes store pointers inside unallocated user memory.
 * 3. Complete prevention of external heap fragmentation.
 * 4. Safety bounds checking for pool pointers.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

/* Node stored inside free blocks */
typedef struct PoolNode {
    struct PoolNode *next;
} PoolNode;

/* Pool allocator control structure */
typedef struct {
    uint8_t *buffer;
    size_t block_size;
    size_t block_count;
    PoolNode *free_list;
    size_t active_allocations;
} MemoryPool;

/* Initialize pool with capacity for 'block_count' chunks of 'block_size' bytes */
MemoryPool pool_init(size_t block_size, size_t block_count) {
    MemoryPool pool;
    // Ensure block is at least large enough to hold the PoolNode pointer itself
    pool.block_size = (block_size < sizeof(PoolNode)) ? sizeof(PoolNode) : block_size;
    // Align block size to 8-byte boundary
    pool.block_size = (pool.block_size + 7) & ~((size_t)7);
    pool.block_count = block_count;
    pool.active_allocations = 0;

    size_t total_bytes = pool.block_size * pool.block_count;
    pool.buffer = (uint8_t *)malloc(total_bytes);
    if (!pool.buffer) {
        fprintf(stderr, "Fatal: Could not allocate memory pool buffer\n");
        exit(EXIT_FAILURE);
    }

    // Link all blocks together in the initial free-list
    pool.free_list = (PoolNode *)pool.buffer;
    for (size_t i = 0; i < block_count - 1; i++) {
        PoolNode *current = (PoolNode *)(pool.buffer + (i * pool.block_size));
        PoolNode *next = (PoolNode *)(pool.buffer + ((i + 1) * pool.block_size));
        current->next = next;
    }
    // Last block points to NULL
    PoolNode *last = (PoolNode *)(pool.buffer + ((block_count - 1) * pool.block_size));
    last->next = NULL;

    return pool;
}

/* O(1) Pop head of free list */
void *pool_alloc(MemoryPool *pool) {
    if (pool->free_list == NULL) {
        fprintf(stderr, "Pool out of memory! No free blocks remaining.\n");
        return NULL;
    }
    PoolNode *allocated_node = pool->free_list;
    pool->free_list = pool->free_list->next;
    pool->active_allocations++;
    return (void *)allocated_node;
}

/* O(1) Push freed block back to head of free list */
void pool_free(MemoryPool *pool, void *ptr) {
    if (ptr == NULL) return;

    // Safety check: Ensure pointer actually lives within this pool's memory buffer
    uintptr_t start = (uintptr_t)pool->buffer;
    uintptr_t end = start + (pool->block_size * pool->block_count);
    uintptr_t target = (uintptr_t)ptr;

    if (target < start || target >= end) {
        fprintf(stderr, "Error: Attempted to free pointer %p not owned by this pool!\n", ptr);
        return;
    }

    PoolNode *freed_node = (PoolNode *)ptr;
    freed_node->next = pool->free_list;
    pool->free_list = freed_node;
    pool->active_allocations--;
}

void pool_destroy(MemoryPool *pool) {
    if (pool->buffer) {
        free(pool->buffer);
        pool->buffer = NULL;
    }
    pool->free_list = NULL;
    pool->active_allocations = 0;
}

typedef struct {
    int entity_id;
    float position_x;
    float position_y;
} Particle;

int main(void) {
    printf("====================================================\n");
    printf(" 1. FIXED-SIZE POOL ALLOCATOR INITIALIZATION        \n");
    printf("====================================================\n");
    MemoryPool particle_pool = pool_init(sizeof(Particle), 3);
    printf("Pool initialized for 3 Particles (Block size: %zu bytes)\n\n",
           particle_pool.block_size);

    printf("====================================================\n");
    printf(" 2. ALLOCATING OBJECTS                              \n");
    printf("====================================================\n");
    Particle *p1 = (Particle *)pool_alloc(&particle_pool);
    p1->entity_id = 1; p1->position_x = 10.0f; p1->position_y = 20.0f;
    printf("Allocated Particle 1 at %p (Active: %zu/3)\n", (void*)p1, particle_pool.active_allocations);

    Particle *p2 = (Particle *)pool_alloc(&particle_pool);
    p2->entity_id = 2; p2->position_x = 30.0f; p2->position_y = 40.0f;
    printf("Allocated Particle 2 at %p (Active: %zu/3)\n", (void*)p2, particle_pool.active_allocations);

    Particle *p3 = (Particle *)pool_alloc(&particle_pool);
    p3->entity_id = 3; p3->position_x = 50.0f; p3->position_y = 60.0f;
    printf("Allocated Particle 3 at %p (Active: %zu/3)\n\n", (void*)p3, particle_pool.active_allocations);

    // Attempting allocation when full
    Particle *p4 = (Particle *)pool_alloc(&particle_pool);
    printf("Attempted 4th allocation -> Result: %p\n\n", (void*)p4);

    printf("====================================================\n");
    printf(" 3. FREEING AND RE-USING SLOTS (O(1) RECLAIM)       \n");
    printf("====================================================\n");
    printf("Freeing Particle 2 (address %p)...\n", (void*)p2);
    pool_free(&particle_pool, p2);
    printf("Active allocations: %zu/3\n", particle_pool.active_allocations);

    // Allocate again: will immediately reuse the slot that was just freed!
    Particle *p_new = (Particle *)pool_alloc(&particle_pool);
    p_new->entity_id = 99;
    printf("Allocated new particle: Address is %p (Reused slot! Active: %zu/3)\n\n",
           (void*)p_new, particle_pool.active_allocations);

    pool_destroy(&particle_pool);
    printf("Memory pool destroyed cleanly.\n");

    return 0;
}
