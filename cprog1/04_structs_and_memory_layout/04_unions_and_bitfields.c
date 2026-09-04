/**
 * Module 04: Unions, Type Punning, and Bitfields
 *
 * Concepts demonstrated:
 * 1. Unions sharing overlapping memory for all members.
 * 2. Type punning IEEE 754 float into raw hexadecimal and binary.
 * 3. Bitfield structs for packing hardware flags into a single byte.
 */

#include <stdio.h>
#include <stdint.h>

/* Union for inspecting IEEE 754 32-bit single-precision float components */
union FloatInspector {
    float float_val;
    uint32_t raw_bits;
    struct {
        uint32_t mantissa : 23; // Fractional part
        uint32_t exponent : 8;  // Exponent (+127 bias)
        uint32_t sign     : 1;  // Sign bit (0 = positive, 1 = negative)
    } parts;
};

/* Bitfield: Pack multiple device control flags into a single 8-bit byte */
struct HardwareControlRegister {
    uint8_t enable_device : 1; // Bit 0
    uint8_t tx_ready      : 1; // Bit 1
    uint8_t rx_ready      : 1; // Bit 2
    uint8_t interrupt_en  : 1; // Bit 3
    uint8_t baud_rate_sel : 2; // Bits 4-5 (00: 9600, 01: 19200, 10: 57600, 11: 115200)
    uint8_t reserved      : 2; // Bits 6-7
};

int main(void) {
    printf("====================================================\n");
    printf(" 1. UNIONS AND TYPE PUNNING (IEEE 754 FLOAT)        \n");
    printf("====================================================\n");
    union FloatInspector fi;
    fi.float_val = -6.25f;

    printf("Float value : %f\n", fi.float_val);
    printf("Raw 32-bit  : 0x%08X\n", fi.raw_bits);
    printf("  Sign bit  : %u (%s)\n", fi.parts.sign, fi.parts.sign ? "Negative" : "Positive");
    printf("  Exponent  : %u (Raw) -> %d (Unbiased: %u - 127)\n",
           fi.parts.exponent, fi.parts.exponent - 127, fi.parts.exponent);
    printf("  Mantissa  : 0x%06X\n\n", fi.parts.mantissa);

    printf("====================================================\n");
    printf(" 2. BITFIELDS FOR HARDWARE REGISTER FLAGS           \n");
    printf("====================================================\n");
    printf("sizeof(struct HardwareControlRegister) = %zu byte(s)\n",
           sizeof(struct HardwareControlRegister));

    struct HardwareControlRegister reg = {0};
    reg.enable_device = 1;
    reg.tx_ready      = 1;
    reg.interrupt_en  = 1;
    reg.baud_rate_sel = 3; // 115200 baud

    // Read the entire struct as a raw 8-bit byte
    uint8_t raw_reg_byte = *(uint8_t*)&reg;
    printf("Configured flags:\n");
    printf("  enable_device = %u\n", reg.enable_device);
    printf("  tx_ready      = %u\n", reg.tx_ready);
    printf("  rx_ready      = %u\n", reg.rx_ready);
    printf("  interrupt_en  = %u\n", reg.interrupt_en);
    printf("  baud_rate_sel = %u\n", reg.baud_rate_sel);
    printf("Raw register byte value in Hex: 0x%02X (Binary: 00111011)\n", raw_reg_byte);

    return 0;
}
