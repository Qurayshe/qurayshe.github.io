/**
 * Module 20: Compile-Time Computation & Constexpr Lookup Tables
 *
 * Concepts demonstrated:
 * 1. Compile-time string hashing (DJB2 algorithm) via constexpr.
 * 2. Precomputing mathematical lookup tables at compile time with zero runtime overhead.
 * 3. Using static_assert to verify compile-time constraints and logic.
 */

#include <iostream>
#include <array>
#include <cstdint>

/* Compile-time string hashing (DJB2 hash algorithm) */
constexpr uint32_t hash_string(const char* str) {
    uint32_t hash = 5381;
    while (*str != '\0') {
        hash = ((hash << 5) + hash) + static_cast<uint8_t>(*str);
        str++;
    }
    return hash;
}

/* Precomputed Power-of-Two table generated at compile time */
template <size_t N>
constexpr auto generate_power_table() {
    std::array<uint64_t, N> table{};
    uint64_t val = 1;
    for (size_t i = 0; i < N; i++) {
        table[i] = val;
        val *= 2;
    }
    return table;
}

int main() {
    std::cout << "====================================================\n";
    std::cout << " 1. COMPILE-TIME STRING HASHING                     \n";
    std::cout << "====================================================\n";
    // These hashes are calculated by the COMPILER at build time:
    constexpr uint32_t hash_login  = hash_string("CMD_LOGIN");
    constexpr uint32_t hash_logout = hash_string("CMD_LOGOUT");

    std::cout << "Hash of 'CMD_LOGIN'  : 0x" << std::hex << hash_login << std::dec << "\n";
    std::cout << "Hash of 'CMD_LOGOUT' : 0x" << std::hex << hash_logout << std::dec << "\n\n";

    // static_assert proves this runs during compilation!
    static_assert(hash_login != hash_logout, "Hashes must not collide!");

    std::cout << "====================================================\n";
    std::cout << " 2. COMPILE-TIME POWER-OF-TWO LOOKUP TABLE          \n";
    std::cout << "====================================================\n";
    constexpr auto power_lut = generate_power_table<16>();

    std::cout << "Precomputed table values (2^0 through 2^15):\n";
    for (size_t i = 0; i < power_lut.size(); i++) {
        std::cout << "  2^" << i << " = " << power_lut[i] << "\n";
    }

    return 0;
}
