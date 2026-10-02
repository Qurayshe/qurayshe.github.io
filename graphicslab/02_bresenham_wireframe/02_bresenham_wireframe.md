# Module 02: Bresenham's Line Algorithm & Wireframe Rendering

> *"How do you connect two continuous points on a discrete grid of pixels without floating-point division or rounding errors?"*

In 1962, Jack Elton Bresenham developed an algorithm at IBM that remains the foundation of line rasterization. It calculates the closest pixel coordinate along a vector using **pure integer addition, subtraction, and bit shifts** ($O(1)$ per pixel).

---

## 1. The Line Equation & The Floating-Point Problem

A standard 2D line equation is:
$$y = m \cdot x + b \quad \text{where } m = \frac{\Delta y}{\Delta x} = \frac{y_1 - y_0}{x_1 - x_0}$$

The naive approach steps $x$ by 1, calculates $y = m \cdot x + b$, and rounds to the nearest integer `round(y)`.
**Why this is fatal in low-level graphics engines**:
1. Floating-point division and rounding are far slower than integer addition.
2. In steep lines ($|m| > 1$), stepping along $x$ produces disconnected, dotted gaps instead of a continuous line.

---

## 2. Bresenham's Integer Error Accumulator

Instead of floating-point math, Bresenham tracks an **integer error term** $D$.

For a line with $0 \le m \le 1$:
At each step $x \leftarrow x + 1$, the ideal line increases $y$ by the fractional slope $\frac{\Delta y}{\Delta x}$.
We multiply through by $2 \Delta x$ to clear the fractions:
$$\text{Initial Error: } D = 2 \Delta y - \Delta x$$

At each step:
- If $D > 0$: the line has climbed closer to $y + 1$. We step $y \leftarrow y + 1$ and decrement $D \leftarrow D + 2(\Delta y - \Delta x)$.
- If $D \le 0$: $y$ stays the same. We increment $D \leftarrow D + 2 \Delta y$.

```
Bresenham Grid Walk (Slope 0 <= m <= 1):
  y + 1 ┌───┬───┬───┬───┐
        │   │   │   │ X │  <- Step Y when D > 0
    y   ├───┼───┼───┼───┤
        │ X │ X │ X │   │  <- Keep Y when D <= 0
        └───┴───┴───┴───┘
          x  x+1 x+2 x+3
```

---

## 3. Generalizing to All 8 Octants

A line can go in any direction (positive, negative, shallow, steep). By calculating absolute deltas $|dx|, |dy|$ and step directions $sx = \text{sign}(x_1 - x_0)$ and $sy = \text{sign}(y_1 - y_0)$, we can rasterize any arbitrary line across all 8 octants with a single loop:

```c
void draw_line(int x0, int y0, int x1, int y1, Color c) {
    int dx = abs(x1 - x0);
    int dy = -abs(y1 - y0);
    int sx = (x0 < x1) ? 1 : -1;
    int sy = (y0 < y1) ? 1 : -1;
    int err = dx + dy; // error term

    while (1) {
        set_pixel(x0, y0, c);
        if (x0 == x1 && y0 == y1) break;
        int e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}
```

---

---

## 4. The Foundation: "Simple" 3D to 2D Projection Math & Pixel Space

Before dealing with complex $4 \times 4$ transformation matrices, every 3D graphics programmer must master the **fundamental pinhole projection math** that maps continuous 3D world coordinates onto a discrete 2D screen.

```
Pinhole Camera Projection Geometry (Side View along Y and Z):

       +Y (Up)
        ▲
        │          Point P(x, y, z)
        │                ●
        │               /│
        │              / │
        │             /  │
        │   y'       /   │ y
        │  ┌───┐    /    │
        │  │ ● │   /     │
  Camera│  └───┘  /      │
    Eye ●────────┼───────┴────────► +Z (Depth into scene)
      (0,0,0)  z = 1     z
           Projection
             Plane
```

### Step 1: The 3D Point $(x, y, z)$
In camera space (view space), any point in the world is represented by 3 coordinates:
$$(x, y, z)$$
- $x$: Horizontal distance from the camera center (left / right).
- $y$: Vertical distance from the camera center (up / down).
- $z$: Depth distance in front of the camera ($z > 0$).

### Step 2: The Core Perspective Division ($x' = x/z, \; y' = y/z$)
By the geometric principle of **similar triangles**, a point at distance $z$ with height $y$ projects onto a projection plane at unit distance $z = 1$ with projected height $y'$:

$$\frac{y'}{1} = \frac{y}{z} \implies y' = \frac{y}{z}$$
$$\frac{x'}{1} = \frac{x}{z} \implies x' = \frac{x}{z}$$

$$\mathbf{2.} \quad (x, y, z)$$
$$\mathbf{1.} \quad x' = \frac{x}{z}$$
$$\mathbf{3.} \quad y' = \frac{y}{z}$$

> **The Golden Rule of 3D Perspective**:  
> Simply dividing $x$ and $y$ by depth $z$ is the exact reason why objects shrink as they move farther away! If depth $z$ doubles, the object's projected size on screen is cut in half ($1/2$). If depth quadruples, size shrinks to ($1/4$).

### Step 3: Focal Length & Field-of-View (FOV) Scaling
To control the zoom factor or Field of View (FOV) of the virtual camera, we scale the projected coordinates by a focal multiplier $f$ (or $d$):

$$x' = f \cdot \frac{x}{z}, \quad y' = f \cdot \frac{y}{z}$$

Where $f = \frac{1}{\tan(\text{FOV} / 2)}$ (or in pixel terms, $f = \frac{\text{Width}}{2 \cdot \tan(\text{FOV} / 2)}$).

---

## 5. Transforming to Screen Pixel Space

Continuous projection coordinates $(x', y')$ are centered at $(0, 0)$ (the optical axis), with $+Y$ pointing upwards and values spanning roughly $[-1, +1]$.

However, a computer monitor's framebuffer is a discrete 2D grid where:
- $(0, 0)$ is at the **top-left corner**.
- Horizontal pixel $X$ increases **to the right** ($0 \le X < \text{Width}$).
- Vertical pixel $Y$ increases **downwards** ($0 \le Y < \text{Height}$).

```
Camera Projection Plane                 Discrete Screen Pixel Space
    +Y                                   (0,0) ───────────────► +X (Width)
     ▲                                     │   ┌─────────────┐
     │  (x', y')                           │   │             │
     │     ●                               │   │      ● (px, py)
─────┼──────────► +X                       │   │             │
     │ (0,0) center                        ▼   └─────────────┘
     │                                    +Y (Height)
```

To map continuous camera coordinates $(x', y')$ into integer screen pixels $(X_{\text{pixel}}, Y_{\text{pixel}})$:

$$X_{\text{pixel}} = \frac{\text{Width}}{2} + \left(x' \cdot \text{scale}\right) = \frac{\text{Width}}{2} + \left(f \cdot \frac{x}{z}\right)$$

$$Y_{\text{pixel}} = \frac{\text{Height}}{2} - \left(y' \cdot \text{scale}\right) = \frac{\text{Height}}{2} - \left(f \cdot \frac{y}{z}\right)$$

*(Note the minus sign for $Y_{\text{pixel}}$: this flips the vertical axis so that $+Y$ in 3D correctly points up on your screen!)*

### Memory Offset in the Framebuffer
Finally, to store the pixel color in 1D CPU RAM:
$$\text{Pixel Index} = Y_{\text{pixel}} \times \text{Width} + X_{\text{pixel}}$$
$$\text{Byte Offset} = \text{Pixel Index} \times 4 \quad (\text{for RGBA32})$$

---

## 6. Implementation: 3D Wireframe Cube

Here is the exact C function implementing this simple projection math from [`02_bresenham_wireframe.c`](#graphics/02_bresenham_wireframe):

```c
typedef struct { float x, y, z; } Vec3;
typedef struct { int x, y; } Point2D;

Point2D project_to_pixel_space(Vec3 p, float fov_scale, float camera_dist) {
    // 1. Position point in front of camera
    float z = p.z + camera_dist;
    if (z <= 0.1f) z = 0.1f; // Prevent division by zero near plane

    // 2. Simple perspective division: x' = x / z,  y' = y / z
    // 3. Viewport mapping to screen pixel coordinates
    int px = (int)(WIDTH  / 2.0f + (p.x * fov_scale / z));
    int py = (int)(HEIGHT / 2.0f - (p.y * fov_scale / z)); // Inverted Y for display

    return (Point2D){ px, py };
}
```

By projecting the 8 vertices of a unit 3D cube and connecting the 12 edges with Bresenham's `draw_line()`, we achieve real-time 3D wireframe rendering using pure CPU mathematics!

