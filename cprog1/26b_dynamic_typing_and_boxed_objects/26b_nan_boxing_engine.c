#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>

/*
 * Module 26b: NaN-Boxing Dynamic Typing Engine
 *
 * Demonstrates:
 * 1. Packing Doubles, 32-bit Integers, Booleans, and Pointers into 8 bytes
 * 2. IEEE 754 Quiet NaN bitmask manipulation
 * 3. Exact type checking and zero-overhead extraction
 */

// 64-bit Quiet NaN prefix: Exponent all 1s + Quiet bit (bit 51) set
#define QNAN_MASK     ((uint64_t)0x7FFC000000000000ULL)
#define TAG_MASK      ((uint64_t)0x0003000000000000ULL) // 2-bit tag (bits 48-49)
#define PAYLOAD_MASK  ((uint64_t)0x0000FFFFFFFFFFFFULL) // 48-bit payload

#define TAG_NULL      ((uint64_t)0x0000000000000000ULL)
#define TAG_BOOL      ((uint64_t)0x0001000000000000ULL)
#define TAG_INT       ((uint64_t)0x0002000000000000ULL)
#define TAG_PTR       ((uint64_t)0x0003000000000000ULL)

typedef uint64_t Value;

// Constructors
static inline Value val_from_double(double d) {
    Value v;
    memcpy(&v, &d, sizeof(double));
    return v;
}

static inline Value val_from_int(int32_t i) {
    return QNAN_MASK | TAG_INT | ((uint64_t)(uint32_t)i);
}

static inline Value val_from_bool(bool b) {
    return QNAN_MASK | TAG_BOOL | (b ? 1 : 0);
}

static inline Value val_from_ptr(void* ptr) {
    return QNAN_MASK | TAG_PTR | (((uint64_t)ptr) & PAYLOAD_MASK);
}

static inline Value val_null(void) {
    return QNAN_MASK | TAG_NULL;
}

// Type Checkers
static inline bool is_double(Value v) {
    return (v & QNAN_MASK) != QNAN_MASK;
}

static inline bool is_int(Value v) {
    return (v & (QNAN_MASK | TAG_MASK)) == (QNAN_MASK | TAG_INT);
}

static inline bool is_bool(Value v) {
    return (v & (QNAN_MASK | TAG_MASK)) == (QNAN_MASK | TAG_BOOL);
}

static inline bool is_ptr(Value v) {
    return (v & (QNAN_MASK | TAG_MASK)) == (QNAN_MASK | TAG_PTR);
}

static inline bool is_null(Value v) {
    return v == (QNAN_MASK | TAG_NULL);
}

// Extractors
static inline double as_double(Value v) {
    double d;
    memcpy(&d, &v, sizeof(double));
    return d;
}

static inline int32_t as_int(Value v) {
    return (int32_t)(v & 0xFFFFFFFF);
}

static inline bool as_bool(Value v) {
    return (bool)(v & 1);
}

static inline void* as_ptr(Value v) {
    return (void*)(v & PAYLOAD_MASK);
}

void print_value(Value v) {
    printf("Raw 64-bit Hex: 0x%016llX -> ", (unsigned long long)v);
    if (is_double(v)) {
        printf("[Double]  %f\n", as_double(v));
    } else if (is_int(v)) {
        printf("[Integer] %d\n", as_int(v));
    } else if (is_bool(v)) {
        printf("[Boolean] %s\n", as_bool(v) ? "true" : "false");
    } else if (is_ptr(v)) {
        printf("[Pointer] %p (String target: \"%s\")\n", as_ptr(v), (char*)as_ptr(v));
    } else if (is_null(v)) {
        printf("[Null]\n");
    }
}

int main(void) {
    printf("=== Module 26b: NaN-Boxing Dynamic Typing Engine ===\n\n");
    printf("Size of Value: %zu bytes (Fits in 1 CPU register!)\n\n", sizeof(Value));

    char heap_str[] = "Hello from Dynamic Heap Object!";

    Value v1 = val_from_double(3.1415926535);
    Value v2 = val_from_int(1337);
    Value v3 = val_from_bool(true);
    Value v4 = val_from_ptr(heap_str);
    Value v5 = val_null();

    print_value(v1);
    print_value(v2);
    print_value(v3);
    print_value(v4);
    print_value(v5);

    printf("\n[SUCCESS] NaN-boxing engine parsed all dynamic types in 8 bytes! (*^▽^*)\n");
    return 0;
}
