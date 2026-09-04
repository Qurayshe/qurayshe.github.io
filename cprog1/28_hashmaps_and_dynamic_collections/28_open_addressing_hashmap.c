/**
 * Module 28: Cache-Friendly Open-Addressing Hash Map in C
 *
 * Concepts demonstrated:
 * 1. String hashing (DJB2 algorithm) and fast bitwise modulo indexing.
 * 2. Linear Probing for CPU cache line locality (avoiding pointer indirection).
 * 3. Dynamic resizing when load factor exceeds 70%.
 * 4. Constant time O(1) key-value insertion, search, and retrieval.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <stdbool.h>

#define INITIAL_CAPACITY 8
#define MAX_LOAD_FACTOR 0.70f

typedef struct {
    char key[32];
    int value;
    bool is_occupied;
} HashEntry;

typedef struct {
    HashEntry *entries;
    size_t capacity;
    size_t size;
} HashMap;

/* Fast DJB2 hash algorithm */
uint32_t hash_djb2(const char *str) {
    uint32_t hash = 5381;
    while (*str) {
        hash = ((hash << 5) + hash) + (uint8_t)(*str++);
    }
    return hash;
}

HashMap *hashmap_create(size_t capacity) {
    HashMap *map = (HashMap *)malloc(sizeof(HashMap));
    map->capacity = capacity;
    map->size = 0;
    map->entries = (HashEntry *)calloc(map->capacity, sizeof(HashEntry));
    return map;
}

void hashmap_resize(HashMap *map, size_t new_capacity);

/* Insert key-value with Linear Probing */
void hashmap_set(HashMap *map, const char *key, int value) {
    // Check load factor
    if ((float)(map->size + 1) / (float)map->capacity > MAX_LOAD_FACTOR) {
        hashmap_resize(map, map->capacity * 2);
    }

    uint32_t hash = hash_djb2(key);
    size_t index = (size_t)(hash & (map->capacity - 1));

    // Linear probe
    while (map->entries[index].is_occupied) {
        if (strcmp(map->entries[index].key, key) == 0) {
            map->entries[index].value = value; // Update existing
            return;
        }
        index = (index + 1) & (map->capacity - 1); // Wrap around
    }

    // Insert into empty slot
    strncpy(map->entries[index].key, key, sizeof(map->entries[index].key) - 1);
    map->entries[index].value = value;
    map->entries[index].is_occupied = true;
    map->size++;
}

bool hashmap_get(HashMap *map, const char *key, int *out_value) {
    uint32_t hash = hash_djb2(key);
    size_t index = (size_t)(hash & (map->capacity - 1));
    size_t start_index = index;

    while (map->entries[index].is_occupied) {
        if (strcmp(map->entries[index].key, key) == 0) {
            *out_value = map->entries[index].value;
            return true;
        }
        index = (index + 1) & (map->capacity - 1);
        if (index == start_index) break; // Traversed whole table
    }
    return false;
}

void hashmap_resize(HashMap *map, size_t new_capacity) {
    printf("  [HashMap] Resizing table: %zu -> %zu buckets\n", map->capacity, new_capacity);
    HashEntry *old_entries = map->entries;
    size_t old_capacity = map->capacity;

    map->entries = (HashEntry *)calloc(new_capacity, sizeof(HashEntry));
    map->capacity = new_capacity;
    map->size = 0;

    for (size_t i = 0; i < old_capacity; i++) {
        if (old_entries[i].is_occupied) {
            hashmap_set(map, old_entries[i].key, old_entries[i].value);
        }
    }
    free(old_entries);
}

void hashmap_free(HashMap *map) {
    free(map->entries);
    free(map);
}

int main(void) {
    printf("====================================================\n");
    printf(" OPEN-ADDRESSING HASH MAP WITH LINEAR PROBING       \n");
    printf("====================================================\n");
    HashMap *map = hashmap_create(INITIAL_CAPACITY);
    printf("Created hash map with initial capacity %zu\n\n", map->capacity);

    hashmap_set(map, "user_alice", 101);
    hashmap_set(map, "user_bob",   202);
    hashmap_set(map, "user_carol", 303);
    hashmap_set(map, "user_dave",  404);
    hashmap_set(map, "user_eve",   505);
    hashmap_set(map, "user_frank", 606); // Triggers resize!

    printf("\nQuerying keys:\n");
    const char *test_keys[] = {"user_alice", "user_dave", "user_unknown"};
    for (int i = 0; i < 3; i++) {
        int val = 0;
        if (hashmap_get(map, test_keys[i], &val)) {
            printf("  Key '%s' found -> Value = %d\n", test_keys[i], val);
        } else {
            printf("  Key '%s' NOT FOUND\n", test_keys[i]);
        }
    }

    hashmap_free(map);
    return 0;
}
