# Module 02: Pointers & The Call Stack

Pointers have a scary reputation on forum threads, but they're actually super simple once you picture memory as a giant row of numbered lockers! (●'◡'●)

---

## 1. What is Memory?

Think of your RAM as a giant array of 1-byte storage lockers. Every single locker has a numeric address:

```
Locker Address:  0x1000    0x1001    0x1002    0x1003    0x1004
               +---------+---------+---------+---------+---------+
Byte Value:    |  0x42   |  0x00   |  0x1A   |  0xFF   |  0x05   |
               +---------+---------+---------+---------+---------+
```

---

## 2. What is a Pointer?

A **pointer** is literally just a variable that holds the locker address of another variable! That's it! (o゜▽゜)o

```c
int x = 42;      // Lives at locker 0x7FFF0010
int *p = &x;     // 'p' holds the number 0x7FFF0010
```

```
Variable:      p (Pointer)                x (Integer)
Address:     0x7FFF0000                 0x7FFF0010
Value:     [ 0x7FFF0010 ] ------------> [    42     ]
```

### The Two Big Operators:
- `&x` -> **Address-of:** "Hey, where does `x` live?"
- `*p` -> **Dereference:** "Go to the address inside `p` and read/write the value there!"

---

## 3. Generic Pointers: `void*`

A `void*` is a wildcard pointer. It can hold any address, but since the compiler doesn't know how big the target is, you can't dereference it until you cast it!
```c
void *generic = &x;
int val = *(int*)generic; // Cast required! (¬‿¬)
```

---

## 4. The Stack & Call Frames

Every time you call a function, the CPU pushes a **Stack Frame** (local variables, arguments, return address). When the function returns, poof, the frame is popped!

```
High Memory
+------------------------------------+
| main() frame                       |
|   - int main_var                   |
+------------------------------------+
| calculate() frame                  | <-- Function called!
|   - int arg1, arg2                 |
|   - Return address back to main    |
+------------------------------------+ <-- Stack pointer (RSP)
| (Available space)                  |
v Grows DOWNWARD                     |
Low Memory
```

> Watch out for the classic oopsie: (╯°□°)╯︵ ┻━┻
> Never return a pointer to a local stack variable! Once the function returns, that memory is wiped/reused!

---

## Hands-On Programs

1. [`02_pointer_basics.c`](file:///c:/Users/kkhoie/Downloads/cprog1/02_memory_and_pointers/02_pointer_basics.c): Dereferencing, swapping via pass-by-reference, and generic memory dumping.
2. [`02_stack_inspection.c`](file:///c:/Users/kkhoie/Downloads/cprog1/02_memory_and_pointers/02_stack_inspection.c): Live inspection of stack growth direction and frame addresses!
