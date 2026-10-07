# Module 11: GPU Profiling & Debugging Tools (Nsight, RenderDoc, RGP)

> *"In CPU programming, a slow algorithm takes 100 milliseconds and you optimize a loop. In GPU programming, a 2-line shader change can drop your frame rate from 144 FPS to 12 FPS due to quad helper lane divergence, register spilling, or Early-Z de-optimization. Without GPU profilers, you are coding in the dark."*

Professional graphics programmers spend over 40% of their engineering time inside GPU profilers. This module teaches how to capture frames, analyze bottlenecks, and interpret outputs from **NVIDIA Nsight Graphics**, **RenderDoc**, and **AMD Radeon GPU Profiler (RGP)**.

---

## 1. Quad Overdraw & Helper Lane Invocations

### How the GPU Dispatches Pixels
Modern GPUs never dispatch single isolated pixels to fragment shader ALUs. Hardware rasterizers group pixels into **$2 \times 2$ Pixel Quads**:

$$\begin{bmatrix} (x, y) & (x+1, y) \\ (x, y+1) & (x+1, y+1) \end{bmatrix}$$

This quad structure allows hardware finite-difference derivative instructions (`dFdx`, `dFdy` in GLSL / `ddx`, `ddy` in HLSL) to be computed across SIMT lanes in zero clock cycles.

### The Micro-Triangle Catastrophe (Quad Waste)
When a triangle is smaller than 4 pixels (sub-pixel geometry or long, thin geometric slivers):

```
Scenario: A tiny triangle covers only 1 pixel in a 2x2 quad:
┌──────────────┬──────────────┐
│  ACTIVE PIXEL│  HELPER LANE │
│ (Triangle    │ (Must run    │
│  Covers This)│  full shader)│
├──────────────┼──────────────┤
│  HELPER LANE │  HELPER LANE │
│ (Must run    │ (Must run    │
│  full shader)│  full shader)│
└──────────────┴──────────────┘
-> Result: 4 full fragment shader invocations executed, but 3 are discarded!
   Hardware Efficiency = 25%!
```

If multiple micro-triangles overlap the same screen tile, the GPU executes separate quads for every triangle. A single screen pixel can suffer **$8\times$ to $16\times$ Quad Overdraw**!

```
How to Read the Nsight Quad Overdraw Heatmap:
 [Color]        [Overdraw Factor]   [Diagnosis / Action Required]
 🟢 Green        1x - 1.5x          Optimal geometry sizing; minimal edge waste.
 🟡 Yellow       2x - 3x            Standard mesh silhouette edges (acceptable).
 🟠 Orange       4x - 6x            Dense sub-pixel geometry; LOD reduction required.
 🔴 Crimson/Pink 8x - 16x+          Severe micro-triangle disaster! (Foliage/uncooked CAD).
```

---

## 2. NVIDIA Nsight Graphics: Deep Profiling

NVIDIA Nsight Graphics is the primary tool for analyzing NVIDIA hardware architectures (Ada Lovelace, Ampere, Turing, Blackwell).

```
Nsight Graphics Profiling Workflow:
┌────────────────────────────────────────────────────────┐
│ 1. Frame Capture                                       │
│    - Freezes entire DirectX 12 / Vulkan frame.         │
│    - Captures all VRAM buffers, textures, and states.  │
├────────────────────────────────────────────────────────┤
│ 2. Scrubber & API Inspector                            │
│    - Step through draw calls chronologically.          │
│    - Inspect Render Targets, G-Buffers, Depth maps.    │
├────────────────────────────────────────────────────────┤
│ 3. GPU Trace & Speed-of-Light (SOL)                    │
│    - SM Throughput % vs Memory Bandwidth %             │
│    - Identifies compute vs memory-bound bottlenecks.   │
├────────────────────────────────────────────────────────┤
│ 4. Early-Z & Hazard Inspection                         │
│    - Compares Z-Cull Rejection counters.               │
│    - Catches shaders leaking into Late-Z.              │
└────────────────────────────────────────────────────────┘
```

### Key Metrics to Interpret:
1. **Speed of Light (SOL) Analysis**:
   - **SOL SM (Compute) > 85% & SOL Memory < 40%**: The pass is ALU-bound (math-heavy PBR, raymarching, complex transcendental functions). Optimize shader arithmetic or use half-precision FP16.
   - **SOL Memory > 85% & SOL SM < 40%**: The pass is VRAM bandwidth bound (fat G-Buffer reads, uncompressed 4K textures, unaligned staging). Optimize texture formats (BC7/ASTC) or switch to a Visibility Buffer.
2. **Early-Z / Hi-Z Rejection Ratio**:
   - In a Depth Pre-Pass enabled engine, the deferred base pass should show **Z-Cull Rejection $> 60\%$**.
   - If Z-Cull Rejection is near $0\%$, search for dynamic `discard` statements or `gl_FragDepth` assignments that broke the hardware depth culling pipeline!

---

## 3. RenderDoc: Frame Debugging Masterclass

RenderDoc is the open-source, API-agnostic standard for analyzing Vulkan, DirectX 11/12, and OpenGL applications.

### Essential RenderDoc Workflows:
1. **Texture Viewer & G-Buffer Extraction**:
   - RenderDoc allows selecting individual color channels ($R, G, B, A$), overriding range bounds, and evaluating custom decode formulas (e.g., viewing linear view depth from logarithmic floating-point Reverse-Z buffers).
2. **Mesh Viewer (Pre-VS vs Post-VS)**:
   - View raw vertex attributes entering the Vertex Shader, and inspect the resulting homogeneous 4D coordinates $(x, y, z, w)$ after perspective transformation.
   - Rapidly catch NaN vertices, zero-area degenerate triangles, and corrupted index buffers.
3. **Pipeline State Viewer**:
   - Displays the exact configuration of every silicon stage:
     * **IA**: Vertex buffer strides, offsets, attribute formats.
     * **VS / FS**: Shader byte-code, constant buffer / uniform buffer bindings.
     * **RS**: Culling mode (CW vs CCW), scissor rects, viewport dimensions.
     * **OM**: Blend states, write masks, depth comparison functions (`GEQUAL` vs `LESS`).

---

## 4. AMD Radeon GPU Profiler (RGP)

AMD RGP inspects low-level hardware execution across AMD RDNA and GCN architectures.

### What RGP Visualizes:
1. **Wavefront Occupancy Graph**:
   - Shows active 32- or 64-thread wavefronts across GPU Compute Units (CUs) over microsecond timelines.
   - **Register Spilling**: If a shader requires too many Vector General Purpose Registers (VGPRs), the CU cannot host enough concurrent wavefronts to hide memory latency. RGP highlights VGPR pressure in red.
2. **Wavefront Divergence**:
   - Visualizes thread activity masks. If an `if` branch executes with only 4 active lanes out of 32, RGP highlights the wasted ALU cycles in yellow/red.

Inspect [`11_quad_overdraw_simulator.cpp`](#graphics/11_gpu_debugging_and_profiling) to see a concrete C++ software tool that quantifies quad helper thread waste and calculates overdraw heatmaps!

