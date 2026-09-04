# Module 13: Virtual Memory, Pages & Zero-Copy I/O

Plot twist: The pointers in your C code do NOT point to physical RAM chips! They point to **Virtual Memory Addresses** translated on the fly by the CPU's Memory Management Unit (MMU)! (●'◡'●)

---

## 1. 4 KB Pages & The MMU

Memory is managed in **4,096-byte (4 KB) chunks called Pages**.

```
   Virtual Address (e.g. 0x00007FFF12345678)
   +---------------------------------------+--------------------+
   |    Virtual Page Number (VPN)          | Page Offset (12b)  |
   +---------------------------------------+--------------------+
                      |                               |
                      v                               v
             [ MMU Page Table ]           Physical RAM: [ Frame | Offset ]
```

- Offset: `address & 0x0FFF` (lowest 12 bits)
- Page Base: `address & ~0x0FFF`

---

## 2. Demand Paging: How `malloc(100MB)` Actually Works

When you allocate 100 MB, the OS does **not** give you 100 MB of physical RAM immediately.
It sets Page Table entries to `is_present = 0`.
When your code touches `ptr[0]`, the MMU triggers a **Page Fault Exception**. The OS catches it, assigns 1 physical 4KB frame of RAM, and resumes your code! Lazy load gaming!!! (*^▽^*)

---

## 3. Memory-Mapped Files (`mmap`) & Zero-Copy

Instead of copying disk bytes to kernel buffers and then to user buffers (`fread`), `mmap` points your process page table directly to the OS disk cache! Zero buffer copies!!! (o゜▽゜)o

---

## Hands-On Program

Open [`13_virtual_memory_pages.c`](file:///c:/Users/kkhoie/Downloads/cprog1/13_virtual_memory_and_mmap/13_virtual_memory_pages.c) to inspect page offset math and simulated MMU Page Table entries! (≧∇≦)ﾉ
