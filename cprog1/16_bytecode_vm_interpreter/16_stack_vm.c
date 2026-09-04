/**
 * Module 16: Complete Stack-Based Bytecode Virtual Machine (VM)
 *
 * Concepts demonstrated:
 * 1. Defining an Instruction Set Architecture (ISA) with Opcodes.
 * 2. Instruction Pointer (IP) and Execution Stack pointer management.
 * 3. The classic Fetch-Decode-Execute CPU simulation loop.
 * 4. Writing and executing raw binary bytecode programs.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

#define STACK_CAPACITY 64

/* Instruction Set Architecture (ISA) Opcodes */
typedef enum {
    OP_HALT  = 0x00, // Stop VM execution
    OP_PUSH  = 0x01, // Push next byte as literal integer onto stack
    OP_ADD   = 0x02, // Pop 2 values, push sum
    OP_SUB   = 0x03, // Pop 2 values, push (a - b)
    OP_MUL   = 0x04, // Pop 2 values, push (a * b)
    OP_DUP   = 0x05, // Duplicate top of stack
    OP_PRINT = 0x06  // Print and pop top value
} Opcode;

/* Virtual Machine State */
typedef struct {
    int32_t stack[STACK_CAPACITY];
    int sp;            // Stack pointer (points to next free slot)
    const uint8_t *ip; // Instruction pointer (points to current bytecode byte)
    bool running;
} VirtualMachine;

void vm_init(VirtualMachine *vm, const uint8_t *code) {
    vm->sp = 0;
    vm->ip = code;
    vm->running = true;
}

void vm_push(VirtualMachine *vm, int32_t value) {
    if (vm->sp >= STACK_CAPACITY) {
        fprintf(stderr, "VM Error: Stack Overflow!\n");
        vm->running = false;
        return;
    }
    vm->stack[vm->sp++] = value;
}

int32_t vm_pop(VirtualMachine *vm) {
    if (vm->sp <= 0) {
        fprintf(stderr, "VM Error: Stack Underflow!\n");
        vm->running = false;
        return 0;
    }
    return vm->stack[--vm->sp];
}

/* The Core Fetch-Decode-Execute Loop */
void vm_run(VirtualMachine *vm) {
    while (vm->running) {
        // 1. FETCH
        uint8_t instruction = *vm->ip++;

        // 2. DECODE & EXECUTE
        switch (instruction) {
            case OP_HALT:
                vm->running = false;
                break;

            case OP_PUSH: {
                int32_t literal = (int32_t)(*vm->ip++);
                vm_push(vm, literal);
                break;
            }

            case OP_ADD: {
                int32_t b = vm_pop(vm);
                int32_t a = vm_pop(vm);
                vm_push(vm, a + b);
                break;
            }

            case OP_SUB: {
                int32_t b = vm_pop(vm);
                int32_t a = vm_pop(vm);
                vm_push(vm, a - b);
                break;
            }

            case OP_MUL: {
                int32_t b = vm_pop(vm);
                int32_t a = vm_pop(vm);
                vm_push(vm, a * b);
                break;
            }

            case OP_DUP: {
                int32_t val = vm_pop(vm);
                vm_push(vm, val);
                vm_push(vm, val);
                break;
            }

            case OP_PRINT: {
                int32_t val = vm_pop(vm);
                printf("[VM STDOUT] >> %d\n", val);
                break;
            }

            default:
                fprintf(stderr, "VM Error: Unknown opcode 0x%02X\n", instruction);
                vm->running = false;
                break;
        }
    }
}

int main(void) {
    printf("====================================================\n");
    printf(" BYTECODE VIRTUAL MACHINE INTERPRETER               \n");
    printf("====================================================\n");

    /* Program 1: Calculate (7 + 3) * 4
     * Bytecode: PUSH 7, PUSH 3, ADD, PUSH 4, MUL, PRINT, HALT */
    const uint8_t program1[] = {
        OP_PUSH, 7,
        OP_PUSH, 3,
        OP_ADD,
        OP_PUSH, 4,
        OP_MUL,
        OP_PRINT,
        OP_HALT
    };

    printf("Executing Program 1: (7 + 3) * 4 ...\n");
    VirtualMachine vm1;
    vm_init(&vm1, program1);
    vm_run(&vm1);
    printf("Program 1 terminated successfully.\n\n");

    /* Program 2: Duplicate square: 9 -> 9 * 9 = 81
     * Bytecode: PUSH 9, DUP, MUL, PRINT, HALT */
    const uint8_t program2[] = {
        OP_PUSH, 9,
        OP_DUP,
        OP_MUL,
        OP_PRINT,
        OP_HALT
    };

    printf("Executing Program 2: 9^2 (using OP_DUP) ...\n");
    VirtualMachine vm2;
    vm_init(&vm2, program2);
    vm_run(&vm2);
    printf("Program 2 terminated successfully.\n");

    return 0;
}
