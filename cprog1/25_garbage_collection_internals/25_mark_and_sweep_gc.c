/**
 * Module 25: Mark-and-Sweep Garbage Collector in Pure C
 *
 * Concepts demonstrated:
 * 1. Tracking heap objects in an internal VM linked list.
 * 2. Simulating the VM execution stack containing Root pointers.
 * 3. Mark Phase: Recursive graph traversal from stack roots.
 * 4. Sweep Phase: Freeing unreachable (unmarked) memory blocks automatically.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define STACK_MAX 128

typedef enum {
    OBJ_INT,
    OBJ_PAIR
} ObjectType;

typedef struct Object {
    ObjectType type;
    bool is_marked;
    struct Object *next_in_heap; // All allocated objects linked for sweeping

    // Object payload
    union {
        int value;
        struct {
            struct Object *head;
            struct Object *tail;
        } pair;
    };
} Object;

/* Minimal VM State */
typedef struct {
    Object *stack[STACK_MAX];
    int stack_size;
    Object *heap_head; // Master list of all allocated heap objects
    int total_objects;
} VirtualMachine;

VirtualMachine *vm_create(void) {
    VirtualMachine *vm = (VirtualMachine *)malloc(sizeof(VirtualMachine));
    vm->stack_size = 0;
    vm->heap_head = NULL;
    vm->total_objects = 0;
    return vm;
}

void vm_push(VirtualMachine *vm, Object *obj) {
    vm->stack[vm->stack_size++] = obj;
}

Object *vm_pop(VirtualMachine *vm) {
    return vm->stack[--vm->stack_size];
}

/* Allocate a new heap object tracked by VM */
Object *vm_alloc_object(VirtualMachine *vm, ObjectType type) {
    Object *obj = (Object *)malloc(sizeof(Object));
    obj->type = type;
    obj->is_marked = false;

    // Prepend to VM heap tracker list
    obj->next_in_heap = vm->heap_head;
    vm->heap_head = obj;
    vm->total_objects++;
    return obj;
}

/* Mark Phase: Graph DFS from stack roots */
void mark(Object *obj) {
    if (obj == NULL || obj->is_marked) return;

    obj->is_marked = true;

    if (obj->type == OBJ_PAIR) {
        mark(obj->pair.head);
        mark(obj->pair.tail);
    }
}

void mark_all_roots(VirtualMachine *vm) {
    for (int i = 0; i < vm->stack_size; i++) {
        mark(vm->stack[i]);
    }
}

/* Sweep Phase: Free unreferenced heap memory */
void sweep(VirtualMachine *vm) {
    Object **current = &vm->heap_head;
    while (*current) {
        if (!(*current)->is_marked) {
            // Unreached object! Reclaim memory
            Object *unreachable = *current;
            *current = unreachable->next_in_heap;
            printf("  [GC Sweep] Freeing unreachable object (%s) at %p\n",
                   unreachable->type == OBJ_INT ? "INT" : "PAIR", (void*)unreachable);
            free(unreachable);
            vm->total_objects--;
        } else {
            // Reached object: unmark for next GC cycle
            (*current)->is_marked = false;
            current = &(*current)->next_in_heap;
        }
    }
}

void run_garbage_collection(VirtualMachine *vm) {
    printf("\n--- Triggering Garbage Collection (Total objects before GC: %d) ---\n", vm->total_objects);
    mark_all_roots(vm);
    sweep(vm);
    printf("--- GC Complete (Live objects remaining: %d) ---\n\n", vm->total_objects);
}

int main(void) {
    printf("====================================================\n");
    printf(" MARK-AND-SWEEP GARBAGE COLLECTION IN C             \n");
    printf("====================================================\n");
    VirtualMachine *vm = vm_create();

    // 1. Allocate objects on stack (Live Roots)
    Object *a = vm_alloc_object(vm, OBJ_INT); a->value = 10;
    vm_push(vm, a);

    Object *b = vm_alloc_object(vm, OBJ_INT); b->value = 20;
    vm_push(vm, b);

    // Create a Pair referencing a and b
    Object *pair = vm_alloc_object(vm, OBJ_PAIR);
    pair->pair.head = a;
    pair->pair.tail = b;
    vm_push(vm, pair);

    // 2. Allocate an unreachable orphan object (Simulates a dropped local variable)
    Object *orphan = vm_alloc_object(vm, OBJ_INT); orphan->value = 999;
    (void)orphan; // Not on the stack!

    printf("Allocated 4 objects. Running GC while 3 objects are live on stack:\n");
    run_garbage_collection(vm);

    // 3. Pop all objects off stack (Simulates function return)
    printf("Popping all objects from stack (Simulating function exit)...\n");
    vm_pop(vm);
    vm_pop(vm);
    vm_pop(vm);

    printf("Running second GC cycle with empty stack:\n");
    run_garbage_collection(vm);

    free(vm);
    return 0;
}
