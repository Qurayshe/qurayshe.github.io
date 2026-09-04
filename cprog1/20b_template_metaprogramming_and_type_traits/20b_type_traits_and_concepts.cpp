#include <iostream>
#include <type_traits>
#include <concepts>
#include <string>
#include <vector>
#include <limits>

/*
 * Module 20b: Template Metaprogramming, Type Traits & Concepts Demo
 *
 * Demonstrates:
 * 1. Type introspection at compile-time with <type_traits>
 * 2. Zero-cost branch elimination with 'if constexpr'
 * 3. C++20 Concepts and 'requires' clauses
 */

// Custom C++20 Concept
template <typename T>
concept PrintableScalar = (std::integral<T> || std::floating_point<T>) && !std::is_same_v<T, bool>;

// Function template constrained with Concept
template <PrintableScalar T>
void print_scalar_metric(const char* label, T val) {
    std::cout << " [Scalar Metric] " << label << " = " << val 
              << " (Size: " << sizeof(T) << " bytes)\n";
}

// Function using 'if constexpr' for static compile-time type dispatch
template <typename T>
void inspect_and_process(const T& item) {
    std::cout << "--- Processing Type: " << typeid(T).name() << " ---\n";

    if constexpr (std::is_integral_v<T>) {
        std::cout << "   -> Detected: Integral type (val = " << item 
                  << ", is_signed = " << std::is_signed_v<T> << ")\n";
    } else if constexpr (std::is_floating_point_v<T>) {
        std::cout << "   -> Detected: Floating point type (val = " << item 
                  << ", radix = " << std::numeric_limits<T>::radix << ")\n";
    } else if constexpr (std::is_same_v<T, std::string>) {
        std::cout << "   -> Detected: std::string (length = " << item.length() 
                  << ", content = \"" << item << "\")\n";
    } else {
        std::cout << "   -> Detected: Generic complex object (size = " << sizeof(T) << ")\n";
    }
}

int main() {
    std::cout << "=== Module 20b: Template Metaprogramming & Type Traits ===\n\n";

    std::cout << "--- 1. Concept-Constrained Calls ---\n";
    print_scalar_metric("Temperature", 98.6f);
    print_scalar_metric("PacketCount", 1048576ULL);

    std::cout << "\n--- 2. Static Type Dispatch with if constexpr ---\n";
    int integer_val = 42;
    double double_val = 3.14159265;
    std::string text_val = "CompileTimeZeroCost";
    std::vector<int> vec_val = {1, 2, 3};

    inspect_and_process(integer_val);
    inspect_and_process(double_val);
    inspect_and_process(text_val);
    inspect_and_process(vec_val);

    std::cout << "\n[SUCCESS] Module 20b executed cleanly! (o゜▽゜)o\n";
    return 0;
}
