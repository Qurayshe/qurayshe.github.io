#!/usr/bin/env python3
"""
Module 05: Memory Simulation & Side-by-Side Comparison Program
Demonstrates and visualizes two sets of simulated memory:
  - Set A: Naive Malloc/Free Heap (Per-chunk metadata headers + fragmentation holes)
  - Set B: Linear Arena Allocator (Contiguous bump offset + zero metadata + instant wipe)
"""

import sys

BUFFER_SIZE = 64
PAGE_SIZE = 16
NUM_PAGES = BUFFER_SIZE // PAGE_SIZE

class NaiveHeapSim:
    def __init__(self, size=BUFFER_SIZE):
        self.size = size
        # Each cell: '.' (free), 'H' (header), 'X' (hole), or '1', '2', etc. (payload)
        self.cells = ['.'] * size
        self.chunks = {} # id -> (start_idx, total_len, payload_len)
        self.next_id = 1
        self.syscalls = 0
        self.leaks = 0

    def malloc(self, payload_len):
        self.syscalls += 1
        total_len = payload_len + 1 # 1-byte metadata header
        # First-fit search
        start = -1
        consecutive = 0
        for i in range(self.size):
            if self.cells[i] in ('.', 'X'):
                consecutive += 1
                if consecutive == total_len:
                    start = i - total_len + 1
                    break
            else:
                consecutive = 0

        if start == -1:
            return None # Out of memory / cannot find contiguous block

        cid = self.next_id
        self.next_id += 1
        self.cells[start] = 'H' # Header
        for i in range(1, total_len):
            self.cells[start + i] = str(cid)

        self.chunks[cid] = (start, total_len, payload_len)
        return cid

    def free(self, cid):
        if cid not in self.chunks:
            return False
        start, total_len, payload_len = self.chunks.pop(cid)
        # Mark as fragmented hole 'X'
        for i in range(total_len):
            self.cells[start + i] = 'X'
        return True

    def leak(self, cid):
        if cid in self.chunks:
            self.leaks += 1
            # remove from tracking without freeing cells!
            del self.chunks[cid]

    def reset(self):
        self.cells = ['.'] * self.size
        self.chunks.clear()
        self.syscalls = 0
        self.leaks = 0

    def stats(self):
        payload = sum(1 for c in self.cells if c not in ('.', 'H', 'X'))
        headers = sum(1 for c in self.cells if c == 'H')
        holes = sum(1 for c in self.cells if c == 'X')
        free = sum(1 for c in self.cells if c == '.')
        # max contiguous free/hole
        max_free = 0
        cur = 0
        for c in self.cells:
            if c in ('.', 'X'):
                cur += 1
                max_free = max(max_free, cur)
            else:
                cur = 0
        return payload, headers, holes, free, max_free


class ArenaSim:
    def __init__(self, size=BUFFER_SIZE):
        self.size = size
        self.cells = ['.'] * size
        self.offset = 0
        self.next_id = 1
        self.syscalls = 1 # 1 pre-allocation
        self.chunks = {}

    def alloc(self, payload_len):
        if self.offset + payload_len > self.size:
            return None # Arena capacity reached
        cid = self.next_id
        self.next_id += 1
        for i in range(payload_len):
            self.cells[self.offset + i] = str(cid)
        self.chunks[cid] = (self.offset, payload_len)
        self.offset += payload_len
        return cid

    def reset(self):
        self.cells = ['.'] * self.size
        self.offset = 0
        self.chunks.clear()

    def stats(self):
        payload = self.offset
        headers = 0
        holes = 0
        free = self.size - self.offset
        max_free = free
        return payload, headers, holes, free, max_free


def render_comparison(heap, arena, title=""):
    print("=" * 76)
    if title:
        print(f" {title.upper()}")
        print("=" * 76)

    print(f"{'SET A: NAIVE HEAP (MALLOC/FREE)':<37} | {'SET B: LINEAR ARENA (BUMP)':<36}")
    print("-" * 37 + "-+-" + "-" * 36)

    # Print page by page
    for p in range(NUM_PAGES):
        p_start = p * PAGE_SIZE
        p_end = p_start + PAGE_SIZE
        print(f"--- PAGE {p} [0x{p_start:02X} - 0x{p_end-1:02X}] {'-'*15} | --- PAGE {p} [0x{p_start:02X} - 0x{p_end-1:02X}] {'-'*14}")

        for row in range(PAGE_SIZE // 8):
            r_start = p_start + row * 8
            r_end = r_start + 8

            row_a = "".join(f"[{heap.cells[i]}]" for i in range(r_start, r_end))
            row_b = "".join(f"[{arena.cells[i]}]" for i in range(r_start, r_end))
            print(f"0x{r_start:02X}: {row_a:<27} | 0x{r_start:02X}: {row_b:<27}")

    print("=" * 76)
    # Print metrics table
    a_pay, a_hdr, a_hole, a_free, a_max = heap.stats()
    b_pay, b_hdr, b_hole, b_free, b_max = arena.stats()

    print(f"{'METRIC COMPARISON':<32} | {'SET A (NAIVE)':<19} | {'SET B (ARENA)':<18}")
    print("-" * 32 + "-+-" + "-" * 19 + "-+-" + "-" * 18)
    print(f"{'Total Managed Buffer':<32} | {BUFFER_SIZE:<19} | {BUFFER_SIZE:<18}")
    print(f"{'Active Payload (Usable Data)':<32} | {f'{a_pay} B ({a_pay*100//BUFFER_SIZE}%)':<19} | {f'{b_pay} B ({b_pay*100//BUFFER_SIZE}%)':<18}")
    print(f"{'Metadata Overhead (Headers)':<32} | {f'{a_hdr} B ({a_hdr*100//BUFFER_SIZE}%)':<19} | {f'{b_hdr} B (0%)':<18}")
    print(f"{'Fragmented Holes':<32} | {f'{a_hole} B ({a_hole*100//BUFFER_SIZE}%)':<19} | {f'{b_hole} B (0%)':<18}")
    print(f"{'Unallocated Free Space':<32} | {f'{a_free} B ({a_free*100//BUFFER_SIZE}%)':<19} | {f'{b_free} B ({b_free*100//BUFFER_SIZE}%)':<18}")
    print(f"{'Max Contiguous Free Chunk':<32} | {f'{a_max} Bytes':<19} | {f'{b_max} Bytes':<18}")
    print(f"{'OS Allocation Syscalls':<32} | {f'{heap.syscalls} syscalls':<19} | {f'{arena.syscalls} syscall (pre-alloc)':<18}")
    print("=" * 76)
    print("LEGEND: [H]=Header  [1-9]=Payload Chunk  [X]=Fragmented Hole  [.]=Free Unused\n")


def main():
    print("\n" + "#" * 76)
    print(" LOW-LEVEL MEMORY MANAGEMENT SIMULATION & BENCHMARK")
    print(" Comparing Naive Dynamic Heap vs Linear Arena Allocator")
    print("#" * 76 + "\n")

    heap = NaiveHeapSim()
    arena = ArenaSim()

    # Step 1: Initial allocations
    print(">>> STEP 1: Allocating 4 Objects (sizes: 5B, 4B, 6B, 5B) on both sets...")
    heap.malloc(5)
    heap.malloc(4)
    heap.malloc(6)
    heap.malloc(5)

    arena.alloc(5)
    arena.alloc(4)
    arena.alloc(6)
    arena.alloc(5)
    render_comparison(heap, arena, "Step 1: After Initial 4 Allocations")

    # Step 2: Random deallocations
    print(">>> STEP 2: Freeing Object #1 and Object #3 in Set A (creates Swiss cheese holes)...")
    heap.free(1)
    heap.free(3)
    # Arenas don't individually free: they preserve linear state
    render_comparison(heap, arena, "Step 2: After Freeing Chunks #1 & #3 in Set A")

    # Step 3: Attempting to allocate a large 10-byte object
    print(">>> STEP 3: Attempting to allocate a new 10-byte Object...")
    res_a = heap.malloc(10)
    res_b = arena.alloc(10)

    print(f"  --> Set A Result: {'SUCCESS' if res_a else 'FAILED (OUT OF MEMORY / FRAGMENTATION HAZARD)'}")
    print(f"      (Reason: Set A has {heap.stats()[2]} bytes free in holes, but no contiguous run >= 11 bytes!)")
    print(f"  --> Set B Result: {'SUCCESS' if res_b else 'FAILED'}")
    print(f"      (Reason: Arena has contiguous remaining buffer at offset {arena.offset}!)")
    render_comparison(heap, arena, "Step 3: After Attempting 10-Byte Allocation")

    # Step 4: Bulk reset
    print(">>> STEP 4: Resetting All Memory...")
    heap.reset()
    arena.reset()
    render_comparison(heap, arena, "Step 4: After Memory Reset (Both Sets Cleared)")

    print("[SUCCESS] Memory simulation complete! (o^v^o)")

if __name__ == '__main__':
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    main()
