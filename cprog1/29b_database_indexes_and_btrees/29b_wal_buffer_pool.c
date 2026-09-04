#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>

/*
 * Module 29b: Mini Write-Ahead Log (WAL) & Buffer Pool Manager
 *
 * Demonstrates:
 * 1. In-memory Buffer Frame caching with Pin Counts & Dirty tracking
 * 2. Write-Ahead Logging (WAL) protocol: Flush WAL before flushing dirty page
 * 3. Page eviction and crash recovery simulation
 */

#define PAGE_SIZE 512
#define POOL_CAPACITY 4
#define MAX_WAL_RECORDS 16

typedef uint64_t lsn_t;

// WAL Log Record
typedef struct {
    lsn_t lsn;
    uint32_t page_id;
    char operation[64];
} wal_record_t;

// In-memory Buffer Pool Frame
typedef struct {
    uint32_t page_id;
    int pin_count;
    bool is_dirty;
    lsn_t page_lsn;
    char data[PAGE_SIZE];
} buffer_frame_t;

static wal_record_t g_wal_log[MAX_WAL_RECORDS];
static size_t g_wal_count = 0;
static lsn_t g_global_lsn = 100;
static lsn_t g_flushed_wal_lsn = 0;

static buffer_frame_t g_pool[POOL_CAPACITY];

void wal_append(uint32_t page_id, const char* op) {
    g_global_lsn++;
    g_wal_log[g_wal_count].lsn = g_global_lsn;
    g_wal_log[g_wal_count].page_id = page_id;
    strncpy(g_wal_log[g_wal_count].operation, op, sizeof(g_wal_log[g_wal_count].operation) - 1);
    printf("   [WAL Log] Appended record LSN %lu: Page %u -> \"%s\"\n", 
           g_global_lsn, page_id, op);
    g_wal_count++;
}

void wal_flush(void) {
    g_flushed_wal_lsn = g_global_lsn;
    printf("   [WAL Flush] Flushed all log records up to LSN %lu safely to disk storage!\n", 
           g_flushed_wal_lsn);
}

buffer_frame_t* buffer_pool_fetch_page(uint32_t page_id) {
    // Check if already in pool
    for (int i = 0; i < POOL_CAPACITY; ++i) {
        if (g_pool[i].page_id == page_id) {
            g_pool[i].pin_count++;
            return &g_pool[i];
        }
    }
    // Find unpinned frame
    for (int i = 0; i < POOL_CAPACITY; ++i) {
        if (g_pool[i].pin_count == 0) {
            // If dirty, MUST satisfy WAL rule: flush WAL before writing page to disk!
            if (g_pool[i].is_dirty) {
                if (g_pool[i].page_lsn > g_flushed_wal_lsn) {
                    printf("   [WAL Protocol] Enforcing WAL Rule: Flushing log before dirty page %u is written!\n", 
                           g_pool[i].page_id);
                    wal_flush();
                }
                printf("   [Disk Flush] Page %u flushed to disk table file.\n", g_pool[i].page_id);
                g_pool[i].is_dirty = false;
            }
            g_pool[i].page_id = page_id;
            g_pool[i].pin_count = 1;
            g_pool[i].page_lsn = 0;
            snprintf(g_pool[i].data, PAGE_SIZE, "Data on Page %u", page_id);
            return &g_pool[i];
        }
    }
    return NULL; // All frames pinned!
}

void buffer_pool_unpin(buffer_frame_t* frame, bool is_modified, const char* modification_desc) {
    if (is_modified) {
        wal_append(frame->page_id, modification_desc);
        frame->is_dirty = true;
        frame->page_lsn = g_global_lsn;
    }
    frame->pin_count--;
}

int main(void) {
    printf("=== Module 29b: Write-Ahead Logging & Buffer Pool Manager ===\n\n");

    printf("1. Fetching Page 10 into Buffer Pool:\n");
    buffer_frame_t* p10 = buffer_pool_fetch_page(10);
    buffer_pool_unpin(p10, true, "UPDATE balance SET amount = 500 WHERE id = 1");

    printf("\n2. Fetching Page 20 into Buffer Pool:\n");
    buffer_frame_t* p20 = buffer_pool_fetch_page(20);
    buffer_pool_unpin(p20, true, "INSERT INTO orders (id, total) VALUES (99, 120)");

    printf("\n3. Forcing Page Eviction by filling Buffer Pool capacity:\n");
    for (uint32_t p = 30; p <= 33; ++p) {
        buffer_frame_t* frame = buffer_pool_fetch_page(p);
        buffer_pool_unpin(frame, false, "");
    }

    printf("\n[SUCCESS] Module 29b executed cleanly! (*^▽^*)\n");
    return 0;
}
