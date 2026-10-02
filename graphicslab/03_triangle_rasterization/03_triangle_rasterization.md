# Module 03: Triangle Rasterization & Barycentric Coordinates

> *"Why is every 3D model in gaming made of triangles? Because 3 points are always strictly coplanar, uniquely defined, and trivially convex."*

The triangle is the fundamental atomic primitive of computer graphics. Whether inside a Nintendo 64 or an NVIDIA RTX 5090, the hardware rasterizer is dedicated to taking 3 projected 2D screen vertices $(v_0, v_1, v_2)$ and deciding **which pixels are inside the triangle**, while smoothly interpolating colors, UV coordinates, and depth.

---

## 1. The Rasterization Strategy: Bounding Box Traversal

Given three screen-space vertices $V_0(x_0, y_0), V_1(x_1, y_1), V_2(x_2, y_2)$:

```
Screen Rasterization Grid:
  y_min ┌─────────────────────────┐
        │       V0 (Top)          │
        │        /\               │
        │       /  \              │
        │      /    \             │
        │     /      \ V1 (Right) │
        │    /________\           │
        │  V2 (Bottom-Left)       │
  y_max └─────────────────────────┘
        x_min                   x_max
```

1. Compute the Axis-Aligned Bounding Box (AABB):
   $$x_{\min} = \min(x_0, x_1, x_2), \quad x_{\max} = \max(x_0, x_1, x_2)$$
   $$y_{\min} = \min(y_0, y_1, y_2), \quad y_{\max} = \max(y_0, y_1, y_2)$$
2. Clip the bounding box against screen borders $[0, \text{Width}-1]$ and $[0, \text{Height}-1]$.
3. Iterate through every pixel $(x, y)$ inside the bounding box.
4. Test if $(x, y)$ is inside the triangle using **Barycentric Coordinates** or **Edge Functions**.

---

## 2. Barycentric Coordinates Explained

Any point $P(x, y)$ in the 2D plane can be uniquely expressed as a weighted sum of the triangle's three vertices $A, B, C$:

$$P = w_A A + w_B B + w_C C$$
where:
$$w_A + w_B + w_C = 1$$

The weights $(w_A, w_B, w_C)$ (often denoted $\alpha, \beta, \gamma$) are called **Barycentric Coordinates**.

### Geometric Meaning: Ratio of Sub-Triangle Areas
Barycentric weights are proportional to the signed sub-areas formed by point $P$:
$$w_A = \frac{\text{Area}(PBC)}{\text{Area}(ABC)}, \quad w_B = \frac{\text{Area}(APC)}{\text{Area}(ABC)}, \quad w_C = \frac{\text{Area}(ABP)}{\text{Area}(ABC)}$$

```
               A (w_A = 1)
              /\
             /  \
            / P  \
           /______\
B (w_B = 1)        C (w_C = 1)
```

### The Inside-Outside Test:
A pixel $P$ lies **strictly inside** the triangle if and only if all three weights are non-negative:
$$w_A \ge 0, \quad w_B \ge 0, \quad w_C \ge 0$$

If any weight is negative, the point is outside the triangle.

---

## 3. Vertex Attribute Interpolation

Barycentric coordinates do far more than just test hit/miss: they allow **smooth linear interpolation of any vertex property across the surface**:

For smooth Gouraud vertex colors $C_0, C_1, C_2$:
$$\text{Color}(P) = w_A C_0 + w_B C_1 + w_C C_2$$

For UV texture coordinates $(u_0, v_0), (u_1, v_1), (u_2, v_2)$:
$$U(P) = w_A u_0 + w_B u_1 + w_C u_2$$

---

## 4. Edge Functions (Pineda Algorithm)

Modern GPU rasterization hardware uses Juan Pineda's 1988 edge function formula:
$$E_{AB}(P) = (P_x - A_x)(B_y - A_y) - (P_y - A_y)(B_x - A_x)$$

$E_{AB}(P)$ is the 2D cross-product:
- $> 0$ if $P$ is to the right of directed edge $A \to B$
- $< 0$ if $P$ is to the left
- $= 0$ if $P$ lies directly on the edge

Open [`03_triangle_rasterizer.cpp`](file:///c:/Users/kkhoie/Desktop/ktknaga/qurayshe.github.io/graphicslab/03_triangle_rasterization/03_triangle_rasterizer.cpp) to see edge functions and barycentric coordinates in action, rasterizing smooth RGB color-interpolated triangles!
