# Module 10: Visibility Buffers, Reverse-Z & Modern Frame Pipelines

> *"Deferred shading decoupled lighting from geometry by storing fat material attributes. Visibility Buffer rendering goes one step further: it decouples geometry rasterization from material shading entirely."*

Modern AAA rendering architectures (Unreal Engine 5 Nanite, Decima Engine in Horizon/Death Stranding, Crysis 3, Days Gone) face a common crisis: **geometry density has scaled to sub-pixel triangles, while materials require dozens of texture parameters**. The traditional G-Buffer model collapses under this memory pressure.

This module covers the advanced pipeline techniques that power contemporary engines across the industry.

---

## 1. Floating-Point Reverse-Z: Fixing Depth Precision

In traditional graphics pipelines (OpenGL/DirectX 9):
- The near plane is mapped to $z = 0.0$ and the far plane to $z = 1.0$.
- Standard perspective projection produces non-linear normalized depth:
  $$z_{\text{ndc}} = \frac{f}{f - n} - \frac{f \cdot n}{(f - n) \cdot z_{\text{eye}}}$$

### The Precision Catastrophe of Standard Z:
IEEE 754 floating-point numbers allocate half of their entire representable numerical values to the interval $[0.0, 1.0]$ between $0.0$ and $0.5$ (governed by the exponent bits). Because standard perspective projection maps almost the entire visible world distance (e.g., from $2\text{m}$ to $10,000\text{m}$) into the narrow range $[0.9, 1.0]$, **most floating-point precision bits are wasted in the first few inches in front of the camera lens**!

```
Standard Z Distribution (near = 0.0, far = 1.0):
 [0.0 ────────────── 0.9] ─── [0.9 ──────────── 1.0]
     Near 2 meters             Entire rest of open world (10,000 meters!)
 -> Severe Z-fighting on distant mountains, buildings, and ground planes!

Reverse-Z Distribution (near = 1.0, far = 0.0):
 [1.0 ────────────── 0.1] ─── [0.1 ──────────── 0.0]
     Near 2 meters             Distant open world
 -> The non-linearity of float exponents perfectly cancels the non-linearity 
    of perspective division! Uniform precision across kilometers!
```

### The Reverse-Z Formulation:
To implement Reverse-Z:
1. Set the depth comparison operator to `GREATER` or `GREATER_EQUAL` (`glDepthFunc(GL_GEQUAL)` / `VK_COMPARE_OP_GREATER_OR_EQUAL`).
2. Clear the depth buffer to $0.0$ instead of $1.0$ (`glClearDepth(0.0)`).
3. Invert the perspective projection matrix's depth mapping:
   $$\mathbf{P}_{\text{ReverseZ}} = \begin{bmatrix} \frac{1}{\text{aspect} \cdot \tan(\frac{\text{fov}}{2})} & 0 & 0 & 0 \\ 0 & \frac{1}{\tan(\frac{\text{fov}}{2})} & 0 & 0 \\ 0 & 0 & 0 & n \\ 0 & 0 & -1 & 0 \end{bmatrix} \quad (\text{Infinite Far Plane})$$
With Reverse-Z and a 32-bit float or 24-bit unorm depth buffer, **Z-fighting is completely eliminated across open worlds spanning 50 kilometers**.

---

## 2. The Visibility Buffer Architecture

Pioneered by Christopher Burns & Morgan McGuire (2013) and adopted in production by Crytek and Epic Games (Nanite), the **Visibility Buffer** replaces the monolithic 60–90 byte G-Buffer with a tiny **64-bit (8 byte) intermediate buffer**.

```
Deferred Shading vs Visibility Buffer Memory Traffic:

[Deferred Shading G-Buffer]
Rasterize Geometry ──► FAT G-BUFFER (64 - 96 bytes / pixel)
                       ├─ GBufferA: Normal XYZ (FP16), Roughness (FP16)
                       ├─ GBufferB: Albedo RGB (U8), Metallic (U8)
                       ├─ GBufferC: Linear Depth (FP32)
                       └─ GBufferD: Emissive (FP16), Precomputed AO (U8)
                       ▼
Shading Pass        ──► Reads all 4 textures per pixel -> 64 GB/s VRAM bandwidth penalty!

[Visibility Buffer Architecture]
Rasterize Geometry ──► VISIBILITY BUFFER (ONLY 8 BYTES / PIXEL!)
                       ├─ uint32: InstanceID (16 bits) + Meshlet/ClusterID (16 bits)
                       └─ uint32: PrimitiveID (16 bits) + Barycentric Coord (16 bits)
                       ▼
Reconstruction Pass ──► Single Compute Dispatch evaluates materials:
                        1. Reads 64-bit ID from Visibility Buffer.
                        2. Fetches 3 triangle vertices from VRAM using PrimitiveID.
                        3. Evaluates smooth barycentric interpolation in software!
                        4. Samples only the specific textures required by that mesh!
```

### Why the Visibility Buffer Revolutionized High-Poly Engines:
1. **$8\times$ Reduction in Framebuffer Memory Bandwidth**: Writing 8 bytes per pixel instead of 64 bytes eliminates the PCIe and VRAM bandwidth wall at 4K resolution.
2. **Infinite Material Diversity**: Unlike Deferred Shading where all meshes must share the same G-Buffer parameters, the reconstruction pass branches dynamically to evaluate custom BRDFs (hair, cloth, subsurface skin, glass) per instance without paying G-Buffer bandwidth penalties.
3. **Decoupled Shading Rate**: Material shading runs strictly once per visible pixel, regardless of geometric overdraw or micro-triangle density!

---

## 3. Alpha-Testing Hazards & The Partial Pre-Pass

In video game environments, foliage (leaves, grass, chain-link fences) relies on **Alpha Testing** (`discard` in GLSL or `clip()` in HLSL).

### Why Naive Alpha-Testing Kills GPU Performance:
- The GPU hardware **cannot execute Early-Z** if a fragment shader might execute `discard`. If Early-Z executed and updated the depth buffer, but the fragment later discarded itself, the depth buffer would hold a false occlusion barrier!
- Consequently, drawing dense foliage in an Early-Z depth pre-pass forces the GPU to drop into **Late-Z**, degrading throughput by $3\times$ to $5\times$.

### The Engine Solution: The "Partial Alpha-Tested Pre-Pass"
Production engines (e.g., CryEngine, Decima) partition the depth pre-pass into two distinct phases:

```
1. Phase A: Pure Opaque Pre-Pass
   - Renders rocks, terrain, architecture with NO discard instructions.
   - Executes at peak hardware Early-Z and Hi-Z double-speed rates (Z-only mode).

2. Phase B: Conservative Alpha-Tested Pre-Pass
   - Evaluates foliage with discard enabled, but utilizes Alpha-to-Coverage (MSAA)
     or conservative depth bounds to prevent Hi-Z stalls on surrounding geometry.
```

---

## 4. Motion Vector (Velocity) Pre-Pass

Modern temporal techniques—**Temporal Anti-Aliasing (TAA)**, **FSR 2/3**, **DLSS**, and **Screen-Space Motion Blur**—require a 2D screen-space velocity vector $(\Delta u, \Delta v)$ for every pixel:

$$\mathbf{v}_{\text{motion}} = \mathbf{p}_{\text{screen, current}} - \mathbf{p}_{\text{screen, previous}}$$

```
Velocity Buffer Generation:
Current Frame:   p_clip_curr = Proj_curr · View_curr · Model_curr · p_local
Previous Frame:  p_clip_prev = Proj_prev · View_prev · Model_prev · p_local

Screen Velocity:
u_curr = p_clip_curr.xy / p_clip_curr.w * 0.5 + 0.5
u_prev = p_clip_prev.xy / p_clip_prev.w * 0.5 + 0.5
Velocity = u_curr - u_prev
```

- For static objects, the shader reconstructs $\mathbf{p}_{\text{clip, prev}}$ using the inverse current view-projection matrix and the previous view-projection matrix from depth alone.
- For skinned skeletal meshes (characters), the previous frame's bone matrices are preserved in a ring buffer, evaluating dynamic skinned vertex motion.

---

## 5. Sample Frequency Shading & Deferred MSAA

Why is Multi-Sample Anti-Aliasing (MSAA) notoriously difficult in Deferred Shading?
- In Forward rendering, hardware MSAA evaluates the fragment shader **once per pixel**, and tests coverage at $4\times$ or $8\times$ sub-sample locations.
- In Deferred Shading, if edge pixels are shaded at pixel frequency, silhouette color bleeding occurs. If shaded at sample frequency, lighting calculations multiply by $4\times$!

### Crysis 3 & Fox Engine Edge Detection:
1. The engine renders an edge detection pass comparing G-Buffer normal and depth discontinuities:
   $$\text{isEdge} = (\|\mathbf{N}_{\text{sample0}} - \mathbf{N}_{\text{sample1}}\| > \epsilon_N) \lor (|z_0 - z_1| > \epsilon_z)$$
2. Interior pixels (95% of the screen) evaluate lighting **once per pixel**.
3. Silhouette edge pixels (5% of the screen) evaluate lighting at **sample frequency** using hardware `SV_Coverage` masks, delivering razor-sharp anti-aliased geometry edges without 4K performance degradation!

Inspect [`10_visibility_buffer_shader.glsl`](#graphics/10_visibility_buffer_and_advanced_pipelines) to see complete GLSL implementations of 64-bit Visibility Buffer encoding and compute-based material reconstruction.

