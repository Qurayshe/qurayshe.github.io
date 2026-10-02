# Module 04: Z-Buffering & Hidden Surface Removal

> *"If two 3D triangles overlap on the screen, which one gets drawn on top?"*

In early 3D computer graphics, games attempted to sort triangles from back-to-front before drawing them (the **Painter's Algorithm**). But the Painter's Algorithm catastrophically fails in real-world 3D scenes:

1. **Cyclic Overlaps**: Triangle A is in front of B, B is in front of C, and C is in front of A!
2. **Intersecting Triangles**: Two triangles cutting through each other cannot be sorted.
3. **Sorting Overhead**: $O(N \log N)$ CPU sorting overhead per frame for millions of triangles.

In 1974, Edwin Catmull (co-founder of Pixar and former president of Walt Disney Animation Studios) invented the **Z-Buffer** (Depth Buffer), the single most crucial hardware innovation in 3D rendering history.

---

## 1. How the Z-Buffer Works

A Z-buffer is a 2D grid matching the exact resolution of the screen:

$$
\text{float depth\_buffer}[H][W]
$$

Instead of storing colors, each cell stores the distance ($Z$-depth) from the camera to the closest surface rendered so far:

```
At frame initialization:
Clear Framebuffer -> Background Color
Clear Z-Buffer    -> Infinity (+1.0 in NDC or FLT_MAX)

For each pixel (x, y) covered by a triangle with depth z:
  if (z < depth_buffer[y][x]) {
      depth_buffer[y][x] = z;              // Update closest depth
      framebuffer[y][x]  = pixel_color;   // Write pixel color!
  } else {
      // Discard! A closer surface has already been drawn here.
  }
```

```
Z-Buffer Depth Test:
                 Camera Eye
                     O
                    / \
                   /   \
                  /     \
           [Triangle A: z = 3.0]  <-- Passes! (3.0 < inf)
                /         \
         [Triangle B: z = 7.0]    <-- Fails test at (x,y)! (7.0 > 3.0, DISCARDED)
```

---

## 2. Perspective-Correct Depth Interpolation ($1/z$)

Because 2D screen pixels are generated via the perspective divide ($x' = x/z, \; y' = y/z$), original 3D depth $z$ does **not** vary linearly across the flat 2D screen pixel grid!

If you naively interpolate $z$ linearly using screen-space barycentric weights $(b_0, b_1, b_2)$:

$$
z_{\text{wrong}} = b_0 z_0 + b_1 z_1 + b_2 z_2 \quad \text{(Distorted \& Causes Severe Z-fighting!)}
$$

However, reciprocal depth $\frac{1}{z}$ **is strictly linear in 2D screen pixel space**:

$$
\frac{1}{z(P)} = b_0 \frac{1}{z_0} + b_1 \frac{1}{z_1} + b_2 \frac{1}{z_2}
$$

Therefore, for every pixel, we compute:

$$
z(P) = \frac{1}{\frac{1}{z(P)}}
$$

---

## 3. Z-Fighting & Depth Precision

Because floating-point numbers have finite precision (e.g. 24-bit depth buffers in hardware):

- If two coplanar surfaces are positioned at almost the exact same depth, rounding errors cause them to flicker erratically as the camera moves. This artifact is known as **Z-fighting**.
- Modern engines mitigate Z-fighting using **Reversed-Z** (mapping Near plane to $1.0$ and Far plane to $0.0$, pairing with IEEE 754 floating point precision which has dense precision near $0.0$).

Open [`04_zbuffer_rasterizer.cpp`](#graphics/04_zbuffer_and_depth) to inspect intersecting 3D planes rendered with accurate per-pixel depth testing and depth map image output.
