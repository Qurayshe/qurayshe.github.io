/**
 * Module 13: Virtual Memory Pages, Alignment & Page Boundaries
 *
 * Concepts demonstrated:
 * 1. 4096-byte (4 KB) OS Virtual Memory page math.
 * 2. Calculating Virtual Page Number (VPN) and Page Offset from raw pointer addresses.
 * 3. Page alignment rounding up and rounding down bitwise algorithms.
 * 4. Simulating Page Table entry lookups and permission flags.
 */

#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#define PAGE_SIZE 4096U       // 4 KB = 2^12 bytes
#define PAGE_MASK (PAGE_SIZE - 1) // 0x0FFF (lower 12 bits)

/* Bitwise page calculations */
uintptr_t get_page_base_address(uintptr_t address) {
    return address & ~((uintptr_t)PAGE_MASK);
}

uintptr_t get_page_offset(uintptr_t address) {
    return address & PAGE_MASK;
}

uintptr_t align_to_next_page(uintptr_t address) {
    return (address + PAGE_MASK) & ~((uintptr_t)PAGE_MASK);
}

/* Simulated MMU Page Table Entry (PTE) */
typedef struct {
    uint32_t physical_frame_num : 20;
    uint32_t is_present         : 1;
    uint32_t is_writable        : 1;
    uint32_t is_executable      : 1;
    uint32_t is_dirty           : 1; // Written to
    uint32_t reserved           : 8;
} PageTableEntry;

int main(void) {
    printf("====================================================\n");
    printf(" 1. VIRTUAL MEMORY PAGE CALCULATIONS (4 KB PAGES)   \n");
    printf("====================================================\n");
    int stack_variable = 42;
    uintptr_t raw_addr = (uintptr_t)&stack_variable;

    uintptr_t page_base = get_page_base_address(raw_addr);
    uintptr_t offset    = get_page_offset(raw_addr);

    printf("Variable Address : 0x%zX\n", raw_addr);
    printf("Virtual Page Base: 0x%zX\n", page_base);
    printf("Offset in Page   : %zu bytes (0x%zX)\n\n", offset, offset);

    printf("====================================================\n");
    printf(" 2. PAGE ALIGNMENT ROUNDING                         \n");
    printf("====================================================\n");
    size_t requested_bytes = 10000; // ~9.76 KB
    size_t pages_needed = align_to_next_page(requested_bytes) / PAGE_SIZE;

    printf("Requested bytes    : %zu bytes\n", requested_bytes);
    printf("Aligned allocation : %zu bytes (%zu whole 4KB pages)\n\n",
           align_to_next_page(requested_bytes), pages_needed);

    printf("====================================================\n");
    printf(" 3. SIMULATED MMU PAGE TABLE ENTRY (PTE)            \n");
    printf("====================================================\n");
    PageTableEntry pte = {0};
    pte.physical_frame_num = 0x1A2B;
    pte.is_present = 1;
    pte.is_writable = 1;
    pte.is_executable = 0;

    printf("PTE Status:\n");
    printf("  Present in RAM? %s\n", pte.is_present ? "YES" : "NO (Page Fault!)");
    printf("  Writable?       %s\n", pte.is_writable ? "YES" : "READ-ONLY");
    printf("  Executable?     %s\n", pte.is_executable ? "YES (Code)" : "NO (Data/NX bit)");
    printf("  Physical Frame  : 0x%05X\n", pte.physical_frame_num);

    uintptr_t physical_address = ((uintptr_t)pte.physical_frame_num * PAGE_SIZE) | offset;
    printf("Translated Physical RAM Address: 0x%zX\n", physical_address);

    return 0;
}
