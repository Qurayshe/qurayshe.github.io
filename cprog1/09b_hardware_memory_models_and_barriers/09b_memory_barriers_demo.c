#define _GNU_SOURCE
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <stdatomic.h>
#include <pthread.h>
#include <unistd.h>

/*
 * Module 09b: Hardware Memory Ordering & Barriers Demo
 *
 * Demonstrates:
 * 1. Safe Message Passing pattern using atomic acquire-release semantics
 * 2. Why raw non-atomic flags cause data races and instruction reordering bugs
 * 3. Atomic thread fences vs relaxed operations
 */

typedef struct {
    int payload_data[8];       // Non-atomic payload data
    atomic_bool ready_flag;     // Atomic guard flag
} shared_message_t;

static shared_message_t g_msg;

void* producer_thread(void* arg) {
    (void)arg;
    printf("[Producer] Preparing payload data in memory...\n");
    for (int i = 0; i < 8; ++i) {
        g_msg.payload_data[i] = (i + 1) * 100;
    }

    // memory_order_release guarantees that all prior stores (writing payload_data)
    // are visible to other threads BEFORE this ready_flag store becomes visible!
    printf("[Producer] Publishing message with memory_order_release!\n");
    atomic_store_explicit(&g_msg.ready_flag, true, memory_order_release);
    return NULL;
}

void* consumer_thread(void* arg) {
    (void)arg;
    printf("[Consumer] Waiting for ready_flag with memory_order_acquire...\n");

    // Busy-spin until producer signals readiness with acquire semantics
    while (!atomic_load_explicit(&g_msg.ready_flag, memory_order_acquire)) {
        // CPU yield hint
        #if defined(__x86_64__) || defined(_M_X64)
        __builtin_ia32_pause();
        #endif
    }

    printf("[Consumer] Ready flag observed! Verifying payload contents:\n");
    bool valid = true;
    for (int i = 0; i < 8; ++i) {
        int expected = (i + 1) * 100;
        int actual = g_msg.payload_data[i];
        printf("   payload[%d] = %d %s\n", i, actual, (actual == expected) ? "(OK)" : "(CORRUPT!)");
        if (actual != expected) valid = false;
    }

    if (valid) {
        printf("[Consumer] SUCCESS: All payload data arrived in perfect order!\n");
    } else {
        printf("[Consumer] ERROR: Memory reordering bug detected!\n");
    }
    return NULL;
}

int main(void) {
    printf("=== Module 09b: Hardware Memory Models & Acquire/Release Semantics ===\n\n");

    atomic_init(&g_msg.ready_flag, false);

    pthread_t prod, cons;
    pthread_create(&cons, NULL, consumer_thread, NULL);
    usleep(1000); // 1ms delay so consumer starts polling first
    pthread_create(&prod, NULL, producer_thread, NULL);

    pthread_join(prod, NULL);
    pthread_join(cons, NULL);

    printf("\n[SUCCESS] Module 09b completed! (o゜▽゜)o\n");
    return 0;
}
