/**
 * Module 26: Dynamic Typing, Boxed Objects & PyObject Architecture
 *
 * Concepts demonstrated:
 * 1. Simulating CPython's PyObject base struct header and type tagging.
 * 2. Boxed integers, strings, and floats in C.
 * 3. Dynamic runtime type dispatch for operators (e.g. implementing 'add').
 * 4. Memory footprint comparison: Raw C primitives vs Boxed Dynamic Objects.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

typedef enum {
    TYPE_INT,
    TYPE_FLOAT,
    TYPE_STRING
} TypeTag;

// Base Object Header (Matches CPython PyObject design)
typedef struct DynamicObject {
    TypeTag type;
    size_t ref_count;
} DynamicObject;

// Derived Boxed Types
typedef struct {
    DynamicObject base;
    int64_t int_val;
} BoxedInt;

typedef struct {
    DynamicObject base;
    double float_val;
} BoxedFloat;

typedef struct {
    DynamicObject base;
    char str_val[64];
} BoxedString;

// Constructors
DynamicObject *create_int(int64_t val) {
    BoxedInt *obj = (BoxedInt *)malloc(sizeof(BoxedInt));
    obj->base.type = TYPE_INT;
    obj->base.ref_count = 1;
    obj->int_val = val;
    return (DynamicObject *)obj;
}

DynamicObject *create_string(const char *str) {
    BoxedString *obj = (BoxedString *)malloc(sizeof(BoxedString));
    obj->base.type = TYPE_STRING;
    obj->base.ref_count = 1;
    strncpy(obj->str_val, str, sizeof(obj->str_val) - 1);
    obj->str_val[sizeof(obj->str_val) - 1] = '\0';
    return (DynamicObject *)obj;
}

// Dynamic Runtime Addition Operator (Evaluates types at runtime like Python)
DynamicObject *dynamic_add(DynamicObject *a, DynamicObject *b) {
    if (a->type == TYPE_INT && b->type == TYPE_INT) {
        int64_t sum = ((BoxedInt *)a)->int_val + ((BoxedInt *)b)->int_val;
        return create_int(sum);
    } else if (a->type == TYPE_STRING && b->type == TYPE_STRING) {
        char buffer[128];
        snprintf(buffer, sizeof(buffer), "%s%s",
                 ((BoxedString *)a)->str_val,
                 ((BoxedString *)b)->str_val);
        return create_string(buffer);
    } else {
        fprintf(stderr, "TypeError: unsupported operand types for +\n");
        return NULL;
    }
}

void print_dynamic_object(const DynamicObject *obj) {
    if (!obj) return;
    switch (obj->type) {
        case TYPE_INT:
            printf("<int: %lld> (sizeof = %zu bytes)\n",
                   (long long)((BoxedInt *)obj)->int_val, sizeof(BoxedInt));
            break;
        case TYPE_STRING:
            printf("<str: \"%s\"> (sizeof = %zu bytes)\n",
                   ((BoxedString *)obj)->str_val, sizeof(BoxedString));
            break;
        default:
            break;
    }
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. DYNAMIC OBJECT CREATION & MEMORY FOOTPRINT      \n");
    printf("====================================================\n");
    printf("Raw C int size       : %zu bytes\n", sizeof(int));
    printf("Boxed DynamicInt size: %zu bytes (Header + Payload)\n\n", sizeof(BoxedInt));

    // Simulate: x = 10, y = 20, z = x + y
    DynamicObject *x = create_int(10);
    DynamicObject *y = create_int(20);
    DynamicObject *z = dynamic_add(x, y);

    printf("x = "); print_dynamic_object(x);
    printf("y = "); print_dynamic_object(y);
    printf("z = x + y -> "); print_dynamic_object(z);

    printf("\n====================================================\n");
    printf(" 2. DYNAMIC STRING CONCATENATION                    \n");
    printf("====================================================\n");
    // Simulate: s1 = "Hello, ", s2 = "World!", s3 = s1 + s2
    DynamicObject *s1 = create_string("Hello, ");
    DynamicObject *s2 = create_string("World!");
    DynamicObject *s3 = dynamic_add(s1, s2);

    printf("s1 = "); print_dynamic_object(s1);
    printf("s2 = "); print_dynamic_object(s2);
    printf("s3 = s1 + s2 -> "); print_dynamic_object(s3);

    // Cleanup
    free(x); free(y); free(z);
    free(s1); free(s2); free(s3);

    return 0;
}
