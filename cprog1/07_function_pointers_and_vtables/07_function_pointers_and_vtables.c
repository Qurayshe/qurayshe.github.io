/**
 * Module 07: Function Pointers, Callbacks, Jump Tables & vtable Polymorphism
 *
 * Concepts demonstrated:
 * 1. Function pointers as first-class parameters (Callbacks).
 * 2. Jump Table for O(1) opcode dispatch.
 * 3. C-style Object Oriented Polymorphism using Virtual Method Tables (vtables).
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

/* --- Part 1: Arithmetic Callbacks & Jump Tables --- */
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }

typedef int (*MathFunc)(int, int);

/* Higher-order function: accepts a function pointer callback */
void compute_and_print(MathFunc op, int a, int b, const char *op_name) {
    int res = op(a, b);
    printf("Operation '%s': %d, %d => Result: %d\n", op_name, a, b, res);
}

/* --- Part 2: Object-Oriented Polymorphism via VTable --- */

// Forward declaration
struct Shape;

// Virtual method table defining interface
typedef struct {
    double (*get_area)(const struct Shape *self);
    void (*draw)(const struct Shape *self);
} ShapeVTable;

// Base Shape
typedef struct Shape {
    const ShapeVTable *vtable;
    const char *name;
} Shape;

// Derived Circle
typedef struct {
    Shape base;      // Inheritance: base struct must be the FIRST member!
    double radius;
} Circle;

// Derived Rectangle
typedef struct {
    Shape base;
    double width;
    double height;
} Rectangle;

// Circle implementations
double circle_area(const Shape *self) {
    const Circle *c = (const Circle *)self;
    return 3.1415926535 * c->radius * c->radius;
}
void circle_draw(const Shape *self) {
    const Circle *c = (const Circle *)self;
    printf("[DRAW] Circle (radius=%.2f)\n", c->radius);
}

static const ShapeVTable CIRCLE_VTABLE = {
    .get_area = circle_area,
    .draw = circle_draw
};

// Rectangle implementations
double rect_area(const Shape *self) {
    const Rectangle *r = (const Rectangle *)self;
    return r->width * r->height;
}
void rect_draw(const Shape *self) {
    const Rectangle *r = (const Rectangle *)self;
    printf("[DRAW] Rectangle (w=%.2f, h=%.2f)\n", r->width, r->height);
}

static const ShapeVTable RECT_VTABLE = {
    .get_area = rect_area,
    .draw = rect_draw
};

// Generic polymorphic functions
void render_shape(const Shape *shape) {
    printf("Shape Name: %s\n", shape->name);
    shape->vtable->draw(shape);
    printf("Shape Area: %.2f\n\n", shape->vtable->get_area(shape));
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. FUNCTION POINTERS & CALLBACKS                   \n");
    printf("====================================================\n");
    compute_and_print(add, 20, 5, "ADD");
    compute_and_print(sub, 20, 5, "SUB");
    compute_and_print(mul, 20, 5, "MUL");

    printf("\n====================================================\n");
    printf(" 2. JUMP TABLE (O(1) OP-CODE DISPATCH)              \n");
    printf("====================================================\n");
    MathFunc jump_table[3] = {add, sub, mul};
    const char *names[3] = {"Add", "Subtract", "Multiply"};

    int opcode = 2; // Opcode 2 corresponds to Multiply
    printf("Executing opcode %d (%s) on (12, 4) -> Result: %d\n\n",
           opcode, names[opcode], jump_table[opcode](12, 4));

    printf("====================================================\n");
    printf(" 3. POLYMORPHISM & VTABLES IN PURE C                \n");
    printf("====================================================\n");
    Circle my_circle = {
        .base = { .vtable = &CIRCLE_VTABLE, .name = "MyCircle" },
        .radius = 5.0
    };

    Rectangle my_rect = {
        .base = { .vtable = &RECT_VTABLE, .name = "MyRectangle" },
        .width = 4.0,
        .height = 7.0
    };

    // Array of polymorphic base pointers
    Shape *scene[] = { (Shape *)&my_circle, (Shape *)&my_rect };

    for (int i = 0; i < 2; i++) {
        render_shape(scene[i]);
    }

    return 0;
}
