# Module 03: Arrays, Strings & Pointer Arithmetic

Fun fact: In C, arrays and strings aren't high-level objects at all... they're just raw contiguous chunks of memory! (●'◡'●)

---

## 1. Array-Pointer Decay (The Big Secret)

In C expressions, an array name automatically "decays" into a pointer to its first element!

```c
int numbers[5] = {10, 20, 30, 40, 50};
int *ptr = numbers; // 'numbers' is just &numbers[0]!
```

### Array Indexing is Just Pointer Math!
`numbers[i]` is identical to `*(numbers + i)`.
Because addition is commutative, you can even write `2[numbers]` in valid C! (Mind blown? q(≧▽≦q))

---

## 2. Pointer Arithmetic Step Sizes

When you do `ptr + 1`, the address doesn't go up by 1 byte—it jumps by `sizeof(*ptr)` bytes!
- `char* + 1` jumps 1 byte.
- `int* + 1` jumps 4 bytes.
- `double* + 1` jumps 8 bytes.

```
int array (sizeof(int) = 4):
Address:    0x1000       0x1004       0x1008       0x100C
         +------------+------------+------------+------------+
Elements:|  arr[0]=10 |  arr[1]=20 |  arr[2]=30 |  arr[3]=40 |
         +------------+------------+------------+------------+
              ^            ^
             ptr        ptr + 1  (+4 bytes!)
```

---

## 3. C Strings & The Null Terminator (`\0`)

A C string is just an array of `char` ending with a zero byte (`'\0'`).

```
String: "HELLO" (Length 5, needs 6 bytes!)
Memory: [ 'H' | 'E' | 'L' | 'L' | 'O' | '\0' ]
```

> Danger zone:
> `char stack_str[] = "Hello";` -> Lives on the STACK (writable! (*^▽^*))
> `const char *ro_str = "Hello";` -> Lives in READ-ONLY text segment. Trying `ro_str[0] = 'h'` causes a segmentation fault crash! (⊙_⊙;)

---

## Hands-On Program

Open [`03_arrays_and_strings.c`](file:///c:/Users/kkhoie/Downloads/cprog1/03_arrays_and_strings/03_arrays_and_strings.c) to see custom string functions written without `<string.h>` and 2D arrays laid out flat in memory! (≧∇≦)ﾉ
