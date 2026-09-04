# C & Systems Programming Guide (IRC / Web Forum Edition)

Hey there! Welcome to the ultimate low-level systems & C programming journey! (●'◡'●)
We're gonna go all the way from raw binary bits and pointer magic, through kernel syscalls and modern zero-cost C++, all the way up to reverse-engineering how Python, JS, and databases actually work under the hood! q(≧▽≦q)

---

## Complete 4-Part Curriculum Map

### Part 1: C Foundations & Core Memory Mechanics (*^▽^*)

| Module | Topic | What We're Learning | Code Example |
| :--- | :--- | :--- | :--- |
| **[01](file:///c:/Users/kkhoie/Downloads/cprog1/01_compilation_and_memory/01_compilation_pipeline_and_data_types.md)** | **Compilation & Data Types** | Preprocessor, Compiler, Assembler, Linker, `.i`/`.s`/`.o`, Two's Complement, Wraparound | [`01_types_and_bits.c`](file:///c:/Users/kkhoie/Downloads/cprog1/01_compilation_and_memory/01_types_and_bits.c) |
| **[01b](file:///c:/Users/kkhoie/Downloads/cprog1/01_compilation_and_memory/01b_linker_symbols_and_elf.md)** | **Linker Internals & ELF Format** | Symbol resolution, Weak vs Strong symbols, `.text`/`.rodata`/`.data`/`.bss`, Dynamic linking PLT/GOT | [`01b_symbol_resolution.c`](file:///c:/Users/kkhoie/Downloads/cprog1/01_compilation_and_memory/01b_symbol_resolution.c) |
| **[02](file:///c:/Users/kkhoie/Downloads/cprog1/02_memory_and_pointers/02_pointers_and_stack_memory.md)** | **Pointers & The Stack** | Address space, `&` and `*`, Pointer variables, Stack frames, Function calls, `void*` | [`02_pointer_basics.c`](file:///c:/Users/kkhoie/Downloads/cprog1/02_memory_and_pointers/02_pointer_basics.c)<br>[`02_stack_inspection.c`](file:///c:/Users/kkhoie/Downloads/cprog1/02_memory_and_pointers/02_stack_inspection.c) |
| **[03](file:///c:/Users/kkhoie/Downloads/cprog1/03_arrays_and_strings/03_arrays_strings_and_pointer_arithmetic.md)** | **Arrays & Strings** | Pointer arithmetic, Array decay, String literals, Stack vs Read-Only memory, Buffer overflows | [`03_arrays_and_strings.c`](file:///c:/Users/kkhoie/Downloads/cprog1/03_arrays_and_strings/03_arrays_and_strings.c) |
| **[04](file:///c:/Users/kkhoie/Downloads/cprog1/04_structs_and_memory_layout/04_struct_padding_alignment_and_unions.md)** | **Structs, Alignment & Unions** | Hardware word alignment, Structure padding, `offsetof`, Unions, Type punning, Bitfields | [`04_struct_alignment.c`](file:///c:/Users/kkhoie/Downloads/cprog1/04_structs_and_memory_layout/04_struct_alignment.c)<br>[`04_unions_and_bitfields.c`](file:///c:/Users/kkhoie/Downloads/cprog1/04_structs_and_memory_layout/04_unions_and_bitfields.c) |
| **[05](file:///c:/Users/kkhoie/Downloads/cprog1/05_dynamic_memory/05_dynamic_allocation_and_custom_allocators.md)** | **Dynamic Memory & Allocators** | Heap memory, `malloc`/`calloc`/`realloc`/`free`, Leaks, Use-after-free, Building an Arena Allocator | [`05_heap_memory.c`](file:///c:/Users/kkhoie/Downloads/cprog1/05_dynamic_memory/05_heap_memory.c)<br>[`05_simple_arena.c`](file:///c:/Users/kkhoie/Downloads/cprog1/05_dynamic_memory/05_simple_arena.c) |
| **[06](file:///c:/Users/kkhoie/Downloads/cprog1/06_bitwise_and_registers/06_bitwise_operations_and_hardware_registers.md)** | **Bitwise & Hardware Registers** | Bitwise operators, Bitmasks, Endianness, Emulating MMIO hardware registers | [`06_bitwise_manipulation.c`](file:///c:/Users/kkhoie/Downloads/cprog1/06_bitwise_and_registers/06_bitwise_manipulation.c)<br>[`06_endianness_and_registers.c`](file:///c:/Users/kkhoie/Downloads/cprog1/06_bitwise_and_registers/06_endianness_and_registers.c) |
| **[07](file:///c:/Users/kkhoie/Downloads/cprog1/07_function_pointers_and_vtables/07_function_pointers_and_polymorphism.md)** | **Function Pointers & OOP** | Code segment pointers, Callbacks, Jump tables, Virtual tables (vtables) in C | [`07_function_pointers_and_vtables.c`](file:///c:/Users/kkhoie/Downloads/cprog1/07_function_pointers_and_vtables/07_function_pointers_and_vtables.c) |
| **[08](file:///c:/Users/kkhoie/Downloads/cprog1/08_binary_io_and_serialization/08_binary_io_and_file_formats.md)** | **Binary I/O & File Formats** | Raw byte streams, `fread`/`fwrite`, File headers, Magic numbers, Serialization | [`08_binary_file_records.c`](file:///c:/Users/kkhoie/Downloads/cprog1/08_binary_io_and_serialization/08_binary_file_records.c) |

---

### Part 2: Advanced Systems Programming (o゜▽゜)o

| Module | Topic | What We're Learning | Code Example |
| :--- | :--- | :--- | :--- |
| **[09](file:///c:/Users/kkhoie/Downloads/cprog1/09_concurrency_and_atomics/09_concurrency_and_atomics.md)** | **Concurrency & Atomics** | Memory models, race conditions, atomic operations (`stdatomic.h`), spinlocks, lock-free patterns | [`09_atomics_and_spinlocks.c`](file:///c:/Users/kkhoie/Downloads/cprog1/09_concurrency_and_atomics/09_atomics_and_spinlocks.c) |
| **[09b](file:///c:/Users/kkhoie/Downloads/cprog1/09b_hardware_memory_models_and_barriers/09b_hardware_memory_models.md)** | **Hardware Memory Models & Barriers** | Store buffers, MESI cache coherence, out-of-order execution, acquire/release semantics | [`09b_memory_barriers_demo.c`](file:///c:/Users/kkhoie/Downloads/cprog1/09b_hardware_memory_models_and_barriers/09b_memory_barriers_demo.c) |
| **[10](file:///c:/Users/kkhoie/Downloads/cprog1/10_cache_and_simd/10_cache_locality_and_simd.md)** | **CPU Cache & Hardware Locality** | L1/L2/L3 cache lines (64B), spatial vs temporal locality, cache-friendly algorithms, SIMD concept | [`10_cache_locality_benchmark.c`](file:///c:/Users/kkhoie/Downloads/cprog1/10_cache_and_simd/10_cache_locality_benchmark.c) |
| **[10b](file:///c:/Users/kkhoie/Downloads/cprog1/10b_simd_vector_intrinsics/10b_simd_vector_intrinsics.md)** | **SIMD Vector Intrinsics (AVX2)** | 256-bit YMM registers, parallel float ops, `_mm256_add_ps`, memory alignment, auto-vectorization | [`10b_avx2_vectorization.c`](file:///c:/Users/kkhoie/Downloads/cprog1/10b_simd_vector_intrinsics/10b_avx2_vectorization.c) |
| **[11](file:///c:/Users/kkhoie/Downloads/cprog1/11_syscalls_and_signals/11_syscalls_and_signals.md)** | **OS System Calls & Signals** | User space vs Kernel transitions, file descriptors, asynchronous signal handling, reentrancy | [`11_signals_and_syscalls.c`](file:///c:/Users/kkhoie/Downloads/cprog1/11_syscalls_and_signals/11_signals_and_syscalls.c) |
| **[12](file:///c:/Users/kkhoie/Downloads/cprog1/12_advanced_memory_allocators/12_advanced_allocators.md)** | **Pool & Free-List Allocators** | Fixed-size memory pools, embedded free lists, O(1) malloc/free with zero external fragmentation | [`12_pool_allocator.c`](file:///c:/Users/kkhoie/Downloads/cprog1/12_advanced_memory_allocators/12_pool_allocator.c) |
| **[13](file:///c:/Users/kkhoie/Downloads/cprog1/13_virtual_memory_and_mmap/13_virtual_memory_and_mmap.md)** | **Virtual Memory & Zero-Copy I/O** | Page tables, 4KB memory pages, page faults, memory-mapped files (`mmap`), zero-copy streaming | [`13_virtual_memory_pages.c`](file:///c:/Users/kkhoie/Downloads/cprog1/13_virtual_memory_and_mmap/13_virtual_memory_pages.c) |
| **[13b](file:///c:/Users/kkhoie/Downloads/cprog1/13b_page_tables_and_tlb_mechanics/13b_page_tables_and_tlb.md)** | **Page Tables, TLB & Copy-on-Write** | 4-level paging (PML4/PDPT/PD/PT), CR3 register, TLB shootdowns, Copy-on-Write (`fork`) | [`13b_tlb_and_cow_demo.c`](file:///c:/Users/kkhoie/Downloads/cprog1/13b_page_tables_and_tlb_mechanics/13b_tlb_and_cow_demo.c) |
| **[14](file:///c:/Users/kkhoie/Downloads/cprog1/14_advanced_preprocessor_metaprogramming/14_macros_and_metaprogramming.md)** | **Preprocessor Metaprogramming** | Stringification (`#`), Token pasting (`##`), Variadic macros, X-Macros for automatic code generation | [`14_xmacros_and_codegen.c`](file:///c:/Users/kkhoie/Downloads/cprog1/14_advanced_preprocessor_metaprogramming/14_xmacros_and_codegen.c) |
| **[15](file:///c:/Users/kkhoie/Downloads/cprog1/15_inline_assembly_and_intrinsics/15_inline_assembly_and_intrinsics.md)** | **Assembly & CPU Intrinsics** | Compiler intrinsics (`popcount`, `clz`), CPU cycle counter (`rdtsc`), memory barriers & volatile | [`15_intrinsics_and_cycles.c`](file:///c:/Users/kkhoie/Downloads/cprog1/15_inline_assembly_and_intrinsics/15_intrinsics_and_cycles.c) |
| **[15b](file:///c:/Users/kkhoie/Downloads/cprog1/15b_x64_abi_calling_conventions/15b_x64_abi_and_calling_conventions.md)** | **x86-64 ABI & Calling Conventions** | System V vs Win64 ABI, register arguments, 16-byte stack alignment, caller/callee-saved regs | [`15b_abi_and_stack_frames.c`](file:///c:/Users/kkhoie/Downloads/cprog1/15b_x64_abi_calling_conventions/15b_abi_and_stack_frames.c) |
| **[16](file:///c:/Users/kkhoie/Downloads/cprog1/16_bytecode_vm_interpreter/16_bytecode_vm.md)** | **Building a Bytecode Virtual Machine** | Instruction set design (ISA), fetch-decode-execute loop, stack VM, opcodes, bytecode compilation | [`16_stack_vm.c`](file:///c:/Users/kkhoie/Downloads/cprog1/16_bytecode_vm_interpreter/16_stack_vm.c) |
| **[16b](file:///c:/Users/kkhoie/Downloads/cprog1/16b_vm_dispatch_techniques/16b_vm_dispatch_techniques.md)** | **High-Speed VM Dispatch Techniques** | Switch dispatch vs Direct Threaded Code (Computed goto `&&label`), branch predictor optimization | [`16b_threaded_code_vm.c`](file:///c:/Users/kkhoie/Downloads/cprog1/16b_vm_dispatch_techniques/16b_threaded_code_vm.c) |

---

### Part 3: Modern C++ & Zero-Cost Systems Engineering (≧∇≦)ﾉ

| Module | Topic | What We're Learning | Code Example |
| :--- | :--- | :--- | :--- |
| **[17](file:///c:/Users/kkhoie/Downloads/cprog1/17_raii_and_resources/17_raii_and_resources.md)** | **RAII & Resource Management** | Resource Acquisition Is Initialization, Stack unrolling, Custom FD and Mutex RAII guards | [`17_raii_demo.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/17_raii_and_resources/17_raii_demo.cpp) |
| **[17b](file:///c:/Users/kkhoie/Downloads/cprog1/17b_cpp_object_model_and_lifecycles/17b_cpp_object_model_and_lifecycles.md)** | **C++ Object Model & Rule of 5** | Classes vs Structs memory layout, Constructors, Destructors, Rule of 5, Deep vs Move copies | [`17b_lifecycles_and_rule_of_five.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/17b_cpp_object_model_and_lifecycles/17b_lifecycles_and_rule_of_five.cpp) |
| **[18](file:///c:/Users/kkhoie/Downloads/cprog1/18_smart_pointers_internals/18_smart_pointers_internals.md)** | **Smart Pointers Under the Hood** | `std::unique_ptr` (zero-cost pointer), `std::shared_ptr` atomic control blocks, building from scratch | [`18_smart_pointers.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/18_smart_pointers_internals/18_smart_pointers.cpp) |
| **[19](file:///c:/Users/kkhoie/Downloads/cprog1/19_move_semantics_and_rvalues/19_move_semantics.md)** | **Move Semantics & Rvalues** | Lvalues vs Rvalues (`&&`), `std::move`, Move constructor, stealing heap pointers in O(1) | [`19_move_semantics.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/19_move_semantics_and_rvalues/19_move_semantics.cpp) |
| **[19b](file:///c:/Users/kkhoie/Downloads/cprog1/19b_perfect_forwarding_and_universal_references/19b_perfect_forwarding_and_universal_references.md)** | **Universal References & Forwarding** | Reference collapsing, Universal references (`T&&`), `std::forward`, In-place emplace constructors | [`19b_perfect_forwarding.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/19b_perfect_forwarding_and_universal_references/19b_perfect_forwarding.cpp) |
| **[20](file:///c:/Users/kkhoie/Downloads/cprog1/20_constexpr_and_compile_time/20_constexpr_metaprogramming.md)** | **Compile-Time Computation** | `constexpr`, `consteval`, Generating lookup tables & CRC32 hashes during compilation | [`20_constexpr_demo.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/20_constexpr_and_compile_time/20_constexpr_demo.cpp) |
| **[20b](file:///c:/Users/kkhoie/Downloads/cprog1/20b_template_metaprogramming_and_type_traits/20b_template_metaprogramming_and_type_traits.md)** | **Type Traits & C++20 Concepts** | Type traits introspection, `if constexpr` branch elimination, C++20 Concepts & constraints | [`20b_type_traits_and_concepts.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/20b_template_metaprogramming_and_type_traits/20b_type_traits_and_concepts.cpp) |
| **[21](file:///c:/Users/kkhoie/Downloads/cprog1/21_views_and_zero_copy/21_views_and_zero_copy.md)** | **Non-Owning Memory Views** | `std::span`, `std::string_view`, Zero-copy slicing, Avoiding dangling view references | [`21_memory_views.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/21_views_and_zero_copy/21_memory_views.cpp) |
| **[22](file:///c:/Users/kkhoie/Downloads/cprog1/22_pmr_and_custom_allocators/22_pmr_and_allocators.md)** | **Polymorphic Allocators (PMR)** | `std::pmr::monotonic_buffer_resource`, Stack-backed vector allocation, Zero-heap containers | [`22_pmr_arena.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/22_pmr_and_custom_allocators/22_pmr_arena.cpp) |
| **[23](file:///c:/Users/kkhoie/Downloads/cprog1/23_cache_alignment_and_false_sharing/23_false_sharing.md)** | **False Sharing & Cache Alignment** | `alignas(64)`, Hardware cache line interference across multi-core threads, Cache padding | [`23_false_sharing_benchmark.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/23_cache_alignment_and_false_sharing/23_false_sharing_benchmark.cpp) |
| **[24](file:///c:/Users/kkhoie/Downloads/cprog1/24_lock_free_spsc_ring_buffer/24_spsc_queue.md)** | **Capstone: Lock-Free SPSC Ring Buffer** | Single-Producer Single-Consumer queue, Atomic acquire/release memory orders, Zero-lock throughput | [`24_spsc_ring_buffer.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/24_lock_free_spsc_ring_buffer/24_spsc_ring_buffer.cpp) |
| **[24b](file:///c:/Users/kkhoie/Downloads/cprog1/24b_lock_free_patterns_and_aba_problem/24b_lock_free_patterns_and_aba_problem.md)** | **Lock-Free Patterns & ABA Problem** | Multi-threaded CAS loops, ABA race condition, Tagged pointers, Hazard pointers, Epoch reclamation | [`24b_lock_free_stack_aba.cpp`](file:///c:/Users/kkhoie/Downloads/cprog1/24b_lock_free_patterns_and_aba_problem/24b_lock_free_stack_aba.cpp) |

---

### Part 4: High-Level to Low-Level Deconstruction (Working Backwards) (¬‿¬)

| Module | Topic | High-Level Feature -> Low-Level Foundation | Code Example |
| :--- | :--- | :--- | :--- |
| **[25](file:///c:/Users/kkhoie/Downloads/cprog1/25_garbage_collection_internals/25_garbage_collection.md)** | **Garbage Collection Under the Hood** | Python/Java/JS auto memory -> Mark-and-Sweep, stack roots, pointer graph traversal | [`25_mark_and_sweep_gc.c`](file:///c:/Users/kkhoie/Downloads/cprog1/25_garbage_collection_internals/25_mark_and_sweep_gc.c) |
| **[26](file:///c:/Users/kkhoie/Downloads/cprog1/26_dynamic_typing_and_boxed_objects/26_dynamic_typing.md)** | **Dynamic Typing & `PyObject`** | Python `x = 42; x = "str"` -> C Tagged unions, Boxing, NaN-tagging, Type dispatch | [`26_boxed_types_and_tagging.c`](file:///c:/Users/kkhoie/Downloads/cprog1/26_dynamic_typing_and_boxed_objects/26_boxed_types_and_tagging.c) |
| **[26b](file:///c:/Users/kkhoie/Downloads/cprog1/26b_dynamic_typing_and_boxed_objects/26b_nan_boxing_deep_dive.md)** | **NaN-Boxing Engine Deep Dive** | IEEE 754 Quiet NaN bitmasking, 48-bit pointer packing, 8-byte universal dynamic values | [`26b_nan_boxing_engine.c`](file:///c:/Users/kkhoie/Downloads/cprog1/26b_dynamic_typing_and_boxed_objects/26b_nan_boxing_engine.c) |
| **[27](file:///c:/Users/kkhoie/Downloads/cprog1/27_async_event_loop_and_coroutines/27_async_event_loop.md)** | **Async/Await & Event Loops** | JS Promises / Python `async def` -> Non-blocking I/O, Callbacks, Coroutine state machines | [`27_micro_event_loop.c`](file:///c:/Users/kkhoie/Downloads/cprog1/27_async_event_loop_and_coroutines/27_micro_event_loop.c) |
| **[27b](file:///c:/Users/kkhoie/Downloads/cprog1/27b_async_event_loop_and_coroutines/27b_io_multiplexing_epoll_kqueue.md)** | **I/O Multiplexing & `epoll`** | C10K problem, `select`/`poll` vs `epoll`/`kqueue`, non-blocking descriptors, Reactor pattern | [`27b_epoll_reactor_pattern.c`](file:///c:/Users/kkhoie/Downloads/cprog1/27b_async_event_loop_and_coroutines/27b_epoll_reactor_pattern.c) |
| **[27c](file:///c:/Users/kkhoie/Downloads/cprog1/27c_async_event_loop_and_coroutines/27c_fibers_and_stackful_coroutines.md)** | **Fibers & Stackful Coroutines** | Stackless vs Stackful coroutines, Go goroutines, register swapping (`RSP`/`RBP`/`RIP`), `setjmp` | [`27c_cooperative_fiber_scheduler.c`](file:///c:/Users/kkhoie/Downloads/cprog1/27c_async_event_loop_and_coroutines/27c_cooperative_fiber_scheduler.c) |
| **[28](file:///c:/Users/kkhoie/Downloads/cprog1/28_hashmaps_and_dynamic_collections/28_hashmaps_internals.md)** | **Hash Maps & Dictionaries** | Python `dict` / JS `Map` -> Hash math, Open Addressing, Cache line spatial locality | [`28_open_addressing_hashmap.c`](file:///c:/Users/kkhoie/Downloads/cprog1/28_hashmaps_and_dynamic_collections/28_open_addressing_hashmap.c) |
| **[29](file:///c:/Users/kkhoie/Downloads/cprog1/29_database_indexes_and_btrees/29_database_indexes.md)** | **Databases & B-Tree Indexes** | SQL `SELECT WHERE id = 10` -> 4KB disk page nodes, binary search on disk, Page cache | [`29_page_btree_indexer.c`](file:///c:/Users/kkhoie/Downloads/cprog1/29_database_indexes_and_btrees/29_page_btree_indexer.c) |
| **[29b](file:///c:/Users/kkhoie/Downloads/cprog1/29b_database_indexes_and_btrees/29b_wal_and_buffer_pool_manager.md)** | **Write-Ahead Logging (WAL) & Buffer Pool** | Buffer frame pinning, dirty page flushing, WAL append protocol, ACID durability | [`29b_wal_buffer_pool.c`](file:///c:/Users/kkhoie/Downloads/cprog1/29b_database_indexes_and_btrees/29b_wal_buffer_pool.c) |
| **[30](file:///c:/Users/kkhoie/Downloads/cprog1/30_http_and_socket_networking/30_http_and_networking.md)** | **Web Frameworks & HTTP Parsers** | Express/FastAPI `@app.get` -> TCP socket file descriptors, zero-copy buffer slicing | [`30_raw_http_parser.c`](file:///c:/Users/kkhoie/Downloads/cprog1/30_http_and_socket_networking/30_raw_http_parser.c) |
| **[30b](file:///c:/Users/kkhoie/Downloads/cprog1/30_http_and_socket_networking/30b_tcp_internals_and_socket_lifecycle.md)** | **TCP Internals & Message Framing** | 3-way handshake, `TIME_WAIT`, `SO_REUSEADDR`, stream packet fragmentation, length-prefix framing | [`30b_tcp_framing_protocol.c`](file:///c:/Users/kkhoie/Downloads/cprog1/30_http_and_socket_networking/30b_tcp_framing_protocol.c) |
| **[31](file:///c:/Users/kkhoie/Downloads/cprog1/31_jit_compiler_and_dynamic_codegen/31_jit_compilers.md)** | **JIT Compilers (V8 / JVM)** | JavaScript / Java near-native speed -> `mmap(PROT_EXEC)` generating raw CPU machine bytes | [`31_mini_jit_compiler.c`](file:///c:/Users/kkhoie/Downloads/cprog1/31_jit_compiler_and_dynamic_codegen/31_mini_jit_compiler.c) |
| **[31b](file:///c:/Users/kkhoie/Downloads/cprog1/31_jit_compiler_and_dynamic_codegen/31b_jit_trampolines_and_instruction_cache.md)** | **$W \oplus X$ Security & I-Cache Flushing** | $W \oplus X$ policy, DEP/NX bit, `__builtin___clear_cache`, D-Cache/I-Cache coherence, Trampolines | [`31b_jit_trampolines.c`](file:///c:/Users/kkhoie/Downloads/cprog1/31_jit_compiler_and_dynamic_codegen/31b_jit_trampolines.c) |
| **[32](file:///c:/Users/kkhoie/Downloads/cprog1/32_grand_unified_software_architecture/32_full_stack_deconstruction.md)** | **Grand Unified Software Stack** | Running `python app.py` -> Complete journey from OS Loader, ELF, libc, VM to Silicon | [`32_system_trace_analyzer.c`](file:///c:/Users/kkhoie/Downloads/cprog1/32_grand_unified_software_architecture/32_system_trace_analyzer.c) |

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
