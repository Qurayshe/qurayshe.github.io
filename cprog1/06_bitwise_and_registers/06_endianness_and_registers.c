/**
 * Module 06: Endianness Detection, Byte Swapping, and MMIO Registers
 *
 * Concepts demonstrated:
 * 1. Runtime detection of machine Endianness (Little-Endian vs Big-Endian).
 * 2. Manual byte swapping between Host and Network Byte Order.
 * 3. Simulating hardware Memory-Mapped I/O (MMIO) registers.
 */

#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

/* Runtime Endianness check using pointer type punning */
bool is_system_little_endian(void) {
    uint16_t test_val = 0x0001;
    uint8_t *first_byte = (uint8_t *)&test_val;
    return (*first_byte == 0x01);
}

/* Manual 32-bit byte swap (Host to Big-Endian / Network Order) */
uint32_t byte_swap32(uint32_t val) {
    return ((val & 0x000000FFU) << 24) |
           ((val & 0x0000FF00U) << 8)  |
           ((val & 0x00FF0000U) >> 8)  |
           ((val & 0xFF000000U) >> 24);
}

/* Simulated Hardware Peripheral: Serial UART Controller */
typedef struct {
    volatile uint32_t DATA_REG;   // 0x00: Data Transmit/Receive Buffer
    volatile uint32_t STATUS_REG; // 0x04: Status (Ready, Error, etc.)
    volatile uint32_t CTRL_REG;   // 0x08: Control Settings
} SimulatedUART;

// Bit definitions for STATUS_REG
#define UART_STATUS_TX_EMPTY (1U << 0)
#define UART_STATUS_RX_READY (1U << 1)
#define UART_STATUS_ERROR    (1U << 2)

// Bit definitions for CTRL_REG
#define UART_CTRL_ENABLE     (1U << 0)
#define UART_CTRL_IRQ_ENABLE (1U << 1)

void uart_transmit_char(SimulatedUART *uart, char c) {
    // Wait until TX buffer is empty (polling hardware flag)
    while ((uart->STATUS_REG & UART_STATUS_TX_EMPTY) == 0) {
        // In real hardware, we spin-wait or yield
    }
    // Write character into data register
    uart->DATA_REG = (uint32_t)c;
    printf("[Simulated UART] Transmitted char '%c' (0x%02X)\n", c, (uint8_t)c);
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. ENDIANNESS DETECTION                            \n");
    printf("====================================================\n");
    if (is_system_little_endian()) {
        printf("This processor architecture is LITTLE-ENDIAN.\n");
    } else {
        printf("This processor architecture is BIG-ENDIAN.\n");
    }

    uint32_t original = 0x12345678;
    uint8_t *raw = (uint8_t *)&original;
    printf("Memory layout of 0x12345678 in RAM: [0x%02X] [0x%02X] [0x%02X] [0x%02X]\n",
           raw[0], raw[1], raw[2], raw[3]);

    uint32_t swapped = byte_swap32(original);
    printf("After byte swap (Network Byte Order) : 0x%08X\n\n", swapped);

    printf("====================================================\n");
    printf(" 2. SIMULATING HARDWARE MMIO REGISTERS              \n");
    printf("====================================================\n");
    // Allocate simulated device registers in memory
    SimulatedUART uart_device = {0};

    // Initialize hardware device via control registers
    uart_device.CTRL_REG |= UART_CTRL_ENABLE | UART_CTRL_IRQ_ENABLE;
    uart_device.STATUS_REG |= UART_STATUS_TX_EMPTY; // Mark transmitter ready

    printf("UART initialized: CTRL_REG = 0x%08X, STATUS_REG = 0x%08X\n",
           uart_device.CTRL_REG, uart_device.STATUS_REG);

    uart_transmit_char(&uart_device, 'H');
    uart_transmit_char(&uart_device, 'E');
    uart_transmit_char(&uart_device, 'L');
    uart_transmit_char(&uart_device, 'L');
    uart_transmit_char(&uart_device, 'O');

    return 0;
}
