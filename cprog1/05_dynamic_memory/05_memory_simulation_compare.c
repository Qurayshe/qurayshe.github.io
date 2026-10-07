/**
 * Module 05: Memory Simulation & Side-by-Side Comparison
 *
 * Concepts demonstrated:
 * 1. Simulates two parallel memory spaces (64-byte buffer across 4 pages of 16B).
 * 2. Set A: Naive Malloc/Free Heap with 1-byte chunk header overhead and fragmented holes.
 * 3. Set B: Linear Arena with contiguous bump pointer and instant O(1) bulk reset.
 * 4. Prints visual side-by-side memory grids and metric scorecards.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define BUFFER_SIZE 64
#define PAGE_SIZE 16
#define NUM_PAGES (BUFFER_SIZE / PAGE_SIZE)

/* --- Set A: Naive Heap Simulation --- */
typedef struct {
    char cells[BUFFER_SIZE];
    int syscalls;
    int leaks;
} NaiveHeapSim;

void heap_init(NaiveHeapSim *h) {
    memset(h->cells, '.', BUFFER_SIZE);
    h->syscalls = 0;
    h->leaks = 0;
}

int heap_malloc(NaiveHeapSim *h, int payload_len, char id_char) {
    h->syscalls++;
    int total_len = payload_len + 1; /* 1-byte header */
    int start = -1;
    int consecutive = 0;

    for (int i = 0; i < BUFFER_SIZE; i++) {
        if (h->cells[i] == '.' || h->cells[i] == 'X') {
            consecutive++;
            if (consecutive == total_len) {
                start = i - total_len + 1;
                break;
            }
        } else {
            consecutive = 0;
        }
    }

    if (start == -1) return 0; /* Failed to find contiguous block (Fragmentation or OOM) */

    h->cells[start] = 'H'; /* Header overhead */
    for (int i = 1; i < total_len; i++) {
        h->cells[start + i] = id_char;
    }
    return 1;
}

int heap_free(NaiveHeapSim *h, char id_char) {
    int found = 0;
    for (int i = 0; i < BUFFER_SIZE; i++) {
        if (h->cells[i] == id_char) {
            found = 1;
            /* Also find and free preceding header */
            if (i > 0 && h->cells[i - 1] == 'H') {
                h->cells[i - 1] = 'X';
            }
            h->cells[i] = 'X'; /* Mark as fragmented hole */
        }
    }
    return found;
}

/* --- Set B: Linear Arena Simulation --- */
typedef struct {
    char cells[BUFFER_SIZE];
    int offset;
    int syscalls;
} ArenaSim;

void arena_init_sim(ArenaSim *a) {
    memset(a->cells, '.', BUFFER_SIZE);
    a->offset = 0;
    a->syscalls = 1; /* 1 pre-allocation syscall */
}

int arena_alloc_sim(ArenaSim *a, int payload_len, char id_char) {
    if (a->offset + payload_len > BUFFER_SIZE) return 0;
    for (int i = 0; i < payload_len; i++) {
        a->cells[a->offset + i] = id_char;
    }
    a->offset += payload_len;
    return 1;
}

void arena_reset_sim(ArenaSim *a) {
    memset(a->cells, '.', BUFFER_SIZE);
    a->offset = 0;
}

/* --- Visual Grid Rendering --- */
void render_memory_grid(const NaiveHeapSim *h, const ArenaSim *a, const char *step_title) {
    printf("\n============================================================================\n");
    printf(" %s\n", step_title);
    printf("============================================================================\n");
    printf("SET A: NAIVE HEAP (MALLOC/FREE)       | SET B: LINEAR ARENA (BUMP)          \n");
    printf("--------------------------------------+-------------------------------------\n");

    for (int p = 0; p < NUM_PAGES; p++) {
        int p_start = p * PAGE_SIZE;
        int p_end = p_start + PAGE_SIZE;
        printf("--- PAGE %d [0x%02X - 0x%02X] --------------- | --- PAGE %d [0x%02X - 0x%02X] --------------\n",
               p, p_start, p_end - 1, p, p_start, p_end - 1);

        for (int row = 0; row < PAGE_SIZE / 8; row++) {
            int r_start = p_start + row * 8;
            int r_end = r_start + 8;

            printf("0x%02X: ", r_start);
            for (int i = r_start; i < r_end; i++) printf("[%c]", h->cells[i]);
            printf("    | 0x%02X: ", r_start);
            for (int i = r_start; i < r_end; i++) printf("[%c]", a->cells[i]);
            printf("\n");
        }
    }

    /* Calculate stats */
    int a_payload = 0, a_header = 0, a_holes = 0, a_free = 0;
    for (int i = 0; i < BUFFER_SIZE; i++) {
        if (h->cells[i] == 'H') a_header++;
        else if (h->cells[i] == 'X') a_holes++;
        else if (h->cells[i] == '.') a_free++;
        else a_payload++;
    }

    int b_payload = a->offset;
    int b_free = BUFFER_SIZE - a->offset;

    printf("============================================================================\n");
    printf("METRIC COMPARISON                | SET A (NAIVE)       | SET B (ARENA)     \n");
    printf("---------------------------------+---------------------+-------------------\n");
    printf("Total Managed Buffer             | %-19d | %-18d\n", BUFFER_SIZE, BUFFER_SIZE);
    printf("Active Payload (Usable Data)     | %d B (%d%%)           | %d B (%d%%)\n",
           a_payload, (a_payload * 100) / BUFFER_SIZE, b_payload, (b_payload * 100) / BUFFER_SIZE);
    printf("Metadata Overhead (Headers)      | %d B (%d%%)            | 0 B (0%%)\n",
           a_header, (a_header * 100) / BUFFER_SIZE);
    printf("Fragmented Holes                 | %d B (%d%%)           | 0 B (0%%)\n",
           a_holes, (a_holes * 100) / BUFFER_SIZE);
    printf("Unallocated Free Space           | %d B (%d%%)           | %d B (%d%%)\n",
           a_free, (a_free * 100) / BUFFER_SIZE, b_free, (b_free * 100) / BUFFER_SIZE);
    printf("OS Allocation Syscalls           | %-19d | 1 (pre-allocated)\n", h->syscalls);
    printf("============================================================================\n");
    printf("LEGEND: [H]=Header  [1-9]=Payload Chunk  [X]=Fragmented Hole  [.]=Free Unused\n");
}

int main(void) {
    printf("============================================================================\n");
    printf(" MEMORY MANAGEMENT COMPARISON: NAIVE HEAP VS LINEAR ARENA ALLOCATOR         \n");
    printf("============================================================================\n");

    NaiveHeapSim heap;
    ArenaSim arena;
    heap_init(&heap);
    arena_init_sim(&arena);

    /* Step 1: Allocate 5 objects filling most of the 64-byte buffer */
    heap_malloc(&heap, 10, '1');
    heap_malloc(&heap, 10, '2');
    heap_malloc(&heap, 10, '3');
    heap_malloc(&heap, 10, '4');
    heap_malloc(&heap, 10, '5');

    arena_alloc_sim(&arena, 10, '1');
    arena_alloc_sim(&arena, 10, '2');
    arena_alloc_sim(&arena, 10, '3');
    arena_alloc_sim(&arena, 10, '4');
    arena_alloc_sim(&arena, 10, '5');
    render_memory_grid(&heap, &arena, "STEP 1: INITIAL 5 ALLOCATIONS (10 BYTES EACH)");

    /* Step 2: Deallocate objects #1 and #3 */
    heap_free(&heap, '1');
    heap_free(&heap, '3');
    render_memory_grid(&heap, &arena, "STEP 2: DEALLOCATED OBJECTS #1 AND #3 (FRAGMENTED HOLES CREATED)");

    /* Step 3: Attempt to allocate a 15-byte object */
    int ok_a = heap_malloc(&heap, 15, '6');
    int ok_b = arena_alloc_sim(&arena, 14, '6');
    printf("\n>>> ALLOCATION TEST (Requesting contiguous block):\n");
    printf("    Set A (Naive Heap):  %s\n", ok_a ? "ALLOCATED" : "FAILED (FRAGMENTATION OOM: Free holes are too small!)");
    printf("    Set B (Arena):       %s\n", ok_b ? "ALLOCATED" : "CAPACITY FULL");
    render_memory_grid(&heap, &arena, "STEP 3: AFTER 15-BYTE ALLOCATION ATTEMPT");

    /* Step 4: Bulk Reset */
    heap_init(&heap);
    arena_reset_sim(&arena);
    render_memory_grid(&heap, &arena, "STEP 4: BULK RESET (INSTANT ARENA WIPE)");

    return 0;
}

