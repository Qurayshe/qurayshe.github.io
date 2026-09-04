/**
 * Module 17: RAII (Resource Acquisition Is Initialization)
 *
 * Concepts demonstrated:
 * 1. Encapsulating raw C file handles (FILE*) into a deterministic RAII class.
 * 2. Automatic destructor execution on early returns and scope exit.
 * 3. Scoped heap buffer allocator guard.
 * 4. Preventing resource leaks without manual fclose/free cleanup boilerplate.
 */

#include <iostream>
#include <cstdio>
#include <cstdint>

/* RAII Wrapper for C FILE* handles */
class ScopedFile {
private:
    std::FILE* handle;
    const char* filename;

public:
    // Resource Acquired in Constructor
    ScopedFile(const char* path, const char* mode)
        : handle(std::fopen(path, mode)), filename(path) {
        if (handle) {
            std::cout << "[ScopedFile] Opened file '" << filename << "' (" << (void*)handle << ")\n";
        } else {
            std::cout << "[ScopedFile] Failed to open '" << filename << "'\n";
        }
    }

    // Resource Released deterministically in Destructor
    ~ScopedFile() {
        if (handle) {
            std::fclose(handle);
            std::cout << "[ScopedFile] Closed file '" << filename << "' automatically.\n";
            handle = nullptr;
        }
    }

    // Prevent accidental copying (would cause double fclose)
    ScopedFile(const ScopedFile&) = delete;
    ScopedFile& operator=(const ScopedFile&) = delete;

    std::FILE* get() const { return handle; }
    bool is_valid() const { return handle != nullptr; }
};

/* RAII Dynamic Memory Buffer */
class ScopedBuffer {
private:
    uint8_t* memory;
    size_t size;

public:
    explicit ScopedBuffer(size_t num_bytes)
        : memory(new uint8_t[num_bytes]), size(num_bytes) {
        std::cout << "[ScopedBuffer] Allocated " << size << " bytes at " << (void*)memory << "\n";
    }

    ~ScopedBuffer() {
        delete[] memory;
        std::cout << "[ScopedBuffer] Deallocated memory buffer automatically.\n";
    }

    // Delete copy operations
    ScopedBuffer(const ScopedBuffer&) = delete;
    ScopedBuffer& operator=(const ScopedBuffer&) = delete;

    uint8_t* data() { return memory; }
};

void perform_early_exit_task(bool trigger_early_exit) {
    std::cout << "\n--- Entering perform_early_exit_task(early=" << (trigger_early_exit ? "true" : "false") << ") ---\n";
    ScopedBuffer buf(1024);

    if (trigger_early_exit) {
        std::cout << "--> Early return condition hit! Exiting function immediately...\n";
        return; // Destructors for 'buf' called automatically!
    }

    std::cout << "--> Normal execution completed.\n";
}

int main() {
    std::cout << "====================================================\n";
    std::cout << " 1. SCOPED FILE HANDLE RAII                         \n";
    std::cout << "====================================================\n";
    {
        // Scope block
        ScopedFile file("test_raii.txt", "w");
        if (file.is_valid()) {
            std::fputs("Testing RAII in modern C++\n", file.get());
        }
        std::cout << "Exiting inner scope block...\n";
    } // File is closed HERE automatically!

    std::remove("test_raii.txt");

    std::cout << "\n====================================================\n";
    std::cout << " 2. EARLY EXIT SAFETY WITH STACK UNWINDING          \n";
    std::cout << "====================================================\n";
    perform_early_exit_task(true);  // Early exit
    perform_early_exit_task(false); // Normal exit

    return 0;
}
