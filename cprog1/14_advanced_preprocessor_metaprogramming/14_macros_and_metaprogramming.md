# Module 14: Preprocessor Metaprogramming & X-Macros

The C preprocessor isn't just for `#include`—it's a compile-time code generator! (●'◡'●)

---

## 1. Advanced Macro Operators

1. **Stringification (`#`):** Converts an argument into a quoted string:
   `#define STR(x) #x` -> `STR(hello)` expands to `"hello"`!
2. **Token Pasting (`##`):** Glues two tokens together:
   `#define MAKE_VAR(n) var_##n` -> `MAKE_VAR(1)` becomes `var_1`! (o゜▽゜)o

---

## 2. The Legendary X-Macro Pattern

Tired of updating an `enum`, string converter, and lookup table separately?
Define your data **once** in a master table:

```c
#define COLOR_TABLE(X) \
    X(RED,   0xFF0000, "Red") \
    X(GREEN, 0x00FF00, "Green") \
    X(BLUE,  0x0000FF, "Blue")

// 1. Auto-generate the enum!
#define AS_ENUM(name, hex, str) name,
enum Color { COLOR_TABLE(AS_ENUM) };

// 2. Auto-generate the string converter!
#define AS_STRING(name, hex, str) case name: return str;
const char* color_to_str(enum Color c) {
    switch(c) { COLOR_TABLE(AS_STRING) }
    return "Unknown";
}
```
Add a color in one line, and the whole codebase updates automatically! Pure magic! q(≧▽≦q)

---

## Hands-On Program

Open [`14_xmacros_and_codegen.c`](file:///c:/Users/kkhoie/Downloads/cprog1/14_advanced_preprocessor_metaprogramming/14_xmacros_and_codegen.c) to see X-Macros generate synchronized error tables and box types! (*^▽^*)
