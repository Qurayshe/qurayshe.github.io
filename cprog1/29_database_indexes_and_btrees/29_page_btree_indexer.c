/**
 * Module 29: Database B-Tree Index Page Search in C
 *
 * Concepts demonstrated:
 * 1. Structuring database index nodes to fit disk page boundaries.
 * 2. Multi-way branching B-Tree node layout.
 * 3. Fast binary search within a single page cache frame.
 * 4. Resolving record keys to raw disk file byte offsets in O(log N) page reads.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

#define KEYS_PER_NODE 3
#define CHILDREN_PER_NODE (KEYS_PER_NODE + 1)

/* Index Entry mapping a Primary Key to a File Byte Offset */
typedef struct {
    uint32_t key;
    uint64_t file_offset; // Byte offset in main database table file
} IndexEntry;

/* B-Tree Node (Designed to model a disk page) */
typedef struct BTreeNode {
    bool is_leaf;
    int num_keys;
    IndexEntry entries[KEYS_PER_NODE];
    struct BTreeNode *children[CHILDREN_PER_NODE];
} BTreeNode;

BTreeNode *create_node(bool is_leaf) {
    BTreeNode *node = (BTreeNode *)calloc(1, sizeof(BTreeNode));
    node->is_leaf = is_leaf;
    node->num_keys = 0;
    return node;
}

/* Binary search inside a single node page */
int find_key_index_in_node(const BTreeNode *node, uint32_t key) {
    int idx = 0;
    while (idx < node->num_keys && node->entries[idx].key < key) {
        idx++;
    }
    return idx;
}

/* Search B-Tree for key and return file offset */
bool btree_search(const BTreeNode *node, uint32_t key, uint64_t *out_offset, int *page_reads) {
    (*page_reads)++;
    int idx = find_key_index_in_node(node, key);

    // Key found in this node
    if (idx < node->num_keys && node->entries[idx].key == key) {
        *out_offset = node->entries[idx].file_offset;
        return true;
    }

    // If leaf and not found, key doesn't exist
    if (node->is_leaf) {
        return false;
    }

    // Traverse down to appropriate child page
    return btree_search(node->children[idx], key, out_offset, page_reads);
}

int main(void) {
    printf("====================================================\n");
    printf(" DATABASE B-TREE PAGE INDEXER (Pure C)              \n");
    printf("====================================================\n");
    printf("sizeof(BTreeNode) = %zu bytes\n\n", sizeof(BTreeNode));

    // Construct a 2-level B-Tree index
    // Root Node (Keys: 200, 400)
    BTreeNode *root = create_node(false);
    root->num_keys = 2;
    root->entries[0] = (IndexEntry){ .key = 200, .file_offset = 0x1000 };
    root->entries[1] = (IndexEntry){ .key = 400, .file_offset = 0x2000 };

    // Leaf 0: Keys < 200 (Keys: 50, 100)
    BTreeNode *leaf0 = create_node(true);
    leaf0->num_keys = 2;
    leaf0->entries[0] = (IndexEntry){ .key = 50,  .file_offset = 0x0100 };
    leaf0->entries[1] = (IndexEntry){ .key = 100, .file_offset = 0x0200 };

    // Leaf 1: 200 <= Keys < 400 (Keys: 250, 300)
    BTreeNode *leaf1 = create_node(true);
    leaf1->num_keys = 2;
    leaf1->entries[0] = (IndexEntry){ .key = 250, .file_offset = 0x1200 };
    leaf1->entries[1] = (IndexEntry){ .key = 300, .file_offset = 0x1400 };

    // Leaf 2: Keys >= 400 (Keys: 500, 600)
    BTreeNode *leaf2 = create_node(true);
    leaf2->num_keys = 2;
    leaf2->entries[0] = (IndexEntry){ .key = 500, .file_offset = 0x2500 };
    leaf2->entries[1] = (IndexEntry){ .key = 600, .file_offset = 0x2800 };

    root->children[0] = leaf0;
    root->children[1] = leaf1;
    root->children[2] = leaf2;

    printf("Querying index for User ID 300 (Simulating SELECT WHERE id = 300)...\n");
    uint64_t offset = 0;
    int page_reads = 0;

    if (btree_search(root, 300, &offset, &page_reads)) {
        printf("--> Found! Direct file byte offset: 0x%llX (Located in only %d page reads!)\n",
               (unsigned long long)offset, page_reads);
    } else {
        printf("--> Key not found.\n");
    }

    // Cleanup
    free(leaf0); free(leaf1); free(leaf2); free(root);

    return 0;
}
