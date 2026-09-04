/**
 * Module 14: Advanced Preprocessor Metaprogramming & X-Macros
 *
 * Concepts demonstrated:
 * 1. Stringification (#) and Token Concatenation (##).
 * 2. Variadic logging macros with __FILE__ and __LINE__.
 * 3. The X-Macro technique for synchronized Enum + String + Dispatch table generation.
 */

#include <stdio.h>
#include <stdint.h>

/* --- Part 1: Stringification & Token Concatenation --- */

#define PRINT_EXPRESSION(expr) \
    printf("[EXPR] %s = %d\n", #expr, (int)(expr))

#define DEFINE_BOX_TYPE(Type, Name) \
    typedef struct { \
        Type value; \
    } Box_##Name; \
    Box_##Name make_##Name##_box(Type v) { \
        Box_##Name b = { .value = v }; \
        return b; \
    }

DEFINE_BOX_TYPE(int, Int)
DEFINE_BOX_TYPE(double, Double)

/* --- Part 2: X-Macro Table-Driven Code Generation --- */

/* Master Table of System Error Codes:
 * Format: X(ENUM_NAME, ERROR_CODE, USER_MESSAGE) */
#define ERROR_CODE_TABLE(X) \
    X(ERR_SUCCESS,       0, "Operation completed successfully") \
    X(ERR_NOT_FOUND,     1, "Resource could not be located") \
    X(ERR_PERMISSION,    2, "Access denied: insufficient permissions") \
    X(ERR_OUT_OF_MEMORY, 3, "Failed to allocate memory buffer") \
    X(ERR_NETWORK_RESET, 4, "Connection reset by peer")

// 1. Generate the Enum automatically from the table
#define EXPAND_AS_ENUM(name, code, msg) name = code,
typedef enum {
    ERROR_CODE_TABLE(EXPAND_AS_ENUM)
} SystemError;
#undef EXPAND_AS_ENUM

// 2. Generate the String Converter function automatically from the table
#define EXPAND_AS_CASE(name, code, msg) case name: return msg;
const char *system_error_to_string(SystemError err) {
    switch (err) {
        ERROR_CODE_TABLE(EXPAND_AS_CASE)
    }
    return "Unknown Error Code";
}
#undef EXPAND_AS_CASE

int main(void) {
    printf("====================================================\n");
    printf(" 1. STRINGIFICATION (#) & TOKEN PASTING (##)         \n");
    printf("====================================================\n");
    int a = 15, b = 27;
    PRINT_EXPRESSION(a + b);
    PRINT_EXPRESSION((a * 2) - b);

    // Using auto-generated box structs from macro
    Box_Int int_box = make_Int_box(42);
    Box_Double double_box = make_Double_box(3.1415);
    printf("Box_Int value: %d, Box_Double value: %.4f\n\n",
           int_box.value, double_box.value);

    printf("====================================================\n");
    printf(" 2. X-MACRO DRIVEN ENUM & STRING RESOLUTION         \n");
    printf("====================================================\n");
    SystemError sample_errors[] = {
        ERR_SUCCESS,
        ERR_PERMISSION,
        ERR_OUT_OF_MEMORY,
        (SystemError)99 // Unknown
    };

    for (size_t i = 0; i < sizeof(sample_errors)/sizeof(sample_errors[0]); i++) {
        SystemError err = sample_errors[i];
        printf("Error Code %d -> Message: \"%s\"\n",
               err, system_error_to_string(err));
    }

    return 0;
}
