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

## 4. 3D Wireframe Rendering

By connecting projected 3D vertices $(x, y, z)$ with Bresenham lines, we can render 3D meshes (cubes, wireframe spheres, terrain heightmaps) entirely on the CPU!

Open [`02_bresenham_wireframe.c`](file:///c:/Users/kkhoie/Desktop/ktknaga/qurayshe.github.io/graphicslab/02_bresenham_wireframe/02_bresenham_wireframe.c) to inspect full wireframe rotation and perspective projection of a 3D cube rendered to PPM.
