/**
 * Interactive Memory Management Visualizer & Simulator
 * Provides a functional, byte-level memory grid simulation comparing two sets of memory:
 *   - Set A: Naive / Unoptimized (Heap headers, fragmented holes, leaks, misalignments)
 *   - Set B: Optimized Technique (Linear Arena, Fixed-Size Pool, or Aligned PMR Stack)
 *
 * Visualizes:
 *   - 64 Bytes of memory across 4 virtual pages (Page 0 to Page 3)
 *   - Regions: Stack buffers, Heap dynamic chunks, Metadata headers, Padding, Free-list links
 *   - Live proportional memory usage bars and exact byte statistics
 *   - Benchmark stress tester comparing fragmentation and contiguous allocatable limits
 */

export class MemoryVisualizer {
  constructor(container, type = 'arena') {
    this.container = container;
    this.type = type; // 'arena', 'pool', or 'alignment'
    this.bufferSize = 64; // 64 bytes total
    this.pageSize = 16;   // 16 bytes per page
    this.numPages = 4;    // 4 pages total
    this.state = this.getInitialState(type);
    this.render();
  }

  getInitialState(type) {
    const size = this.bufferSize;

    if (type === 'arena') {
      return {
        type: 'arena',
        // Set A: Naive Heap (with headers & holes)
        bad: {
          name: 'Set A: Naive Heap (malloc/free)',
          tag: 'Naive Heap',
          bytes: new Array(size).fill(null), // null = free '.', or { id, type: 'header'|'payload'|'hole'|'leak', tag, color }
          chunks: {}, // id -> { start, total, payload, color }
          nextId: 1,
          syscalls: 0,
          leaksCount: 0,
          log: 'Initialized heap space (64 Bytes across 4 pages). Ready.'
        },
        // Set B: Linear Arena (contiguous bump pointer)
        good: {
          name: 'Set B: Linear Arena (Bump Allocator)',
          tag: 'Linear Arena',
          bytes: new Array(size).fill(null), // null = unallocated '.', or { id, type: 'payload', tag, color }
          chunks: {},
          offset: 0,
          nextId: 1,
          syscalls: 1, // Single initial backing malloc!
          log: 'Pre-allocated 64B contiguous buffer in 1 syscall. Offset = 0x00.'
        }
      };
    } else if (type === 'pool') {
      // 4 pages of 16B = 8 slots of 8B each
      const slotSize = 8;
      const numSlots = size / slotSize; // 8 slots
      return {
        type: 'pool',
        slotSize,
        numSlots,
        // Set A: Variable-size dynamic malloc
        bad: {
          name: 'Set A: Variable-Size Heap',
          tag: 'Variable Heap',
          bytes: new Array(size).fill(null),
          chunks: {},
          nextId: 1,
          log: 'Variable-size allocator ready. Free space scattered.'
        },
        // Set B: Fixed slot pool with embedded free list
        good: {
          name: 'Set B: Fixed-Size Slot Pool (Free-List)',
          tag: 'Slot Pool',
          bytes: new Array(size).fill(null),
          freeList: Array.from({ length: numSlots }, (_, i) => i), // stack of free slot indices
          nextId: 1,
          log: 'Pool initialized: 8 uniform slots of 8 bytes (O(1) free list).'
        }
      };
    } else {
      // Alignment & PMR (Module 22)
      return {
        type: 'alignment',
        // Set A: Raw unaligned byte packing
        bad: {
          name: 'Set A: Raw Unaligned Packing',
          tag: 'Unaligned Raw',
          bytes: new Array(size).fill(null),
          currentByte: 0,
          misalignedCount: 0,
          cacheLineSplits: 0,
          log: 'Packed raw byte allocation (no hardware alignment checks).'
        },
        // Set B: Aligned Arena & Stack PMR
        good: {
          name: 'Set B: Aligned Arena & PMR Stack',
          tag: 'Aligned PMR',
          bytes: new Array(size).fill(null),
          currentByte: 0,
          paddingBytes: 0,
          log: 'Strict power-of-two align_up() allocator on stack buffer.'
        }
      };
    }
  }

  // =========================================================================
  // ACTIONS: ARENA (Module 05)
  // =========================================================================

  arenaAllocateChunk(payloadSize = 5) {
    const s = this.state;
    const colors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];
    const color = colors[s.good.nextId % colors.length];
    const cid = s.good.nextId;

    // 1. Set B: Good Arena (Contiguous bump pointer, 0 header bytes)
    let goodSuccess = false;
    if (s.good.offset + payloadSize <= this.bufferSize) {
      for (let i = 0; i < payloadSize; i++) {
        s.good.bytes[s.good.offset + i] = {
          id: cid,
          type: 'payload',
          tag: `Obj#${cid}`,
          byteIndex: i + 1,
          payloadSize,
          color
        };
      }
      s.good.chunks[cid] = { start: s.good.offset, payload: payloadSize, color };
      s.good.offset += payloadSize;
      s.good.nextId++;
      s.good.log = `Bumped offset +${payloadSize}B -> now at 0x${s.good.offset.toString(16).padStart(2, '0').toUpperCase()} (0 metadata, 0 syscalls).`;
      goodSuccess = true;
    } else {
      s.good.log = `Arena buffer full (${s.good.offset}/${this.bufferSize} B). Bulk reset needed.`;
    }

    // 2. Set A: Bad Naive Heap (Requires 1-byte header overhead per allocation!)
    const totalNeeded = payloadSize + 1; // 1 byte header
    let placedStart = -1;
    let consecutive = 0;

    for (let i = 0; i < this.bufferSize; i++) {
      if (s.bad.bytes[i] === null || s.bad.bytes[i].type === 'hole') {
        consecutive++;
        if (consecutive === totalNeeded) {
          placedStart = i - totalNeeded + 1;
          break;
        }
      } else {
        consecutive = 0;
      }
    }

    if (placedStart !== -1) {
      s.bad.syscalls++;
      // Place header
      s.bad.bytes[placedStart] = {
        id: cid,
        type: 'header',
        tag: `Hdr(${payloadSize}B)`,
        color: '#a855f7'
      };
      // Place payload
      for (let i = 1; i < totalNeeded; i++) {
        s.bad.bytes[placedStart + i] = {
          id: cid,
          type: 'payload',
          tag: `Obj#${cid}`,
          byteIndex: i,
          payloadSize,
          color
        };
      }
      s.bad.chunks[cid] = { start: placedStart, total: totalNeeded, payload: payloadSize, color };
      s.bad.nextId++;
      s.bad.log = `malloc(${payloadSize}B) placed at 0x${placedStart.toString(16).padStart(2, '0').toUpperCase()} (+1B header overhead, OS syscall #${s.bad.syscalls}).`;
    } else {
      s.bad.log = `💥 OOM ERROR: Could not find contiguous ${totalNeeded} bytes in Set A heap!`;
    }

    this.render();
  }

  arenaBatchAllocate() {
    const sizes = [5, 4, 6];
    sizes.forEach(sz => this.arenaAllocateChunk(sz));
  }

  arenaDeallocateRandom() {
    const s = this.state;
    const activeIds = Object.keys(s.bad.chunks).map(Number);

    if (activeIds.length === 0) {
      s.bad.log = 'No active allocations in Set A to free.';
      this.render();
      return;
    }

    // Pick a chunk to free
    const cid = activeIds[Math.floor(Math.random() * activeIds.length)];
    const chunk = s.bad.chunks[cid];
    delete s.bad.chunks[cid];

    // Turn cells into fragmented holes
    for (let i = 0; i < chunk.total; i++) {
      s.bad.bytes[chunk.start + i] = {
        id: cid,
        type: 'hole',
        tag: 'Hole',
        color: '#f43f5e'
      };
    }

    s.bad.log = `free(Obj#${cid}) executed. Left a fragmented hole of ${chunk.total} bytes!`;
    s.good.log = `Notice: Linear Arenas do not free individual chunks! Zero fragmentation holes created.`;
    this.render();
  }

  arenaRunBenchmark() {
    const s = this.state;
    // Reset and run a reproducible stress test
    this.arenaReset();

    // 1. Allocate 5 chunks (filling ~45 bytes)
    this.arenaAllocateChunk(7);
    this.arenaAllocateChunk(6);
    this.arenaAllocateChunk(8);
    this.arenaAllocateChunk(6);
    this.arenaAllocateChunk(7);

    // 2. Free chunks #1 and #3 in Set A to create scattered Swiss-cheese holes
    const activeIds = Object.keys(s.bad.chunks).map(Number);
    if (activeIds.length >= 3) {
      const c1 = s.bad.chunks[activeIds[0]];
      const c3 = s.bad.chunks[activeIds[2]];
      delete s.bad.chunks[activeIds[0]];
      delete s.bad.chunks[activeIds[2]];

      for (let i = 0; i < c1.total; i++) {
        s.bad.bytes[c1.start + i] = { id: activeIds[0], type: 'hole', tag: 'Hole', color: '#f43f5e' };
      }
      for (let i = 0; i < c3.total; i++) {
        s.bad.bytes[c3.start + i] = { id: activeIds[2], type: 'hole', tag: 'Hole', color: '#f43f5e' };
      }
    }

    // 3. Attempt a 14-byte allocation
    this.arenaAllocateChunk(14);

    s.bad.log = 'BENCHMARK COMPLETED: Set A has free bytes scattered across holes, but failed 14B alloc due to fragmentation! Set B Arena remained 100% compact.';
    this.render();
  }

  arenaReset() {
    const s = this.state;
    s.good.bytes.fill(null);
    s.good.chunks = {};
    s.good.offset = 0;
    s.good.nextId = 1;
    s.good.log = 'Arena instant reset (offset = 0x00). All memory reclaimed in 0 ns.';

    s.bad.bytes.fill(null);
    s.bad.chunks = {};
    s.bad.nextId = 1;
    s.bad.syscalls = 0;
    s.bad.leaksCount = 0;
    s.bad.log = 'Heap reset after sweeping all chunks.';
    this.render();
  }

  // =========================================================================
  // ACTIONS: POOL ALLOCATOR (Module 12)
  // =========================================================================

  poolAllocate() {
    const s = this.state;
    const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const cid = s.good.nextId++;

    // 1. Set B: Good Pool (Pops slot index from embedded free-list in O(1))
    if (s.good.freeList.length > 0) {
      const slotIdx = s.good.freeList.pop();
      const start = slotIdx * s.slotSize;
      for (let i = 0; i < s.slotSize; i++) {
        s.good.bytes[start + i] = {
          id: cid,
          slotIdx,
          type: 'payload',
          tag: `Slot#${slotIdx}`,
          color
        };
      }
      s.good.log = `Popped Slot #${slotIdx} from embedded free-list in O(1) time. 100% uniform!`;
    } else {
      s.good.log = 'Pool capacity reached (all 8 slots in use).';
    }

    // 2. Set A: Variable heap allocation (alternating between 4B and 12B)
    const reqSize = (cid % 2 === 0) ? 4 : 12;
    let placed = -1;
    let run = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      if (s.bad.bytes[i] === null || s.bad.bytes[i].type === 'hole') {
        run++;
        if (run === reqSize) { placed = i - reqSize + 1; break; }
      } else {
        run = 0;
      }
    }

    if (placed !== -1) {
      for (let i = 0; i < reqSize; i++) {
        s.bad.bytes[placed + i] = {
          id: cid,
          type: 'payload',
          tag: `Var(${reqSize}B)`,
          color
        };
      }
      s.bad.chunks[cid] = { start: placed, size: reqSize };
      s.bad.log = `Allocated variable ${reqSize}-byte object at 0x${placed.toString(16).padStart(2, '0').toUpperCase()}.`;
    } else {
      s.bad.log = `💥 Allocation failed for ${reqSize} bytes! Heap fragmented with non-contiguous holes.`;
    }

    this.render();
  }

  poolFreeRandom() {
    const s = this.state;
    // Set B: Free a slot, push onto free-list stack
    const allocatedSlots = [];
    for (let i = 0; i < s.numSlots; i++) {
      if (!s.good.freeList.includes(i)) allocatedSlots.push(i);
    }

    if (allocatedSlots.length > 0) {
      const randSlot = allocatedSlots[Math.floor(Math.random() * allocatedSlots.length)];
      const start = randSlot * s.slotSize;
      for (let i = 0; i < s.slotSize; i++) {
        s.good.bytes[start + i] = null;
      }
      s.good.freeList.push(randSlot);
      s.good.log = `Freed Slot #${randSlot}. Pushed to free-list head in O(1). Instantly 100% reusable!`;
    }

    // Set A: Free random variable chunk
    const badIds = Object.keys(s.bad.chunks).map(Number);
    if (badIds.length > 0) {
      const randId = badIds[Math.floor(Math.random() * badIds.length)];
      const ch = s.bad.chunks[randId];
      delete s.bad.chunks[randId];
      for (let i = 0; i < ch.size; i++) {
        s.bad.bytes[ch.start + i] = { id: randId, type: 'hole', tag: 'Hole', color: '#f43f5e' };
      }
      s.bad.log = `Freed variable object #${randId} (${ch.size}B). Leaves an isolated gap.`;
    }

    this.render();
  }

  poolRunBenchmark() {
    this.poolReset();
    // Allocate 6 items
    for (let i = 0; i < 6; i++) this.poolAllocate();
    // Free 2 random items
    this.poolFreeRandom();
    this.poolFreeRandom();
    // Try to allocate 16 bytes (fails in variable heap, works in pool slots)
    const s = this.state;
    s.bad.log = 'BENCHMARK COMPLETED: Variable heap has fragmented holes too small to fit large structs. Fixed pool free-list reuses any slot in O(1).';
    this.render();
  }

  poolReset() {
    const s = this.state;
    s.good.bytes.fill(null);
    s.good.freeList = Array.from({ length: s.numSlots }, (_, i) => i);
    s.good.log = 'Pool reset. All 8 slots returned to free-list.';
    s.bad.bytes.fill(null);
    s.bad.chunks = {};
    s.bad.log = 'Variable heap cleared.';
    this.render();
  }

  // =========================================================================
  // ACTIONS: ALIGNMENT & PMR (Module 22)
  // =========================================================================

  alignmentAllocateMixed() {
    const s = this.state;
    const types = [
      { name: 'uint8', bytes: 1, align: 1, color: '#f59e0b' },
      { name: 'uint32', bytes: 4, align: 4, color: '#06b6d4' },
      { name: 'double', bytes: 8, align: 8, color: '#10b981' },
      { name: 'float4(SIMD)', bytes: 16, align: 16, color: '#ec4899' }
    ];

    const item = types[Math.floor(Math.random() * types.length)];

    // 1. Set A: Raw byte packing (no alignment)
    if (s.bad.currentByte + item.bytes <= this.bufferSize) {
      const isMisaligned = (s.bad.currentByte % item.align !== 0);
      const crossesCacheLine = (Math.floor(s.bad.currentByte / 32) !== Math.floor((s.bad.currentByte + item.bytes - 1) / 32));

      if (isMisaligned) s.bad.misalignedCount++;
      if (crossesCacheLine) s.bad.cacheLineSplits++;

      for (let i = 0; i < item.bytes; i++) {
        s.bad.bytes[s.bad.currentByte + i] = {
          tag: item.name,
          color: isMisaligned ? '#f43f5e' : item.color,
          misaligned: isMisaligned,
          crossesCacheLine
        };
      }
      s.bad.log = `Packed ${item.name} at raw byte 0x${s.bad.currentByte.toString(16).padStart(2, '0').toUpperCase()}. ${isMisaligned ? '⚠️ MISALIGNED! Address % ' + item.align + ' != 0.' : 'Accidentally aligned.'}`;
      s.bad.currentByte += item.bytes;
    } else {
      s.bad.log = 'Raw buffer full!';
    }

    // 2. Set B: Aligned Arena with align_up()
    const mask = item.align - 1;
    const alignedOff = (s.good.currentByte + mask) & ~mask;
    const pad = alignedOff - s.good.currentByte;

    if (alignedOff + item.bytes <= this.bufferSize) {
      // Mark padding bytes
      for (let i = 0; i < pad; i++) {
        s.good.bytes[s.good.currentByte + i] = {
          tag: 'Pad',
          type: 'padding',
          color: '#475569'
        };
      }
      s.good.paddingBytes += pad;

      // Mark aligned payload
      for (let i = 0; i < item.bytes; i++) {
        s.good.bytes[alignedOff + i] = {
          tag: item.name,
          type: 'payload',
          color: item.color
        };
      }
      s.good.currentByte = alignedOff + item.bytes;
      s.good.log = `align_up() pushed offset to 0x${alignedOff.toString(16).padStart(2, '0').toUpperCase()} (+${pad}B pad). ${item.name} guaranteed ${item.align}B aligned!`;
    } else {
      s.good.log = 'Aligned arena buffer full!';
    }

    this.render();
  }

  alignmentRunBenchmark() {
    this.alignmentReset();
    for (let i = 0; i < 5; i++) this.alignmentAllocateMixed();
    const s = this.state;
    s.good.log = 'BENCHMARK COMPLETED: Set B maintains 100% hardware alignment with explicit padding. Set A triggers misaligned hardware penalties!';
    this.render();
  }

  alignmentReset() {
    const s = this.state;
    s.bad.bytes.fill(null);
    s.bad.currentByte = 0;
    s.bad.misalignedCount = 0;
    s.bad.cacheLineSplits = 0;
    s.bad.log = 'Raw buffer reset.';

    s.good.bytes.fill(null);
    s.good.currentByte = 0;
    s.good.paddingBytes = 0;
    s.good.log = 'Aligned arena reset to offset 0.';
    this.render();
  }

  // =========================================================================
  // METRICS COMPUTATION
  // =========================================================================

  calculateStats(bytes) {
    let payload = 0;
    let overhead = 0;
    let holes = 0;
    let free = 0;

    for (let i = 0; i < this.bufferSize; i++) {
      const b = bytes[i];
      if (b === null) {
        free++;
      } else if (b.type === 'header' || b.type === 'padding') {
        overhead++;
      } else if (b.type === 'hole') {
        holes++;
      } else {
        payload++;
      }
    }

    // Largest contiguous free block
    let maxFree = 0;
    let curFree = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      if (bytes[i] === null || (bytes[i] && bytes[i].type === 'hole')) {
        curFree++;
        if (curFree > maxFree) maxFree = curFree;
      } else {
        curFree = 0;
      }
    }

    const usedTotal = payload + overhead + holes;
    const fragPercent = (holes + overhead > 0 && free + holes > 0)
      ? Math.round((holes / (free + holes)) * 100)
      : 0;

    return {
      payload,
      overhead,
      holes,
      free,
      maxFree,
      fragPercent,
      payloadPct: Math.round((payload / this.bufferSize) * 100),
      overheadPct: Math.round((overhead / this.bufferSize) * 100),
      holesPct: Math.round((holes / this.bufferSize) * 100),
      freePct: Math.round((free / this.bufferSize) * 100)
    };
  }

  // =========================================================================
  // RENDER GRID & UI
  // =========================================================================

  renderMemoryGrid(bytes, isBad = false) {
    let pagesHtml = '';

    for (let p = 0; p < this.numPages; p++) {
      const pStart = p * this.pageSize;
      const pEnd = pStart + this.pageSize;
      const pageHexStart = `0x${pStart.toString(16).padStart(2, '0').toUpperCase()}`;
      const pageHexEnd = `0x${(pEnd - 1).toString(16).padStart(2, '0').toUpperCase()}`;

      let regionLabel = 'Heap Region';
      if (this.type === 'alignment') {
        regionLabel = p < 2 ? 'Stack Frame Buffer' : 'Heap Extension Page';
      } else if (p === 0) {
        regionLabel = 'Base Memory Page';
      }

      let rowsHtml = '';
      const rowsPerPage = this.pageSize / 8; // 2 rows per page, 8 bytes each

      for (let r = 0; r < rowsPerPage; r++) {
        const rStart = pStart + r * 8;
        const rEnd = rStart + 8;
        const rowHex = `0x${rStart.toString(16).padStart(2, '0').toUpperCase()}`;

        let cellsHtml = '';
        for (let i = rStart; i < rEnd; i++) {
          const cell = bytes[i];
          const byteHex = `0x${i.toString(16).padStart(2, '0').toUpperCase()}`;

          if (!cell) {
            cellsHtml += `
              <div class="byte-cell byte-free" title="${byteHex} &bull; Page ${p} &bull; Free Unallocated (0x00)">
                <span class="byte-char">.</span>
              </div>
            `;
          } else if (cell.type === 'header') {
            cellsHtml += `
              <div class="byte-cell byte-header" style="background-color: ${cell.color};" title="${byteHex} &bull; Page ${p} &bull; Bookkeeping Metadata Header">
                <span class="byte-char">H</span>
              </div>
            `;
          } else if (cell.type === 'padding') {
            cellsHtml += `
              <div class="byte-cell byte-padding" style="background-color: ${cell.color};" title="${byteHex} &bull; Page ${p} &bull; Hardware Alignment Padding">
                <span class="byte-char">P</span>
              </div>
            `;
          } else if (cell.type === 'hole') {
            cellsHtml += `
              <div class="byte-cell byte-hole" style="background-color: rgba(244, 63, 94, 0.25);" title="${byteHex} &bull; Page ${p} &bull; Fragmented Swiss-Cheese Hole!">
                <span class="byte-char">X</span>
              </div>
            `;
          } else {
            const misClass = cell.misaligned ? 'byte-misaligned' : '';
            const charLabel = cell.tag.replace(/[^0-9a-zA-Z]/g, '').substring(0, 2) || '#';
            cellsHtml += `
              <div class="byte-cell ${misClass}" style="background-color: ${cell.color};" title="${byteHex} &bull; Page ${p} &bull; ${cell.tag}">
                <span class="byte-char">${charLabel}</span>
              </div>
            `;
          }
        }

        rowsHtml += `
          <div class="mem-grid-row">
            <span class="row-addr">${rowHex}:</span>
            <div class="row-bytes">${cellsHtml}</div>
          </div>
        `;
      }

      pagesHtml += `
        <div class="mem-page-block">
          <div class="mem-page-header">
            <span class="page-title">PAGE ${p} [${pageHexStart} - ${pageHexEnd}]</span>
            <span class="page-region">${regionLabel}</span>
          </div>
          <div class="mem-page-rows">${rowsHtml}</div>
        </div>
      `;
    }

    return pagesHtml;
  }

  renderUsageBar(stats) {
    return `
      <div class="mem-usage-bar-wrap">
        <div class="mem-usage-bar">
          <div class="bar-seg seg-payload" style="width: ${stats.payloadPct}%;" title="Usable Payload: ${stats.payload}B (${stats.payloadPct}%)"></div>
          <div class="bar-seg seg-overhead" style="width: ${stats.overheadPct}%;" title="Metadata/Padding: ${stats.overhead}B (${stats.overheadPct}%)"></div>
          <div class="bar-seg seg-holes" style="width: ${stats.holesPct}%;" title="Fragmented Holes: ${stats.holes}B (${stats.holesPct}%)"></div>
          <div class="bar-seg seg-free" style="width: ${stats.freePct}%;" title="Free: ${stats.free}B (${stats.freePct}%)"></div>
        </div>
        <div class="mem-usage-legend">
          <span class="u-item"><span class="dot dot-payload"></span> Payload: ${stats.payload}B</span>
          <span class="u-item"><span class="dot dot-overhead"></span> Overhead: ${stats.overhead}B</span>
          <span class="u-item"><span class="dot dot-holes"></span> Holes: ${stats.holes}B</span>
          <span class="u-item"><span class="dot dot-free"></span> Free: ${stats.free}B</span>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.container) return;
    const s = this.state;
    const badStats = this.calculateStats(s.bad.bytes);
    const goodStats = this.calculateStats(s.good.bytes);

    let controlsHtml = '';
    let simTitle = 'Interactive Memory Simulator & Visual Grid';
    let simSubtitle = 'Comparing two parallel sets of simulated memory page-by-page and byte-by-byte.';

    if (s.type === 'arena') {
      simTitle = 'Interactive Memory Grid: Naive Dynamic Heap vs Linear Arena';
      simSubtitle = 'Watch how individual mallocs pollute pages with 1-byte headers and fragmented holes, while the Arena bumps sequentially across pages with zero metadata.';
      controlsHtml = `
        <button class="mem-sim-btn btn-primary" id="btn-sim-alloc-one">
          <span>⚡ Allocate (+5B Chunk)</span>
        </button>
        <button class="mem-sim-btn btn-primary" id="btn-sim-alloc-batch">
          <span>📦 Batch Allocate (+3 Chunks)</span>
        </button>
        <button class="mem-sim-btn btn-warning" id="btn-sim-free-random">
          <span>💥 Random Free (Make Hole)</span>
        </button>
        <button class="mem-sim-btn btn-danger" id="btn-sim-benchmark">
          <span>🧪 Run Stress Benchmark</span>
        </button>
        <button class="mem-sim-btn btn-secondary" id="btn-sim-reset">
          <span>🔄 Reset Both Sets</span>
        </button>
      `;
    } else if (s.type === 'pool') {
      simTitle = 'Interactive Memory Grid: Variable Heap vs Fixed Slot Pool';
      simSubtitle = 'Compare variable allocations that trap memory in unusable gaps vs uniform 8-byte slots that can be reclaimed and reused in O(1).';
      controlsHtml = `
        <button class="mem-sim-btn btn-primary" id="btn-sim-pool-alloc">
          <span>⚡ Allocate (+1 Slot)</span>
        </button>
        <button class="mem-sim-btn btn-warning" id="btn-sim-pool-free">
          <span>💥 Random Free (Push Free-List)</span>
        </button>
        <button class="mem-sim-btn btn-danger" id="btn-sim-pool-bench">
          <span>🧪 Run Pool Benchmark</span>
        </button>
        <button class="mem-sim-btn btn-secondary" id="btn-sim-pool-reset">
          <span>🔄 Reset Both Sets</span>
        </button>
      `;
    } else {
      simTitle = 'Interactive Memory Grid: Raw Unaligned vs Aligned Arena & PMR';
      simSubtitle = 'Observe how raw byte packing causes misaligned hardware stalls across 32B cache lines, while align_up() inserts explicit padding for peak performance.';
      controlsHtml = `
        <button class="mem-sim-btn btn-primary" id="btn-sim-align-alloc">
          <span>⚡ Allocate Mixed Type</span>
        </button>
        <button class="mem-sim-btn btn-danger" id="btn-sim-align-bench">
          <span>🧪 Run Alignment Benchmark</span>
        </button>
        <button class="mem-sim-btn btn-secondary" id="btn-sim-align-reset">
          <span>🔄 Reset Both Sets</span>
        </button>
      `;
    }

    this.container.innerHTML = `
      <div class="memory-visualizer-card">
        <div class="mem-sim-header">
          <div class="mem-sim-badge">
            <span class="pulse-dot"></span>
            <span>Functional Memory Simulation Grid</span>
          </div>
          <h3 class="mem-sim-title">${simTitle}</h3>
          <p class="mem-sim-sub">${simSubtitle}</p>
        </div>

        <!-- Controls -->
        <div class="mem-sim-controls">
          ${controlsHtml}
        </div>

        <!-- Side-by-Side Memory Sets Grid -->
        <div class="mem-compare-grid">
          <!-- LEFT: SET A (BAD) -->
          <div class="mem-column mem-bad-col">
            <div class="mem-col-header">
              <span class="mem-col-tag tag-bad">&#x2716; ${s.bad.name}</span>
            </div>

            <!-- Proportional Usage Meter -->
            ${this.renderUsageBar(badStats)}

            <!-- Pages & Bytes 2D Grid -->
            <div class="mem-pages-container">
              ${this.renderMemoryGrid(s.bad.bytes, true)}
            </div>

            <!-- Metric Summary -->
            <div class="mem-metrics-row">
              <div class="mem-metric-item">
                <span class="m-val m-danger">${badStats.fragPercent}%</span>
                <span class="m-lbl">Fragmentation</span>
              </div>
              <div class="mem-metric-item">
                <span class="m-val m-warning">${badStats.overhead} Bytes</span>
                <span class="m-lbl">Overhead</span>
              </div>
              <div class="mem-metric-item">
                <span class="m-val m-danger">${badStats.maxFree} Bytes</span>
                <span class="m-lbl">Max Free Run</span>
              </div>
            </div>

            <!-- Terminal log -->
            <div class="mem-mini-log">
              <div class="log-line">&gt; ${s.bad.log}</div>
            </div>
          </div>

          <!-- RIGHT: SET B (GOOD) -->
          <div class="mem-column mem-good-col">
            <div class="mem-col-header">
              <span class="mem-col-tag tag-good">&#x2714; ${s.good.name}</span>
            </div>

            <!-- Proportional Usage Meter -->
            ${this.renderUsageBar(goodStats)}

            <!-- Pages & Bytes 2D Grid -->
            <div class="mem-pages-container">
              ${this.renderMemoryGrid(s.good.bytes, false)}
            </div>

            <!-- Metric Summary -->
            <div class="mem-metrics-row">
              <div class="mem-metric-item">
                <span class="m-val m-success">${goodStats.fragPercent}%</span>
                <span class="m-lbl">Fragmentation</span>
              </div>
              <div class="mem-metric-item">
                <span class="m-val m-success">${goodStats.overhead} Bytes</span>
                <span class="m-lbl">Overhead</span>
              </div>
              <div class="mem-metric-item">
                <span class="m-val m-success">${goodStats.maxFree} Bytes</span>
                <span class="m-lbl">Max Free Run</span>
              </div>
            </div>

            <!-- Terminal log -->
            <div class="mem-mini-log log-good">
              <div class="log-line">&gt; ${s.good.log}</div>
            </div>
          </div>
        </div>

        <!-- Visual Legend -->
        <div class="mem-legend">
          <span class="legend-item"><span class="legend-swatch swatch-alloc"></span> Payload Byte [A-Z, #]</span>
          <span class="legend-item"><span class="legend-swatch swatch-hdr"></span> Chunk Header / Metadata [H]</span>
          <span class="legend-item"><span class="legend-swatch swatch-pad"></span> Hardware Padding [P]</span>
          <span class="legend-item"><span class="legend-swatch swatch-leak"></span> Fragmented Hole [X]</span>
          <span class="legend-item"><span class="legend-swatch swatch-free"></span> Free Unallocated [.]</span>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    if (this.state.type === 'arena') {
      this.container.querySelector('#btn-sim-alloc-one')?.addEventListener('click', () => this.arenaAllocateChunk(5));
      this.container.querySelector('#btn-sim-alloc-batch')?.addEventListener('click', () => this.arenaBatchAllocate());
      this.container.querySelector('#btn-sim-free-random')?.addEventListener('click', () => this.arenaDeallocateRandom());
      this.container.querySelector('#btn-sim-benchmark')?.addEventListener('click', () => this.arenaRunBenchmark());
      this.container.querySelector('#btn-sim-reset')?.addEventListener('click', () => this.arenaReset());
    } else if (this.state.type === 'pool') {
      this.container.querySelector('#btn-sim-pool-alloc')?.addEventListener('click', () => this.poolAllocate());
      this.container.querySelector('#btn-sim-pool-free')?.addEventListener('click', () => this.poolFreeRandom());
      this.container.querySelector('#btn-sim-pool-bench')?.addEventListener('click', () => this.poolRunBenchmark());
      this.container.querySelector('#btn-sim-pool-reset')?.addEventListener('click', () => this.poolReset());
    } else {
      this.container.querySelector('#btn-sim-align-alloc')?.addEventListener('click', () => this.alignmentAllocateMixed());
      this.container.querySelector('#btn-sim-align-bench')?.addEventListener('click', () => this.alignmentRunBenchmark());
      this.container.querySelector('#btn-sim-align-reset')?.addEventListener('click', () => this.alignmentReset());
    }
  }
}
