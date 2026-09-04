#include <iostream>
#include <utility>
#include <string>
#include <memory>

/*
 * Module 19b: Universal References & Perfect Forwarding Demo
 *
 * Demonstrates:
 * 1. Difference between lvalue and rvalue function overloads
 * 2. Why plain forwarding fails without std::forward<T>
 * 3. Perfect forwarding in custom in-place factory templates
 */

struct Widget {
    std::string name;
    int id;

    Widget(const std::string& n, int i) : name(n), id(i) {
        std::cout << " [Widget] Constructed from LVALUE string copy (\"" << name << "\")\n";
    }

    Widget(std::string&& n, int i) : name(std::move(n)), id(i) {
        std::cout << " [Widget] Constructed from RVALUE string move (\"" << name << "\") (Zero copy!)\n";
    }
};

// Target overloaded functions
void process_target(int& x) {
    std::cout << " -> process_target(int&): Received LVALUE reference (val = " << x << ")\n";
}

void process_target(const int& x) {
    std::cout << " -> process_target(const int&): Received CONST LVALUE reference (val = " << x << ")\n";
}

void process_target(int&& x) {
    std::cout << " -> process_target(int&&): Received RVALUE reference (val = " << x << ")\n";
}

// Perfect forwarding wrapper
template <typename T>
void perfect_wrapper(T&& arg) {
    // std::forward<T> preserves the exact value category of arg
    process_target(std::forward<T>(arg));
}

// Emplace factory demonstrating in-place perfect construction
template <typename T, typename... Args>
std::unique_ptr<T> create_object(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

int main() {
    std::cout << "=== Module 19b: Perfect Forwarding & Universal References ===\n\n";

    int a = 42;
    const int b = 100;

    std::cout << "--- 1. Testing Value Category Preservation ---\n";
    perfect_wrapper(a);             // Passes lvalue
    perfect_wrapper(b);             // Passes const lvalue
    perfect_wrapper(777);           // Passes temporary rvalue
    perfect_wrapper(std::move(a));  // Passes moved rvalue

    std::cout << "\n--- 2. In-Place Emplace Construction ---\n";
    std::string str1 = "ConfigData";
    std::cout << "Creating w1 with lvalue string:\n";
    auto w1 = create_object<Widget>(str1, 101);

    std::cout << "Creating w2 with temporary rvalue string:\n";
    auto w2 = create_object<Widget>("TemporaryString", 202);

    std::cout << "\n[SUCCESS] Module 19b executed cleanly! (≧∇≦)ﾉ\n";
    return 0;
}
