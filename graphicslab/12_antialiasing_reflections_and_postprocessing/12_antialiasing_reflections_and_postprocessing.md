# Module 12: Anti-Aliasing, SSR & Modern Post-Processing (MSAA, FXAA, TAA, AO)

> *"In real-time rendering, beauty is not just evaluating the lighting equation. It is removing geometric jaggedness without blurring textures, grounding objects with contact ambient occlusion, and simulating physical reflections across screen surfaces."*

This module analyzes the evolution of real-time image quality algorithms, directly contrasting **primitive / classic approaches** against **modern production solutions** used across AAA engines (Unreal Engine 5, Frostbite, Decima, id Tech).

---

## 1. The Anti-Aliasing Evolution: From SSAA to TAA

### What Causes Spatial & Temporal Aliasing?
Under the **Shannon-Nyquist Sampling Theorem**, an analog continuous geometric triangle or high-frequency specular highlight must be sampled at more than twice its highest spatial frequency. Because rasterization samples a pixel at a single infinitesimal point center $(x + 0.5, y + 0.5)$, high frequencies fold back into visible artifacts:
1. **Geometric Aliasing**: High-contrast "stair-stepping" along triangle silhouette edges.
2. **Shader / Specular Aliasing**: Pinpoint specular highlights jumping between pixels across camera motion.
3. **Sub-Pixel Geometry Flickering**: Power lines, chain-link fences, and foliage disappearing and reappearing frame-to-frame.

---

### Comparative Analysis: Primitive vs Modern Anti-Aliasing

```
Anti-Aliasing Algorithmic Family Tree:

[1. Super-Sample AA (SSAA)] ───────► Render entire frame at 2x-4x resolution, downsample.
                                     Cost: 4x-16x full shading ALU + VRAM bandwidth! (Extinct in real-time)
         │
         ▼
[2. Hardware MSAA (Multi-Sample)] ──► Shade 1x per pixel; evaluate coverage at 2x-8x subpixel locations.
                                     Primitive: 4x Rotated Grid Box Filter.
                                     Flaw: Only fixes geometric edges; does zero for shader/specular aliasing;
                                           extremely expensive in Deferred Shading!
         │
         ▼
[3. Post-Process AA (FXAA / SMAA)] ─► Single fullscreen image filter on final LDR/HDR buffer.
                                     FXAA: Luminance contrast gradient search along edge tangents.
                                     Flaw: Blurs high-frequency texture details; misses sub-pixel specular crawl.
         │
         ▼
[4. Temporal AA (TAA)] ────────────► Jitter camera projection sub-pixel by sub-pixel across consecutive frames!
                                     Reprojects color history using motion vectors + variance clipping.
                                     Modern: Eliminates geometric edges, shader shimmer, and sub-pixel crawls!
```

---

### Deep Dive: Fast Approximate Anti-Aliasing (FXAA)
Engineered by Timothy Lottes (NVIDIA, 2011), FXAA runs entirely in a single fullscreen post-processing pass:
1. **Luminance Edge Detection**: The shader computes perceptual luminance $L = 0.299R + 0.587G + 0.114B$ for the current pixel and its 4 cardinal neighbors (North, South, East, West).
2. **Contrast Thresholding**: If the local luminance contrast is below a threshold ($L_{\max} - L_{\min} < \max(\epsilon_{\text{min}}, L_{\max} \cdot \epsilon_{\text{rel}})$), the pixel is interior and left untouched.
3. **Tangent Search**: For edge pixels, the shader searches iteratively along the tangent of the edge gradient (horizontal or vertical) until the edge terminates.
4. **Sub-Pixel Filtering**: Computes a sub-pixel blend offset proportional to the distance along the edge, filtering across the boundary.

* **Strength**: Extremely cheap (~0.3 ms at 1080p), zero memory overhead, API-agnostic.
* **Flaw**: Static 2D filter that blurs fine texture text/decals and cannot fix temporal crawling.

---

### Deep Dive: Modern Temporal Anti-Aliasing (TAA)
Modern production engines (UE5, Decima, Frostbite) rely on **Temporal Anti-Aliasing**:

```
TAA Frame Pipeline:
┌────────────────────────────────────────────────────────────────────────┐
│ Current Frame Jitter:                                                  │
│ Offset camera projection matrix by sub-pixel Halton(2, 3) sequence:    │
│   p_clip.x += Jitter_X / ScreenWidth,  p_clip.y += Jitter_Y / Height   │
├────────────────────────────────────────────────────────────────────────┤
│ Render Frame (Geometry, Shading, Depth, Velocity Buffer)               │
├────────────────────────────────────────────────────────────────────────┤
│ History Reprojection Pass:                                             │
│ 1. Read motion vector (u_vel, v_vel) from Velocity Buffer.             │
│ 2. Sample previous frame history: C_prev = HistoryTexture(uv - vel).   │
│ 3. Sample 3x3 neighborhood of current frame pixels.                    │
│ 4. Compute Color Bounding Box: [C_min, C_max] or Variance Ellipsoid:  │
│      μ = mean(3x3),  σ = std_dev(3x3)                                  │
│ 5. Variance Clipping: Clip C_prev into [μ - γ·σ, μ + γ·σ]!             │
│ 6. Blend: C_final = mix(C_curr, C_prev_clipped, 0.90 to 0.95)          │
└────────────────────────────────────────────────────────────────────────┘
```

#### Why Variance Clipping is Crucial:
Without variance clipping, when an object moves or a light switches off, the history buffer still retains the old pixel colors, producing **Ghosting Artifacts** (trails of discarded visual data). Variance clipping forcefully clamps the history sample into the statistical bounds of the current frame's immediate $3 \times 3$ pixel neighborhood, instantly destroying ghosting while preserving sub-pixel anti-aliasing!

---

## 2. Real-Time Reflections: Primitive vs Modern

```
Reflections Comparison:

[Primitive: Cubemap Reflection Probe]
Surface Point P ──► Sample static pre-rendered cubemap texture in mirror direction R.
                   Pros: Zero run-time raymarching cost.
                   Cons: Infinite distance parallax error; completely misses dynamic moving objects!

[Modern: Screen-Space Reflections (SSR)]
Surface Point P ──► Step ray across 2.5D Screen-Space Depth Buffer:
                    1. Trace ray in world space along reflection vector R.
                    2. Project ray sample point p(t) into camera screen coordinates (u, v).
                    3. Compare ray z against geometry depth stored in Depth Buffer!
                    4. When ray crosses behind geometry surface: Hit detected!
                    5. Sample color from previous frame's HDR Color Buffer at (u, v)!
                    Pros: Perfectly captures dynamic characters, moving lights, and local geometry!
                    Cons: Ray cannot reflect objects outside camera view frustum (requires probe fallback).
```

### Screen-Space Raymarching Math:
Given hit point $\mathbf{p}$ and reflection vector $\mathbf{R} = \mathbf{V} - 2(\mathbf{V} \cdot \mathbf{N})\mathbf{N}$:
$$\mathbf{p}(t) = \mathbf{p} + t \mathbf{R}, \quad t \in [0, t_{\max}]$$
At each step $k$:
1. Project $\mathbf{p}(k \cdot \Delta t)$ into NDC screen space:
   $$(u, v, z_{\text{ray}}) = \text{ProjectToScreen}(\mathbf{p}(k \cdot \Delta t))$$
2. Read stored geometry depth: $z_{\text{scene}} = \text{DepthTexture}(u, v)$.
3. Intersection condition with surface thickness tolerance $\tau$:
   $$0 \le (z_{\text{ray}} - z_{\text{scene}}) \le \tau$$
4. Once an intersection is found, apply **Binary Search Refinement** for 5 iterations to find the exact sub-pixel reflection contact point!

---

## 3. Ambient Occlusion: Primitive SSAO vs Modern HBAO/GTAO

Ambient occlusion approximates the fraction of incoming hemispherical ambient light blocked by surrounding local geometry.

```
Ambient Occlusion Approaches:

[Primitive: Standard SSAO (CryEngine 2, 2007)]
Sample N points uniformly in a sphere/hemisphere around point P.
Test if sample point lies behind scene depth buffer.
Occlusion = (Number of samples behind geometry) / N.
Flaws: High noise; requires massive bilateral blur; inaccurate darkening on flat planes.

[Modern: Horizon-Based / Ground Truth AO (HBAO / GTAO)]
Trace rays in radial screen directions. For each direction, find the maximum horizon angle h:
Occlusion Integral along slice:
  A = (1 / 2) · ∫ [sin(h_right) + sin(h_left)] dφ
Pros: Mathematically matches physical diffuse radiosity; zero self-occlusion on flat surfaces!
```

---

## 4. Tone Mapping & Exposure: Primitive vs Modern

Displays (sRGB monitors) can only represent normalized luminance values in $[0.0, 1.0]$. Real light operates in high dynamic range (HDR) with physical values ranging from $0.001 \text{ cd/m}^2$ (moonlight) to $100,000 \text{ cd/m}^2$ (sunlight).

| Tone Mapping Method | Mathematical Formulation | Visual Characteristic |
| :--- | :--- | :--- |
| **Primitive: Hard Clamp** | $C_{\text{out}} = \min(1.0, C_{\text{in}})$ | Destroys all specular detail; highlights blow out into ugly flat solids. |
| **Classic: Reinhard (2002)** | $C_{\text{out}} = \frac{C_{\text{in}}}{1.0 + C_{\text{in}}}$ | Soft roll-off; preserves details, but desaturates bright colors into washed-out gray. |
| **Modern: ACES Filmic** | $f(x) = \frac{x(2.51x + 0.03)}{x(2.43x + 0.59) + 0.14}$ | Cinematic S-curve; rich toe contrast, natural shoulder roll-off, preserves color saturation in bright specular highlights. |

Open [`12_antialiasing_and_postprocessing.glsl`](#graphics/12_antialiasing_reflections_and_postprocessing) to inspect production shader implementations comparing FXAA, TAA variance clipping, Screen-Space Reflections, and ACES Filmic tone mapping.

