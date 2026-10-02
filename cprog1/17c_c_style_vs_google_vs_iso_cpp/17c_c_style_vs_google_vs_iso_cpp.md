# Module 17c: C-Style C++ vs. Google-Style C++ vs. Modern ISO C++ (Core Guidelines '26)

> *"Within C++, there is a much smaller and cleaner language struggling to get out."* — Bjarne Stroustrup
>
> *"C makes it easy to shoot yourself in the foot; C++ makes it harder, but when you do, it blows your whole leg off."* — Bjarne Stroustrup

In the systems programming industry, you will never encounter just one dialect of C++. Depending on whether you are working on the Linux kernel, game engines, Google monorepos, high-frequency trading engines, or modern ISO-standard libraries, you will encounter three fundamentally distinct coding philosophies:

1. **CPL / "C-Style C++" (The 1980s–1990s Cfront Lineage)**: Procedural mindset, manual pointer arithmetic, raw `malloc`/`free` or `new`/`delete`, out-parameter pointers, macros, and sentinel error codes.
2. **Google-Style C++ (The Abseil & Chromium Lineage)**: Strictly disciplined systems C++, exceptions disabled (`-fno-exceptions`), explicit ownership via `std::unique_ptr`, `absl::StatusOr<T>` error handling, strict naming rules (`trailing_underscore_`), and prevention of undefined behavior at scale.
3. **Modern ISO C++ & C++ Core Guidelines of '26 (The C++20/C++23/C++26 Standard)**: Zero-cost abstractions, Rule of Zero, `std::expected<T, E>`, C++26 Contracts (`[[contract: ...]]`), `std::span` and `std::string_view` non-owning views, compile-time Concepts, and type-safe `std::print`.

---

## 1. Historical Evolution: From CPL to C++26

To understand why "C-style C++" exists, we must trace its lineage:

```
[1963] CPL (Combined Programming Language - Strachey, Cambridge/London)
   │
[1967] BCPL (Basic CPL - Martin Richards, stripped untyped typeless words)
   │
[1969] B (Ken Thompson, Unix at Bell Labs)
   │
[1972] C (Dennis Ritchie, added data types, structs, pointers)
   │
   ├────────────────────────────────────────────────┐
   ▼                                                ▼
[1979-1983] "C with Classes" (Stroustrup)       [1989] ANSI C (C89/C90)
   │                                                │
[1985] C++ 1.0 (Cfront compiler translating to C)   [1999] C99 (VLA, restrict)
   │                                                │
[1998] ISO C++98 (Templates, STL, exceptions)       [2011] C11 (Atomics, threads)
   │
   ├────────────────────────────────────────────────┐
   ▼                                                ▼
[2008+] Google C++ Style Guide                  [2011] Modern ISO C++11 (Move, auto)
(No exceptions, StatusOr, unique_ptr, Abseil)       │
                                                [2020] ISO C++20 (Concepts, Coroutines, Span)
                                                    │
                                                [2023] ISO C++23 (std::expected, std::print)
                                                    │
                                                [2026] ISO C++26 & Core Guidelines '26
                                                (Contracts, Reflection, Safety Profiles)
```

In the 1980s and 1990s, the first C++ compiler, **Cfront**, literally converted C++ code into raw C code before invoking a C compiler. As a result, an entire generation of engineers learned to write C++ simply as "C with `class` instead of `struct`". This is what the industry calls **"C-style C++"** or **"C/C++"**.

---

## 2. The Three Paradigms Compared Side-by-Side

| Feature / Domain | CPL / "C-Style C++" | Google-Style C++ (Abseil) | Modern ISO C++ (Core Guidelines '26) |
| :--- | :--- | :--- | :--- |
| **Primary Philosophy** | Procedural, direct memory access, minimal abstraction | Scalable safety, explicit control, predictable binaries | Expressive, zero-overhead, type-safe, lifetime-verified |
| **Memory Allocation** | Raw `malloc()`/`free()`, raw `new`/`delete` | `std::make_unique<T>()`, custom arena allocators | Rule of Zero, `std::make_unique`, `std::pmr` |
| **Ownership Semantics** | Implicit in programmer's head; manual cleanup | Single-owner via `std::unique_ptr`; `shared_ptr` restricted | Value semantics, RAII, move semantics (`std::move`) |
| **Exception Handling** | None; manual return codes (`-1`, `NULL`) | **Disabled (`-fno-exceptions`)**; `absl::StatusOr<T>` | `std::expected<T, E>`, `noexcept`, C++26 Contracts |
| **String & Buffer Views** | `const char*` + `size_t len`, `strlen()` | `absl::string_view`, `absl::Span<const T>` | `std::string_view`, `std::span<const T>`, Ranges |
| **Class Lifecycle** | Manual `Init()` and `Destroy()` functions | `= delete` for copy/assign; explicit constructors | **Rule of Zero**: let compiler generate all 5 functions |
| **Member Naming** | `m_data`, `mSize`, or raw `data` | `data_`, `size_` (trailing underscore for private) | Consistent domain naming or `m_` prefix |
| **Constants & Macros** | `#define BUFFER_SIZE 4096` | `constexpr size_t kBufferSize = 4096;` | `inline constexpr size_t BufferSize = 4096;` |
| **Cast Syntax** | C-style cast: `(uint32_t*)ptr` | `reinterpret_cast<uint32_t*>(ptr)` | `std::bit_cast<uint32_t*>(ptr)`, `static_cast` |
| **Output / Logging** | `printf("val=%d\n", val);` (type-unsafe) | `LOG(INFO) << "val=" << val;` / `absl::PrintF` | `std::println("val={}", val);` (C++23/26 type-safe) |
| **Pre/Post Conditions** | Manual `assert()` or `if (!x) return -1;` | `ABSL_CHECK(x)` / `ABSL_DCHECK(x)` crash assertions | **C++26 Contracts**: `[[contract: pre(x > 0)]]` |

---

## 3. Deep Dive: Architectural Nuances

### A. Why Does Google Ban C++ Exceptions? (`-fno-exceptions`)
In Google's production codebases (and in Chromium, Android, and LLVM), C++ exceptions (`throw`, `try`, `catch`) are explicitly disabled at the compiler level via `-fno-exceptions`. Why?
1. **Historical Monorepo**: Google's massive codebase was started when C++ compilers produced terrible stack-unwinding code that bloated binary sizes by 15–30%.
2. **Invisible Control Flow**: An exception can exit a function from *any* function call. If every line of code can throw, verifying exception safety across millions of lines of code requires extreme vigilance (every acquired lock or pointer must be exception-safe).
3. **Google's Modern Solution**: Instead of throwing, functions return `absl::Status` (for void results) or `absl::StatusOr<T>` (for values). If a function fails, the caller is forced by compiler annotations (`[[nodiscard]]`) to handle the status:

```cpp
// Google Style: Explicit status return, no hidden control flow
absl::StatusOr<std::unique_ptr<Packet>> ParsePacket(absl::string_view raw_bytes) {
  if (raw_bytes.size() < kHeaderSize) {
    return absl::InvalidArgumentError("Packet header too short");
  }
  auto packet = std::make_unique<Packet>();
  // populate packet...
  return packet;
}
```

### B. Modern ISO C++26 & The Core Guidelines of '26
The **C++ Core Guidelines** (edited by Bjarne Stroustrup and Herb Sutter) aim to modernize C++ so that **dangling pointers, type confusion, and leaks become statically impossible**:
1. **C++26 Contracts**: Replacing manual assertions with formal language-level pre-conditions, post-conditions, and invariants:
   ```cpp
   // C++26 Contract Syntax
   auto read_samples(std::span<const float> buffer, size_t count) -> std::vector<float>
       [[contract: pre(!buffer.empty())]]
       [[contract: pre(count <= buffer.size())]]
       [[contract: post(r: !r.empty())]];
   ```
2. **Monadic `std::expected<T, E>` (C++23/C++26)**: ISO standard's functional response to Google's `StatusOr` and Rust's `Result<T, E>`:
   ```cpp
   std::expected<int, std::string_view> parse_int(std::string_view s);
   ```
3. **The Rule of Zero**: In C-style C++, you write destructors and manual copy routines. In ISO C++26, you design structs using self-managing components (`std::vector`, `std::string`, `std::unique_ptr`) so you write **zero special member functions**. The compiler auto-synthesizes optimal copy and move operations with no memory leak vulnerabilities.

---

## 4. Concrete Code Comparison: The Packet Buffer

Let's look at how the exact same real-world task — allocating, manipulating, and safely parsing a binary network buffer — is implemented in each dialect.

### Style 1: CPL / "C-Style C++" (1980s–1990s Cfront Style)
```cpp
// C-Style C++: Procedural classes, manual pointers, sentinel error codes
#define MAX_PAYLOAD 2048

class CStyleBuffer {
public:
    char* data;
    int size;
    int capacity;

    // Manual init/cleanup simulating CPL/C idioms
    void Init(int cap) {
        capacity = (cap > 0) ? cap : MAX_PAYLOAD;
        data = (char*)malloc(capacity); // Raw malloc in C++
        size = 0;
    }

    void Destroy() {
        if (data != NULL) {
            free(data);
            data = NULL;
        }
    }

    // Out-parameter for return, int return code (-1 on failure)
    int AppendData(const char* src, int len) {
        if (!data || size + len > capacity) {
            return -1; // Sentinel error
        }
        memcpy(data + size, src, len);
        size += len;
        return 0; // Success
    }
};
```
*Critique*: Leaks if `Destroy()` is forgotten; `Init()` can be skipped; copy causes double-free crash; manual casts bypass type system.

---

### Style 2: Google-Style C++ (Abseil / Production Systems)
```cpp
// Google-Style C++: -fno-exceptions, unique_ptr, StatusOr, explicit naming
class GooglePacketBuffer {
 public:
  static constexpr size_t kDefaultCapacity = 2048;

  // Disallow copy and assign (single owner only)
  GooglePacketBuffer(const GooglePacketBuffer&) = delete;
  GooglePacketBuffer& operator=(const GooglePacketBuffer&) = delete;

  // Movable
  GooglePacketBuffer(GooglePacketBuffer&&) noexcept = default;
  GooglePacketBuffer& operator=(GooglePacketBuffer&&) noexcept = default;

  explicit GooglePacketBuffer(size_t capacity = kDefaultCapacity)
      : capacity_(capacity),
        data_(std::make_unique<uint8_t[]>(capacity_)),
        size_(0) {}

  // Google convention: Returns absl::Status (no exceptions)
  absl::Status Append(absl::string_view bytes) {
    if (size_ + bytes.size() > capacity_) {
      return absl::ResourceExhaustedError("Buffer capacity exceeded");
    }
    std::memcpy(data_.get() + size_, bytes.data(), bytes.size());
    size_ += bytes.size();
    return absl::OkStatus();
  }

  size_t size() const { return size_; }
  const uint8_t* data() const { return data_.get(); }

 private:
  size_t capacity_;
  std::unique_ptr<uint8_t[]> data_;
  size_t size_;
};
```
*Critique*: Explicit, zero leaks via `std::unique_ptr`, compiler forces caller to inspect `absl::Status`, clear private member naming (`trailing_underscore_`).

---

### Style 3: Modern ISO C++26 & Core Guidelines '26
```cpp
// ISO C++26: Rule of Zero, std::expected, std::span, std::print, Contracts
#include <expected>
#include <span>
#include <vector>
#include <string_view>
#include <print>

enum class BufferError { OutOfMemory, InvalidSlice, CapacityExceeded };

class IsoPacketBuffer {
    std::vector<std::byte> storage_; // Rule of Zero: vector handles memory, copy, move!

public:
    explicit IsoPacketBuffer(size_t initial_cap = 2048) {
        storage_.reserve(initial_cap);
    }

    // Monadic error handling with std::expected + C++26 Contract pre-condition
    [[nodiscard]] auto append(std::span<const std::byte> bytes) noexcept
        -> std::expected<void, BufferError>
        // C++26 Contract pre-condition
        [[contract: pre(!bytes.empty())]] 
    {
        if (storage_.size() + bytes.size() > storage_.capacity()) {
            return std::unexpected(BufferError::CapacityExceeded);
        }
        storage_.insert(storage_.end(), bytes.begin(), bytes.end());
        return {};
    }

    // Non-owning view for zero-copy inspection
    [[nodiscard]] auto as_span() const noexcept -> std::span<const std::byte> {
        return storage_;
    }

    [[nodiscard]] size_t size() const noexcept { return storage_.size(); }
};
```
*Critique*: Exactly 0 lines of manual allocation or deallocation; memory-safe by construction; contract verified at boundary; monadic chaining.

---

## 5. Summary Guidelines for Production Codebases

1. **If writing C-Style C++**: Stop using `malloc`/`free` or naked `new`/`delete` in C++. Use standard containers or write a dedicated RAII wrapper.
2. **If adhering to Google Style**: Disable exceptions, use `std::unique_ptr` for exclusive ownership, return `StatusOr<T>`, pass inputs by `const &` or `string_view`, use `kConstant` and `member_` naming.
3. **If writing Modern ISO C++ (C++20/C++23/C++26)**:
   - Prefer **Rule of Zero** over Rule of 5.
   - Use `std::span` and `std::string_view` for function parameters instead of pointers + lengths.
   - Use `std::expected` for operations that can fail without abnormal termination.
   - Use C++26 Contracts (`[[contract: pre(...)]]`) to document and enforce invariant guarantees.
   - Use `std::print` / `std::println` instead of `printf` or `std::cout`.
