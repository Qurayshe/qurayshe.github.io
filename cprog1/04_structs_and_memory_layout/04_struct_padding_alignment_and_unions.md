# Module 04: Structs, Memory Alignment, Padding & Unions

Did you know the compiler puts invisible gaps inside your structs? Let's uncover the mystery of structure padding! (●'◡'●)

---

## 1. Structure Padding: Why 1 + 4 + 1 = 12?!

Modern 64-bit CPUs love reading memory in aligned 4-byte or 8-byte chunks (word boundaries).

Look at this innocent struct:
```c
struct BadLayout {
    char a;      // 1 byte
    int b;       // 4 bytes
    char c;      // 1 byte
};
```
You'd think it's $1 + 4 + 1 = 6$ bytes, right? Nope! It takes **12 bytes** in memory! (╯°□°)╯︵ ┻━┻

```
Memory Layout (12 Bytes Total):
+--------+-----------------+----------------+--------+-----------------+
| a (1B) | [Pad: 3 Bytes]  |    b (4B)      | c (1B) | [Pad: 3 Bytes]  |
+--------+-----------------+----------------+--------+-----------------+
```

### Pro-Tip: Reorder Your Fields!
Sort your struct fields from largest to smallest:
```c
struct OptimizedLayout {
    int b;       // 4 bytes
    char a;      // 1 byte
    char c;      // 1 byte
                 // [Pad: 2 Bytes]
};               // Total: 8 Bytes (Saved 33% memory! q(≧▽≦q))
```

---

## 2. Unions & Type Punning

In a `union`, all members share the **exact same memory address**.
Write to a float, read back the raw integer bits—instant IEEE 754 float inspection with zero performance cost! (¬‿¬)

---

## 3. Bitfields

Need to pack hardware flags into a single byte? Bitfields let you specify exact bit widths:
```c
struct Flags {
    uint8_t power_on  : 1; // 1 bit
    uint8_t error_led : 1; // 1 bit
    uint8_t speed_mode: 2; // 2 bits
};
```

---

## Hands-On Programs

1. [`04_struct_alignment.c`](file:///c:/Users/kkhoie/Downloads/cprog1/04_structs_and_memory_layout/04_struct_alignment.c): Byte-by-byte visual memory dumps of struct padding!
2. [`04_unions_and_bitfields.c`](file:///c:/Users/kkhoie/Downloads/cprog1/04_structs_and_memory_layout/04_unions_and_bitfields.c): Floating point bit inspections and register flags!
