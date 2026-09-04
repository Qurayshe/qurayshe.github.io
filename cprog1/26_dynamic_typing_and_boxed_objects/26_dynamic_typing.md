# Module 26: Dynamic Typing & `PyObject` (Working Backwards)

In Python and JS, variables can change types whenever you want:
`x = 42; x = "hello"`!
How does a CPU (which only knows rigid integer registers) pull this off? (●'◡'●)

---

## 1. The High-Level Illusion: Dynamic Types

Variables don't hold raw numbers—they hold a pointer to a **Boxed Object** on the heap!

---

## 2. Low-Level Reality: CPython's `PyObject` Header

In CPython (written in C), every single Python object shares a common C struct header:

```c
typedef struct _object {
    size_t ob_refcnt;            // Reference count!
    struct _typeobject *ob_type; // Pointer to Type Descriptor / VTable (Module 07)
} PyObject;
```

A Python integer is actually:
```c
typedef struct {
    PyObject ob_base; // Inherits header
    int64_t ob_digit; // The actual integer value!
} PyLongObject;
```

### The Cost of Dynamic Typing:
- Storing `42` in C: 4 bytes.
- Storing `42` in Python: **28 to 32 bytes!** (╯°□°)╯︵ ┻━┻
- Doing `x + y` requires dereferencing pointers, inspecting type tags, and allocating a *new* boxed object!

---

## Hands-On Program

Open [`26_boxed_types_and_tagging.c`](file:///c:/Users/kkhoie/Downloads/cprog1/26_dynamic_typing_and_boxed_objects/26_boxed_types_and_tagging.c) to see dynamic boxed objects, runtime type dispatch, and type errors in pure C! (*^▽^*)
