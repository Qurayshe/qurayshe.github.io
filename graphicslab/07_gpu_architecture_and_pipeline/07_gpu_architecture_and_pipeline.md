# Module 07: GPU Architecture & The Programmable Pipeline

> *"A CPU is a Ferrari that seats 4 passengers and goes 200 mph. A GPU is a massive freight train that carries 10,000 passengers at 60 mph."*

Having built a software rasterizer and raytracer from scratch in C/C++, you now know *what* algorithms must be computed. But on a CPU, rendering 4K resolution at 144 FPS requires running the fragment loop $3840 \times 2160 \times 144 \approx 1.2 \text{ billion times per second}$. A CPU with 8 or 16 latency-optimized cores simply chokes on this throughput.

To render real-time 3D graphics, computer architecture evolved **The Graphics Processing Unit (GPU)**.

---

## 1. CPU vs. GPU Architectural Philosophy

```
CPU Architecture (Latency Oriented):
+-------------------------------------------------------+
|  Branch Predictor  |  Massive L3 Cache (32MB - 96MB)  |
+-------------------------------------------------------+
| Core 0 (ALU) | Core 1 (ALU) | Core 2 (ALU) | Core 3   |
+-------------------------------------------------------+
-> Optimizes serial code, deep out-of-order execution, low latency.

GPU Architecture (Throughput Oriented - SIMT):
+-------------------------------------------------------+
|  Small L2 Cache    | High-Bandwidth VRAM (GDDR6X/HBM) |
+-------------------------------------------------------+
| [SM/CU 0] 128 ALUs | [SM/CU 1] 128 ALUs | [SM/CU 2]   |
| [SM/CU 3] 128 ALUs | [SM/CU 4] 128 ALUs | [SM/CU 5]   |
| ... thousands of lightweight floating-point ALUs ...   |
+-------------------------------------------------------+
-> Optimizes parallel data throughput; hides memory latency via massive thread switching.
```

### SIMT: Single Instruction, Multiple Threads
GPUs group parallel threads into lockstep execution batches called **Warps** (NVIDIA: 32 threads) or **Wavefronts** (AMD: 64 threads).
- Every thread in a warp executes the exact same assembly instruction at the same cycle, but on distinct vertex or pixel data.
- **Warp Divergence**: If an `if (condition)` branches differently across threads in a warp, both branches are executed serially, and inactive threads are masked out. **Branching in shaders incurs a performance penalty!**

---

## 2. The Modern Programmable Graphics Pipeline

Every modern API (OpenGL Core, Vulkan, DirectX 12, Metal, WebGPU) maps directly to these hardware stages:

```
[1. Vertex Input Buffers (VBO/IBO in VRAM)]
                   │
                   ▼
[2. Vertex Shader (Programmable)] ────> Runs per-vertex: MVP transform, normal calculation
                   │
                   ▼
[3. Tessellation & Geometry Shader (Optional Programmable)]
                   │
                   ▼
[4. Primitive Assembly & Clipping] ───> Discards primitives outside Frustum [-1, 1]
                   │
                   ▼
[5. Hardware Rasterizer (Fixed Function)] ──> Evaluates Pineda edge equations in hardware,
                   │                           generates Fragments (pixel candidates)
                   ▼
[6. Early Z-Testing (Hardware Optimization)] ──> Discards occluded fragments before shading!
                   │
                   ▼
[7. Fragment / Pixel Shader (Programmable)] ─> Runs per-fragment: textures, PBR lighting, BRDF
                   │
                   ▼
[8. Per-Sample Operations & Blending] ──> Late Z-test, Stencil test, Alpha blend into Framebuffer
                   │
                   ▼
[Color Attachment / Swapchain Presentation]
```

---

## 3. Host Memory vs. Device Memory

Modern graphics programming is fundamentally an exercise in **data staging between two different computers connected over a PCIe bus**:

| Memory Type | Location | Access Speed | Usage |
| :--- | :--- | :--- | :--- |
| **Host Memory (System RAM)** | Motherboard | ~50 GB/s (Fast for CPU, slow for GPU) | Initial asset loading (OBJ, PNG), staging buffers |
| **Host-Visible Coherent** | Shared BAR / RAM | ~15–30 GB/s (PCIe Gen4/5) | Dynamic uniform buffers that update every frame |
| **Device-Local (VRAM)** | Dedicated GPU PCB | **1,000+ GB/s (GDDR6X / HBM3)** | Static Vertex Buffers, Index Buffers, Render Targets |

In old OpenGL, the driver silently copied memory across PCIe on your behalf.
In modern Vulkan, DirectX 12, and WebGPU, **you must explicitly create Staging Buffers and record DMA copy commands** to move mesh data from Host to Device VRAM!

---

## 4. Draw Call Overhead: The CPU Bottleneck

When a CPU instructs a GPU to draw an object (`glDrawArrays()` or `vkCmdDraw()`), the driver must validate state, encode hardware ring-buffer packets, and issue a kernel context switch.
- Traditional OpenGL can sustain ~10,000 draw calls per frame before the CPU limits FPS.
- Modern Vulkan / DirectX 12 / WebGPU allow multi-threaded command buffer recording and **Indirect Drawing**, sustaining **100,000+ to 1,000,000 draw calls per frame**!
