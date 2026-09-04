#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <unistd.h>
#include <fcntl.h>
#include <string.h>
#include <errno.h>

#if defined(__linux__)
#include <sys/epoll.h>
#endif

/*
 * Module 27b: I/O Multiplexing & Reactor Pattern Demo
 *
 * Demonstrates:
 * 1. Creating an epoll instance (epoll_create1)
 * 2. Non-blocking descriptor registration (epoll_ctl)
 * 3. O(1) Event demultiplexing loop (epoll_wait)
 */

#define MAX_EVENTS 8

// Helper to set non-blocking flag
int set_nonblocking(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);
    if (flags == -1) return -1;
    return fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

int main(void) {
    printf("=== Module 27b: I/O Multiplexing & Reactor Pattern ===\n\n");

    #if defined(__linux__)
    int pipe_fds[2];
    if (pipe(pipe_fds) == -1) {
        perror("pipe");
        return 1;
    }

    set_nonblocking(pipe_fds[0]); // Read end
    set_nonblocking(pipe_fds[1]); // Write end

    int epoll_fd = epoll_create1(0);
    if (epoll_fd == -1) {
        perror("epoll_create1");
        return 1;
    }

    // Register pipe read-end for EPOLLIN events
    struct epoll_event ev;
    ev.events = EPOLLIN;
    ev.data.fd = pipe_fds[0];

    if (epoll_ctl(epoll_fd, EPOLL_CTL_ADD, pipe_fds[0], &ev) == -1) {
        perror("epoll_ctl");
        return 1;
    }

    printf("[Reactor] Registered pipe descriptor %d with epoll instance %d\n", pipe_fds[0], epoll_fd);

    // Simulate incoming data arriving asynchronously
    const char* test_msg = "Hello from Async Network Packet!";
    printf("[Producer] Writing \"%s\" into pipe...\n", test_msg);
    write(pipe_fds[1], test_msg, strlen(test_msg) + 1);

    // Reactor event loop poll
    struct epoll_event ready_events[MAX_EVENTS];
    printf("[Reactor] Calling epoll_wait() to check for active events...\n");
    int num_ready = epoll_wait(epoll_fd, ready_events, MAX_EVENTS, 1000);

    printf("[Reactor] epoll_wait returned %d ready event(s)!\n", num_ready);
    for (int i = 0; i < num_ready; ++i) {
        if (ready_events[i].data.fd == pipe_fds[0]) {
            char buffer[128];
            ssize_t bytes_read = read(pipe_fds[0], buffer, sizeof(buffer));
            printf("   -> [Event Triggered] Read %zd bytes: \"%s\"\n", bytes_read, buffer);
        }
    }

    close(pipe_fds[0]);
    close(pipe_fds[1]);
    close(epoll_fd);
    #else
    printf("Non-Linux OS detected (epoll is Linux-specific; kqueue/IOCP provide equivalent mechanics)\n");
    #endif

    printf("\n[SUCCESS] Module 27b executed cleanly! (o゜▽゜)o\n");
    return 0;
}
