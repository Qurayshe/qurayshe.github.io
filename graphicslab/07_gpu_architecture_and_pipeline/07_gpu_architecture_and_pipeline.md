# Module 07: GPU Architecture, The Complete Graphics Pipeline & Multi-Pass Rendering

> *"A CPU is a Ferrari that seats 4 passengers and travels at 200 mph. A GPU is a massive freight train that carries 20,000 passengers at 60 mph. Real-time graphics is not a sprint of low latency; it is an industrial logistics system of high throughput."*

Having built a software rasterizer and raytracer from scratch in C/C++, you know *what* mathematical algorithms must be evaluated. But at 4K resolution ($3840 \times 2160$) at 144 Hz, a rendering engine must process:

$$\text{Fragments per second} \approx 3840 \times 2160 \times 144 \approx 1.194 \times 10^9 \text{ fragments/sec}$$

Accounting for a modest scene depth overdraw factor of $2.5\times$, the machine must evaluate over **3 billion fragment shading iterations every second**. A CPU with 8 or 16 latency-optimized cores simply chokes on this demand.

To solve this, modern computer engineering developed the **Graphics Processing Unit (GPU)** and structured real-time rendering into two deeply coordinated systems:
1. **The Low-Level Hardware Pipeline**: The silicon stages that transform vertex streams into rasterized pixels.
2. **The High-Level Engine Render Passes**: The multi-pass directed acyclic graph (DAG) that decomposes complex physical phenomena (shadows, G-buffers, ambient occlusion, clustered lighting, HDR post-processing) into discrete GPU passes.

---

## 1. Hardware Architectural Philosophy: CPU vs GPU

```
CPU Architecture (Optimized for Minimum Latency):
┌──────────────────────────────────────────────────────────────┐
│  Branch Predictor   │       Massive L3 Cache (32MB - 128MB)  │
├──────────────────────────────────────────────────────────────┤
│ Core 0 (Out-of-Order) │ Core 1 (OOO) │ Core 2 │ Core 3       │
└──────────────────────────────────────────────────────────────┘
-> Features: Speculative execution, deep pipelines, fast clocks (4-6 GHz).
-> Mission: Execute sequential threads as fast as theoretically possible.

GPU Architecture (Optimized for Maximum Throughput - SIMT):
┌──────────────────────────────────────────────────────────────┐
│  Small L2 Cache     │ High-Bandwidth VRAM (GDDR6X / HBM3e)   │
├──────────────────────────────────────────────────────────────┤
│ [SM / WGP 0]  128 ALUs │ [SM / WGP 1]  128 ALUs │ [SM / WGP 2]│
│ [SM / WGP 3]  128 ALUs │ [SM / WGP 4]  128 ALUs │ [SM / WGP 5]│
│ ... dozens of Streaming Multiprocessors (10,000+ FP32 ALUs) │
└──────────────────────────────────────────────────────────────┘
-> Features: Thousands of concurrent hardware thread contexts.
-> Mission: Zero-cost thread switching to hide memory latency (1,000+ GB/s).
```

### SIMT: Single Instruction, Multiple Threads
GPUs group execution into lockstep batches of threads called **Warps** (NVIDIA: 32 threads) or **Wavefronts** (AMD: 64 threads):
- In every clock cycle, all 32 threads in a warp execute the **identical assembly instruction**, but each thread operates on its own distinct register data (such as vertex ID or pixel coordinate).
- **Warp Divergence Hazard**: If code contains a conditional branch `if (x > 0)`, and half the threads in a warp evaluate to `true` while the other half evaluate to `false`, the warp cannot split into two asynchronous paths. The hardware must serialize execution: it executes the `true` path while masking out inactive threads, and then executes the `false` path while masking the inverse. **Divergent branching halves ALU throughput!**
- **Occupancy & Register Pressure**: Each Streaming Multiprocessor (SM) has a fixed physical register file (e.g., 64K 32-bit registers). If a shader requires 64 registers per thread, the SM can simultaneously host $64\text{K} / 64 = 1024$ active threads. If register pressure increases to 128 registers per thread, active thread count drops to 512, reducing the GPU's ability to hide memory stalls.

---

## 2. The Complete Hardware Graphics Pipeline (Stage-by-Stage)

Modern graphics APIs (DirectX 12, Vulkan, Metal, WebGPU) map directly to the hardware rasterization pipeline. The pipeline consists of both **programmable compute stages** and **fixed-function hardware ASICs**:

```
[1. Input Assembler (IA) - Fixed Function]
       │ Reads Index Buffers (IBO) & Vertex Buffers (VBO) from VRAM
       ▼
[2. Vertex Shader (VS) - Programmable]
       │ Transforms vertices: Object Space -> World -> View -> Clip Space (MVP)
       ▼
[3. Tessellation Control / Hull Shader (TCS) - Programmable]
       │ Determines dynamic Level-of-Detail (LOD) tessellation factors
       ▼
[4. Fixed-Function Tessellation Primitive Generator (TPG)]
       │ Subdivides domain patches into dense triangle mesh
       ▼
[5. Tessellation Evaluation / Domain Shader (TES) - Programmable]
       │ Evaluates parametric positions (PN-triangles, displacement maps)
       ▼
[6. Geometry / Mesh Shader (GS / MS) - Programmable]
       │ Amplifies or generates geometry per primitive; culls triangle clusters
       ▼
[7. Primitive Assembly & Frustum Clipping - Fixed Function]
       │ Assembles primitives; clips triangles against 4D frustum; backface culls
       ▼
[8. Viewport Transform & Perspective Divide - Fixed Function]
       │ Perspective divide: (x/w, y/w, z/w) -> Screen Space [0, W] x [0, H]
       ▼
[9. Hardware Rasterizer - Fixed Function ASIC]
       │ Evaluates edge functions, conservative raster, MSAA sample masks
       ▼
[10. Early-Z & Hierarchical-Z (Hi-Z) - Hardware Optimization]
       │ Tests depth at tile & pixel level BEFORE fragment shader runs!
       ▼
[11. Fragment / Pixel Shader (FS) - Programmable]
       │ 2x2 Quad lockstep; evaluates BRDF, textures, normal maps, shadows
       ▼
[12. Late Depth & Stencil Testing - Fixed Function]
       │ Resolves fragments when Early-Z was disabled (alpha test / discard)
       ▼
[13. Raster Operations (ROP) & Blending - Fixed Function]
       │ Porter-Duff alpha blending, logic ops, multisample resolve -> VRAM
```

---

### Mathematical Foundations of Hardware Pipeline Stages

#### Stage 1 & 2: Homogeneous Transformation & Orthonormal TBN Basis
The Vertex Shader transforms local object-space positions $\mathbf{p}_{\text{local}} = (x, y, z, 1)^T$ into Homogeneous Clip Space using the Model ($\mathbf{M}$), View ($\mathbf{V}$), and Projection ($\mathbf{P}$) matrices:

$$\mathbf{p}_{\text{clip}} = \mathbf{P} \cdot \mathbf{V} \cdot \mathbf{M} \cdot \mathbf{p}_{\text{local}}$$

To correctly transform surface normal vectors under non-uniform scaling $\mathbf{M}$, the shader computes the **Normal Matrix** (inverse-transpose):

$$\mathbf{N}_{\text{world}} = \left( (\mathbf{M}_{3\times 3})^{-1} \right)^T \cdot \mathbf{n}_{\text{local}}$$

For normal mapping, the vertex stage constructs the **Tangent-Bitangent-Normal (TBN)** orthonormal basis using Gram-Schmidt re-orthogonalization:

$$\mathbf{T}' = \text{normalize}\left(\mathbf{T} - (\mathbf{T} \cdot \mathbf{N})\mathbf{N}\right), \quad \mathbf{B} = \text{cross}(\mathbf{N}, \mathbf{T}')$$

$$\mathbf{M}_{\text{TBN}} = \begin{bmatrix} T'_x & B_x & N_x \\ T'_y & B_y & N_y \\ T'_z & B_z & N_z \end{bmatrix}$$

---

#### Stage 7 & 8: 4D Homogeneous Clipping & Viewport Transformation
A vertex $\mathbf{p}_{\text{clip}} = (x_c, y_c, z_c, w_c)^T$ lies inside the visible view frustum if and only if:

$$\text{OpenGL / WebGL:} \quad -w_c \le x_c \le w_c, \quad -w_c \le y_c \le w_c, \quad -w_c \le z_c \le w_c$$

$$\text{Vulkan / DirectX 12 / WebGPU / Metal:} \quad -w_c \le x_c \le w_c, \quad -w_c \le y_c \le w_c, \quad 0 \le z_c \le w_c$$

The hardware executes **Sutherland-Hodgman polygon clipping in 4D space before perspective divide**, avoiding division-by-zero singularities when $w_c \le 0$ (points behind the camera).

Once clipped, the hardware performs the **Perspective Divide** to obtain Normalized Device Coordinates (NDC):

$$\mathbf{p}_{\text{ndc}} = \begin{pmatrix} x_c / w_c \\ y_c / w_c \\ z_c / w_c \end{pmatrix}$$

The **Viewport Transformation** maps NDC to Screen Coordinates $(x_w, y_w) \in [0, W] \times [0, H]$ and Depth $z_w \in [n, f]$:

$$\begin{bmatrix} x_w \\ y_w \\ z_w \\ 1 \end{bmatrix} = \begin{bmatrix} \frac{W}{2} & 0 & 0 & X + \frac{W}{2} \\ 0 & -\frac{H}{2} & 0 & Y + \frac{H}{2} \\ 0 & 0 & \frac{f - n}{2} & \frac{f + n}{2} \\ 0 & 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x_{\text{ndc}} \\ y_{\text{ndc}} \\ z_{\text{ndc}} \\ 1 \end{bmatrix}$$

---

#### Stage 9: Hardware Rasterization & Fixed-Function Edge Equations
The hardware rasterizer evaluates 2D oriented edge equations (Pineda edge functions) for a triangle with screen vertices $\mathbf{v}_0, \mathbf{v}_1, \mathbf{v}_2$:

$$E_{ij}(x, y) = (x - x_i)(y_j - y_i) - (y - y_i)(x_j - x_i)$$

A sample point $(x, y)$ is covered if:

$$E_{01}(x, y) \ge 0 \quad \land \quad E_{12}(x, y) \ge 0 \quad \land \quad E_{20}(x, y) \ge 0$$

Fixed-function hardware evaluators compute these equations in parallel across bounding-box tiles ($8 \times 8$ or $16 \times 16$ pixels), emitting candidate fragments.

---

#### Stage 10: Early-Z & Hierarchical-Z (Hi-Z)
Evaluating complex fragment shaders for occluded pixels wastes immense GPU power. Modern GPUs implement two levels of hardware depth testing **prior to running the fragment shader**:
1. **Hierarchical Z (Hi-Z)**: A low-resolution pyramid of minimum and maximum depth values stored in on-chip SRAM cache. If an incoming triangle's closest depth is farther than the farthest depth recorded in a screen tile, the entire tile is discarded in a single cycle.
2. **Early-Z Test**: The per-pixel depth buffer comparison runs before fragment shading. Occluded pixels are instantly killed.

> [!WARNING] Early-Z Pipeline Hazards
> The GPU driver must **disable Early-Z** and defer depth testing to Late-Z if the fragment shader:
> - Calls `discard` (OpenGL) or `discard_fragment` (WGSL) based on dynamic data.
> - Writes explicitly to `gl_FragDepth`.
> - Performs side-effect writes to unordered access views (UAV / SSBO) that must execute regardless of depth.
> Disabling Early-Z can cause a $2\times$ to $5\times$ drop in frame rate due to full shading of occluded geometry!

---

#### Stage 11: Fragment Shaders, $2\times 2$ Quads & Derivative Math
GPUs never execute fragment shaders for isolated individual pixels. They always execute in lockstep $2 \times 2$ **Pixel Quads**:

$$\begin{matrix} (x, y) & (x+1, y) \\ (x, y+1) & (x+1, y+1) \end{matrix}$$

This quad arrangement allows the hardware to calculate screen-space finite difference partial derivatives (`dFdx`, `dFdy` in GLSL / `dpdx`, `dpdy` in WGSL) across adjacent SIMT lanes at zero performance cost:

$$\frac{\partial u}{\partial x} \approx u(x+1, y) - u(x, y), \quad \frac{\partial u}{\partial y} \approx u(x, y+1) - u(x, y)$$

These derivatives are essential for **Texture Mipmapping**: the GPU computes the anisotropic footprint $\rho$:

$$\rho = \max\left( \sqrt{\left(\frac{\partial u}{\partial x}\right)^2 + \left(\frac{\partial v}{\partial x}\right)^2}, \sqrt{\left(\frac{\partial u}{\partial y}\right)^2 + \left(\frac{\partial v}{\partial y}\right)^2} \right)$$

$$\text{Mipmap Level } \lambda = \log_2(\rho)$$

---

#### Stage 13: Raster Operations (ROP) & Alpha Blending Formulation
The fixed-function ROP unit receives fragment color $\mathbf{C}_{\text{src}}$ and alpha $A_{\text{src}}$, compares against the existing framebuffer pixel $\mathbf{C}_{\text{dst}}$ and $A_{\text{dst}}$, and evaluates the **Universal Porter-Duff Blending Equation**:

$$\mathbf{C}_{\text{out}} = (\mathbf{C}_{\text{src}} \times \mathbf{F}_{\text{src}}) \odot (\mathbf{C}_{\text{dst}} \times \mathbf{F}_{\text{dst}})$$

$$A_{\text{out}} = (A_{\text{src}} \times F_{a,\text{src}}) \odot (A_{\text{dst}} \times F_{a,\text{dst}})$$

Where $\odot \in \{+, -, \text{reverse } -, \min, \max\}$.

| Blend Mode | Source Factor ($\mathbf{F}_{\text{src}}$) | Destination Factor ($\mathbf{F}_{\text{dst}}$) | Blend Operation | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Opaque Override** | `ONE` ($1$) | `ZERO` ($0$) | `ADD` | Standard solid opaque meshes |
| **Traditional Alpha Blend** | `SRC_ALPHA` ($A_{\text{src}}$) | `ONE_MINUS_SRC_ALPHA` ($1 - A_{\text{src}}$) | `ADD` | Tinted glass, decals, UI |
| **Premultiplied Alpha** | `ONE` ($1$) | `ONE_MINUS_SRC_ALPHA` ($1 - A_{\text{src}}$) | `ADD` | Texture atlases, correct filtering |
| **Additive Blending** | `ONE` ($1$) | `ONE` ($1$) | `ADD` | Fire, explosions, laser beams, bloom |
| **Subtractive / Modulate** | `DST_COLOR` ($\mathbf{C}_{\text{dst}}$) | `ZERO` ($0$) | `ADD` | Shadow volumes, light attenuation |

---

## 3. High-Level Engine Architecture: Multi-Pass Render Pipelines

While the hardware pipeline describes how a single draw call traverses silicon, a modern 3D game engine (Unreal Engine 5, Unity HDRP, Frostbite, Decima, id Tech) structures rendering into an orchestrated sequence of **Render Passes**.

```
Modern AAA Game Engine Frame Pass Graph (DAG):
┌────────────────────────────────────────────────────────────────────────┐
│ Pass 1: Depth Pre-Pass (Early-Z Population)                            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────────────────────┐ ┌────────────────────────────────────┐
│ Pass 2: Shadow Mapping Cascades │ │ Pass 3: Geometry Pass (G-Buffer)   │
│ (CSM 4-split Directional Light) │ │ MRT: Position, Normal, Albedo, AO  │
└────────────────┬────────────────┘ └────────────────┬───────────────────┘
                 │                                   │
                 │         ┌─────────────────────────┘
                 ▼         ▼
┌─────────────────────────────────┐ ┌────────────────────────────────────┐
│ Pass 4: SSAO (Screen Ambient)   │ │ Pass 5: Clustered Light Culling    │
│ Hemisphere depth raymarch blur  │ │ Compute Shader: 3D Frustum Binning │
└────────────────┬────────────────┘ └────────────────┬───────────────────┘
                 │                                   │
                 └─────────────────┬─────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Pass 6: Deferred Lighting Accumulation (PBR Direct + IBL Specular)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Pass 7: Volumetric Fog & Subsurface Scattering (Screen-Space SSS)      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Pass 8: Forward Transparency Pass (Weighted Blended OIT)               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Pass 9: Post-Processing Stack (HDR Bloom, ACES Tone Mapping, TAA)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

---

### Architectural Battle: Traditional Forward vs Deferred vs Forward+ vs Clustered Shading

In a 3D scene with $M$ geometry primitives, $P$ rendered screen pixels, and $N$ dynamic light sources:

```
Algorithmic Complexity Hierarchy:
1. Traditional Forward:  O(M * N)                  -> Frag shader loops all N lights per polygon.
2. Deferred Shading:     O(M) + O(N * ScreenPixels) -> Separates geometry from lighting via G-Buffer.
3. Forward+ (Tiled):     O(M) + O(Tiles * N) + O(M * N_tile) -> Compute shader bins lights into 2D tiles.
4. Clustered Forward:    O(M) + O(Clusters * N) + O(M * N_cluster) -> 3D sub-frustum binning; handles transparency!
```

```
Pipeline Dataflows Compared:

[Deferred Shading]
Geometry Pass ──► FAT G-BUFFER (60-90 bytes/pixel) ──► Fullscreen Lighting Pass (PBR) ──► HDR Output
                   (Normal, Depth, Albedo, AO, Metal)   (Cannot do native MSAA; Alpha broken)

[Forward+ (Tiled)]
Depth Pre-Pass ──► Depth Texture ──► Compute Shader (Tile Culling) ──► Light Index SSBO ──┐
                                     (16x16 pixel screen tiles)                           │
Scene Meshes (Custom Shaders) ────────────────────────────────────────────────────────────┴─► Forward Color
(Native MSAA, Custom BRDFs, Low VRAM bandwidth, but struggles with silhouettes!)

[Clustered Forward]
Scene View Frustum ──► Compute Shader (3D Clusters: 16x9x24) ──► 3D Cluster Light Grid ──┐
                                                                                         │
Scene Meshes (Opaque + Transparent) ─────────────────────────────────────────────────────┴─► Forward Color
(Native MSAA, Translucency support, zero tile depth-discontinuity penalty!)
```

---

#### 1. Deferred Shading: Strengths & Fatal Flaws
Popularized by engines in the late 2000s (Unreal Engine 3/4, Frostbite, Killzone 2), Deferred Shading solved the $O(M \times N)$ light explosion by rendering geometry attributes into a **G-Buffer (Geometry Buffer)**, and computing lighting on screen quads.

**Why Deferred Succeeded:**
- Decouples lighting from geometric complexity. You can place 2,000 small point lights in a dungeon, and lighting cost is strictly proportional to the light's screen coverage area rather than triangle count.

**The Fatal Flaws of Deferred Shading:**
1. **Enormous VRAM Bandwidth Overhead**:
   At 4K ($3840 \times 2160$) at 60 FPS, reading and writing a 64-byte/pixel G-Buffer consumes:
   $$\text{Bandwidth} = 3840 \times 2160 \times 64 \text{ bytes} \times 2 (\text{write} + \text{read}) \times 60 \text{ Hz} \approx 63.7 \text{ GB/s}$$
   Just to pass basic geometry data between passes! This incurs a severe thermal and memory penalty on mobile and integrated GPUs.
2. **Hardware MSAA Incompatibility**:
   Because G-Buffer pixels store discrete values per pixel rather than sub-sample coverage, standard hardware Multi-Sample Anti-Aliasing (MSAA) cannot resolve edge color discontinuities without catastrophic memory overhead ($4\times$ or $8\times$ G-Buffer sizes).
3. **Transparency Failure**:
   The G-Buffer can only store a single surface depth per pixel. Transparent objects (glass, fire, smoke, water) **cannot be deferred** and must still be rendered in a separate forward pass.
4. **Restricted Material Diversity**:
   Every object in the scene must conform to the material channels packed into the G-Buffer (e.g., Albedo, Roughness, Metallic). Specialized materials like anisotropic hair, velvet cloth, subsurface eye/skin models, or car clearcoats require branching in the lighting pass or additional G-Buffer attachments.

---

#### 2. Forward+ (Tiled Forward Shading)
Introduced by Takahiro Harada, Jay McKee, and Jason Yang (AMD, 2012), **Forward+** was engineered to eliminate the G-Buffer bandwidth and MSAA penalties of Deferred Shading while preserving the ability to render thousands of dynamic lights.

Forward+ splits rendering into **3 Phases**:

```
Forward+ Three-Phase Execution:
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Depth Pre-Pass                                                │
│ -> Rasterize scene geometry with color writes disabled.                │
│ -> Generates hardware depth buffer.                                    │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Compute Shader Tile Light Culling                             │
│ -> Screen is split into 16x16 pixel tiles (e.g. 120x68 tiles for 1080p)│
│ -> Parallel reduction finds min/max depth: [Z_min, Z_max] per tile.    │
│ -> Constructs 6 frustum planes bounding the 3D tile frustum.           │
│ -> Intersects all scene light spheres against tile frustum planes.     │
│ -> Writes light indices into a shared Shader Storage Buffer (SSBO).   │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Final Forward Shading Pass                                    │
│ -> Meshes render in forward pass with full material flexibility.       │
│ -> Fragment shader reads tile light list: only loops over 5-20 lights! │
│ -> Full hardware MSAA and custom BRDFs supported natively!             │
└────────────────────────────────────────────────────────────────────────┘
```

##### Mathematical Formulation: Tile Frustum Construction & Light Culling
For a screen tile of size $T \times T$ pixels with viewport dimensions $W \times H$:
1. Unproject the 4 corner pixels $(x_0, y_0), (x_1, y_1)$ at $Z = 1.0$ into View Space using the inverse projection matrix $\mathbf{P}^{-1}$.
2. Compute the minimum and maximum depth $[z_{\min}, z_{\max}]$ of all pixels in the tile using parallel reduction in compute workgroup shared memory (`groupshared` / `shared`).
3. Construct the 4 bounding side planes passing through the camera eye origin $(0, 0, 0)$ and the tile corner rays.
4. For each point light with center $\mathbf{c} = (c_x, c_y, c_z)$ and radius $r$, evaluate the signed distance to each plane equation $\mathbf{n} \cdot \mathbf{x} + d = 0$:
   $$D_i = \mathbf{n}_i \cdot \mathbf{c} + d_i$$
   If $D_i < -r$ for any plane, the light is completely outside the tile frustum and is culled!
   If $D_i \ge -r$ for all 6 planes (left, right, bottom, top, near $z_{\min}$, far $z_{\max}$), the light intersects the tile.

##### The Fatal Flaw of Forward+ (The Silhouette / Depth Discontinuity Problem):
Consider a screen tile containing both a foreground character sword ($z = 1\text{m}$) and the distant sky or background wall ($z = 500\text{m}$):
- The tile's depth range spans $[1\text{m}, 500\text{m}]$.
- The tile frustum becomes an enormous, stretched cone stretching across the entire level.
- **Result**: The tile captures every light in the entire corridor, causing light culling to fail and triggering severe fragment shader performance spikes along object silhouettes!

---

#### 3. Clustered Forward Shading (The Modern Standard)
Developed by Ola Olsson, Markus Billeter, and Ulf Assarsson (2012) and made famous by id Software in **DOOM (2016)** (id Tech 6), **Clustered Shading** fixes the Forward+ depth discontinuity bug by subdividing the view frustum in all 3 dimensions ($X, Y, Z$).

```
Clustered 3D View Frustum Partitioning:
                     Camera Eye
                         ▲
                        / \
                       /   \  Cluster Grid:
                      /┌─┬─┐\ (e.g. 16 x 9 x 24 slices)
                     / ├─┼─┤ \
                    /  ├─┼─┤  \  <- Exponential Z Slices
                   /   └─┴─┘   \
                  /             \
```

Rather than calculating dynamic $[z_{\min}, z_{\max}]$ per frame from a depth buffer, the view frustum is divided into a fixed 3D grid of **Clusters** (typically $16 \times 9 \times 24 = 3,456$ clusters):
- Slices along $Z$ are partitioned **logarithmically (exponentially)** to provide fine clusters near the camera and larger clusters in the distance:
  $$Z_{\text{slice}}(k) = z_{\text{near}} \left( \frac{z_{\text{far}}}{z_{\text{near}}} \right)^{\frac{k}{S_z}}, \quad k \in [0, S_z]$$
- **Decoupled from Scene Geometry**: Because the 3D grid is defined purely by camera optics, light culling can execute **before or in parallel with geometry rasterization**!
- **Translucent Light Support**: Transparent particles, volumetric fog, and smoke can easily look up which 3D cluster they reside in and receive full dynamic lighting from thousands of lights—a feat impossible in standard Deferred or 2D Tiled Forward+!

---

### Exhaustive Architectural Comparison Matrix

| Architectural Feature | Traditional Forward | Deferred Shading (MRT) | Forward+ (Tiled) | Clustered Forward |
| :--- | :--- | :--- | :--- | :--- |
| **Complexity** | $O(M \times N)$ | $O(M) + O(N \times \text{Pixels})$ | $O(M) + O(\text{Tiles} \times N)$ | $O(M) + O(\text{Clusters} \times N)$ |
| **Active Dynamic Lights** | $\le 8$ per object | $1,000+$ | $1,000+$ | $5,000+$ |
| **VRAM Bandwidth** | Lowest (Single RT) | Extremely High (Fat G-Buffer) | Very Low (Depth + Light List) | Low (Light Grid SSBO) |
| **Hardware MSAA** | Native, trivial | Extremely expensive | Native, trivial | Native, trivial |
| **Transparent Geometry** | Native | Broken (Requires Forward pass) | Limited (Needs separate pass) | **Native full multi-light support** |
| **Depth Discontinuities** | N/A | None | **Severe performance drop** | **Zero penalty (3D clustered)** |
| **Material Flexibility** | Full (Custom shaders) | Restricted to G-Buffer | Full (Custom shaders) | Full (Custom shaders) |
| **Geometry Overdraw Cost** | High (Shades occluded) | Zero (Deferred lighting) | Zero (With Z-Prepass) | Zero (With Z-Prepass) |
| **Mobile / Tile GPUs (TBDR)**| Excellent | High memory bandwidth penalty| High | **Excellent** |
| **Industry Benchmark** | Unity Built-in | UE4, Frostbite, CryEngine | Battlefield 3, Dirt Rally | **DOOM (id Tech 6/7), UE5, Godot 4** |

---

### Pass-by-Pass Deep Dive

#### Pass 1: Depth Pre-Pass (Z-Prepass)
- **Goal**: Eliminate fragment overdraw during heavy lighting calculations.
- **Implementation**: The scene geometry is rasterized with **color writes completely disabled** (`glColorMask(GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE)` or `VK_COLOR_COMPONENT_FLAG_BITS = 0`). Only the depth buffer is written.
- **Benefit**: In subsequent shading passes, all occluded fragments fail the hardware Early-Z test at zero ALU cost.

#### Pass 2: Cascaded Shadow Maps (CSM) & PCF Math
- **Goal**: Cast sharp, anti-aliased shadows from the sun across massive open-world view distances.
- **Frustum Partitioning**: The camera view frustum $[z_{\text{near}}, z_{\text{far}}]$ is split into $K$ logarithmic/linear slices (typically 4 cascades):

$$z_i = \lambda z_{\text{near}} \left(\frac{z_{\text{far}}}{z_{\text{near}}}\right)^{\frac{i}{K}} + (1 - \lambda)\left(z_{\text{near}} + \frac{i}{K}(z_{\text{far}} - z_{\text{near}})\right)$$

- Each slice is rendered into a light-space orthographic depth texture.
- During lighting evaluation, fragments apply **Percentage Closer Filtering (PCF)** across a $3 \times 3$ or $5 \times 5$ kernel to generate soft penumbra borders:

$$\text{Shadow}(p) = \frac{1}{(2k + 1)^2} \sum_{u=-k}^k \sum_{v=-k}^k \mathbf{1}\left( z_{\text{light}} - \text{bias} \le D_{\text{shadowmap}}(xy + (u, v)\Delta) \right)$$

#### Pass 3: Geometry Pass (G-Buffer Multiple Render Targets)
The engine binds multiple high-precision textures simultaneously into a framebuffer attachment:
- **`GBufferA` (RGBA16F)**: World-Space Normal XYZ, Surface Roughness ($W$).
- **`GBufferB` (RGBA8)**: Base Color Albedo RGB, Metallic ($A$).
- **`GBufferC` (R32F / Depth24Stencil8)**: High-precision linear camera depth.
- **`GBufferD` (RGBA16F)**: Emissive Color RGB, Precomputed Ambient Occlusion ($A$).

#### Pass 4: Screen-Space Ambient Occlusion (SSAO)
Approximates ambient light occlusion by sampling depth values in a hemisphere oriented along the surface normal:

$$A(\mathbf{p}) = 1.0 - \frac{1}{N} \sum_{i=1}^N V\left(\mathbf{p} + r \cdot \mathbf{s}_i\right) \cdot \max(0, \mathbf{n} \cdot \mathbf{s}_i)$$

Where $\mathbf{s}_i$ is a cosine-weighted sample vector in the upper hemisphere and $V$ tests if the geometry depth occludes the sample point.

#### Pass 5: Clustered Light Culling Compute Pass
A modern compute shader divides the screen frustum into a 3D grid of clusters ($16 \times 9 \times 24 = 3,456$ frustum frusta).
1. For each cluster AABB, compute intersecting light spheres using fast sphere-frustum plane distance tests.
2. Build an index list of lights intersecting each cluster in a GPU Structured Buffer (`SSBO`).
3. Fragment shaders look up light indices using `gl_FragCoord.xy` and linear eye depth $z_e$, testing only the ~5–20 relevant lights rather than all 2,000 lights in the level.

#### Pass 6: Deferred Lighting Accumulation
A full-screen quad (or tiled compute dispatch) samples the G-Buffer textures, loops through active lights, and evaluates the complete **Cook-Torrance PBR BRDF** for each light, storing the linear High Dynamic Range (HDR) radiance result in an FP16 attachment.

#### Pass 8: Weighted Blended Order-Independent Transparency (WBOIT)
Because deferred renderers cannot sort translucent surfaces in the G-Buffer, translucent particles and glass are rendered in a forward pass using McGuire and Bavoil's WBOIT depth-weighting function:

$$w(z, \alpha) = \alpha \cdot \max\left(10^{-2}, \min\left(3 \times 10^3, \frac{10}{10^{-5} + \left(\frac{z}{200}\right)^4}\right)\right)$$

Accumulating into two MRT buffers (Color Accumulation + Alpha Revealage), resolving transparency without CPU triangle sorting!

#### Pass 9: Post-Processing Stack (HDR Tone Mapping & Bloom)
1. **Bright Pass & Dual-Kawase Bloom**: Isolates radiance above $1.0$, applies a 5-stage ping-pong downsampling and upsampling blur chain, and additively composites back onto the HDR buffer.
2. **ACES Filmic Tone Mapping**: Remaps high-dynamic range values $[0, \infty)$ into non-linear Display $[0, 1]$:

$$f(x) = \frac{x(2.51x + 0.03)}{x(2.43x + 0.59) + 0.14}$$

3. **Gamma Correction**: Converts linear color values into sRGB display space:

$$C_{\text{display}} = C_{\text{linear}}^{\frac{1}{2.2}}$$

---

## 4. Modern Render Graph / Frame Graph Architecture

In older engines, passes were hardcoded procedural function calls (`renderShadows()`, `renderGBuffer()`, `renderLighting()`).
Modern production engines (Frostbite, Unreal Engine 5 RDG, Godot 4) structure the entire frame as a **Frame Graph**:

```
Frame Graph Execution Lifecycle:
┌────────────────────────────────────────────────────────┐
│ 1. Pass Registration Phase                             │
│    - Pass declares resource reads (textures/buffers)   │
│    - Pass declares resource writes / creations         │
├────────────────────────────────────────────────────────┤
│ 2. DAG Compilation & Pruning                           │
│    - Culls unused passes whose outputs aren't viewed   │
│    - Topologically sorts dependencies                  │
├────────────────────────────────────────────────────────┤
│ 3. Memory Aliasing Optimization                        │
│    - Shares identical VRAM memory heap across non-     │
│      overlapping transient textures (saves ~60% VRAM!) │
├────────────────────────────────────────────────────────┤
│ 4. Automated Hardware Synchronization                  │
│    - Automatically inserts Vulkan VkPipelineBarrier &  │
│      Image Layout Transitions at precise stages!       │
└────────────────────────────────────────────────────────┘
```

---

## 5. The Tiny Working 5-Pass Renderer

To ground these theoretical concepts into concrete, working code that you can inspect and preview in real time, Module 07 includes a zero-dependency software renderer ([`07_tiny_multipass_renderer.cpp`](#graphics/07_gpu_architecture_and_pipeline)) and an interactive live workstation engine implementing all 5 passes:

```
Tiny 5-Pass Engine Dataflow:
┌────────────────────────────────────────────────────────────────────────┐
│ Pass 1: Depth Pre-Pass                                                 │
│ -> Rasterizes 3D mesh with color writes disabled.                      │
│ -> Fills depthPrepass buffer; enables 0% overdraw in Pass 3!           │
├────────────────────────────────────────────────────────────────────────┤
│ Pass 2: Perspective Shadow Mapping                                    │
│ -> Transforms primitives using Spotlight Perspective Matrix P_light.   │
│ -> Encodes light-space depth into 64x64 perspective shadowMap buffer.  │
├────────────────────────────────────────────────────────────────────────┤
│ Pass 3: Deferred Base Pass (G-Buffer MRT)                              │
│ -> Evaluates Early-Z against Pass 1 depthPrepass.                      │
│ -> Multiple Render Targets: gNormal (XYZ), gAlbedo (RGB), gDepth (Z). │
├────────────────────────────────────────────────────────────────────────┤
│ Pass 4: Stencil Volume Lighting                                        │
│ -> Step A: Stencil Marking: pixels inside light sphere radius get 1.   │
│ -> Step B: Lighting: fragments with stencil == 0 are SKIPPED!          │
│ -> Reprojects visible fragments into light space, tests shadow map,    │
│    and accumulates Blinn-Phong specular & Lambert diffuse.             │
├────────────────────────────────────────────────────────────────────────┤
│ Pass 5: 4x MSAA Resolve & Tone Mapping                                 │
│ -> 4-sample subpixel cross box resolve reconstructs smooth silhouettes.│
│ -> Applies Reinhard tone mapping & sRGB gamma 2.2 correction.          │
└────────────────────────────────────────────────────────────────────────┘
```

Inspect the interactive workstation viewport above:
- Toggle **Pass View** across `Final (5 Passes)`, `1. Depth Pre-Pass`, `2. Perspective Shadow`, `3. G-Buffer Normals`, and `4. Stencil Volume`.
- Move the **Spotlight Orbit Angle** slider to see dynamic perspective shadows cast in real time.
- Toggle **5. 4x MSAA Resolve** to see immediate anti-aliasing edge reconstruction!
- Open [`07_tiny_multipass_renderer.cpp`](#graphics/07_gpu_architecture_and_pipeline) and [`07_multipass_deferred_shaders.glsl`](#graphics/07_gpu_architecture_and_pipeline) to inspect the complete source implementations.

