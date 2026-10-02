# C & Systems Programming Guide (IRC / Web Forum Edition)

Hey there! Welcome to the ultimate low-level systems & C programming journey! (●'◡'●)
We're gonna go all the way from raw binary bits and pointer magic, through kernel syscalls and modern zero-cost C++, all the way up to reverse-engineering how Python, JS, and databases actually work under the hood! q(≧▽≦q)

---

## Complete 4-Part Curriculum Map

### Part 1: C Foundations & Core Memory Mechanics (*^▽^*)

| Module | Topic | What We're Learning | Code Example |
| :--- | :--- | :--- | :--- |
| **[01](#systems/01_compilation_and_memory)** | **Compilation & Data Types** | Preprocessor, Compiler, Assembler, Linker, `.i`/`.s`/`.o`, Two's Complement, Wraparound | [`01_types_and_bits.c`](#systems/01_compilation_and_memory) |
| **[01b](#systems/01_compilation_and_memory)** | **Linker Internals & ELF Format** | Symbol resolution, Weak vs Strong symbols, `.text`/`.rodata`/`.data`/`.bss`, Dynamic linking PLT/GOT | [`01b_symbol_resolution.c`](#systems/01_compilation_and_memory) |
| **[02](#systems/02_memory_and_pointers)** | **Pointers & The Stack** | Address space, `&` and `*`, Pointer variables, Stack frames, Function calls, `void*` | [`02_pointer_basics.c`](#systems/02_memory_and_pointers)<br>[`02_stack_inspection.c`](#systems/02_memory_and_pointers) |
| **[03](#systems/03_arrays_and_strings)** | **Arrays & Strings** | Pointer arithmetic, Array decay, String literals, Stack vs Read-Only memory, Buffer overflows | [`03_arrays_and_strings.c`](#systems/03_arrays_and_strings) |
| **[04](#systems/04_structs_and_memory_layout)** | **Structs, Alignment & Unions** | Hardware word alignment, Structure padding, `offsetof`, Unions, Type punning, Bitfields | [`04_struct_alignment.c`](#systems/04_structs_and_memory_layout)<br>[`04_unions_and_bitfields.c`](#systems/04_structs_and_memory_layout) |
| **[05](#systems/05_dynamic_memory)** | **Dynamic Memory & Allocators** | Heap memory, `malloc`/`calloc`/`realloc`/`free`, Leaks, Use-after-free, Building an Arena Allocator | [`05_heap_memory.c`](#systems/05_dynamic_memory)<br>[`05_simple_arena.c`](#systems/05_dynamic_memory) |
| **[06](#systems/06_bitwise_and_registers)** | **Bitwise & Hardware Registers** | Bitwise operators, Bitmasks, Endianness, Emulating MMIO hardware registers | [`06_bitwise_manipulation.c`](#systems/06_bitwise_and_registers)<br>[`06_endianness_and_registers.c`](#systems/06_bitwise_and_registers) |
| **[07](#systems/07_function_pointers_and_vtables)** | **Function Pointers & OOP** | Code segment pointers, Callbacks, Jump tables, Virtual tables (vtables) in C | [`07_function_pointers_and_vtables.c`](#systems/07_function_pointers_and_vtables) |
| **[08](#systems/08_binary_io_and_serialization)** | **Binary I/O & File Formats** | Raw byte streams, `fread`/`fwrite`, File headers, Magic numbers, Serialization | [`08_binary_file_records.c`](#systems/08_binary_io_and_serialization) |

---

### Part 2: Advanced Systems Programming (o゜▽゜)o

| Module | Topic | What We're Learning | Code Example |
| :--- | :--- | :--- | :--- |
| **[09](#systems/09_concurrency_and_atomics)** | **Concurrency & Atomics** | Memory models, race conditions, atomic operations (`stdatomic.h`), spinlocks, lock-free patterns | [`09_atomics_and_spinlocks.c`](#systems/09_concurrency_and_atomics) |
| **[09b](#systems/09b_hardware_memory_models_and_barriers)** | **Hardware Memory Models & Barriers** | Store buffers, MESI cache coherence, out-of-order execution, acquire/release semantics | [`09b_memory_barriers_demo.c`](#systems/09b_hardware_memory_models_and_barriers) |
| **[10](#systems/10_cache_and_simd)** | **CPU Cache & Hardware Locality** | L1/L2/L3 cache lines (64B), spatial vs temporal locality, cache-friendly algorithms, SIMD concept | [`10_cache_locality_benchmark.c`](#systems/10_cache_and_simd) |
| **[10b](#systems/10b_simd_vector_intrinsics)** | **SIMD Vector Intrinsics (AVX2)** | 256-bit YMM registers, parallel float ops, `_mm256_add_ps`, memory alignment, auto-vectorization | [`10b_avx2_vectorization.c`](#systems/10b_simd_vector_intrinsics) |
| **[11](#systems/11_syscalls_and_signals)** | **OS System Calls & Signals** | User space vs Kernel transitions, file descriptors, asynchronous signal handling, reentrancy | [`11_signals_and_syscalls.c`](#systems/11_syscalls_and_signals) |
| **[12](#systems/12_advanced_memory_allocators)** | **Pool & Free-List Allocators** | Fixed-size memory pools, embedded free lists, O(1) malloc/free with zero external fragmentation | [`12_pool_allocator.c`](#systems/12_advanced_memory_allocators) |
| **[13](#systems/13_virtual_memory_and_mmap)** | **Virtual Memory & Zero-Copy I/O** | Page tables, 4KB memory pages, page faults, memory-mapped files (`mmap`), zero-copy streaming | [`13_virtual_memory_pages.c`](#systems/13_virtual_memory_and_mmap) |
| **[13b](#systems/13b_page_tables_and_tlb_mechanics)** | **Page Tables, TLB & Copy-on-Write** | 4-level paging (PML4/PDPT/PD/PT), CR3 register, TLB shootdowns, Copy-on-Write (`fork`) | [`13b_tlb_and_cow_demo.c`](#systems/13b_page_tables_and_tlb_mechanics) |
| **[14](#systems/14_advanced_preprocessor_metaprogramming)** | **Preprocessor Metaprogramming** | Stringification (`#`), Token pasting (`##`), Variadic macros, X-Macros for automatic code generation | [`14_xmacros_and_codegen.c`](#systems/14_advanced_preprocessor_metaprogramming) |
| **[15](#systems/15_inline_assembly_and_intrinsics)** | **Assembly & CPU Intrinsics** | Compiler intrinsics (`popcount`, `clz`), CPU cycle counter (`rdtsc`), memory barriers & volatile | [`15_intrinsics_and_cycles.c`](#systems/15_inline_assembly_and_intrinsics) |
| **[15b](#systems/15b_x64_abi_calling_conventions)** | **x86-64 ABI & Calling Conventions** | System V vs Win64 ABI, register arguments, 16-byte stack alignment, caller/callee-saved regs | [`15b_abi_and_stack_frames.c`](#systems/15b_x64_abi_calling_conventions) |
| **[16](#systems/16_bytecode_vm_interpreter)** | **Building a Bytecode Virtual Machine** | Instruction set design (ISA), fetch-decode-execute loop, stack VM, opcodes, bytecode compilation | [`16_stack_vm.c`](#systems/16_bytecode_vm_interpreter) |
| **[16b](#systems/16b_vm_dispatch_techniques)** | **High-Speed VM Dispatch Techniques** | Switch dispatch vs Direct Threaded Code (Computed goto `&&label`), branch predictor optimization | [`16b_threaded_code_vm.c`](#systems/16b_vm_dispatch_techniques) |

---

### Part 3: Modern C++ & Zero-Cost Systems Engineering (≧∇≦)ﾉ

| Module | Topic | What We're Learning | Code Example |
| :--- | :--- | :--- | :--- |
| **[17](#systems/17_raii_and_resources)** | **RAII & Resource Management** | Resource Acquisition Is Initialization, Stack unrolling, Custom FD and Mutex RAII guards | [`17_raii_demo.cpp`](#systems/17_raii_and_resources) |
| **[17b](#systems/17b_cpp_object_model_and_lifecycles)** | **C++ Object Model & Rule of 5** | Classes vs Structs memory layout, Constructors, Destructors, Rule of 5, Deep vs Move copies | [`17b_lifecycles_and_rule_of_five.cpp`](#systems/17b_cpp_object_model_and_lifecycles) |
| **[18](#systems/18_smart_pointers_internals)** | **Smart Pointers Under the Hood** | `std::unique_ptr` (zero-cost pointer), `std::shared_ptr` atomic control blocks, building from scratch | [`18_smart_pointers.cpp`](#systems/18_smart_pointers_internals) |
| **[19](#systems/19_move_semantics_and_rvalues)** | **Move Semantics & Rvalues** | Lvalues vs Rvalues (`&&`), `std::move`, Move constructor, stealing heap pointers in O(1) | [`19_move_semantics.cpp`](#systems/19_move_semantics_and_rvalues) |
| **[19b](#systems/19b_perfect_forwarding_and_universal_references)** | **Universal References & Forwarding** | Reference collapsing, Universal references (`T&&`), `std::forward`, In-place emplace constructors | [`19b_perfect_forwarding.cpp`](#systems/19b_perfect_forwarding_and_universal_references) |
| **[20](#systems/20_constexpr_and_compile_time)** | **Compile-Time Computation** | `constexpr`, `consteval`, Generating lookup tables & CRC32 hashes during compilation | [`20_constexpr_demo.cpp`](#systems/20_constexpr_and_compile_time) |
| **[20b](#systems/20b_template_metaprogramming_and_type_traits)** | **Type Traits & C++20 Concepts** | Type traits introspection, `if constexpr` branch elimination, C++20 Concepts & constraints | [`20b_type_traits_and_concepts.cpp`](#systems/20b_template_metaprogramming_and_type_traits) |
| **[21](#systems/21_views_and_zero_copy)** | **Non-Owning Memory Views** | `std::span`, `std::string_view`, Zero-copy slicing, Avoiding dangling view references | [`21_memory_views.cpp`](#systems/21_views_and_zero_copy) |
| **[22](#systems/22_pmr_and_custom_allocators)** | **Polymorphic Allocators (PMR)** | `std::pmr::monotonic_buffer_resource`, Stack-backed vector allocation, Zero-heap containers | [`22_pmr_arena.cpp`](#systems/22_pmr_and_custom_allocators) |
| **[23](#systems/23_cache_alignment_and_false_sharing)** | **False Sharing & Cache Alignment** | `alignas(64)`, Hardware cache line interference across multi-core threads, Cache padding | [`23_false_sharing_benchmark.cpp`](#systems/23_cache_alignment_and_false_sharing) |
| **[24](#systems/24_lock_free_spsc_ring_buffer)** | **Capstone: Lock-Free SPSC Ring Buffer** | Single-Producer Single-Consumer queue, Atomic acquire/release memory orders, Zero-lock throughput | [`24_spsc_ring_buffer.cpp`](#systems/24_lock_free_spsc_ring_buffer) |
| **[24b](#systems/24b_lock_free_patterns_and_aba_problem)** | **Lock-Free Patterns & ABA Problem** | Multi-threaded CAS loops, ABA race condition, Tagged pointers, Hazard pointers, Epoch reclamation | [`24b_lock_free_stack_aba.cpp`](#systems/24b_lock_free_patterns_and_aba_problem) |

---

### Part 4: High-Level to Low-Level Deconstruction (Working Backwards) (¬‿¬)

| Module | Topic | High-Level Feature -> Low-Level Foundation | Code Example |
| :--- | :--- | :--- | :--- |
| **[25](#systems/25_garbage_collection_internals)** | **Garbage Collection Under the Hood** | Python/Java/JS auto memory -> Mark-and-Sweep, stack roots, pointer graph traversal | [`25_mark_and_sweep_gc.c`](#systems/25_garbage_collection_internals) |
| **[26](#systems/26_dynamic_typing_and_boxed_objects)** | **Dynamic Typing & `PyObject`** | Python `x = 42; x = "str"` -> C Tagged unions, Boxing, NaN-tagging, Type dispatch | [`26_boxed_types_and_tagging.c`](#systems/26_dynamic_typing_and_boxed_objects) |
| **[26b](#systems/26b_dynamic_typing_and_boxed_objects)** | **NaN-Boxing Engine Deep Dive** | IEEE 754 Quiet NaN bitmasking, 48-bit pointer packing, 8-byte universal dynamic values | [`26b_nan_boxing_engine.c`](#systems/26b_dynamic_typing_and_boxed_objects) |
| **[27](#systems/27_async_event_loop_and_coroutines)** | **Async/Await & Event Loops** | JS Promises / Python `async def` -> Non-blocking I/O, Callbacks, Coroutine state machines | [`27_micro_event_loop.c`](#systems/27_async_event_loop_and_coroutines) |
| **[27b](#systems/27b_async_event_loop_and_coroutines)** | **I/O Multiplexing & `epoll`** | C10K problem, `select`/`poll` vs `epoll`/`kqueue`, non-blocking descriptors, Reactor pattern | [`27b_epoll_reactor_pattern.c`](#systems/27b_async_event_loop_and_coroutines) |
| **[27c](#systems/27c_async_event_loop_and_coroutines)** | **Fibers & Stackful Coroutines** | Stackless vs Stackful coroutines, Go goroutines, register swapping (`RSP`/`RBP`/`RIP`), `setjmp` | [`27c_cooperative_fiber_scheduler.c`](#systems/27c_async_event_loop_and_coroutines) |
| **[28](#systems/28_hashmaps_and_dynamic_collections)** | **Hash Maps & Dictionaries** | Python `dict` / JS `Map` -> Hash math, Open Addressing, Cache line spatial locality | [`28_open_addressing_hashmap.c`](#systems/28_hashmaps_and_dynamic_collections) |
| **[29](#systems/29_database_indexes_and_btrees)** | **Databases & B-Tree Indexes** | SQL `SELECT WHERE id = 10` -> 4KB disk page nodes, binary search on disk, Page cache | [`29_page_btree_indexer.c`](#systems/29_database_indexes_and_btrees) |
| **[29b](#systems/29b_database_indexes_and_btrees)** | **Write-Ahead Logging (WAL) & Buffer Pool** | Buffer frame pinning, dirty page flushing, WAL append protocol, ACID durability | [`29b_wal_buffer_pool.c`](#systems/29b_database_indexes_and_btrees) |
| **[30](#systems/30_http_and_socket_networking)** | **Web Frameworks & HTTP Parsers** | Express/FastAPI `@app.get` -> TCP socket file descriptors, zero-copy buffer slicing | [`30_raw_http_parser.c`](#systems/30_http_and_socket_networking) |
| **[30b](#systems/30_http_and_socket_networking)** | **TCP Internals & Message Framing** | 3-way handshake, `TIME_WAIT`, `SO_REUSEADDR`, stream packet fragmentation, length-prefix framing | [`30b_tcp_framing_protocol.c`](#systems/30_http_and_socket_networking) |
| **[31](#systems/31_jit_compiler_and_dynamic_codegen)** | **JIT Compilers (V8 / JVM)** | JavaScript / Java near-native speed -> `mmap(PROT_EXEC)` generating raw CPU machine bytes | [`31_mini_jit_compiler.c`](#systems/31_jit_compiler_and_dynamic_codegen) |
| **[31b](#systems/31_jit_compiler_and_dynamic_codegen)** | **$W \oplus X$ Security & I-Cache Flushing** | $W \oplus X$ policy, DEP/NX bit, `__builtin___clear_cache`, D-Cache/I-Cache coherence, Trampolines | [`31b_jit_trampolines.c`](#systems/31_jit_compiler_and_dynamic_codegen) |
| **[32](#systems/32_grand_unified_software_architecture)** | **Grand Unified Software Stack** | Running `python app.py` -> Complete journey from OS Loader, ELF, libc, VM to Silicon | [`32_system_trace_analyzer.c`](#systems/32_grand_unified_software_architecture) |

---

## The Low-Level Mental Model (How RAM Actually Looks!)

Whenever your code runs, the OS gives your program a virtual playground:

```
High Addresses (0xFFFFFFFF... on 64-bit)
+-------------------------------------------------------+
| Kernel Space (Hands off! OS only zone)                |
+-------------------------------------------------------+
| Stack (Grows DOWNWARD!)                               |
|   - Local variables live here                         |
|   - Function return addresses                         |
|                           |                           |
|                           v                           |
|                                                       |
|                           ^                           |
|                           |                           |
| Heap (Grows UPWARD!)                                  |
|   - malloc() / new lives here                         |
+-------------------------------------------------------+
| BSS Segment (Uninitialized globals = 0)               |
+-------------------------------------------------------+
| Data Segment (Initialized globals)                    |
+-------------------------------------------------------+
| Text / Code Segment (Your compiled assembly machine   |
| instructions + string literals! Read-only!)           |
+-------------------------------------------------------+
Low Addresses (0x00000000...)
```

---

## How to Compile and Run

Every single example here is super self-contained! Grab your favorite compiler and let's go! (o゜▽゜)o

```bash
# For C programs (Modules 01 - 16b, 25 - 32):
gcc -Wall -Wextra -std=c11 <folder>/<file>.c -o <name>
./<name>

# For C++ programs (Modules 17 - 24b):
g++ -Wall -Wextra -std=c++20 <folder>/<file>.cpp -o <name>
./<name>
```
