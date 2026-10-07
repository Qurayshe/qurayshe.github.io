/**
 * Interactive Memory Management Visualizer
 * Provides live side-by-side comparisons of memory management techniques:
 * 1. Module 05: Naive malloc/free (fragmented & leaky) vs Linear Arena (bump allocation)
 * 2. Module 12: Variable-size malloc (external fragmentation) vs Fixed-Size Pool with embedded free-list
 * 3. Module 22: Misaligned raw allocations (cache line splits/UB) vs Aligned Arena & PMR
 */

export class MemoryVisualizer {
  constructor(container, type = 'arena') {
    this.container = container;
    this.type = type; // 'arena', 'pool', or 'alignment'
    this.state = this.getInitialState(type);
    this.render();
  }

  getInitialState(type) {
    const totalSlots = 32; // 32 slots representing a 512-byte buffer (16 bytes per slot)
    if (type === 'arena') {
      return {
        type: 'arena',
        totalSlots,
        // Bad side: Naive heap
        bad: {
          slots: new Array(totalSlots).fill(null), // null = free, object = { id, color, tag, isHeader, isLeak }
          nextId: 1,
          syscalls: 0,
          leaksCount: 0,
          allocatedBytes: 0,
          logs: ['Heap initialized via OS. No allocations yet.']
        },
        // Good side: Arena
        good: {
          slots: new Array(totalSlots).fill(null), // null = unused, object = { id, color, tag }
          offset: 0,
          nextId: 1,
          syscalls: 1, // Single initial backing malloc!
          leaksCount: 0,
          allocatedBytes: 0,
          logs: ['Arena pre-allocated single 512B buffer in 1 syscall. Ready!']
        }
      };
    } else if (type === 'pool') {
      const slotCount = 16;
      return {
        type: 'pool',
        slotCount,
        // Bad side: Variable-size malloc
        bad: {
          slots: new Array(slotCount).fill(null), // null = free, { id, size, tag }
          fragmentedHoles: 0,
          logs: ['Variable-size heap ready.']
        },
        // Good side: Fixed size pool with embedded free list
        good: {
          slots: new Array(slotCount).fill(null), // null = in free list, { id, tag }
          freeList: Array.from({ length: slotCount }, (_, i) => i), // stack of free indices
          logs: ['Pool initialized with 16 uniform slots (O(1) free list).']
        }
      };
    } else {
      // Alignment
      return {
        type: 'alignment',
        totalSlots: 16, // Each slot is 4 bytes (total 64 bytes = 1 cache line)
        bad: {
          slots: new Array(16).fill(null),
          misalignedCount: 0,
          cacheSplits: 0,
          currentByteOff: 0,
          logs: ['Raw byte packing initialized (no alignment checks).']
        },
        good: {
          slots: new Array(16).fill(null),
          paddingSlots: 0,
          currentByteOff: 0,
          logs: ['Aligned arena initialized (strict power-of-two align_up).']
        }
      };
    }
  }

  // =========================================================================
  // ACTIONS: ARENA (Module 05)
  // =========================================================================

  arenaAllocateBatch() {
    const s = this.state;
    const colors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24'];

    for (let i = 0; i < 3; i++) {
      const itemSize = (i % 2 === 0) ? 2 : 3; // 2 or 3 slots
      const color = colors[s.good.nextId % colors.length];
      const tag = `Obj#${s.good.nextId}`;

      // 1. Good side: Bump arena
      if (s.good.offset + itemSize <= s.totalSlots) {
        for (let j = 0; j < itemSize; j++) {
          s.good.slots[s.good.offset + j] = { id: s.good.nextId, color, tag };
        }
        s.good.offset += itemSize;
        s.good.allocatedBytes += itemSize * 16;
      }

      // 2. Bad side: Naive malloc (requires 1 slot chunk header overhead!)
      const totalNeeded = itemSize + 1; // 1 slot overhead for glibc metadata header
      let placedIdx = -1;
      for (let j = 0; j <= s.totalSlots - totalNeeded; j++) {
        let fits = true;
        for (let k = 0; k < totalNeeded; k++) {
          if (s.bad.slots[j + k] !== null) { fits = false; break; }
        }
        if (fits) { placedIdx = j; break; }
      }

      if (placedIdx !== -1) {
        // Metadata header
        s.bad.slots[placedIdx] = { id: s.good.nextId, color: '#a855f7', tag: 'Header(16B)', isHeader: true };
        for (let k = 1; k < totalNeeded; k++) {
          s.bad.slots[placedIdx + k] = { id: s.good.nextId, color, tag, isHeader: false };
        }
        s.bad.syscalls++;
        s.bad.allocatedBytes += totalNeeded * 16;
      }

      s.good.nextId++;
      s.bad.nextId++;
    }

    s.good.logs.unshift(`Bumped arena offset to ${s.good.offset * 16}B (0 fragmentation, 0 syscalls).`);
    s.bad.logs.unshift(`Allocated 3 objects with separate malloc() calls (+16B header per alloc, 3 syscalls).`);
    this.render();
  }

  arenaDeallocateRandom() {
    const s = this.state;
    // On the bad side: Freeing individual items randomly causes fragmentation holes!
    const activeIds = [];
    s.bad.slots.forEach(slot => {
      if (slot && !slot.isHeader && !activeIds.includes(slot.id)) {
        activeIds.push(slot.id);
      }
    });

    if (activeIds.length === 0) {
      s.bad.logs.unshift('No allocations left to free.');
      this.render();
      return;
    }

    // Pick a random object to free
    const targetId = activeIds[Math.floor(Math.random() * activeIds.length)];
    let freedSlots = 0;
    for (let i = 0; i < s.totalSlots; i++) {
      if (s.bad.slots[i] && s.bad.slots[i].id === targetId) {
        s.bad.slots[i] = null; // Free slot leaves hole!
        freedSlots++;
      }
    }

    s.bad.logs.unshift(`free(Obj#${targetId}) called. Created fragmented hole of ${freedSlots * 16}B!`);
    s.good.logs.unshift(`Notice: Arenas don't individually free objects! Zero fragmentation overhead.`);
    this.render();
  }

  arenaSimulateLeak() {
    const s = this.state;
    // On the bad side: An object is lost (never freed, memory leak)
    const activeIds = [];
    s.bad.slots.forEach(slot => {
      if (slot && !slot.isHeader && !slot.isLeak && !activeIds.includes(slot.id)) {
        activeIds.push(slot.id);
      }
    });

    if (activeIds.length > 0) {
      const targetId = activeIds[0];
      s.bad.slots.forEach(slot => {
        if (slot && slot.id === targetId) {
          slot.isLeak = true;
          slot.color = '#ef4444';
          slot.tag = `LEAK(#${targetId})`;
        }
      });
      s.bad.leaksCount++;
      s.bad.logs.unshift(`Lost pointer to Obj#${targetId}! Heap memory leak permanently held hostage!`);
    } else {
      s.bad.logs.unshift(`Allocate some objects first before simulating leaks!`);
    }
    this.render();
  }

  arenaResetAll() {
    const s = this.state;
    // Good side: O(1) Instant wipe!
    s.good.slots.fill(null);
    s.good.offset = 0;
    s.good.logs.unshift(`arena.reset() called! All memory reclaimed in 0 nanoseconds (offset = 0)!`);

    // Bad side: What happens if there were leaks?
    if (s.bad.leaksCount > 0) {
      s.bad.logs.unshift(`Attempted cleanup: Leaked blocks cannot be freed because pointers were lost!`);
    } else {
      s.bad.slots.fill(null);
      s.bad.syscalls = 0;
      s.bad.logs.unshift(`All malloc pointers manually freed with loop.`);
    }
    this.render();
  }

  // =========================================================================
  // ACTIONS: POOL ALLOCATOR (Module 12)
  // =========================================================================

  poolAllocate() {
    const s = this.state;
    const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    for (let k = 0; k < 2; k++) {
      const color = colors[Math.floor(Math.random() * colors.length)];

      // Good side: Pop from free list (O(1))
      if (s.good.freeList.length > 0) {
        const slotIdx = s.good.freeList.pop();
        s.good.slots[slotIdx] = { id: slotIdx + 1, color, tag: `Slot#${slotIdx}` };
      }

      // Bad side: Variable-size malloc (alternating 1 and 2 slots)
      const reqSize = (k % 2 === 0) ? 1 : 2;
      let placedIdx = -1;
      for (let i = 0; i <= s.slotCount - reqSize; i++) {
        let ok = true;
        for (let j = 0; j < reqSize; j++) {
          if (s.bad.slots[i + j] !== null) { ok = false; break; }
        }
        if (ok) { placedIdx = i; break; }
      }

      if (placedIdx !== -1) {
        for (let j = 0; j < reqSize; j++) {
          s.bad.slots[placedIdx + j] = { id: placedIdx + 1, color, tag: `Var(${reqSize * 32}B)` };
        }
      }
    }

    s.good.logs.unshift(`Popped slot from embedded free list in O(1). Zero searching!`);
    s.bad.logs.unshift(`Searched heap free list linearly to find contiguous fitting blocks.`);
    this.render();
  }

  poolFreeRandom() {
    const s = this.state;
    // Good side: Pick an allocated slot, push to free list
    const goodAllocated = [];
    s.good.slots.forEach((slot, idx) => { if (slot !== null) goodAllocated.push(idx); });

    if (goodAllocated.length > 0) {
      const randIdx = goodAllocated[Math.floor(Math.random() * goodAllocated.length)];
      s.good.slots[randIdx] = null;
      s.good.freeList.push(randIdx);
      s.good.logs.unshift(`Pushed Slot#${randIdx} onto free list head in O(1). Instantly reusable!`);
    }

    // Bad side: Free random item
    const badAllocated = [];
    s.bad.slots.forEach((slot, idx) => { if (slot !== null) badAllocated.push(idx); });
    if (badAllocated.length > 0) {
      const randIdx = badAllocated[Math.floor(Math.random() * badAllocated.length)];
      const targetId = s.bad.slots[randIdx].id;
      for (let i = 0; i < s.slotCount; i++) {
        if (s.bad.slots[i] && s.bad.slots[i].id === targetId) {
          s.bad.slots[i] = null;
        }
      }
      s.bad.logs.unshift(`Freed variable block. Leaves isolated holes!`);
    }
    this.render();
  }

  poolTriggerOOM() {
    const s = this.state;
    // Try to allocate a 3-slot item on both
    let badCanFit = false;
    for (let i = 0; i <= s.slotCount - 3; i++) {
      if (s.bad.slots[i] === null && s.bad.slots[i + 1] === null && s.bad.slots[i + 2] === null) {
        badCanFit = true;
        break;
      }
    }

    const badTotalFree = s.bad.slots.filter(s => s === null).length;
    if (!badCanFit && badTotalFree >= 3) {
      s.bad.logs.unshift(`💥 CRITICAL FRAGMENTATION ERROR: 3 slots free (${badTotalFree * 32}B), but scattered! Allocation FAILED!`);
    } else {
      s.bad.logs.unshift(`Attempted large allocation. Current contiguous space: ${badCanFit ? 'available' : 'insufficient'}.`);
    }

    s.good.logs.unshift(`Pools eliminate external fragmentation: Every single freed slot fits any incoming entity.`);
    this.render();
  }

  poolResetAll() {
    const s = this.state;
    s.good.slots.fill(null);
    s.good.freeList = Array.from({ length: s.slotCount }, (_, i) => i);
    s.bad.slots.fill(null);
    s.good.logs.unshift(`All pool slots reclaimed into free list.`);
    s.bad.logs.unshift(`Heap cleared.`);
    this.render();
  }

  // =========================================================================
  // ACTIONS: ALIGNMENT (Module 22)
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
    const slotsNeeded = Math.ceil(item.bytes / 4); // each slot is 4 bytes

    // 1. Bad side: Pack bytes without alignment
    const badStartSlot = Math.floor(s.bad.currentByteOff / 4);
    if (badStartSlot + slotsNeeded <= 16) {
      const isMisaligned = (s.bad.currentByteOff % item.align !== 0);
      if (isMisaligned) {
        s.bad.misalignedCount++;
        s.bad.cacheSplits++;
      }
      for (let i = 0; i < slotsNeeded; i++) {
        s.bad.slots[badStartSlot + i] = {
          tag: item.name,
          color: isMisaligned ? '#f43f5e' : item.color,
          misaligned: isMisaligned
        };
      }
      s.bad.currentByteOff += item.bytes;
      s.bad.logs.unshift(`Allocated ${item.name} (${item.bytes}B) at raw byte offset ${s.bad.currentByteOff - item.bytes}. ${isMisaligned ? '⚠️ MISALIGNED! Crossing cache line!' : 'Aligned by luck.'}`);
    } else {
      s.bad.logs.unshift('Buffer full!');
    }

    // 2. Good side: align_up
    const mask = item.align - 1;
    const alignedByteOff = (s.good.currentByteOff + mask) & ~mask;
    const paddingBytes = alignedByteOff - s.good.currentByteOff;
    const goodStartSlot = Math.floor(alignedByteOff / 4);

    if (goodStartSlot + slotsNeeded <= 16) {
      // Show padding slots if padding >= 4 bytes
      const paddingSlots = Math.floor(paddingBytes / 4);
      for (let p = 0; p < paddingSlots; p++) {
        s.good.slots[Math.floor(s.good.currentByteOff / 4) + p] = {
          tag: 'Pad',
          color: '#475569',
          isPadding: true
        };
      }
      for (let i = 0; i < slotsNeeded; i++) {
        s.good.slots[goodStartSlot + i] = {
          tag: item.name,
          color: item.color,
          misaligned: false
        };
      }
      s.good.currentByteOff = alignedByteOff + item.bytes;
      s.good.logs.unshift(`align_up() pushed offset to byte ${alignedByteOff}. ${item.name} is guaranteed aligned to ${item.align}B!`);
    } else {
      s.good.logs.unshift('Arena full!');
    }

    this.render();
  }

  alignmentTestSIMD() {
    const s = this.state;
    if (s.bad.misalignedCount > 0) {
      s.bad.logs.unshift(`💥 SIMD CRASH: _mm256_load_ps executed on misaligned pointer! Hardware General Protection Fault (GPF)!`);
    } else {
      s.bad.logs.unshift(`No misaligned items found yet. Try allocating more mixed types!`);
    }
    s.good.logs.unshift(`✅ SIMD SUCCESS: Aligned arena guarantees 16/32-byte alignment. Single-cycle AVX2 load executed cleanly!`);
    this.render();
  }

  alignmentResetAll() {
    const s = this.state;
    s.bad.slots.fill(null);
    s.bad.misalignedCount = 0;
    s.bad.cacheSplits = 0;
    s.bad.currentByteOff = 0;
    s.bad.logs.unshift('Buffer cleared.');

    s.good.slots.fill(null);
    s.good.currentByteOff = 0;
    s.good.logs.unshift('Aligned arena reset to offset 0.');
    this.render();
  }

  // =========================================================================
  // CALCULATE METRICS
  // =========================================================================

  getMetrics() {
    const s = this.state;
    if (s.type === 'arena') {
      // Calculate bad fragmentation: isolated null slots surrounded by non-null
      let holes = 0;
      let inHole = false;
      for (let i = 0; i < s.totalSlots; i++) {
        if (s.bad.slots[i] === null) {
          if (!inHole && i > 0 && s.bad.slots[i - 1] !== null) {
            holes++;
          }
          inHole = true;
        } else {
          inHole = false;
        }
      }
      const badFreeSlots = s.bad.slots.filter(x => x === null).length;
      const fragPercent = badFreeSlots > 0 ? Math.min(100, Math.round((holes / (s.totalSlots / 4)) * 100)) : 0;

      return {
        bad: {
          syscalls: s.bad.syscalls,
          fragmentation: `${fragPercent}%`,
          leaks: `${s.bad.leaksCount} blocks`,
          allocSpeed: 'O(N) Search',
          cleanupSpeed: 'O(N) Pointer Tracking'
        },
        good: {
          syscalls: '1 (Pre-allocated)',
          fragmentation: '0%',
          leaks: '0 (Guaranteed)',
          allocSpeed: 'O(1) Bump Offset',
          cleanupSpeed: 'O(1) Instant (offset=0)'
        }
      };
    } else if (s.type === 'pool') {
      const badHoles = s.bad.slots.filter(x => x === null).length;
      return {
        bad: {
          fragmentation: `${Math.round((badHoles / s.slotCount) * 100)}% scattered`,
          allocSpeed: 'O(N) Free-List Search',
          slotReuse: 'Variable (Holes may not fit)'
        },
        good: {
          fragmentation: '0% (Uniform Slots)',
          allocSpeed: 'O(1) Pop Free-List Head',
          slotReuse: '100% Guaranteed Reusable'
        }
      };
    } else {
      return {
        bad: {
          misaligned: `${s.bad.misalignedCount} hazards`,
          cacheSplits: `${s.bad.cacheSplits} split lines`,
          simdSafety: s.bad.misalignedCount > 0 ? 'FAIL (Undefined Behavior / Crash)' : 'Passing'
        },
        good: {
          misaligned: '0 (Enforced by align_up)',
          cacheSplits: '0 (Cache Aligned)',
          simdSafety: 'PASS (Zero-Penalty Load)'
        }
      };
    }
  }

  // =========================================================================
  // RENDER UI
  // =========================================================================

  render() {
    if (!this.container) return;
    const metrics = this.getMetrics();
    const s = this.state;

    let titleText = 'Interactive Memory Lab: Allocator Comparison';
    let subtitleText = 'Compare the naive "bad" approach side-by-side against the engineering technique.';
    let actionButtonsHtml = '';

    if (s.type === 'arena') {
      titleText = 'Interactive Memory Lab: Naive Heap vs Linear Arena';
      subtitleText = 'Watch how naive malloc/free causes fragmentation holes and leaks, while the Arena bumps forward with 0% fragmentation and resets in O(1).';
      actionButtonsHtml = `
        <button class="mem-sim-btn btn-primary" id="btn-arena-alloc">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline></svg>
          <span>Allocate Batch (+3 Objs)</span>
        </button>
        <button class="mem-sim-btn btn-warning" id="btn-arena-free">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          <span>Random Free (Fragment Heap)</span>
        </button>
        <button class="mem-sim-btn btn-danger" id="btn-arena-leak">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Simulate Memory Leak</span>
        </button>
        <button class="mem-sim-btn btn-secondary" id="btn-arena-reset">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          <span>Reset All Memory</span>
        </button>
      `;
    } else if (s.type === 'pool') {
      titleText = 'Interactive Memory Lab: Variable Malloc vs Fixed Pool';
      subtitleText = 'See how scattered variable allocations make it impossible to allocate new blocks, while uniform Pool slots are 100% reusable via free-lists.';
      actionButtonsHtml = `
        <button class="mem-sim-btn btn-primary" id="btn-pool-alloc">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Spawn Entities (+2)</span>
        </button>
        <button class="mem-sim-btn btn-warning" id="btn-pool-free">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          <span>Despawn Random (Free Slot)</span>
        </button>
        <button class="mem-sim-btn btn-danger" id="btn-pool-oom">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Try Allocate 3-Slot Block</span>
        </button>
        <button class="mem-sim-btn btn-secondary" id="btn-pool-reset">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          <span>Reset Pool</span>
        </button>
      `;
    } else {
      titleText = 'Interactive Memory Lab: Misaligned Raw vs Aligned Arena';
      subtitleText = 'Compare misaligned byte packing (split cache lines and SIMD crashes) against strict hardware alignment with align_up().';
      actionButtonsHtml = `
        <button class="mem-sim-btn btn-primary" id="btn-align-alloc">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Allocate Mixed Type</span>
        </button>
        <button class="mem-sim-btn btn-danger" id="btn-align-simd">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          <span>Run 16B SIMD Load Test</span>
        </button>
        <button class="mem-sim-btn btn-secondary" id="btn-align-reset">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          <span>Reset Arena</span>
        </button>
      `;
    }

    // Render slots for Bad side
    const badSlotsHtml = s.bad.slots.map((slot, i) => {
      const addrHex = `0x${(i * 16).toString(16).padStart(2, '0').toUpperCase()}`;
      if (!slot) {
        return `<div class="mem-cell mem-free" title="Offset ${addrHex} &bull; Free memory hole"><span class="mem-cell-idx">${i}</span></div>`;
      }
      const isHdr = slot.isHeader ? 'mem-header' : '';
      const isLk = slot.isLeak ? 'mem-leak' : '';
      const isMis = slot.misaligned ? 'mem-misaligned' : '';
      return `<div class="mem-cell ${isHdr} ${isLk} ${isMis}" style="background-color: ${slot.color};" title="Offset ${addrHex} &bull; ${slot.tag}"><span class="mem-cell-idx">${i}</span><span class="mem-cell-label">${slot.tag.substring(0, 5)}</span></div>`;
    }).join('');

    // Render slots for Good side
    const goodSlotsHtml = s.good.slots.map((slot, i) => {
      const addrHex = `0x${(i * 16).toString(16).padStart(2, '0').toUpperCase()}`;
      if (!slot) {
        return `<div class="mem-cell mem-free" title="Offset ${addrHex} &bull; Unused capacity"><span class="mem-cell-idx">${i}</span></div>`;
      }
      const isPad = slot.isPadding ? 'mem-padding' : '';
      return `<div class="mem-cell ${isPad}" style="background-color: ${slot.color};" title="Offset ${addrHex} &bull; ${slot.tag}"><span class="mem-cell-idx">${i}</span><span class="mem-cell-label">${slot.tag.substring(0, 5)}</span></div>`;
    }).join('');

    // HTML Output
    this.container.innerHTML = `
      <div class="memory-visualizer-card">
        <div class="mem-sim-header">
          <div class="mem-sim-badge">
            <span class="pulse-dot"></span>
            <span>Live Memory Simulator</span>
          </div>
          <h3 class="mem-sim-title">${titleText}</h3>
          <p class="mem-sim-sub">${subtitleText}</p>
        </div>

        <!-- Action Control Bar -->
        <div class="mem-sim-controls">
          ${actionButtonsHtml}
        </div>

        <!-- Side-by-Side Comparison Container -->
        <div class="mem-compare-grid">
          <!-- LEFT: BAD APPROACH -->
          <div class="mem-column mem-bad-col">
            <div class="mem-col-header">
              <span class="mem-col-tag tag-bad">&#x2716; Naive / Unoptimized</span>
              <div class="mem-col-title">
                ${s.type === 'arena' ? 'Individual malloc() / free()' : (s.type === 'pool' ? 'Variable-Size Malloc' : 'Misaligned Byte Packing')}
              </div>
            </div>

            <!-- Memory Strip -->
            <div class="mem-strip-wrap">
              <div class="mem-strip-label">Heap Memory Space (512 Bytes)</div>
              <div class="mem-strip-cells">${badSlotsHtml}</div>
            </div>

            <!-- Live Metrics -->
            <div class="mem-metrics-row">
              ${s.type === 'arena' ? `
                <div class="mem-metric-item"><span class="m-val m-danger">${metrics.bad.fragmentation}</span><span class="m-lbl">Fragmentation</span></div>
                <div class="mem-metric-item"><span class="m-val m-warning">${metrics.bad.syscalls}</span><span class="m-lbl">Syscalls</span></div>
                <div class="mem-metric-item"><span class="m-val m-danger">${metrics.bad.leaks}</span><span class="m-lbl">Memory Leaks</span></div>
              ` : (s.type === 'pool' ? `
                <div class="mem-metric-item"><span class="m-val m-danger">${metrics.bad.fragmentation}</span><span class="m-lbl">External Frag</span></div>
                <div class="mem-metric-item"><span class="m-val m-warning">${metrics.bad.allocSpeed}</span><span class="m-lbl">Latency</span></div>
              ` : `
                <div class="mem-metric-item"><span class="m-val m-danger">${metrics.bad.misaligned}</span><span class="m-lbl">Unaligned Slots</span></div>
                <div class="mem-metric-item"><span class="m-val m-danger">${metrics.bad.simdSafety}</span><span class="m-lbl">SIMD Safety</span></div>
              `)}
            </div>

            <!-- Terminal Log -->
            <div class="mem-mini-log">
              <div class="log-line">&gt; ${s.bad.logs[0] || 'Ready'}</div>
            </div>
          </div>

          <!-- RIGHT: GOOD TECHNIQUE -->
          <div class="mem-column mem-good-col">
            <div class="mem-col-header">
              <span class="mem-col-tag tag-good">&#x2714; Engineering Technique</span>
              <div class="mem-col-title">
                ${s.type === 'arena' ? 'Contiguous Arena Allocator' : (s.type === 'pool' ? 'Fixed Pool & Free-List' : 'Aligned Arena (align_up)')}
              </div>
            </div>

            <!-- Memory Strip -->
            <div class="mem-strip-wrap">
              <div class="mem-strip-label">Arena / Pool Contiguous Buffer</div>
              <div class="mem-strip-cells">${goodSlotsHtml}</div>
            </div>

            <!-- Live Metrics -->
            <div class="mem-metrics-row">
              ${s.type === 'arena' ? `
                <div class="mem-metric-item"><span class="m-val m-success">${metrics.good.fragmentation}</span><span class="m-lbl">Fragmentation</span></div>
                <div class="mem-metric-item"><span class="m-val m-success">${metrics.good.syscalls}</span><span class="m-lbl">Syscalls</span></div>
                <div class="mem-metric-item"><span class="m-val m-success">${metrics.good.leaks}</span><span class="m-lbl">Memory Leaks</span></div>
              ` : (s.type === 'pool' ? `
                <div class="mem-metric-item"><span class="m-val m-success">${metrics.good.fragmentation}</span><span class="m-lbl">External Frag</span></div>
                <div class="mem-metric-item"><span class="m-val m-success">${metrics.good.allocSpeed}</span><span class="m-lbl">Latency</span></div>
              ` : `
                <div class="mem-metric-item"><span class="m-val m-success">${metrics.good.misaligned}</span><span class="m-lbl">Unaligned Slots</span></div>
                <div class="mem-metric-item"><span class="m-val m-success">${metrics.good.simdSafety}</span><span class="m-lbl">SIMD Safety</span></div>
              `)}
            </div>

            <!-- Terminal Log -->
            <div class="mem-mini-log log-good">
              <div class="log-line">&gt; ${s.good.logs[0] || 'Ready'}</div>
            </div>
          </div>
        </div>

        <div class="mem-legend">
          <span class="legend-item"><span class="legend-swatch swatch-alloc"></span> Allocated Entity</span>
          <span class="legend-item"><span class="legend-swatch swatch-hdr"></span> Metadata Header (Overhead)</span>
          <span class="legend-item"><span class="legend-swatch swatch-leak"></span> Memory Leak / Hazard</span>
          <span class="legend-item"><span class="legend-swatch swatch-free"></span> Free Unused Memory</span>
        </div>
      </div>
    `;

    this.bindButtons();
  }

  bindButtons() {
    if (this.state.type === 'arena') {
      this.container.querySelector('#btn-arena-alloc')?.addEventListener('click', () => this.arenaAllocateBatch());
      this.container.querySelector('#btn-arena-free')?.addEventListener('click', () => this.arenaDeallocateRandom());
      this.container.querySelector('#btn-arena-leak')?.addEventListener('click', () => this.arenaSimulateLeak());
      this.container.querySelector('#btn-arena-reset')?.addEventListener('click', () => this.arenaResetAll());
    } else if (this.state.type === 'pool') {
      this.container.querySelector('#btn-pool-alloc')?.addEventListener('click', () => this.poolAllocate());
      this.container.querySelector('#btn-pool-free')?.addEventListener('click', () => this.poolFreeRandom());
      this.container.querySelector('#btn-pool-oom')?.addEventListener('click', () => this.poolTriggerOOM());
      this.container.querySelector('#btn-pool-reset')?.addEventListener('click', () => this.poolResetAll());
    } else {
      this.container.querySelector('#btn-align-alloc')?.addEventListener('click', () => this.alignmentAllocateMixed());
      this.container.querySelector('#btn-align-simd')?.addEventListener('click', () => this.alignmentTestSIMD());
      this.container.querySelector('#btn-align-reset')?.addEventListener('click', () => this.alignmentResetAll());
    }
  }
}

