#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <setjmp.h>
#include <stdbool.h>

/*
 * Module 27c: Cooperative Fiber Scheduler (Stackful Coroutines)
 *
 * Demonstrates:
 * 1. Cooperative user-space context switching using setjmp/longjmp
 * 2. Fiber control blocks and cooperative yield() semantics
 * 3. Round-robin multi-fiber interleaving without kernel threads
 */

#define MAX_FIBERS 4

typedef enum {
    FIBER_DEAD = 0,
    FIBER_READY,
    FIBER_RUNNING
} fiber_state_t;

typedef struct {
    jmp_buf env;
    fiber_state_t state;
    int id;
    int counter;
} fiber_t;

static fiber_t g_fibers[MAX_FIBERS];
static int g_current_fiber = 0;
static jmp_buf g_scheduler_env;

// Yield current fiber execution and return to scheduler
void fiber_yield(void) {
    if (setjmp(g_fibers[g_current_fiber].env) == 0) {
        g_fibers[g_current_fiber].state = FIBER_READY;
        longjmp(g_scheduler_env, 1);
    }
    // Execution resumes here when fiber is scheduled again!
}

void fiber_task_1(void) {
    for (int i = 1; i <= 3; ++i) {
        printf("   [Fiber 1] Working on step %d...\n", i);
        fiber_yield();
    }
    printf("   [Fiber 1] Completed all tasks!\n");
    g_fibers[1].state = FIBER_DEAD;
    longjmp(g_scheduler_env, 1);
}

void fiber_task_2(void) {
    for (int i = 1; i <= 3; ++i) {
        printf("   [Fiber 2] Processing batch %d...\n", i * 10);
        fiber_yield();
    }
    printf("   [Fiber 2] Completed all tasks!\n");
    g_fibers[2].state = FIBER_DEAD;
    longjmp(g_scheduler_env, 1);
}

void run_scheduler(void) {
    printf("[Scheduler] Starting fiber round-robin loop...\n");

    while (true) {
        bool has_active = false;
        for (int i = 1; i < MAX_FIBERS; ++i) {
            if (g_fibers[i].state == FIBER_READY) {
                has_active = true;
                g_current_fiber = i;
                g_fibers[i].state = FIBER_RUNNING;

                if (setjmp(g_scheduler_env) == 0) {
                    longjmp(g_fibers[i].env, 1);
                }
            }
        }
        if (!has_active) break;
    }

    printf("[Scheduler] All fibers finished!\n");
}

int main(void) {
    printf("=== Module 27c: Cooperative Fiber Scheduler Demo ===\n\n");

    // Initialize fibers
    g_fibers[1].id = 1;
    g_fibers[1].state = FIBER_READY;
    g_fibers[2].id = 2;
    g_fibers[2].state = FIBER_READY;

    // Bootstrap fiber jump buffers
    if (setjmp(g_fibers[1].env) == 0) {
        if (setjmp(g_fibers[2].env) == 0) {
            run_scheduler();
            printf("\n[SUCCESS] Module 27c executed cleanly! (o゜▽゜)o\n");
            return 0;
        } else {
            fiber_task_2();
        }
    } else {
        fiber_task_1();
    }

    return 0;
}
