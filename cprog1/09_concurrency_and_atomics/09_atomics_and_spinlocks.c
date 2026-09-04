/**
 * Module 09: Atomic Operations, Memory Consistency & Custom Spinlock
 *
 * Concepts demonstrated:
 * 1. Lock-free atomic increment, load, and store operations.
 * 2. Compare-And-Swap (CAS) mechanics using atomic_compare_exchange_strong.
 * 3. Implementing a lightweight spinlock mutex from first principles.
 * 4. Memory order concepts and race condition avoidance.
 */

#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>

#if defined(__STDC_NO_ATOMICS__)
#error "C11 Atomics not supported by this compiler"
#else
#include <stdatomic.h>
#endif

/* Custom Spinlock Type */
typedef struct {
    atomic_flag flag;
} Spinlock;

#define SPINLOCK_INIT { ATOMIC_FLAG_INIT }

void spinlock_lock(Spinlock *lock) {
    // atomic_flag_test_and_set returns the previous value and sets the flag to true.
    // If it was already true (locked), we spin until the owner clears it.
    while (atomic_flag_test_and_set_explicit(&lock->flag, memory_order_acquire)) {
        // Spin-wait loop (in real systems, can insert CPU pause instruction)
    }
}

void spinlock_unlock(Spinlock *lock) {
    // Release the lock
    atomic_flag_clear_explicit(&lock->flag, memory_order_release);
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. LOCK-FREE ATOMIC COUNTER OPERATIONS             \n");
    printf("====================================================\n");
    atomic_int counter = ATOMIC_VAR_INIT(0);

    // Atomic fetch and add
    int prev = atomic_fetch_add(&counter, 10);
    printf("Previous value: %d, New value: %d\n", prev, atomic_load(&counter));

    atomic_fetch_add(&counter, 5);
    printf("After adding 5: %d\n\n", atomic_load(&counter));

    printf("====================================================\n");
    printf(" 2. COMPARE-AND-SWAP (CAS) DEMONSTRATION            \n");
    printf("====================================================\n");
    atomic_int target_val = ATOMIC_VAR_INIT(100);

    int expected = 50;  // Wrong guess
    int desired  = 200;

    printf("Attempting CAS with expected = %d, desired = %d (Actual = %d)...\n",
           expected, desired, atomic_load(&target_val));

    bool success = atomic_compare_exchange_strong(&target_val, &expected, desired);
    printf("CAS Success? %s. Target is now: %d (Expected was updated to actual: %d)\n",
           success ? "YES" : "NO", atomic_load(&target_val), expected);

    // Second attempt with correct expected value
    printf("\nRetrying CAS with correct expected = %d, desired = %d...\n",
           expected, desired);
    success = atomic_compare_exchange_strong(&target_val, &expected, desired);
    printf("CAS Success? %s. Target is now: %d\n\n",
           success ? "YES" : "NO", atomic_load(&target_val));

    printf("====================================================\n");
    printf(" 3. CUSTOM SPINLOCK MUTEX DEMO                      \n");
    printf("====================================================\n");
    Spinlock my_lock = SPINLOCK_INIT;

    printf("Acquiring spinlock...\n");
    spinlock_lock(&my_lock);
    printf("--> Critical section entered safely!\n");

    // Simulated critical section work
    int shared_resource = 42;
    shared_resource += 100;
    printf("--> Shared resource updated to: %d\n", shared_resource);

    printf("Releasing spinlock...\n");
    spinlock_unlock(&my_lock);
    printf("--> Spinlock released.\n");

    return 0;
}
