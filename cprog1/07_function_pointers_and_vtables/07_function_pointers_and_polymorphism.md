# Module 07: Function Pointers & Polymorphism (vtables)

Functions live in memory too (the Text segment)! That means functions have addresses, and we can store their addresses in pointers! (●'◡'●)

---

## 1. Function Pointer Syntax

```c
// ReturnType (*PointerName)(ParamTypes);
int (*op)(int, int);
```

### Clean it up with `typedef`:
```c
typedef int (*MathFunc)(int, int);

int add(int a, int b) { return a + b; }
MathFunc my_func = add;
int res = my_func(10, 20); // 30! (*^▽^*)
```

---

## 2. Jump Tables: Instant O(1) Dispatch

Instead of a massive 50-branch `switch` statement:
```c
MathFunc jump_table[] = {add, sub, mul, div};
int ans = jump_table[opcode](x, y); // Instant jump!
```

---

## 3. How OOP & `vtables` Work Under the Hood

Ever wonder how C++ or Java classes implement polymorphism?
They create a **Virtual Method Table (`vtable`)** containing function pointers! You can do the exact same thing in pure C:

```
Object (Circle)                VTable (ShapeOps)
+--------------------+        +------------------------------+
| vtable_ptr --------|------> | draw()     -> draw_circle()  |
| float radius       |        | get_area() -> area_circle()  |
+--------------------+        +------------------------------+
```

---

## Hands-On Program

Open [`07_function_pointers_and_vtables.c`](file:///c:/Users/kkhoie/Downloads/cprog1/07_function_pointers_and_vtables/07_function_pointers_and_vtables.c) to see generic callbacks, jump tables, and a full polymorphic Shape vtable hierarchy in pure C! (≧∇≦)ﾉ
