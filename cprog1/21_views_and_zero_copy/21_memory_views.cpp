/**
 * Module 21: Non-Owning Zero-Copy Memory Views
 *
 * Concepts demonstrated:
 * 1. std::string_view for zero-allocation string slicing and parsing.
 * 2. std::span for unified, non-owning contiguous memory array slicing.
 * 3. Inspecting physical memory sizes of views (Pointer + Length).
 */

#include <iostream>
#include <string_view>
#include <span>
#include <vector>
#include <array>

// Generic function operating on ANY continuous memory buffer of ints
void print_span(std::string_view label, std::span<const int> data) {
    std::cout << label << " (size=" << data.size() << ", bytes=" << data.size_bytes() << "): [ ";
    for (int val : data) {
        std::cout << val << " ";
    }
    std::cout << "]\n";
}

int main() {
    std::cout << "====================================================\n";
    std::cout << " 1. STD::STRING_VIEW ZERO-ALLOCATION PARSING        \n";
    std::cout << "====================================================\n";
    std::cout << "sizeof(std::string_view) = " << sizeof(std::string_view)
              << " bytes (8-byte pointer + 8-byte size)\n\n";

    std::string_view raw_http = "HTTP/1.1 200 OK\r\nContent-Length: 42";

    // Slice tokens without any malloc/copy operations:
    std::string_view protocol = raw_http.substr(0, 8);
    std::string_view status   = raw_http.substr(9, 3);

    std::cout << "Original String : \"" << raw_http << "\"\n";
    std::cout << "Parsed Protocol : \"" << protocol << "\"\n";
    std::cout << "Parsed Status   : \"" << status << "\"\n\n";

    std::cout << "====================================================\n";
    std::cout << " 2. STD::SPAN UNIFYING ARRAYS & VECTORS             \n";
    std::cout << "====================================================\n";
    int c_array[] = {10, 20, 30, 40, 50};
    std::vector<int> std_vec = {100, 200, 300, 400, 500};
    std::array<int, 4> std_arr = {1, 2, 3, 4};

    // Pass different container types seamlessly to the same function:
    print_span("C Array View", c_array);
    print_span("Vector View ", std_vec);
    print_span("Std Array   ", std_arr);

    // Slicing sub-ranges without copying:
    std::span<const int> sub_slice = std::span(c_array).subspan(1, 3); // Elements 20, 30, 40
    print_span("Sub-Slice   ", sub_slice);

    return 0;
}
