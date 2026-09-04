/**
 * Module 11: OS Signal Handling & Safe Asynchronous State Mutation
 *
 * Concepts demonstrated:
 * 1. Registering custom signal handlers with signal().
 * 2. Safe async-signal handling using volatile sig_atomic_t flags.
 * 3. Graceful shutdown architecture for server/daemon loops.
 * 4. Raising software signals programmatically.
 */

#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <stdbool.h>

/* Volatile sig_atomic_t guarantees lock-free atomic read/write even when interrupted */
static volatile sig_atomic_t g_shutdown_requested = 0;
static volatile sig_atomic_t g_custom_signal_count = 0;

/* Clean, async-safe signal handler (NO printf or malloc inside real signal handlers!) */
void handle_sigint(int signum) {
    (void)signum;
    g_shutdown_requested = 1;
}

void handle_sigfpe(int signum) {
    (void)signum;
    g_custom_signal_count++;
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. REGISTERING SIGNAL HANDLERS                     \n");
    printf("====================================================\n");
    // Register custom handlers
    signal(SIGINT, handle_sigint);
    signal(SIGFPE, handle_sigfpe);
    printf("Registered handlers for SIGINT (Ctrl+C) and SIGFPE.\n\n");

    printf("====================================================\n");
    printf(" 2. PROGRAMMATIC SIGNAL DELIVERY (raise)            \n");
    printf("====================================================\n");
    printf("Sending SIGFPE signal programmatically via raise()...\n");
    raise(SIGFPE);
    printf("Signal intercepted! Handler executed. Count = %d\n\n", (int)g_custom_signal_count);

    printf("====================================================\n");
    printf(" 3. SIMULATING A SAFE EVENT LOOP WITH GRACEFUL EXIT \n");
    printf("====================================================\n");
    printf("Entering main worker loop...\n");

    int tick = 0;
    while (!g_shutdown_requested && tick < 5) {
        printf("  [Worker Loop] Processing tick #%d\n", tick);
        tick++;

        // Simulate receiving a shutdown interrupt on tick 3
        if (tick == 3) {
            printf("  --> Simulated external SIGINT trigger!\n");
            raise(SIGINT);
        }
    }

    if (g_shutdown_requested) {
        printf("\nGraceful shutdown signal detected! Performing resource cleanup...\n");
        printf("All buffers flushed, handles closed safely. Clean exit.\n");
    }

    return 0;
}
