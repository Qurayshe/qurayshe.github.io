/**
 * Module 01: Types, Sizes, Bit Representation & Two's Complement
 *
 * Concepts demonstrated:
 * 1. Exact byte sizes of basic and fixed-width types via sizeof.
 * 2. Visualizing the binary representation of memory.
 * 3. Two's complement representation for negative numbers.
 * 4. Unsigned wraparound vs potential overflow hazards.
 */

#include <stdio.h>
#include <stdint.h>
#include <limits.h>

/* Helper function: Print the binary representation of a single byte */
void print_byte_binary(uint8_t byte) {
    for (int i = 7; i >= 0; i--) {
        putchar((byte & (1 << i)) ? '1' : '0');
    }
}

/* Helper function: Print arbitrary memory block in binary format */
void print_memory_binary(const void *ptr, size_t size) {
    const uint8_t *bytes = (const uint8_t *)ptr;
    // Iterate from highest byte to lowest (big-endian display style for reading)
    for (size_t i = size; i > 0; i--) {
        print_byte_binary(bytes[i - 1]);
        putchar(' ');
    }
    putchar('\n');
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. DATA TYPE SIZES (on this system & compiler)     \n");
    printf("====================================================\n");
    printf("sizeof(char)      = %zu byte(s)\n", sizeof(char));
    printf("sizeof(short)     = %zu byte(s)\n", sizeof(short));
    printf("sizeof(int)       = %zu byte(s)\n", sizeof(int));
    printf("sizeof(long)      = %zu byte(s)\n", sizeof(long));
    printf("sizeof(long long) = %zu byte(s)\n", sizeof(long long));
    printf("sizeof(float)     = %zu byte(s)\n", sizeof(float));
    printf("sizeof(double)    = %zu byte(s)\n", sizeof(double));
    printf("sizeof(void*)     = %zu byte(s) (Pointer Width)\n", sizeof(void*));
    printf("sizeof(size_t)    = %zu byte(s)\n\n", sizeof(size_t));

    printf("====================================================\n");
    printf(" 2. FIXED-WIDTH TYPES (from <stdint.h>)             \n");
    printf("====================================================\n");
    printf("sizeof(uint8_t)   = %zu byte  (Range: 0 to %u)\n", sizeof(uint8_t), UINT8_MAX);
    printf("sizeof(int8_t)    = %zu byte  (Range: %d to %d)\n", sizeof(int8_t), INT8_MIN, INT8_MAX);
    printf("sizeof(uint16_t)  = %zu bytes (Range: 0 to %u)\n", sizeof(uint16_t), UINT16_MAX);
    printf("sizeof(int16_t)   = %zu bytes (Range: %d to %d)\n", sizeof(int16_t), INT16_MIN, INT16_MAX);
    printf("sizeof(uint32_t)  = %zu bytes (Range: 0 to %u)\n", sizeof(uint32_t), UINT32_MAX);
    printf("sizeof(int32_t)   = %zu bytes (Range: %d to %d)\n", sizeof(int32_t), INT32_MIN, INT32_MAX);
    printf("sizeof(uint64_t)  = %zu bytes (Range: 0 to %llu)\n", sizeof(uint64_t), (unsigned long long)UINT64_MAX);
    printf("sizeof(int64_t)   = %zu bytes\n\n", sizeof(int64_t));

    printf("====================================================\n");
    printf(" 3. TWO'S COMPLEMENT BINARY INSPECTION              \n");
    printf("====================================================\n");
    int8_t positive_val = 5;
    int8_t negative_val = -5;
    int8_t minus_one    = -1;

    printf("Value: %4d -> Binary: ", positive_val);
    print_byte_binary((uint8_t)positive_val);
    printf(" (Hex: 0x%02X)\n", (uint8_t)positive_val);

    printf("Value: %4d -> Binary: ", negative_val);
    print_byte_binary((uint8_t)negative_val);
    printf(" (Hex: 0x%02X)\n", (uint8_t)negative_val);

    printf("Value: %4d -> Binary: ", minus_one);
    print_byte_binary((uint8_t)minus_one);
    printf(" (Hex: 0x%02X - Notice all 1s!)\n\n", (uint8_t)minus_one);

    printf("====================================================\n");
    printf(" 4. UNSIGNED WRAPAROUND VS OVERFLOW BEHAVIOR        \n");
    printf("====================================================\n");
    uint8_t max_u8 = 255;
    printf("uint8_t max initial value : %u\n", max_u8);
    max_u8 += 1;
    printf("uint8_t after adding 1   : %u (Modulo 256 Wraparound!)\n", max_u8);

    uint8_t zero_u8 = 0;
    zero_u8 -= 1;
    printf("uint8_t 0 minus 1        : %u (Underflow to 255!)\n\n", zero_u8);

    printf("====================================================\n");
    printf(" 5. 32-BIT INTEGER IN MEMORY                        \n");
    printf("====================================================\n");
    int32_t test_32 = 0x12345678;
    printf("Value: 0x12345678 (Decimal: %d)\n", test_32);
    printf("Raw binary (MSB to LSB): ");
    print_memory_binary(&test_32, sizeof(test_32));

    return 0;
}
