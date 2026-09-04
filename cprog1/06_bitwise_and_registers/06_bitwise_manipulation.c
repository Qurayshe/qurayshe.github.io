/**
 * Module 06: Bitwise Operations, Bitmasks, and Bit Flags
 *
 * Concepts demonstrated:
 * 1. Setting, clearing, toggling, and testing individual bits.
 * 2. Creating and applying multi-bit masks.
 * 3. Fast power-of-two detection via bitwise arithmetic.
 * 4. Permission bitmasks (like Unix chmod rwx).
 */

#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

void print_binary_8(uint8_t val) {
    for (int i = 7; i >= 0; i--) {
        putchar((val & (1U << i)) ? '1' : '0');
    }
}

// Unix-style file permission flags
#define PERM_EXECUTE (1U << 0) // 0b00000001 (1)
#define PERM_WRITE   (1U << 1) // 0b00000010 (2)
#define PERM_READ    (1U << 2) // 0b00000100 (4)

int main(void) {
    printf("====================================================\n");
    printf(" 1. BASIC BIT OPERATIONS ON A SINGLE BYTE           \n");
    printf("====================================================\n");
    uint8_t flags = 0b00000000;
    printf("Initial       : "); print_binary_8(flags); printf(" (0x%02X)\n", flags);

    // 1. SET bit 3 and bit 5
    flags |= (1U << 3);
    flags |= (1U << 5);
    printf("Set bits 3 & 5: "); print_binary_8(flags); printf(" (0x%02X)\n", flags);

    // 2. CHECK bit 3
    bool bit_3_is_set = (flags & (1U << 3)) != 0;
    printf("Is bit 3 set? : %s\n", bit_3_is_set ? "YES" : "NO");

    // 3. CLEAR bit 3
    flags &= ~(1U << 3);
    printf("Clear bit 3   : "); print_binary_8(flags); printf(" (0x%02X)\n", flags);

    // 4. TOGGLE bit 5 and bit 0
    flags ^= (1U << 5); // Clears bit 5
    flags ^= (1U << 0); // Sets bit 0
    printf("Toggle 5 and 0: "); print_binary_8(flags); printf(" (0x%02X)\n\n", flags);

    printf("====================================================\n");
    printf(" 2. PERMISSIONS BITMASK SYSTEM                      \n");
    printf("====================================================\n");
    uint8_t user_perms = PERM_READ | PERM_WRITE; // Read + Write (6)

    printf("User permissions: ");
    print_binary_8(user_perms);
    printf(" [ %c%c%c ]\n",
           (user_perms & PERM_READ) ? 'r' : '-',
           (user_perms & PERM_WRITE) ? 'w' : '-',
           (user_perms & PERM_EXECUTE) ? 'x' : '-');

    // Grant execute
    user_perms |= PERM_EXECUTE;
    printf("After adding execute permission: [ %c%c%c ]\n\n",
           (user_perms & PERM_READ) ? 'r' : '-',
           (user_perms & PERM_WRITE) ? 'w' : '-',
           (user_perms & PERM_EXECUTE) ? 'x' : '-');

    printf("====================================================\n");
    printf(" 3. FAST BITWISE TRICKS                             \n");
    printf("====================================================\n");
    uint32_t test_values[] = {0, 1, 2, 3, 4, 15, 16, 100, 128, 255, 256};
    for (size_t i = 0; i < sizeof(test_values)/sizeof(test_values[0]); i++) {
        uint32_t n = test_values[i];
        bool is_pow2 = (n > 0) && ((n & (n - 1)) == 0);
        printf("Number %3u is %spower of 2\n", n, is_pow2 ? "a   " : "NOT ");
    }

    return 0;
}
