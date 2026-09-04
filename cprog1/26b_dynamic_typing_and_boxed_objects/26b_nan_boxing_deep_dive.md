# Module 26b: NaN-Boxing Deep Dive (The 8-Byte Dynamic Value Engine)

In Module 26, we saw Tagged Unions (`struct { int type; union { ... } value; }`). But a tagged union takes **16 to 24 bytes** due to struct padding! (●'◡'●)
How do ultra-fast dynamic runtimes like **LuaJIT, JavaScript V8, and WebKit JavaScriptCore** store *integers, booleans, pointers, and doubles* in **1 single 8-byte variable**?
Welcome to **NaN-Boxing**! q(≧▽≦q)

---

## 1. The Anatomy of IEEE 754 Floating Point (64-bit Double)

```
 63 62       52 51                                              0
+--+-----------+-------------------------------------------------+
|S | Exponent  |                    Mantissa                     |
|  | (11 bits) |                   (52 bits)                     |
+--+-----------+-------------------------------------------------+
```

- When all 11 Exponent bits are `1` (`0x7FF0...`), the value is **NaN (Not a Number)** or **Infinity**.
- If bit 51 is also `1`, it is a **Quiet NaN (QNaN)**.
- **The Magic Trick**: The CPU hardware completely ignores the remaining 50 bits of the mantissa!

---

## 2. Hijacking the NaN Payload Bits

On x86-64, virtual memory pointers only use **48 bits** (the top 16 bits are always `0x0000`).
This leaves plenty of room inside a single 64-bit QNaN to store our own type tags and 48-bit pointers:

```
+---------------------------------------------------------------+
| If Exponent != 0x7FFC -> Standard 64-bit IEEE 754 Float!      |
+---------------------------------------------------------------+
| If Exponent == 0x7FFC (Quiet NaN Prefix):                     |
|   Bits 48-51: Type Tag (e.g. 0=Null, 1=Bool, 2=Int, 3=Pointer)|
|   Bits 0-47:  Raw 32-bit Integer or 48-bit Heap Pointer!      |
+---------------------------------------------------------------+
```

```
Double:  0 10000000000 10010010000111111011010101... -> 3.14159265
Integer: 1 11111111111 100000000000000000000000000... (Int Tag) | 42
Pointer: 1 11111111111 110000000000000000000000000... (Ptr Tag) | 0x7FFF12345678
```

---

## 3. Why NaN-Boxing Crushes Tagged Unions

1. **Cache Locality**: 8 bytes vs 24 bytes means **3x more values per 64-byte CPU cache line**!
2. **Double Arithmetic Speed**: Floating-point operations require zero unpacking — just load straight into `%xmm0` registers!

---

## Hands-On Program

Open [`26b_nan_boxing_engine.c`](file:///c:/Users/kkhoie/Downloads/cprog1/26b_dynamic_typing_and_boxed_objects/26b_nan_boxing_engine.c) to inspect bitwise NaN packaging, unpacking, and dynamic dispatch live! (*^▽^*)
