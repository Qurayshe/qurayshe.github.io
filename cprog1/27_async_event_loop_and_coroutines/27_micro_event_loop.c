/**
 * Module 27: Async Event Loop & Coroutine State Machine in C
 *
 * Concepts demonstrated:
 * 1. Simulating a single-threaded asynchronous Event Loop with a Task Queue.
 * 2. Compiling 'async/await' into explicit C state machines.
 * 3. Non-blocking task suspension (yielding) and resumption.
 * 4. Cooperative multitasking across multiple concurrent tasks without threads.
 */

#include <stdio.h>
#include <stdbool.h>

#define MAX_TASKS 16

/* Forward declaration */
struct Task;
typedef void (*TaskCallback)(struct Task *self);

typedef struct Task {
    int id;
    int state;           // Internal state machine position (0 = init, 1 = resumed, etc.)
    int yield_counter;   // Simulated async I/O timer
    TaskCallback resume; // Function pointer to resume task execution
    bool is_completed;
} Task;

/* The Central Event Loop Engine */
typedef struct {
    Task *tasks[MAX_TASKS];
    int task_count;
} EventLoop;

void event_loop_add(EventLoop *loop, Task *t) {
    if (loop->task_count < MAX_TASKS) {
        loop->tasks[loop->task_count++] = t;
    }
}

void event_loop_run(EventLoop *loop) {
    printf("--- [Event Loop] Starting processing cycle ---\n");
    int active_tasks = loop->task_count;

    while (active_tasks > 0) {
        active_tasks = 0;
        for (int i = 0; i < loop->task_count; i++) {
            Task *t = loop->tasks[i];
            if (!t->is_completed) {
                active_tasks++;
                // Execute a single step of the task coroutine
                t->resume(t);
            }
        }
    }
    printf("--- [Event Loop] All async tasks completed successfully! ---\n\n");
}

/* Coroutine 1: Simulating an Async Network Fetch
 * Corresponds to:
 * async function fetchUser() {
 *     print("Request sent");
 *     await sleep(2);
 *     print("Data received");
 * }
 */
void async_fetch_user_step(Task *self) {
    switch (self->state) {
        case 0:
            printf("  [Task %d: fetchUser] State 0: Sent HTTP Request! Awaiting response (Yielding)...\n", self->id);
            self->yield_counter = 2; // Simulate waiting 2 ticks for I/O
            self->state = 1;
            break;

        case 1:
            if (self->yield_counter > 0) {
                printf("  [Task %d: fetchUser] State 1: Still waiting for socket I/O... (ticks left: %d)\n",
                       self->id, self->yield_counter);
                self->yield_counter--;
            } else {
                printf("  [Task %d: fetchUser] State 1: Response arrived! Parsing user payload...\n", self->id);
                self->state = 2;
            }
            break;

        case 2:
            printf("  [Task %d: fetchUser] State 2: User record stored! Task DONE.\n", self->id);
            self->is_completed = true;
            break;
    }
}

/* Coroutine 2: Simulating an Async File Read */
void async_read_file_step(Task *self) {
    switch (self->state) {
        case 0:
            printf("  [Task %d: readFile ] State 0: Opened file stream. Awaiting disk DMA transfer...\n", self->id);
            self->yield_counter = 1;
            self->state = 1;
            break;

        case 1:
            if (self->yield_counter > 0) {
                self->yield_counter--;
            } else {
                printf("  [Task %d: readFile ] State 1: Read 4096 bytes from disk. Task DONE.\n", self->id);
                self->is_completed = true;
            }
            break;
    }
}

int main(void) {
    printf("====================================================\n");
    printf(" MICRO ASYNC EVENT LOOP & COROUTINES (Pure C)       \n");
    printf("====================================================\n");
    EventLoop loop = { .task_count = 0 };

    Task t1 = { .id = 1, .state = 0, .resume = async_fetch_user_step, .is_completed = false };
    Task t2 = { .id = 2, .state = 0, .resume = async_read_file_step,  .is_completed = false };

    event_loop_add(&loop, &t1);
    event_loop_add(&loop, &t2);

    // Run both concurrent async tasks on a single thread without blocking:
    event_loop_run(&loop);

    return 0;
}
