# Module 13b: Page Tables, TLB Mechanics & Copy-on-Write (COW)

In Module 13, we saw that virtual addresses are translated to physical RAM. But how does the CPU's **MMU (Memory Management Unit)** actually perform this translation in hardware, and why does `fork()` take 0.1ms even for a 10 GB process? (●'◡'●)
Let's dive into **Multi-Level Page Tables, TLBs, and Copy-on-Write (COW)**! q(≧▽≦q)

---

## 1. 4-Level Paging Architecture (x86-64)

A 64-bit virtual address is split into 5 distinct bitfields:

```
63        48 47     39 38     30 29     21 20     12 11          0
+-----------+---------+---------+---------+---------+------------+
| Sign Ext  | PML4 Idx| PDPT Idx|  PD Idx |  PT Idx | PageOffset |
| (16 bits) | (9 bits)| (9 bits)| (9 bits)| (9 bits)| (12 bits)  |
+-----------+---------+---------+---------+---------+------------+
```

```
CPU CR3 Register (Points to Root PML4 Table in RAM)
       |
       v
  [ PML4 Table ] (512 entries x 8 bytes = 4KB page)
       | (PML4 Index selects entry)
       v
  [ PDPT Table ] (Page Directory Pointer Table)
       | (PDPT Index selects entry)
       v
  [ Page Directory ]
       | (PD Index selects entry)
       v
  [ Page Table ] (4KB page of PTE entries)
       | (PT Index selects PTE -> Physical Frame Base)
       v
  [ Physical RAM Frame ] + Page Offset (0 - 4095) = Exact Byte! (o゜▽゜)o
```

---

## 2. The TLB (Translation Lookaside Buffer)

Doing 4 RAM accesses for every single pointer dereference would make the CPU 4x slower!
The **TLB** is an on-chip associative cache holding the most recent `Virtual Page -> Physical Frame` translations:
- **TLB Hit**: 0.5 - 1 CPU cycle!
- **TLB Miss (Page Walk)**: 20 - 50 cycles (hardware walks the 4 page table levels).
- **Huge Pages (2 MB / 1 GB)**: Bypasses the lower page table level, covering 512x more RAM per TLB entry!

---

## 3. Copy-on-Write (COW) Magic

When Linux runs `fork()`:
1. The OS does **NOT** copy the gigabytes of RAM.
2. It duplicates only the Page Tables and marks every single page as **Read-Only**!
3. If Child or Parent writes to a page:
   - Hardware triggers a **Page Fault (`#PF`)**.
   - Kernel catches the fault, allocates **1 single new 4KB physical page**, copies the 4KB, updates the child's PTE to **Read-Write**, and resumes execution!

```
Parent Virtual Page A \
                       ---> [ Physical Page 0x8A00 (Read-Only) ]
Child Virtual Page A  /
         |
         v (Child writes: *ptr = 99)
   [ Page Fault! ] -> Kernel allocates [ New Physical Page 0x9F00 (Read-Write) ]
```

---

## Hands-On Program

Open [`13b_tlb_and_cow_demo.c`](file:///c:/Users/kkhoie/Downloads/cprog1/13b_page_tables_and_tlb_mechanics/13b_tlb_and_cow_demo.c) to observe TLB strided memory access benchmarks and COW page-splitting behavior! (*^▽^*)
