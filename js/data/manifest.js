/**
 * Unified Curriculum and Project Manifest
 * Indexes all modules across C/Systems Programming, Rust & Go Servers, and 3D Motion Lab.
 */

export const SYSTEMS_CURRICULUM = [
  // Part 1: C Foundations & Core Memory Mechanics
  {
    part: 1,
    partTitle: 'Part 1: C Foundations & Core Memory Mechanics',
    partDesc: 'Compilation pipelines, ELF symbol resolution, raw pointers, memory layout, stack vs heap, and bitwise registers.',
    badge: 'C Foundations',
    modules: [
      {
        id: '01_compilation_and_memory',
        num: '01',
        title: 'Compilation & Data Types',
        desc: 'Preprocessor, Compiler, Assembler, Linker, Two\'s Complement, Wraparound, and Integer Promotions.',
        mdPath: 'cprog1/01_compilation_and_memory/01_compilation_pipeline_and_data_types.md',
        codeFiles: [
          { name: '01_types_and_bits.c', path: 'cprog1/01_compilation_and_memory/01_types_and_bits.c', lang: 'c' }
        ],
        tags: ['Compilation', 'Bits', 'Types', 'Preprocessor']
      },
      {
        id: '01b_linker_symbols_and_elf',
        num: '01b',
        title: 'Linker Internals & ELF Format',
        desc: 'Symbol resolution, Weak vs Strong symbols, .text/.data/.bss sections, Dynamic linking PLT/GOT.',
        mdPath: 'cprog1/01_compilation_and_memory/01b_linker_symbols_and_elf.md',
        codeFiles: [
          { name: '01b_symbol_resolution.c', path: 'cprog1/01_compilation_and_memory/01b_symbol_resolution.c', lang: 'c' }
        ],
        tags: ['Linker', 'ELF', 'Symbols', 'Dynamic Linking']
      },
      {
        id: '02_memory_and_pointers',
        num: '02',
        title: 'Pointers & The Stack',
        desc: 'Virtual address space, & and * operators, Stack frames, Calling conventions, void* generic pointers.',
        mdPath: 'cprog1/02_memory_and_pointers/02_pointers_and_stack_memory.md',
        codeFiles: [
          { name: '02_pointer_basics.c', path: 'cprog1/02_memory_and_pointers/02_pointer_basics.c', lang: 'c' },
          { name: '02_stack_inspection.c', path: 'cprog1/02_memory_and_pointers/02_stack_inspection.c', lang: 'c' }
        ],
        tags: ['Pointers', 'Stack', 'Frames', 'Memory']
      },
      {
        id: '03_arrays_and_strings',
        num: '03',
        title: 'Arrays & Strings',
        desc: 'Pointer arithmetic, Array decay, String literals, Stack vs Read-Only memory, Buffer overflows.',
        mdPath: 'cprog1/03_arrays_and_strings/03_arrays_strings_and_pointer_arithmetic.md',
        codeFiles: [
          { name: '03_arrays_and_strings.c', path: 'cprog1/03_arrays_and_strings/03_arrays_and_strings.c', lang: 'c' }
        ],
        tags: ['Arrays', 'Strings', 'Pointer Arithmetic', 'Security']
      },
      {
        id: '04_structs_and_memory_layout',
        num: '04',
        title: 'Structs, Alignment & Unions',
        desc: 'Hardware word alignment, Structure padding, offsetof macro, Unions, Type punning, Bitfields.',
        mdPath: 'cprog1/04_structs_and_memory_layout/04_struct_padding_alignment_and_unions.md',
        codeFiles: [
          { name: '04_struct_alignment.c', path: 'cprog1/04_structs_and_memory_layout/04_struct_alignment.c', lang: 'c' },
          { name: '04_unions_and_bitfields.c', path: 'cprog1/04_structs_and_memory_layout/04_unions_and_bitfields.c', lang: 'c' }
        ],
        tags: ['Structs', 'Alignment', 'Padding', 'Unions', 'Bitfields']
      },
      {
        id: '05_dynamic_memory',
        num: '05',
        title: 'Dynamic Memory & Allocators',
        desc: 'Heap memory internals, malloc/calloc/realloc/free, Leaks, Use-after-free, Building an Arena Allocator.',
        mdPath: 'cprog1/05_dynamic_memory/05_dynamic_allocation_and_custom_allocators.md',
        codeFiles: [
          { name: '05_heap_memory.c', path: 'cprog1/05_dynamic_memory/05_heap_memory.c', lang: 'c' },
          { name: '05_simple_arena.c', path: 'cprog1/05_dynamic_memory/05_simple_arena.c', lang: 'c' },
          { name: '05_memory_simulation_compare.c', path: 'cprog1/05_dynamic_memory/05_memory_simulation_compare.c', lang: 'c' }
        ],
        tags: ['Heap', 'malloc', 'Arena Allocator', 'Memory Safety']
      },
      {
        id: '06_bitwise_and_registers',
        num: '06',
        title: 'Bitwise & Hardware Registers',
        desc: 'Bitwise operators, Bitmasks, Endianness (Little vs Big), Emulating MMIO hardware registers.',
        mdPath: 'cprog1/06_bitwise_and_registers/06_bitwise_operations_and_hardware_registers.md',
        codeFiles: [
          { name: '06_bitwise_manipulation.c', path: 'cprog1/06_bitwise_and_registers/06_bitwise_manipulation.c', lang: 'c' },
          { name: '06_endianness_and_registers.c', path: 'cprog1/06_bitwise_and_registers/06_endianness_and_registers.c', lang: 'c' }
        ],
        tags: ['Bitwise', 'Registers', 'Endianness', 'MMIO']
      },
      {
        id: '07_function_pointers_and_vtables',
        num: '07',
        title: 'Function Pointers & Polymorphism',
        desc: 'Code segment pointers, Callbacks, Jump tables, Implementing Virtual Tables (vtables) in C.',
        mdPath: 'cprog1/07_function_pointers_and_vtables/07_function_pointers_and_polymorphism.md',
        codeFiles: [
          { name: '07_function_pointers_and_vtables.c', path: 'cprog1/07_function_pointers_and_vtables/07_function_pointers_and_vtables.c', lang: 'c' }
        ],
        tags: ['Function Pointers', 'Vtables', 'Polymorphism', 'Callbacks']
      },
      {
        id: '08_binary_io_and_serialization',
        num: '08',
        title: 'Binary I/O & File Formats',
        desc: 'Raw byte streams, fread/fwrite, File headers, Magic numbers, Struct serialization and deserialization.',
        mdPath: 'cprog1/08_binary_io_and_serialization/08_binary_io_and_file_formats.md',
        codeFiles: [
          { name: '08_binary_file_records.c', path: 'cprog1/08_binary_io_and_serialization/08_binary_file_records.c', lang: 'c' }
        ],
        tags: ['Binary I/O', 'Serialization', 'File Formats', 'Streams']
      }
    ]
  },

  // Part 2: Advanced Systems Programming
  {
    part: 2,
    partTitle: 'Part 2: Advanced Systems Programming',
    partDesc: 'Hardware memory models, SIMD vectorization, atomics, custom allocators, virtual memory, assembly, and bytecode VMs.',
    badge: 'Advanced Systems',
    modules: [
      {
        id: '09_concurrency_and_atomics',
        num: '09',
        title: 'Concurrency & Atomics',
        desc: 'Memory models, Race conditions, Atomic operations (stdatomic.h), Spinlocks, Lock-free sync.',
        mdPath: 'cprog1/09_concurrency_and_atomics/09_concurrency_and_atomics.md',
        codeFiles: [
          { name: '09_atomics_and_spinlocks.c', path: 'cprog1/09_concurrency_and_atomics/09_atomics_and_spinlocks.c', lang: 'c' }
        ],
        tags: ['Concurrency', 'Atomics', 'Spinlocks', 'Threads']
      },
      {
        id: '09b_hardware_memory_models_and_barriers',
        num: '09b',
        title: 'Hardware Memory Models & Barriers',
        desc: 'Store buffers, MESI cache coherence, Out-of-order execution, Acquire/Release semantics, Memory fences.',
        mdPath: 'cprog1/09b_hardware_memory_models_and_barriers/09b_hardware_memory_models.md',
        codeFiles: [
          { name: '09b_memory_barriers_demo.c', path: 'cprog1/09b_hardware_memory_models_and_barriers/09b_memory_barriers_demo.c', lang: 'c' }
        ],
        tags: ['Memory Barriers', 'MESI', 'Cache Coherence', 'Hardware']
      },
      {
        id: '10_cache_and_simd',
        num: '10',
        title: 'CPU Cache & Hardware Locality',
        desc: 'L1/L2/L3 cache lines (64B), Spatial vs Temporal locality, Cache-friendly algorithms, Matrix transposition.',
        mdPath: 'cprog1/10_cache_and_simd/10_cache_locality_and_simd.md',
        codeFiles: [
          { name: '10_cache_locality_benchmark.c', path: 'cprog1/10_cache_and_simd/10_cache_locality_benchmark.c', lang: 'c' }
        ],
        tags: ['CPU Cache', 'Locality', 'L1/L2/L3', 'Performance']
      },
      {
        id: '10b_simd_vector_intrinsics',
        num: '10b',
        title: 'SIMD Vector Intrinsics (AVX2)',
        desc: '256-bit YMM registers, Parallel float operations, _mm256_add_ps, 32-byte memory alignment, Vector speedup.',
        mdPath: 'cprog1/10b_simd_vector_intrinsics/10b_simd_vector_intrinsics.md',
        codeFiles: [
          { name: '10b_avx2_vectorization.c', path: 'cprog1/10b_simd_vector_intrinsics/10b_avx2_vectorization.c', lang: 'c' }
        ],
        tags: ['SIMD', 'AVX2', 'Intrinsics', 'Vectorization']
      },
      {
        id: '11_syscalls_and_signals',
        num: '11',
        title: 'OS System Calls & Signals',
        desc: 'User space vs Kernel space transitions, File descriptors, Asynchronous signal handling, Reentrancy.',
        mdPath: 'cprog1/11_syscalls_and_signals/11_syscalls_and_signals.md',
        codeFiles: [
          { name: '11_signals_and_syscalls.c', path: 'cprog1/11_syscalls_and_signals/11_signals_and_syscalls.c', lang: 'c' }
        ],
        tags: ['Syscalls', 'Kernel', 'Signals', 'POSIX']
      },
      {
        id: '12_advanced_memory_allocators',
        num: '12',
        title: 'Pool & Free-List Allocators',
        desc: 'Fixed-size memory pools, Embedded singly-linked free lists, O(1) allocation/deallocation, Zero fragmentation.',
        mdPath: 'cprog1/12_advanced_memory_allocators/12_advanced_allocators.md',
        codeFiles: [
          { name: '12_pool_allocator.c', path: 'cprog1/12_advanced_memory_allocators/12_pool_allocator.c', lang: 'c' }
        ],
        tags: ['Pool Allocator', 'Free List', 'Memory Optimization', 'O(1)']
      },
      {
        id: '13_virtual_memory_and_mmap',
        num: '13',
        title: 'Virtual Memory & Zero-Copy I/O',
        desc: 'Page tables, 4KB memory pages, Page faults, Memory-mapped files (mmap), Zero-copy file processing.',
        mdPath: 'cprog1/13_virtual_memory_and_mmap/13_virtual_memory_and_mmap.md',
        codeFiles: [
          { name: '13_virtual_memory_pages.c', path: 'cprog1/13_virtual_memory_and_mmap/13_virtual_memory_pages.c', lang: 'c' }
        ],
        tags: ['Virtual Memory', 'mmap', 'Zero-Copy', 'Page Faults']
      },
      {
        id: '13b_page_tables_and_tlb_mechanics',
        num: '13b',
        title: 'Page Tables, TLB & Copy-on-Write',
        desc: '4-level paging (PML4/PDPT/PD/PT), CR3 register, Translation Lookaside Buffer, Copy-on-Write (fork).',
        mdPath: 'cprog1/13b_page_tables_and_tlb_mechanics/13b_page_tables_and_tlb.md',
        codeFiles: [
          { name: '13b_tlb_and_cow_demo.c', path: 'cprog1/13b_page_tables_and_tlb_mechanics/13b_tlb_and_cow_demo.c', lang: 'c' }
        ],
        tags: ['Page Tables', 'TLB', 'Copy-on-Write', 'Paging']
      },
      {
        id: '14_advanced_preprocessor_metaprogramming',
        num: '14',
        title: 'Preprocessor Metaprogramming',
        desc: 'Stringification (#), Token pasting (##), Variadic macros, X-Macros for automatic boilerplate code generation.',
        mdPath: 'cprog1/14_advanced_preprocessor_metaprogramming/14_macros_and_metaprogramming.md',
        codeFiles: [
          { name: '14_xmacros_and_codegen.c', path: 'cprog1/14_advanced_preprocessor_metaprogramming/14_xmacros_and_codegen.c', lang: 'c' }
        ],
        tags: ['X-Macros', 'Metaprogramming', 'Preprocessor', 'Codegen']
      },
      {
        id: '15_inline_assembly_and_intrinsics',
        num: '15',
        title: 'Assembly & CPU Intrinsics',
        desc: 'Compiler intrinsics (__builtin_popcount, __builtin_clz), CPU cycle counter (__rdtsc), Volatile barriers.',
        mdPath: 'cprog1/15_inline_assembly_and_intrinsics/15_inline_assembly_and_intrinsics.md',
        codeFiles: [
          { name: '15_intrinsics_and_cycles.c', path: 'cprog1/15_inline_assembly_and_intrinsics/15_intrinsics_and_cycles.c', lang: 'c' }
        ],
        tags: ['Assembly', 'rdtsc', 'Intrinsics', 'CPU Cycles']
      },
      {
        id: '15b_x64_abi_calling_conventions',
        num: '15b',
        title: 'x86-64 ABI & Calling Conventions',
        desc: 'System V vs Microsoft x64 ABI, Register argument passing, 16-byte stack alignment, Red zone, Shadow space.',
        mdPath: 'cprog1/15b_x64_abi_calling_conventions/15b_x64_abi_and_calling_conventions.md',
        codeFiles: [
          { name: '15b_abi_and_stack_frames.c', path: 'cprog1/15b_x64_abi_calling_conventions/15b_abi_and_stack_frames.c', lang: 'c' }
        ],
        tags: ['x86-64', 'ABI', 'Calling Conventions', 'Stack Frames']
      },
      {
        id: '16_bytecode_vm_interpreter',
        num: '16',
        title: 'Building a Bytecode Virtual Machine',
        desc: 'Instruction set architecture (ISA), Fetch-decode-execute loop, Stack-based VM, Opcodes, Bytecode compilation.',
        mdPath: 'cprog1/16_bytecode_vm_interpreter/16_bytecode_vm.md',
        codeFiles: [
          { name: '16_stack_vm.c', path: 'cprog1/16_bytecode_vm_interpreter/16_stack_vm.c', lang: 'c' }
        ],
        tags: ['Bytecode VM', 'Interpreter', 'ISA', 'Opcodes']
      },
      {
        id: '16b_vm_dispatch_techniques',
        num: '16b',
        title: 'High-Speed VM Dispatch Techniques',
        desc: 'Switch dispatch vs Direct Threaded Code (Computed goto &&label), Branch predictor optimization.',
        mdPath: 'cprog1/16b_vm_dispatch_techniques/16b_vm_dispatch_techniques.md',
        codeFiles: [
          { name: '16b_threaded_code_vm.c', path: 'cprog1/16b_vm_dispatch_techniques/16b_threaded_code_vm.c', lang: 'c' }
        ],
        tags: ['Direct Threading', 'Computed Goto', 'VM Optimization', 'Branch Prediction']
      }
    ]
  },

  // Part 3: Modern C++ & Zero-Cost Systems Engineering
  {
    part: 3,
    partTitle: 'Part 3: Modern C++ & Zero-Cost Systems Engineering',
    partDesc: 'RAII lifecycles, smart pointers, move semantics, perfect forwarding, constexpr, PMR, and lock-free data structures.',
    badge: 'Modern C++',
    modules: [
      {
        id: '17_raii_and_resources',
        num: '17',
        title: 'RAII & Resource Management',
        desc: 'Resource Acquisition Is Initialization, Stack unwinding, Custom FD and Mutex RAII guards, Exception safety.',
        mdPath: 'cprog1/17_raii_and_resources/17_raii_and_resources.md',
        codeFiles: [
          { name: '17_raii_demo.cpp', path: 'cprog1/17_raii_and_resources/17_raii_demo.cpp', lang: 'cpp' }
        ],
        tags: ['RAII', 'Resource Management', 'Exception Safety', 'C++']
      },
      {
        id: '17b_cpp_object_model_and_lifecycles',
        num: '17b',
        title: 'C++ Object Model & Rule of 5',
        desc: 'Classes vs Structs memory layout, Constructors/Destructors, Rule of 5, Deep vs Move copies.',
        mdPath: 'cprog1/17b_cpp_object_model_and_lifecycles/17b_cpp_object_model_and_lifecycles.md',
        codeFiles: [
          { name: '17b_lifecycles_and_rule_of_five.cpp', path: 'cprog1/17b_cpp_object_model_and_lifecycles/17b_cpp_object_model_and_lifecycles.cpp', lang: 'cpp' }
        ],
        tags: ['Rule of 5', 'Object Model', 'Lifecycles', 'C++']
      },
      {
        id: '17c_c_style_vs_google_vs_iso_cpp',
        num: '17c',
        title: 'C-Style C++ vs Google vs ISO \'26',
        desc: 'CPL lineage & "C with Classes" vs Google Style (-fno-exceptions, StatusOr) vs Modern ISO C++26 (Contracts, Expected, Rule of Zero).',
        mdPath: 'cprog1/17c_c_style_vs_google_vs_iso_cpp/17c_c_style_vs_google_vs_iso_cpp.md',
        codeFiles: [
          { name: '17c_paradigms_comparison.cpp', path: 'cprog1/17c_c_style_vs_google_vs_iso_cpp/17c_paradigms_comparison.cpp', lang: 'cpp' }
        ],
        tags: ['C-Style C++', 'Google Style', 'Abseil', 'ISO C++26', 'Contracts', 'Rule of Zero']
      },
      {
        id: '18_smart_pointers_internals',
        num: '18',
        title: 'Smart Pointers Under the Hood',
        desc: 'std::unique_ptr (zero-cost pointer), std::shared_ptr atomic control blocks, std::weak_ptr, building from scratch.',
        mdPath: 'cprog1/18_smart_pointers_internals/18_smart_pointers_internals.md',
        codeFiles: [
          { name: '18_smart_pointers.cpp', path: 'cprog1/18_smart_pointers_internals/18_smart_pointers.cpp', lang: 'cpp' }
        ],
        tags: ['Smart Pointers', 'unique_ptr', 'shared_ptr', 'Control Block']
      },
      {
        id: '19_move_semantics_and_rvalues',
        num: '19',
        title: 'Move Semantics & Rvalues',
        desc: 'Lvalues vs Rvalues (&&), std::move, Move constructors, Stealing heap pointers in O(1) without allocations.',
        mdPath: 'cprog1/19_move_semantics_and_rvalues/19_move_semantics.md',
        codeFiles: [
          { name: '19_move_semantics.cpp', path: 'cprog1/19_move_semantics_and_rvalues/19_move_semantics.cpp', lang: 'cpp' }
        ],
        tags: ['Move Semantics', 'Rvalues', 'std::move', 'Zero Copy']
      },
      {
        id: '19b_perfect_forwarding_and_universal_references',
        num: '19b',
        title: 'Universal References & Forwarding',
        desc: 'Reference collapsing rules, Forwarding references (T&&), std::forward, Emplace-style constructors.',
        mdPath: 'cprog1/19b_perfect_forwarding_and_universal_references/19b_perfect_forwarding_and_universal_references.md',
        codeFiles: [
          { name: '19b_perfect_forwarding.cpp', path: 'cprog1/19b_perfect_forwarding_and_universal_references/19b_perfect_forwarding.cpp', lang: 'cpp' }
        ],
        tags: ['Perfect Forwarding', 'std::forward', 'Universal References', 'Templates']
      },
      {
        id: '20_constexpr_and_compile_time',
        num: '20',
        title: 'Compile-Time Computation',
        desc: 'constexpr, consteval, Generating lookup tables & CRC32 hashes during compilation with zero runtime cost.',
        mdPath: 'cprog1/20_constexpr_and_compile_time/20_constexpr_metaprogramming.md',
        codeFiles: [
          { name: '20_constexpr_demo.cpp', path: 'cprog1/20_constexpr_and_compile_time/20_constexpr_demo.cpp', lang: 'cpp' }
        ],
        tags: ['constexpr', 'consteval', 'Compile Time', 'Lookup Tables']
      },
      {
        id: '20b_template_metaprogramming_and_type_traits',
        num: '20b',
        title: 'Type Traits & C++20 Concepts',
        desc: 'Type traits introspection, if constexpr branch elimination, C++20 Concepts & constraints for expressive APIs.',
        mdPath: 'cprog1/20b_template_metaprogramming_and_type_traits/20b_template_metaprogramming_and_type_traits.md',
        codeFiles: [
          { name: '20b_type_traits_and_concepts.cpp', path: 'cprog1/20b_template_metaprogramming_and_type_traits/20b_type_traits_and_concepts.cpp', lang: 'cpp' }
        ],
        tags: ['Type Traits', 'Concepts', 'C++20', 'Templates']
      },
      {
        id: '21_views_and_zero_copy',
        num: '21',
        title: 'Non-Owning Memory Views',
        desc: 'std::span, std::string_view, Zero-copy slicing, Avoiding dangling view references, High-speed parsing.',
        mdPath: 'cprog1/21_views_and_zero_copy/21_views_and_zero_copy.md',
        codeFiles: [
          { name: '21_memory_views.cpp', path: 'cprog1/21_views_and_zero_copy/21_memory_views.cpp', lang: 'cpp' }
        ],
        tags: ['span', 'string_view', 'Zero Copy', 'Views']
      },
      {
        id: '22_pmr_and_custom_allocators',
        num: '22',
        title: 'Custom Arenas & PMR Allocators',
        desc: 'Production arena upgrades (Aligned, Chunked, Thread-Safe), and C++17 std::pmr monotonic buffer resources.',
        mdPath: 'cprog1/22_pmr_and_custom_allocators/22_pmr_and_allocators.md',
        codeFiles: [
          { name: '22_arena_upgrades.cpp', path: 'cprog1/22_pmr_and_custom_allocators/22_arena_upgrades.cpp', lang: 'cpp' },
          { name: '22_pmr_arena.cpp', path: 'cprog1/22_pmr_and_custom_allocators/22_pmr_arena.cpp', lang: 'cpp' }
        ],
        tags: ['PMR', 'Arena Allocator', 'Alignment', 'Thread-Safe', 'Custom Allocators']
      },
      {
        id: '23_cache_alignment_and_false_sharing',
        num: '23',
        title: 'False Sharing & Cache Alignment',
        desc: 'alignas(64), Hardware cache line interference across multi-core threads, Cache padding techniques.',
        mdPath: 'cprog1/23_cache_alignment_and_false_sharing/23_false_sharing.md',
        codeFiles: [
          { name: '23_false_sharing_benchmark.cpp', path: 'cprog1/23_cache_alignment_and_false_sharing/23_false_sharing_benchmark.cpp', lang: 'cpp' }
        ],
        tags: ['False Sharing', 'Cache Alignment', 'alignas', 'Multithreading']
      },
      {
        id: '24_lock_free_spsc_ring_buffer',
        num: '24',
        title: 'Lock-Free SPSC Ring Buffer',
        desc: 'Single-Producer Single-Consumer queue, Atomic acquire/release memory orders, Zero-lock ultra throughput.',
        mdPath: 'cprog1/24_lock_free_spsc_ring_buffer/24_spsc_queue.md',
        codeFiles: [
          { name: '24_spsc_ring_buffer.cpp', path: 'cprog1/24_lock_free_spsc_ring_buffer/24_spsc_ring_buffer.cpp', lang: 'cpp' }
        ],
        tags: ['Lock-Free', 'SPSC', 'Ring Buffer', 'Acquire-Release']
      },
      {
        id: '24b_lock_free_patterns_and_aba_problem',
        num: '24b',
        title: 'Lock-Free Patterns & ABA Problem',
        desc: 'Multi-threaded CAS loops, ABA race conditions, Tagged pointers, Hazard pointers, Epoch-based reclamation.',
        mdPath: 'cprog1/24b_lock_free_patterns_and_aba_problem/24b_lock_free_patterns_and_aba_problem.md',
        codeFiles: [
          { name: '24b_lock_free_stack_aba.cpp', path: 'cprog1/24b_lock_free_patterns_and_aba_problem/24b_lock_free_stack_aba.cpp', lang: 'cpp' }
        ],
        tags: ['ABA Problem', 'CAS', 'Hazard Pointers', 'Lock-Free Stack']
      }
    ]
  },

  // Part 4: High-Level to Low-Level Deconstruction
  {
    part: 4,
    partTitle: 'Part 4: High-Level to Low-Level Deconstruction',
    partDesc: 'Reverse-engineering high-level runtime magic: Garbage collectors, NaN-boxing, event loops, B-Trees, HTTP parsers, and JIT compilers.',
    badge: 'Deconstruction',
    modules: [
      {
        id: '25_garbage_collection_internals',
        num: '25',
        title: 'Garbage Collection Under the Hood',
        desc: 'Python/Java/JS auto memory: Mark-and-Sweep algorithms, Stack roots, Object graph pointer traversal.',
        mdPath: 'cprog1/25_garbage_collection_internals/25_garbage_collection.md',
        codeFiles: [
          { name: '25_mark_and_sweep_gc.c', path: 'cprog1/25_garbage_collection_internals/25_mark_and_sweep_gc.c', lang: 'c' }
        ],
        tags: ['Garbage Collection', 'Mark & Sweep', 'Runtimes', 'Graph Traversal']
      },
      {
        id: '26_dynamic_typing_and_boxed_objects',
        num: '26',
        title: 'Dynamic Typing & PyObject',
        desc: 'Python dynamic variables (x = 42; x = "str"): C Tagged unions, Boxing, Dynamic dispatch.',
        mdPath: 'cprog1/26_dynamic_typing_and_boxed_objects/26_dynamic_typing.md',
        codeFiles: [
          { name: '26_boxed_types_and_tagging.c', path: 'cprog1/26_dynamic_typing_and_boxed_objects/26_boxed_types_and_tagging.c', lang: 'c' }
        ],
        tags: ['Dynamic Typing', 'Boxing', 'PyObject', 'Tagged Unions']
      },
      {
        id: '26b_nan_boxing_engine',
        num: '26b',
        title: 'NaN-Boxing Engine Deep Dive',
        desc: 'IEEE 754 Quiet NaN bitmasking, 48-bit pointer packing, Universal 8-byte dynamic value representations (SpiderMonkey/LuaJIT).',
        mdPath: 'cprog1/26b_dynamic_typing_and_boxed_objects/26b_nan_boxing_deep_dive.md',
        codeFiles: [
          { name: '26b_nan_boxing_engine.c', path: 'cprog1/26b_dynamic_typing_and_boxed_objects/26b_nan_boxing_engine.c', lang: 'c' }
        ],
        tags: ['NaN Boxing', 'IEEE 754', 'LuaJIT', 'V8']
      },
      {
        id: '27_async_event_loop_and_coroutines',
        num: '27',
        title: 'Async/Await & Micro Event Loops',
        desc: 'JS Promises & Python async def: Non-blocking I/O, Task queues, Coroutine state machines in C.',
        mdPath: 'cprog1/27_async_event_loop_and_coroutines/27_async_event_loop.md',
        codeFiles: [
          { name: '27_micro_event_loop.c', path: 'cprog1/27_async_event_loop_and_coroutines/27_micro_event_loop.c', lang: 'c' }
        ],
        tags: ['Event Loop', 'Async/Await', 'Coroutines', 'Non-blocking']
      },
      {
        id: '27b_io_multiplexing_epoll_kqueue',
        num: '27b',
        title: 'I/O Multiplexing & epoll',
        desc: 'The C10K problem, select/poll vs epoll/kqueue, Non-blocking descriptors, Reactor architecture pattern.',
        mdPath: 'cprog1/27b_async_event_loop_and_coroutines/27b_io_multiplexing_epoll_kqueue.md',
        codeFiles: [
          { name: '27b_epoll_reactor_pattern.c', path: 'cprog1/27b_async_event_loop_and_coroutines/27b_io_multiplexing_epoll_kqueue.md', lang: 'c' }
        ],
        tags: ['epoll', 'I/O Multiplexing', 'C10K', 'Reactor Pattern']
      },
      {
        id: '27c_fibers_and_stackful_coroutines',
        num: '27c',
        title: 'Fibers & Stackful Coroutines',
        desc: 'Stackless vs Stackful coroutines, Go goroutine internals, Register swapping (RSP/RBP/RIP), Cooperative scheduler.',
        mdPath: 'cprog1/27c_async_event_loop_and_coroutines/27c_fibers_and_stackful_coroutines.md',
        codeFiles: [
          { name: '27c_cooperative_fiber_scheduler.c', path: 'cprog1/27c_async_event_loop_and_coroutines/27c_cooperative_fiber_scheduler.c', lang: 'c' }
        ],
        tags: ['Fibers', 'Goroutines', 'Context Switch', 'Schedulers']
      },
      {
        id: '28_hashmaps_and_dynamic_collections',
        num: '28',
        title: 'Hash Maps & Dictionaries',
        desc: 'Python dict / JS Map: Hash functions, Open addressing with linear probing, Cache line spatial locality.',
        mdPath: 'cprog1/28_hashmaps_and_dynamic_collections/28_hashmaps_internals.md',
        codeFiles: [
          { name: '28_open_addressing_hashmap.c', path: 'cprog1/28_hashmaps_and_dynamic_collections/28_open_addressing_hashmap.c', lang: 'c' }
        ],
        tags: ['Hash Maps', 'Open Addressing', 'Dictionaries', 'Data Structures']
      },
      {
        id: '29_database_indexes_and_btrees',
        num: '29',
        title: 'Databases & B-Tree Indexes',
        desc: 'SQL indexing: 4KB disk page nodes, Binary search on disk, Page cache buffer manager.',
        mdPath: 'cprog1/29_database_indexes_and_btrees/29_database_indexes.md',
        codeFiles: [
          { name: '29_page_btree_indexer.c', path: 'cprog1/29_database_indexes_and_btrees/29_page_btree_indexer.c', lang: 'c' }
        ],
        tags: ['B-Tree', 'Databases', 'Disk Pages', 'Indexing']
      },
      {
        id: '29b_wal_and_buffer_pool_manager',
        num: '29b',
        title: 'Write-Ahead Logging (WAL) & Buffer Pool',
        desc: 'Buffer frame pinning, Dirty page flushing, WAL append protocol, ACID durability guarantees.',
        mdPath: 'cprog1/29b_database_indexes_and_btrees/29b_wal_and_buffer_pool_manager.md',
        codeFiles: [
          { name: '29b_wal_buffer_pool.c', path: 'cprog1/29b_database_indexes_and_btrees/29b_wal_buffer_pool.c', lang: 'c' }
        ],
        tags: ['WAL', 'ACID', 'Buffer Pool', 'Durability']
      },
      {
        id: '30_http_and_socket_networking',
        num: '30',
        title: 'Web Frameworks & HTTP Parsers',
        desc: 'Express/FastAPI routing: Raw TCP socket file descriptors, Zero-copy buffer slicing, HTTP/1.1 streaming parser.',
        mdPath: 'cprog1/30_http_and_socket_networking/30_http_and_networking.md',
        codeFiles: [
          { name: '30_raw_http_parser.c', path: 'cprog1/30_http_and_socket_networking/30_raw_http_parser.c', lang: 'c' }
        ],
        tags: ['HTTP Parser', 'Sockets', 'Networking', 'Web Frameworks']
      },
      {
        id: '30b_tcp_internals_and_socket_lifecycle',
        num: '30b',
        title: 'TCP Internals & Message Framing',
        desc: '3-way handshake, TIME_WAIT state, SO_REUSEADDR, Stream packet fragmentation, Length-prefix framing.',
        mdPath: 'cprog1/30_http_and_socket_networking/30b_tcp_internals_and_socket_lifecycle.md',
        codeFiles: [
          { name: '30b_tcp_framing_protocol.c', path: 'cprog1/30_http_and_socket_networking/30b_tcp_framing_protocol.c', lang: 'c' }
        ],
        tags: ['TCP', 'Framing', 'Handshake', 'Sockets']
      },
      {
        id: '31_jit_compiler_and_dynamic_codegen',
        num: '31',
        title: 'JIT Compilers (V8 / JVM)',
        desc: 'JavaScript & Java near-native speed: mmap(PROT_EXEC) generating raw x86-64 machine instructions at runtime.',
        mdPath: 'cprog1/31_jit_compiler_and_dynamic_codegen/31_jit_compilers.md',
        codeFiles: [
          { name: '31_mini_jit_compiler.c', path: 'cprog1/31_jit_compiler_and_dynamic_codegen/31_mini_jit_compiler.c', lang: 'c' }
        ],
        tags: ['JIT Compiler', 'Codegen', 'mmap', 'x86 Machine Code']
      },
      {
        id: '31b_jit_trampolines_and_instruction_cache',
        num: '31b',
        title: 'W⊕X Security & I-Cache Flushing',
        desc: 'W^X security policy, DEP/NX bit, __builtin___clear_cache, D-Cache/I-Cache coherence, JIT Trampolines.',
        mdPath: 'cprog1/31_jit_compiler_and_dynamic_codegen/31b_jit_trampolines_and_instruction_cache.md',
        codeFiles: [
          { name: '31b_jit_trampolines.c', path: 'cprog1/31_jit_compiler_and_dynamic_codegen/31b_jit_trampolines.c', lang: 'c' }
        ],
        tags: ['W^X Security', 'I-Cache', 'Trampolines', 'DEP/NX']
      },
      {
        id: '32_grand_unified_software_architecture',
        num: '32',
        title: 'Grand Unified Software Stack',
        desc: 'Running a program: The complete trace from OS Loader, ELF parsing, libc initialization, runtime to silicon.',
        mdPath: 'cprog1/32_grand_unified_software_architecture/32_full_stack_deconstruction.md',
        codeFiles: [
          { name: '32_system_trace_analyzer.c', path: 'cprog1/32_grand_unified_software_architecture/32_system_trace_analyzer.c', lang: 'c' }
        ],
        tags: ['Architecture', 'Full Stack', 'ELF Loader', 'Silicon']
      }
    ]
  }
];

export const SERVER_STAGES = [
  {
    id: '01_hello_world',
    step: '01',
    title: 'The Basics: Raw TCP & HTTP',
    summary: 'Binding raw TCP sockets and manually parsing HTTP GET requests without any framework.',
    rust: {
      title: 'Rust: std::net::TcpListener',
      desc: 'Single-threaded server using std::net::TcpListener and manual stream reading/writing.',
      mdPath: 'rustserver/01_hello_world/README.md',
      files: [
        { name: 'main.rs', path: 'rustserver/01_hello_world/src/main.rs', lang: 'rust' },
        { name: 'Cargo.toml', path: 'rustserver/01_hello_world/Cargo.toml', lang: 'toml' }
      ],
      keyConcepts: ['std::net::TcpListener', 'std::io::{Read, Write}', 'Manual HTTP/1.1 Framing']
    },
    go: {
      title: 'Go: net/http Standard Server',
      desc: 'Concurrent HTTP server built using Go\'s production-ready net/http standard library package.',
      mdPath: 'rustserver/golang/01_hello_world/README.md',
      files: [
        { name: 'main.go', path: 'rustserver/golang/01_hello_world/main.go', lang: 'go' },
        { name: 'go.mod', path: 'rustserver/golang/01_hello_world/go.mod', lang: 'toml' }
      ],
      keyConcepts: ['net/http', 'http.HandlerFunc', 'DefaultServeMux']
    }
  },
  {
    id: '02_multithreaded_server',
    step: '02',
    title: 'Concurrency: ThreadPool vs Goroutines',
    summary: 'Scaling concurrent connections safely: Rust Worker ThreadPool with channels vs Go lightweight Goroutines.',
    rust: {
      title: 'Rust: Fearless Concurrency ThreadPool',
      desc: 'Building a custom thread pool dispatcher using Arc<Mutex<Receiver>>, worker threads, and mpsc channels.',
      mdPath: 'rustserver/02_multithreaded_server/README.md',
      files: [
        { name: 'main.rs', path: 'rustserver/02_multithreaded_server/src/main.rs', lang: 'rust' },
        { name: 'lib.rs', path: 'rustserver/02_multithreaded_server/src/lib.rs', lang: 'rust' },
        { name: 'Cargo.toml', path: 'rustserver/02_multithreaded_server/Cargo.toml', lang: 'toml' }
      ],
      keyConcepts: ['std::thread::spawn', 'Arc<Mutex<T>>', 'std::sync::mpsc', 'ThreadPool Dispatch']
    },
    go: {
      title: 'Go: Goroutines & Channels',
      desc: 'Simulating concurrent background workers using Go channels, go func(), and sync.WaitGroup.',
      mdPath: 'rustserver/golang/02_goroutines_channels/README.md',
      files: [
        { name: 'main.go', path: 'rustserver/golang/02_goroutines_channels/main.go', lang: 'go' },
        { name: 'go.mod', path: 'rustserver/golang/02_goroutines_channels/go.mod', lang: 'toml' }
      ],
      keyConcepts: ['go routine', 'chan Message', 'sync.WaitGroup', 'select']
    }
  },
  {
    id: '03_async_basics',
    step: '03',
    title: 'Async & Routing Middleware',
    summary: 'Transitioning to asynchronous runtimes: Tokio async/await in Rust vs Go 1.22+ ServeMux routing & middleware chaining.',
    rust: {
      title: 'Rust: Tokio Async Runtime',
      desc: 'Rebuilding with tokio::net::TcpListener and async/await tasks for non-blocking multiplexed I/O.',
      mdPath: 'rustserver/03_async_basics/README.md',
      files: [
        { name: 'main.rs', path: 'rustserver/03_async_basics/src/main.rs', lang: 'rust' },
        { name: 'Cargo.toml', path: 'rustserver/03_async_basics/Cargo.toml', lang: 'toml' }
      ],
      keyConcepts: ['tokio::main', 'async / await', 'tokio::spawn', 'AsyncReadExt']
    },
    go: {
      title: 'Go: HTTP Routing & Middleware',
      desc: 'Modern Go 1.22+ routing with method/path pattern matching and composable HTTP middleware wrappers.',
      mdPath: 'rustserver/golang/03_routing_middleware/README.md',
      files: [
        { name: 'main.go', path: 'rustserver/golang/03_routing_middleware/main.go', lang: 'go' },
        { name: 'go.mod', path: 'rustserver/golang/03_routing_middleware/go.mod', lang: 'toml' }
      ],
      keyConcepts: ['http.NewServeMux', 'Path Matching ("GET /users/{id}")', 'Middleware Pattern']
    }
  },
  {
    id: '04_axum_routing_state',
    step: '04',
    title: 'Modern Frameworks & JSON APIs',
    summary: 'High-level REST APIs: Axum extractors & Serde serialization vs Go struct tags & json.NewDecoder.',
    rust: {
      title: 'Rust: Axum & Shared State',
      desc: 'Building a modern REST JSON API using Axum, type-safe state extractors, and Serde JSON serialization.',
      mdPath: 'rustserver/04_axum_routing_state/README.md',
      files: [
        { name: 'main.rs', path: 'rustserver/04_axum_routing_state/src/main.rs', lang: 'rust' },
        { name: 'Cargo.toml', path: 'rustserver/04_axum_routing_state/Cargo.toml', lang: 'toml' }
      ],
      keyConcepts: ['axum::Router', 'State<Arc<AppState>>', 'Json<Payload>', 'serde::Serialize']
    },
    go: {
      title: 'Go: JSON REST API',
      desc: 'JSON payload unmarshaling and struct serialization with custom status responses and validation.',
      mdPath: 'rustserver/golang/04_json_api/README.md',
      files: [
        { name: 'main.go', path: 'rustserver/golang/04_json_api/main.go', lang: 'go' },
        { name: 'go.mod', path: 'rustserver/golang/04_json_api/go.mod', lang: 'toml' }
      ],
      keyConcepts: ['encoding/json', 'Struct Tags (`json:"name"`)', 'json.NewEncoder']
    }
  },
  {
    id: '05_database_integration',
    step: '05',
    title: 'Database Persistence (SQLite)',
    summary: 'Async persistence layers: Compile-time SQL verification via SQLx vs Go database/sql connection pool & transactions.',
    rust: {
      title: 'Rust: SQLx & Compile-Time Queries',
      desc: 'Integrating SQLite with SQLx, demonstrating connection pools and compile-time verified SQL queries.',
      mdPath: 'rustserver/05_database_integration/README.md',
      files: [
        { name: 'main.rs', path: 'rustserver/05_database_integration/src/main.rs', lang: 'rust' },
        { name: 'Cargo.toml', path: 'rustserver/05_database_integration/Cargo.toml', lang: 'toml' }
      ],
      keyConcepts: ['sqlx::SqlitePool', 'sqlx::query_as', 'Compile-Time SQL Checks', 'Migrations']
    },
    go: {
      title: 'Go: database/sql Persistence',
      desc: 'Standard library database/sql with SQLite driver, prepared statements, and CRUD operations.',
      mdPath: 'rustserver/golang/05_database_integration/README.md',
      files: [
        { name: 'main.go', path: 'rustserver/golang/05_database_integration/main.go', lang: 'go' },
        { name: 'go.mod', path: 'rustserver/golang/05_database_integration/go.mod', lang: 'toml' }
      ],
      keyConcepts: ['database/sql', 'sql.DB Connection Pool', 'db.Exec / db.QueryRow']
    }
  },
  {
    id: '06_modern_deployment',
    step: '06',
    title: 'Production Ready: Telemetry & Signals',
    summary: 'Enterprise readiness: Structured tracing & graceful OS shutdown handlers in Rust and Go.',
    rust: {
      title: 'Rust: Tracing & Graceful Shutdown',
      desc: 'Structured observability via tracing-subscriber and OS SIGINT/SIGTERM signal interception for zero-downtime shutdown.',
      mdPath: 'rustserver/06_modern_deployment/README.md',
      files: [
        { name: 'main.rs', path: 'rustserver/06_modern_deployment/src/main.rs', lang: 'rust' },
        { name: 'Cargo.toml', path: 'rustserver/06_modern_deployment/Cargo.toml', lang: 'toml' }
      ],
      keyConcepts: ['tracing / tracing-subscriber', 'tokio::signal::ctrl_c', 'Graceful Shutdown Handlers']
    },
    go: {
      title: 'Go: slog & Context Cancellation',
      desc: 'Structured JSON logging with log/slog and signal handling via signal.NotifyContext to gracefully terminate HTTP servers.',
      mdPath: 'rustserver/golang/06_modern_deployment/README.md',
      files: [
        { name: 'main.go', path: 'rustserver/golang/06_modern_deployment/main.go', lang: 'go' },
        { name: 'go.mod', path: 'rustserver/golang/06_modern_deployment/go.mod', lang: 'toml' }
      ],
      keyConcepts: ['log/slog', 'signal.NotifyContext', 'srv.Shutdown(ctx)']
    }
  }
];

export const MOTION_LAB_EXAMPLES = [
  {
    id: 'three-geometries',
    num: '01',
    title: 'Procedural Geometries & Vertex Morphing',
    category: 'Three.js Fundamentals',
    badge: 'Three.js',
    badgeClass: 'badge-three',
    difficulty: 'Beginner',
    desc: 'Real-time Float32Array vertex buffer displacement, sine wave ripples, and normal recalculation.',
    file: 'qutest2/js/examples/01-three-geometries.js'
  },
  {
    id: 'three-lighting-pbr',
    num: '02',
    title: 'Studio Lighting, Shadows & PBR Materials',
    category: 'Three.js Fundamentals',
    badge: 'Three.js',
    badgeClass: 'badge-three',
    difficulty: 'Intermediate',
    desc: 'Physically Based Rendering (PBR) studio with orbiting PointLights, PCF soft shadows, and metalness/roughness maps.',
    file: 'qutest2/js/examples/02-three-lighting-pbr.js'
  },
  {
    id: 'three-particle-galaxy',
    num: '03',
    title: 'Particle Vortex Galaxy (100k Points)',
    category: 'Three.js Fundamentals',
    badge: 'Three.js',
    badgeClass: 'badge-three',
    difficulty: 'Intermediate',
    desc: 'GPU-optimized BufferGeometry points rendering 100,000+ stars with logarithmic spiral arm dynamics.',
    file: 'qutest2/js/examples/03-three-particle-galaxy.js'
  },
  {
    id: 'anime-kinetic-svg',
    num: '04',
    title: 'Kinetic Typography & SVG Path Drawing',
    category: 'Anime.js Motion Mastery',
    badge: 'Anime.js',
    badgeClass: 'badge-anime',
    difficulty: 'Beginner',
    desc: 'SVG strokeDashoffset line self-drawing and letter-by-letter kinetic elastic typography reveals.',
    file: 'qutest2/js/examples/04-anime-kinetic-svg.js'
  },
  {
    id: 'anime-timelines',
    num: '05',
    title: 'Timeline Choreography & Keyframes',
    category: 'Anime.js Motion Mastery',
    badge: 'Anime.js',
    badgeClass: 'badge-anime',
    difficulty: 'Intermediate',
    desc: 'Complex multi-stage UI animation sequences, scrubber seeking, speed modulation, and keyframe chaining.',
    file: 'qutest2/js/examples/05-anime-timelines.js'
  },
  {
    id: 'anime-stagger-grid',
    num: '06',
    title: 'Elastic Matrix Staggering & Ripple Physics',
    category: 'Anime.js Motion Mastery',
    badge: 'Anime.js',
    badgeClass: 'badge-anime',
    difficulty: 'Intermediate',
    desc: '2D grid stagger physics, click-origin radial ripples, and spring-damped kinetic tile matrices.',
    file: 'qutest2/js/examples/06-anime-stagger-grid.js'
  },
  {
    id: 'combo-camera-director',
    num: '07',
    title: 'Cinematic 3D Camera & Dolly Zoom',
    category: 'Three.js + Anime.js Synergy',
    badge: 'Hybrid',
    badgeClass: 'badge-hybrid',
    difficulty: 'Advanced',
    desc: 'Cinematic camera trajectory choreography between 3D stations and Vertigo dolly zoom FOV manipulation.',
    file: 'qutest2/js/examples/07-combo-camera-director.js'
  },
  {
    id: 'combo-exploding-mesh',
    num: '08',
    title: '3D Mechanical Assembly & Exploding Stagger',
    category: 'Three.js + Anime.js Synergy',
    badge: 'Hybrid',
    badgeClass: 'badge-hybrid',
    difficulty: 'Advanced',
    desc: '125+ modular voxel components exploding outward along normal vectors with staggered physics spring snap.',
    file: 'qutest2/js/examples/08-combo-exploding-mesh.js'
  },
  {
    id: 'combo-hologram-pulse',
    num: '09',
    title: 'Holographic Shader Uniforms & Glitch Pulse',
    category: 'Three.js + Anime.js Synergy',
    badge: 'Hybrid',
    badgeClass: 'badge-hybrid',
    difficulty: 'Advanced',
    desc: 'Custom GLSL ShaderMaterial with Fresnel rim lighting, scanline bands, and Anime.js-driven uniform oscillations.',
    file: 'qutest2/js/examples/09-combo-hologram-pulse.js'
  },
  {
    id: 'combo-3d-cards',
    num: '10',
    title: 'Raycasted 3D Interactive Card Deck',
    category: 'Three.js + Anime.js Synergy',
    badge: 'Hybrid',
    badgeClass: 'badge-hybrid',
    difficulty: 'Advanced',
    desc: 'Pointer raycasting with 3D card tilt physics, hover elevation, and click-to-flip 180° spring flips.',
    file: 'qutest2/js/examples/10-combo-3d-cards.js'
  },
  {
    id: 'combo-kinetic-audio',
    num: '11',
    title: 'Kinetic 3D Soundwave Equalizer & Procedural Beats',
    category: 'Three.js + Anime.js Synergy',
    badge: 'Hybrid',
    badgeClass: 'badge-hybrid',
    difficulty: 'Advanced',
    desc: 'Circular 64-band 3D kinetic equalizer reacting to procedural synthesizer beats with shockwave floor rings.',
    file: 'qutest2/js/examples/11-combo-kinetic-audio.js'
  }
];

export const AI_CURRICULUM = [
  // Part 0: Mathematical Prerequisites
  {
    part: 0,
    partTitle: 'Part 0: Math Prerequisites',
    partDesc: 'Vector spaces, linear transformations, Gaussian elimination, determinants, ODEs, and dynamical systems.',
    badge: 'Prerequisites',
    modules: [
      {
        id: '00a_vector_spaces_and_transforms',
        num: '00a',
        title: 'Vector Spaces & Transforms',
        desc: 'Vector axioms, linear independence, basis, geometric matrices, Gram-Schmidt.',
        mdPath: 'ailab/00a_vector_spaces_and_transforms/00a_vector_spaces_and_transforms.md',
        codeFiles: [
          { name: '00a_vectors_spaces_transforms.py', path: 'ailab/00a_vector_spaces_and_transforms/00a_vectors_spaces_transforms.py', lang: 'python' }
        ],
        tags: ['Linear Algebra', 'Vector Spaces', 'Transformations', 'Basis', 'Gram-Schmidt']
      },
      {
        id: '00b_linear_systems_and_determinants',
        num: '00b',
        title: 'Linear Systems & Inverses',
        desc: 'Ax = b, Gaussian elimination, partial pivoting, rank-nullity, determinants, inverses.',
        mdPath: 'ailab/00b_linear_systems_and_determinants/00b_linear_systems_and_determinants.md',
        codeFiles: [
          { name: '00b_gaussian_elimination_and_inverses.py', path: 'ailab/00b_linear_systems_and_determinants/00b_gaussian_elimination_and_inverses.py', lang: 'python' }
        ],
        tags: ['Linear Systems', 'Gaussian Elimination', 'Determinants', 'Matrix Inversion', 'Rank']
      },
      {
        id: '00c_differential_equations_and_dynamics',
        num: '00c',
        title: 'Differential Equations & Dynamics',
        desc: 'ODEs, Euler vs RK4 numerical solvers, phase space, continuous gradient flow.',
        mdPath: 'ailab/00c_differential_equations_and_dynamics/00c_differential_equations_and_dynamics.md',
        codeFiles: [
          { name: '00c_ode_solvers_and_dynamics.py', path: 'ailab/00c_differential_equations_and_dynamics/00c_ode_solvers_and_dynamics.py', lang: 'python' }
        ],
        tags: ['Differential Equations', 'ODEs', 'Runge-Kutta', 'Dynamical Systems', 'Gradient Flow']
      }
    ]
  },

  // Part 1: Mathematical Foundations
  {
    part: 1,
    partTitle: 'Part 1: Math Foundations',
    partDesc: 'Vector spaces, matrix decompositions, eigenvalues, SVD, computational graphs, and entropy.',
    badge: 'Math',
    modules: [
      {
        id: '01_linear_algebra',
        num: '01',
        title: 'Linear Algebra & Tensors',
        desc: 'Vectors, dot products, SVD low-rank compression, eigenvalues, tensors.',
        mdPath: 'ailab/01_linear_algebra/01_linear_algebra_and_tensors.md',
        codeFiles: [
          { name: '01_vector_matrix_svd.py', path: 'ailab/01_linear_algebra/01_vector_matrix_svd.py', lang: 'python' }
        ],
        tags: ['Linear Algebra', 'Vectors', 'Matrices', 'SVD', 'Tensors']
      },
      {
        id: '02_calculus_and_autodiff',
        num: '02',
        title: 'Calculus & Autodiff',
        desc: 'Gradients, Jacobians, Hessians, and reverse-mode autodiff DAG engine.',
        mdPath: 'ailab/02_calculus_and_autodiff/02_multivariate_calculus_and_autodiff.md',
        codeFiles: [
          { name: '02_scalar_autodiff_engine.py', path: 'ailab/02_calculus_and_autodiff/02_scalar_autodiff_engine.py', lang: 'python' }
        ],
        tags: ['Calculus', 'Gradients', 'Autodiff', 'Backpropagation']
      },
      {
        id: '03_probability_and_information_theory',
        num: '03',
        title: 'Probability & Entropy',
        desc: 'Bayes theorem, Gaussian MLE, Shannon entropy, cross-entropy, KL divergence.',
        mdPath: 'ailab/03_probability_and_information_theory/03_probability_and_information_theory.md',
        codeFiles: [
          { name: '03_mle_and_entropy.py', path: 'ailab/03_probability_and_information_theory/03_mle_and_entropy.py', lang: 'python' }
        ],
        tags: ['Probability', 'Bayes', 'MLE', 'Entropy', 'KL Divergence']
      }
    ]
  },

  // Part 2: Classical Machine Learning & The Perceptron Era
  {
    part: 2,
    partTitle: 'Part 2: Perceptron & ML',
    partDesc: 'The 1958 Rosenblatt perceptron, linear separability, logistic regression, and SVMs.',
    badge: 'Classical ML',
    modules: [
      {
        id: '04_perceptron_and_linear_models',
        num: '04',
        title: 'Rosenblatt Perceptron',
        desc: 'Neuron math, convergence theorem, and the 1969 XOR catastrophe.',
        mdPath: 'ailab/04_perceptron_and_linear_models/04_rosenblatt_perceptron.md',
        codeFiles: [
          { name: '04_perceptron_from_scratch.py', path: 'ailab/04_perceptron_and_linear_models/04_perceptron_from_scratch.py', lang: 'python' }
        ],
        tags: ['Perceptron', 'Linear Separability', 'XOR Problem', 'Rosenblatt']
      },
      {
        id: '05_logistic_regression_and_optimization',
        num: '05',
        title: 'Logistic Regression & Adam',
        desc: 'Sigmoid activation, BCE loss, SGD, Momentum, RMSprop, Adam optimizer.',
        mdPath: 'ailab/05_logistic_regression_and_optimization/05_logistic_regression_and_gradient_descent.md',
        codeFiles: [
          { name: '05_logistic_regression_adam.py', path: 'ailab/05_logistic_regression_and_optimization/05_logistic_regression_adam.py', lang: 'python' }
        ],
        tags: ['Logistic Regression', 'Sigmoid', 'BCE Loss', 'Adam Optimizer']
      },
      {
        id: '06_support_vector_machines',
        num: '06',
        title: 'SVMs & Kernel Methods',
        desc: 'Maximum margin hyperplanes, dual Lagrangian, KKT, and RBF kernel trick.',
        mdPath: 'ailab/06_support_vector_machines/06_svm_and_kernel_methods.md',
        codeFiles: [
          { name: '06_svm_kernel_smo.py', path: 'ailab/06_support_vector_machines/06_svm_kernel_smo.py', lang: 'python' }
        ],
        tags: ['SVM', 'Margin', 'Dual Lagrangian', 'Kernel Trick', 'RBF']
      }
    ]
  },

  // Part 3: Deep Neural Networks & Backpropagation
  {
    part: 3,
    partTitle: 'Part 3: Deep Networks',
    partDesc: 'Multi-layer perceptrons, matrix backpropagation, activations, and normalization.',
    badge: 'Neural Nets',
    modules: [
      {
        id: '07_multi_layer_perceptrons_and_backprop',
        num: '07',
        title: 'MLP & Matrix Backprop',
        desc: 'Universal approximation, ReLU/GELU activations, exact matrix calculus.',
        mdPath: 'ailab/07_multi_layer_perceptrons_and_backprop/07_mlp_and_matrix_backpropagation.md',
        codeFiles: [
          { name: '07_modular_mlp_framework.py', path: 'ailab/07_multi_layer_perceptrons_and_backprop/07_modular_mlp_framework.py', lang: 'python' }
        ],
        tags: ['MLP', 'Backpropagation', 'Matrix Calculus', 'GELU', 'He Init']
      },
      {
        id: '08_regularization_and_normalization',
        num: '08',
        title: 'Norm & Regularization',
        desc: 'L1/L2 weight decay, inverted dropout, LayerNorm, RMSNorm, cosine schedule.',
        mdPath: 'ailab/08_regularization_and_normalization/08_regularization_and_normalization.md',
        codeFiles: [
          { name: '08_layernorm_dropout_schedule.py', path: 'ailab/08_regularization_and_normalization/08_layernorm_dropout_schedule.py', lang: 'python' }
        ],
        tags: ['Dropout', 'LayerNorm', 'RMSNorm', 'Cosine Schedule', 'Weight Decay']
      }
    ]
  },

  // Part 4: Computer Vision & Sequential Deep Learning
  {
    part: 4,
    partTitle: 'Part 4: CNNs & RNNs',
    partDesc: '2D spatial convolutions, ResNet gradient highways, and LSTM recurrent cells.',
    badge: 'CV & Sequences',
    modules: [
      {
        id: '09_convolutional_neural_networks',
        num: '09',
        title: 'CNNs & ResNet Blocks',
        desc: 'Spatial convolutions, receptive fields, pooling, and ResNet skip shortcuts.',
        mdPath: 'ailab/09_convolutional_neural_networks/09_convolutional_neural_networks.md',
        codeFiles: [
          { name: '09_conv2d_and_resnet_block.py', path: 'ailab/09_convolutional_neural_networks/09_conv2d_and_resnet_block.py', lang: 'python' }
        ],
        tags: ['CNN', 'Convolution', 'Pooling', 'ResNet', 'Skip Connections']
      },
      {
        id: '10_recurrent_neural_networks_and_lstms',
        num: '10',
        title: 'RNNs & LSTM Networks',
        desc: 'Sequence recurrence, BPTT vanishing gradients, 4-gate LSTM cell memory.',
        mdPath: 'ailab/10_recurrent_neural_networks_and_lstms/10_rnn_and_lstm_architectures.md',
        codeFiles: [
          { name: '10_lstm_character_lm.py', path: 'ailab/10_recurrent_neural_networks_and_lstms/10_lstm_character_lm.py', lang: 'python' }
        ],
        tags: ['RNN', 'LSTM', 'BPTT', 'Vanishing Gradients', 'Cell State']
      }
    ]
  },

  // Part 5: Modern Transformers & Large Language Models
  {
    part: 5,
    partTitle: 'Part 5: Transformers & LLMs',
    partDesc: 'Attention Is All You Need, Multi-Head Attention, RoPE, and autoregressive LLMs.',
    badge: 'Transformers',
    modules: [
      {
        id: '11_attention_and_transformers',
        num: '11',
        title: 'Attention & RoPE',
        desc: 'Scaled dot-product (Q, K, V), causal masking, multi-head, and RoPE.',
        mdPath: 'ailab/11_attention_and_transformers/11_scaled_dot_product_attention.md',
        codeFiles: [
          { name: '11_multihead_attention_rope.py', path: 'ailab/11_attention_and_transformers/11_multihead_attention_rope.py', lang: 'python' }
        ],
        tags: ['Attention', 'Transformers', 'Multi-Head Attention', 'RoPE']
      },
      {
        id: '12_large_language_models_pretraining',
        num: '12',
        title: 'LLMs & KV-Caching',
        desc: 'Decoder-only pretraining, BPE tokens, Chinchilla laws, O(1) KV-cache.',
        mdPath: 'ailab/12_large_language_models_pretraining/12_llm_pretraining_and_kv_cache.md',
        codeFiles: [
          { name: '12_minigpt_and_kv_cache.py', path: 'ailab/12_large_language_models_pretraining/12_minigpt_and_kv_cache.py', lang: 'python' }
        ],
        tags: ['LLMs', 'GPT', 'KV-Cache', 'Tokenization', 'Scaling Laws']
      }
    ]
  },

  // Part 6: SOTA Fine-Tuning, Alignment, Diffusion & Reasoning
  {
    part: 6,
    partTitle: 'Part 6: SOTA Frontier',
    partDesc: 'LoRA/QLoRA parameter efficiency, DPO alignment, diffusion, and MCTS reasoning.',
    badge: 'SOTA',
    modules: [
      {
        id: '13_peft_and_lora',
        num: '13',
        title: 'LoRA & PEFT Adapters',
        desc: 'Intrinsic rank hypothesis, Delta W = B * A updates, QLoRA, weight merging.',
        mdPath: 'ailab/13_peft_and_lora/13_peft_lora_and_qlora.md',
        codeFiles: [
          { name: '13_lora_linear_layer.py', path: 'ailab/13_peft_and_lora/13_lora_linear_layer.py', lang: 'python' }
        ],
        tags: ['LoRA', 'PEFT', 'QLoRA', 'Fine-Tuning', 'Weight Merging']
      },
      {
        id: '14_alignment_rlhf_and_dpo',
        num: '14',
        title: 'Alignment: RLHF & DPO',
        desc: 'Bradley-Terry preference model, PPO with KL penalty vs closed-form DPO.',
        mdPath: 'ailab/14_alignment_rlhf_and_dpo/14_rlhf_and_direct_preference_optimization.md',
        codeFiles: [
          { name: '14_dpo_loss_engine.py', path: 'ailab/14_alignment_rlhf_and_dpo/14_dpo_loss_engine.py', lang: 'python' }
        ],
        tags: ['Alignment', 'RLHF', 'DPO', 'Bradley-Terry', 'PPO']
      },
      {
        id: '15_diffusion_and_flow_matching',
        num: '15',
        title: 'Diffusion & Flow Matching',
        desc: 'DDPM forward/reverse Gaussian noise, CFG guidance, flow matching ODEs.',
        mdPath: 'ailab/15_diffusion_and_flow_matching/15_diffusion_models_and_flow_matching.md',
        codeFiles: [
          { name: '15_ddpm_diffusion_sampler.py', path: 'ailab/15_diffusion_and_flow_matching/15_ddpm_diffusion_sampler.py', lang: 'python' }
        ],
        tags: ['Diffusion', 'DDPM', 'Generative AI', 'Flow Matching', 'CFG']
      },
      {
        id: '16_reasoning_and_inference_sota',
        num: '16',
        title: 'Reasoning & Inference',
        desc: 'Test-time compute scaling, Process Reward Models, MCTS, speculative decoding.',
        mdPath: 'ailab/16_reasoning_and_inference_sota/16_reasoning_models_test_time_compute.md',
        codeFiles: [
          { name: '16_mcts_reasoning_speculative.py', path: 'ailab/16_reasoning_and_inference_sota/16_mcts_reasoning_speculative.py', lang: 'python' }
        ],
        tags: ['Reasoning', 'Test-Time Compute', 'Speculative Decoding', 'MCTS']
      }
    ]
  }
];

export const GRAPHICS_CURRICULUM = [
  // Part 1: Basic Graphics from Scratch in C/C++
  {
    part: 1,
    partTitle: 'Part 1: Graphics from Scratch in C & C++',
    partDesc: 'Framebuffers, RGBA stride, Bresenham wireframes, barycentric triangle rasterization, depth buffers, 3D math, and raytracing.',
    badge: 'CPU Software Engine',
    modules: [
      {
        id: '01_software_framebuffer',
        num: '01',
        title: 'The Software Framebuffer & PPM',
        desc: 'Displays as 1D linear RAM, RGBA32 stride math, alpha blending, and zero-dependency Netpbm PPM image serialization.',
        mdPath: 'graphicslab/01_software_framebuffer/01_software_framebuffer.md',
        codeFiles: [
          { name: '01_software_framebuffer.c', path: 'graphicslab/01_software_framebuffer/01_software_framebuffer.c', lang: 'c' }
        ],
        tags: ['Framebuffer', 'PPM', 'RGB', 'Alpha Blending', 'C']
      },
      {
        id: '02_bresenham_wireframe',
        num: '02',
        title: 'Bresenham Lines & 3D Wireframes',
        desc: 'Integer-only incremental error accumulator for drawing straight lines without floating point; 3D rotating wireframe cube.',
        mdPath: 'graphicslab/02_bresenham_wireframe/02_bresenham_wireframe.md',
        codeFiles: [
          { name: '02_bresenham_wireframe.c', path: 'graphicslab/02_bresenham_wireframe/02_bresenham_wireframe.c', lang: 'c' }
        ],
        tags: ['Bresenham', 'Lines', 'Wireframe', 'Rasterization', 'C']
      },
      {
        id: '03_triangle_rasterization',
        num: '03',
        title: 'Triangle Rasterization & Barycentric Math',
        desc: 'The fundamental atomic GPU primitive: AABB bounding box scanline, Pineda edge functions, and smooth vertex color interpolation.',
        mdPath: 'graphicslab/03_triangle_rasterization/03_triangle_rasterization.md',
        codeFiles: [
          { name: '03_triangle_rasterizer.cpp', path: 'graphicslab/03_triangle_rasterization/03_triangle_rasterizer.cpp', lang: 'cpp' }
        ],
        tags: ['Triangles', 'Barycentric Coordinates', 'Gouraud', 'Rasterizer', 'C++']
      },
      {
        id: '04_zbuffer_and_depth',
        num: '04',
        title: 'Z-Buffering & Hidden Surface Removal',
        desc: 'Why Painter\'s algorithm fails with cycles; allocating depth buffers, depth testing, and perspective-correct 1/z interpolation.',
        mdPath: 'graphicslab/04_zbuffer_and_depth/04_zbuffer_and_depth.md',
        codeFiles: [
          { name: '04_zbuffer_rasterizer.cpp', path: 'graphicslab/04_zbuffer_and_depth/04_zbuffer_rasterizer.cpp', lang: 'cpp' }
        ],
        tags: ['Z-Buffer', 'Depth Test', 'Hidden Surfaces', 'Perspective Correct', 'C++']
      },
      {
        id: '05_3d_math_and_transformations',
        num: '05',
        title: '3D Math: Model, View, Projection (MVP)',
        desc: 'Homogeneous coordinates (4D), 4x4 matrix multiplication, LookAt camera view matrix, perspective frustum, and perspective divide.',
        mdPath: 'graphicslab/05_3d_math_and_transformations/05_3d_math_and_transformations.md',
        codeFiles: [
          { name: '05_mvp_transform_math.cpp', path: 'graphicslab/05_3d_math_and_transformations/05_mvp_transform_math.cpp', lang: 'cpp' }
        ],
        tags: ['3D Math', 'MVP Matrix', 'LookAt Camera', 'Perspective Projection', 'Homogeneous']
      },
      {
        id: '06_software_raytracer',
        num: '06',
        title: 'Software Raytracer from Scratch',
        desc: 'Forward projection vs backward light simulation: Ray-sphere quadratic algebra, surface normals, Lambertian diffuse, Blinn-Phong, and shadow rays.',
        mdPath: 'graphicslab/06_software_raytracer/06_software_raytracer.md',
        codeFiles: [
          { name: '06_software_raytracer.cpp', path: 'graphicslab/06_software_raytracer/06_software_raytracer.cpp', lang: 'cpp' }
        ],
        tags: ['Raytracing', 'Ray-Sphere', 'Lambertian', 'Blinn-Phong', 'Shadow Rays', 'C++']
      }
    ]
  },

  // Part 2: Modern GPU Graphics APIs & Shaders
  {
    part: 2,
    partTitle: 'Part 2: Modern GPU Architectures & API Comparisons',
    partDesc: 'Hardware SIMT execution, programmable pipeline stages, Vulkan vs OpenGL vs WebGPU side-by-side, and Cook-Torrance PBR shaders.',
    badge: 'Modern GPU APIs',
    modules: [
      {
        id: '07_gpu_architecture_and_pipeline',
        num: '07',
        title: 'GPU Architecture, Complete Pipeline & Render Passes',
        desc: 'Hardware SIMT execution warps, complete fixed/programmable pipeline stages (IA to ROP), clipping/blending math, and modern multi-pass engine architecture (G-Buffer MRT, Shadows, SSAO, Clustered Shading, Frame Graphs).',
        mdPath: 'graphicslab/07_gpu_architecture_and_pipeline/07_gpu_architecture_and_pipeline.md',
        codeFiles: [
          { name: '07_tiny_multipass_renderer.cpp', path: 'graphicslab/07_gpu_architecture_and_pipeline/07_tiny_multipass_renderer.cpp', lang: 'cpp' },
          { name: '07_multipass_deferred_shaders.glsl', path: 'graphicslab/07_gpu_architecture_and_pipeline/07_multipass_deferred_shaders.glsl', lang: 'c' },
          { name: '07_pipeline_shaders.glsl', path: 'graphicslab/07_gpu_architecture_and_pipeline/07_pipeline_shaders.glsl', lang: 'c' },
          { name: '07_simt_pipeline_emulator.cpp', path: 'graphicslab/07_gpu_architecture_and_pipeline/07_simt_pipeline_emulator.cpp', lang: 'cpp' }
        ],
        tags: ['Graphics Pipeline', 'Render Passes', 'Deferred Shading', 'Shadow Maps', 'Stencil Lighting', 'MSAA', 'SIMT']
      },
      {
        id: '08_vulkan_opengl_webgpu_comparison',
        num: '08',
        title: 'Modern APIs: Vulkan vs OpenGL vs WebGPU',
        desc: 'Exhaustive architectural comparison: OpenGL global state vs Vulkan explicit PSOs & command buffers vs WebGPU next-gen W3C standard.',
        mdPath: 'graphicslab/08_vulkan_opengl_webgpu_comparison/08_vulkan_opengl_webgpu_comparison.md',
        codeFiles: [
          { name: '08_opengl_triangle.cpp', path: 'graphicslab/08_vulkan_opengl_webgpu_comparison/08_opengl_triangle.cpp', lang: 'cpp' },
          { name: '08_vulkan_triangle.cpp', path: 'graphicslab/08_vulkan_opengl_webgpu_comparison/08_vulkan_triangle.cpp', lang: 'cpp' },
          { name: '08_webgpu_triangle.js', path: 'graphicslab/08_vulkan_opengl_webgpu_comparison/08_webgpu_triangle.js', lang: 'javascript' }
        ],
        tags: ['Vulkan', 'OpenGL', 'WebGPU', 'DirectX 12', 'Metal', 'SPIR-V', 'WGSL']
      },
      {
        id: '09_shaders_and_pbr',
        num: '09',
        title: 'Modern Shaders, Diffuse, Phong & Physically Based Rendering (PBR)',
        desc: 'Rigorous radiometry, the Rendering Equation, Lambertian vs Oren-Nayar rough diffuse, Classical Phong vs Blinn-Phong specular, Cook-Torrance microfacet BRDF (GGX, Schlick, Smith, Height-Correlated Visibility), and Split-Sum IBL.',
        mdPath: 'graphicslab/09_shaders_and_pbr/09_shaders_and_pbr.md',
        codeFiles: [
          { name: '09_shading_comparison_models.glsl', path: 'graphicslab/09_shaders_and_pbr/09_shading_comparison_models.glsl', lang: 'c' },
          { name: '09_pbr_shader.glsl', path: 'graphicslab/09_shaders_and_pbr/09_pbr_shader.glsl', lang: 'c' },
          { name: '09_pbr_shader.wgsl', path: 'graphicslab/09_shaders_and_pbr/09_pbr_shader.wgsl', lang: 'rust' }
        ],
        tags: ['Shaders', 'BRDF', 'Diffuse', 'Phong', 'Blinn-Phong', 'Cook-Torrance', 'GGX', 'PBR', 'Radiometry']
      }
    ]
  },

  // Part 3: Advanced Frame Pipelines & GPU Profiling
  {
    part: 3,
    partTitle: 'Part 3: Advanced Pipelines & GPU Profiling',
    partDesc: 'Visibility buffers, floating-point Reverse-Z, motion vector pre-passes, quad helper lane overdraw, TAA/SSR post-processing, and complete step-by-step frame capture dissection with RenderDoc & Nsight.',
    badge: 'Pipelines & Profiling',
    modules: [
      {
        id: '10_visibility_buffer_and_advanced_pipelines',
        num: '10',
        title: 'Visibility Buffers, Reverse-Z & Modern Pipelines',
        desc: 'Decoupling geometry from material shading via 64-bit Visibility Buffers; eliminating Z-fighting with Reverse-Z; handling alpha-test prepass hazards and deferred MSAA.',
        mdPath: 'graphicslab/10_visibility_buffer_and_advanced_pipelines/10_visibility_buffer_and_advanced_pipelines.md',
        codeFiles: [
          { name: '10_visibility_buffer_shader.glsl', path: 'graphicslab/10_visibility_buffer_and_advanced_pipelines/10_visibility_buffer_shader.glsl', lang: 'c' }
        ],
        tags: ['Visibility Buffer', 'Reverse-Z', 'Nanite', 'Velocity Buffer', 'MSAA', 'Alpha-Test']
      },
      {
        id: '11_gpu_debugging_and_profiling',
        num: '11',
        title: 'GPU Profiling & Debugging (Nsight, RenderDoc, RGP)',
        desc: 'Analyzing 2x2 quad helper thread overdraw; interpreting NVIDIA Nsight Graphics SOL and GPU traces; RenderDoc G-buffer inspection; AMD RGP wavefront occupancy.',
        mdPath: 'graphicslab/11_gpu_debugging_and_profiling/11_gpu_debugging_and_profiling.md',
        codeFiles: [
          { name: '11_quad_overdraw_simulator.cpp', path: 'graphicslab/11_gpu_debugging_and_profiling/11_quad_overdraw_simulator.cpp', lang: 'cpp' }
        ],
        tags: ['Nsight', 'RenderDoc', 'RGP', 'Quad Overdraw', 'Wavefronts', 'Profiling', 'Early-Z']
      },
      {
        id: '12_antialiasing_reflections_and_postprocessing',
        num: '12',
        title: 'Anti-Aliasing (MSAA, FXAA, TAA), SSR & Post-Processing',
        desc: 'Geometric vs Temporal Anti-Aliasing (MSAA vs FXAA vs TAA with Halton jitter & YCoCg variance clipping); Screen-Space Reflections (SSR) with 2.5D DDA raymarching; HBAO/GTAO; ACES Filmic tone mapping.',
        mdPath: 'graphicslab/12_antialiasing_reflections_and_postprocessing/12_antialiasing_reflections_and_postprocessing.md',
        codeFiles: [
          { name: '12_antialiasing_and_postprocessing.glsl', path: 'graphicslab/12_antialiasing_reflections_and_postprocessing/12_antialiasing_and_postprocessing.glsl', lang: 'c' }
        ],
        tags: ['Anti-Aliasing', 'TAA', 'MSAA', 'FXAA', 'SSR', 'HBAO', 'ACES Filmic', 'Tone Mapping', 'Variance Clipping']
      },
      {
        id: '13_renderdoc_frame_dissection_viewer',
        num: '13',
        title: 'RenderDoc & Nsight Frame Dissection: Step-by-Step Anatomy',
        desc: 'Comprehensive frame capture dissection from clears and early depth pre-pass to shadow maps, G-buffer, SSAO/HBAO, SSR, deferred lighting, AA, and tone mapping; pipeline state inspection and primitive vs modern paradigm comparison.',
        mdPath: 'graphicslab/13_renderdoc_frame_dissection_viewer/13_renderdoc_frame_dissection_viewer.md',
        codeFiles: [
          { name: '13_frame_debugger_simulation.cpp', path: 'graphicslab/13_renderdoc_frame_dissection_viewer/13_frame_debugger_simulation.cpp', lang: 'cpp' }
        ],
        tags: ['RenderDoc', 'Nsight', 'Frame Capture', 'Pipeline State', 'Barriers', 'G-Buffer', 'Event Scrubbing', 'Modern vs Primitive']
      }
    ]
  }
];


