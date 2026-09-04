# Module 06: Bitwise Operations, Endianness & Hardware Registers

At the end of the day, everything in computing is just bits! Let's manipulate individual wires and registers! (●'◡'●)

---

## 1. The 6 Bitwise Operators

| Op | Name | Logic |
| :--- | :--- | :--- |
| `&` | AND | 1 if BOTH bits are 1 |
| `|` | OR | 1 if EITHER bit is 1 |
| `^` | XOR | 1 if bits are DIFFERENT |
| `~` | NOT | Inverts all bits |
| `<<` | Shift Left | Multiplies by $2^N$ |
| `>>` | Shift Right | Divides by $2^N$ |

---

## 2. Essential Bit Manipulation Cheat Sheet

```c
// 1. SET bit N:
val |= (1U << n);

// 2. CLEAR bit N:
val &= ~(1U << n);

// 3. TOGGLE bit N:
val ^= (1U << n);

// 4. CHECK bit N:
bool is_set = (val & (1U << n)) != 0;

// 5. IS POWER OF 2? (Cleanest trick ever! q(≧▽≦q))
bool is_pow2 = (x > 0) && ((x & (x - 1)) == 0);
```

---

## 3. Endianness: Little-Endian vs Big-Endian

How are multi-byte integers stored in RAM?
Given `0x12345678`:
- **Little-Endian (x86/x64/ARM):** Least significant byte first! `[ 0x78 | 0x56 | 0x34 | 0x12 ]`
- **Big-Endian (Network order):** Most significant byte first! `[ 0x12 | 0x34 | 0x56 | 0x78 ]`

---

## Hands-On Programs

1. [`06_bitwise_manipulation.c`](file:///c:/Users/kkhoie/Downloads/cprog1/06_bitwise_and_registers/06_bitwise_manipulation.c): Bitmask recipes and permission systems.
2. [`06_endianness_and_registers.c`](file:///c:/Users/kkhoie/Downloads/cprog1/06_bitwise_and_registers/06_endianness_and_registers.c): Detecting endianness and simulated hardware UART peripheral control! (o゜▽゜)o
