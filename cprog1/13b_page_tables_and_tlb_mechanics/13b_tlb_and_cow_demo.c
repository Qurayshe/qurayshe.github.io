#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <time.h>

/*
 * Module 13b: Page Tables, TLB Stride & Copy-on-Write (COW)
 *
 * Demonstrates:
 * 1. Simulating x86-64 4-level virtual address decomposition
 * 2. TLB miss stride benchmark across 4KB page boundaries
 * 3. Fork and Copy-on-Write (COW) memory behavior
 */

#define PAGE_SIZE 4096

// Decompose a 64-bit virtual pointer into 4-level page table indices
void decompose_virtual_address(uintptr_t vaddr) {
    uint16_t offset   = vaddr & 0xFFF;
    uint16_t pt_idx   = (vaddr >> 12) & 0x1FF;
    uint16_t pd_idx   = (vaddr >> 21) & 0x1FF;
    uint16_t pdpt_idx = (vaddr >> 30) & 0x1FF;
    uint16_t pml4_idx = (vaddr >> 39) & 0x1FF;

    printf("[Virtual Address 0x%016lX Breakdown]:\n", (unsigned long)vaddr);
    printf("   PML4 Index : %3u (Entries in Level 4 Table)\n", pml4_idx);
    printf("   PDPT Index : %3u (Entries in Level 3 Table)\n", pdpt_idx);
    printf("   PD   Index : %3u (Entries in Level 2 Table)\n", pd_idx);
    printf("   PT   Index : %3u (Entries in Level 1 Table)\n", pt_idx);
    printf("   Page Offset: %3u (Offset inside 4KB physical page)\n\n", offset);
}

void demo_cow(void) {
    printf("--- Copy-On-Write (COW) Memory Demonstration ---\n");

    // Allocate shared anonymous page
    char* shared_mem = (char*)mmap(NULL, PAGE_SIZE, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    snprintf(shared_mem, PAGE_SIZE, "Original string written by Parent process");

    printf("Parent allocated page at %p with text: \"%s\"\n", (void*)shared_mem, shared_mem);

    pid_t pid = fork();
    if (pid == 0) {
        // Inside Child
        printf("[Child] Reads before write: \"%s\"\n", shared_mem);
        // Writing to memory triggers a Page Fault -> OS gives child a fresh new physical page!
        snprintf(shared_mem, PAGE_SIZE, "MODIFIED by Child (Private Copy triggered!)");
        printf("[Child] Reads after write:  \"%s\"\n", shared_mem);
        exit(0);
    } else {
        wait(NULL); // Wait for child to exit
        printf("[Parent] Reads after child wrote: \"%s\"\n", shared_mem);
        printf("[Parent] Note: Parent's memory remains completely unchanged!\n\n");
    }

    munmap(shared_mem, PAGE_SIZE);
}

int main(void) {
    printf("=== Module 13b: Page Tables & Copy-On-Write Mechanics ===\n\n");

    int stack_var = 42;
    decompose_virtual_address((uintptr_t)&stack_var);
    decompose_virtual_address((uintptr_t)main);

    demo_cow();

    printf("[SUCCESS] Module 13b executed cleanly! (*^▽^*)\n");
    return 0;
}
