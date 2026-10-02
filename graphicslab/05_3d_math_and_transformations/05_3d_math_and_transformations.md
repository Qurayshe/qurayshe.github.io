# Module 05: 3D Transformation Math: Model, View, Projection (MVP)

> *"In graphics programming, space is not static: it is a sequence of matrix coordinate transforms."*

To display a 3D character in a video game on a flat 2D glass screen, every single vertex goes through the canonical **MVP Matrix Transformation Pipeline**:

$$\vec{v}_{\text{clip}} = \mathbf{P} \times \mathbf{V} \times \mathbf{M} \times \vec{v}_{\text{local}}$$

```
[Local Model Space]
        │
        ▼  x Model Matrix (Position, Rotation, Scale in World)
[World Space]
        │
        ▼  x View Matrix (Camera LookAt Transformation)
[Camera / Eye Space]
        │
        ▼  x Projection Matrix (Perspective Frustum / FOV)
[Clip Space (Homogeneous x, y, z, w)]
        │
        ▼  Perspective Divide (x/w, y/w, z/w)
[Normalized Device Coordinates (NDC, [-1, 1])]
        │
        ▼  Viewport Mapping
[Screen Pixel Space (x: 0..Width, y: 0..Height)]
```

---

## 1. The Intuition: "Simple" 3D to 2D Projection Math First

Before diving into $4\times 4$ matrix algebra, understand the core intuition: **all 3D rendering reduces to simple perspective division followed by viewport pixel mapping.**

```
The Core 3-Step Pinhole Formula:

    1. Camera 3D Coordinate:
       (x, y, z)   where z is depth into the screen (z > 0)

    2. Perspective Division:
       x' = x / z
       y' = y / z

    3. Discrete Screen Pixel Space:
       X_pixel = (Width / 2)  + (x' * scale)
       Y_pixel = (Height / 2) - (y' * scale)
```

$$\mathbf{2.} \quad (x, y, z)$$
$$\mathbf{1.} \quad x' = \frac{x}{z}$$
$$\mathbf{3.} \quad y' = \frac{y}{z}$$

### Why Does This Work?
By the geometry of similar triangles, light rays passing through a focal pinhole project geometry onto the view plane in inverse proportion to distance:
- When an object is at depth $z = 1$, its size is $100\%$ ($x/1$).
- When it moves back to depth $z = 2$, its projected size drops to $50\%$ ($x/2$).
- When it moves to depth $z = 4$, its projected size drops to $25\%$ ($x/4$).

### Mapping to Screen Pixel Space
Continuous projection coordinates $(x', y')$ are centered at $(0, 0)$ with Cartesian $+Y$ pointing up. A physical monitor uses raster pixel coordinates $(X_{\text{pixel}}, Y_{\text{pixel}})$ with $(0, 0)$ at the top-left and $+Y$ pointing down:

$$X_{\text{pixel}} = \frac{\text{Width}}{2} + \left(f \cdot \frac{x}{z}\right)$$
$$Y_{\text{pixel}} = \frac{\text{Height}}{2} - \left(f \cdot \frac{y}{z}\right)$$

where $f$ is the focal zoom factor ($f = \frac{\text{Width}}{2 \cdot \tan(\text{FOV} / 2)}$).

---

## 2. Why 4x4 Matrices? (Homogeneous Coordinates)

If simple division ($x' = x/z, y' = y/z$) solves 3D projection, why does every modern game engine and GPU use $4 \times 4$ matrices?

1. **Translation Requires Linear Packaging**: In 3D, rotation and scaling can be represented with a $3 \times 3$ matrix, but translation is an addition ($\vec{v} + \vec{t}$):
$$\begin{bmatrix} x' \\ y' \\ z' \end{bmatrix} = \begin{bmatrix} m_{00} & m_{01} & m_{02} \\ m_{10} & m_{11} & m_{12} \\ m_{20} & m_{21} & m_{22} \end{bmatrix} \begin{bmatrix} x \\ y \\ z \end{bmatrix} + \begin{bmatrix} t_x \\ t_y \\ t_z \end{bmatrix}$$

2. **Division is Non-Linear**: A matrix can only perform linear combinations (addition and multiplication). It cannot natively divide by a variable coordinate $z$!

By introducing a 4th homogeneous component $w$ (setting $w = 1$ for points and $w = 0$ for directional vectors), we enter **Homogeneous 4D Coordinates**:

$$\begin{bmatrix} x' \\ y' \\ z' \\ 1 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 & t_x \\ 0 & 1 & 0 & t_y \\ 0 & 0 & 1 & t_z \\ 0 & 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ z \\ 1 \end{bmatrix}$$

The $4 \times 4$ Perspective Projection Matrix $\mathbf{P}$ cleverely puts $-z_{\text{camera}}$ into the $w$ component ($w_{\text{clip}} = -z$). Then, the GPU's hardware **Perspective Divide stage** automatically computes:

$$\left(\frac{x_{\text{clip}}}{w_{\text{clip}}}, \; \frac{y_{\text{clip}}}{w_{\text{clip}}}\right) \equiv \left(\frac{x}{z}, \; \frac{y}{z}\right)$$

The entire modern graphics pipeline is designed specifically to execute the simple $x/z, y/z$ projection at massive hardware scale!

---

## 3. Constructing the Matrices from Scratch

### 1. The Model Matrix $\mathbf{M}$
Combines scaling $\mathbf{S}$, rotation $\mathbf{R}$, and translation $\mathbf{T}$:
$$\mathbf{M} = \mathbf{T} \times \mathbf{R} \times \mathbf{S}$$

### 2. The View (Camera) Matrix $\mathbf{V}$ (LookAt)
Given camera position $\vec{P}_{\text{eye}}$, look target $\vec{P}_{\text{target}}$, and global up vector $\vec{Y}_{\text{up}}$:
1. Forward vector: $\vec{F} = \text{normalize}(\vec{P}_{\text{target}} - \vec{P}_{\text{eye}})$
2. Right vector: $\vec{R} = \text{normalize}(\vec{F} \times \vec{Y}_{\text{up}})$
3. Camera Up vector: $\vec{U} = \vec{R} \times \vec{F}$

$$\mathbf{V} = \begin{bmatrix} R_x & R_y & R_z & -\vec{R} \cdot \vec{P}_{\text{eye}} \\ U_x & U_y & U_z & -\vec{U} \cdot \vec{P}_{\text{eye}} \\ -F_x & -F_y & -F_z & \vec{F} \cdot \vec{P}_{\text{eye}} \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

### 3. The Perspective Projection Matrix $\mathbf{P}$
Simulates human eye perspective (distant objects appear smaller):
Given vertical Field-of-View angle $\theta$ (fov), aspect ratio $a = \frac{W}{H}$, near plane $n$, and far plane $f$:
$$\tan\left(\frac{\theta}{2}\right) = t, \quad \mathbf{P} = \begin{bmatrix} \frac{1}{a \cdot t} & 0 & 0 & 0 \\ 0 & \frac{1}{t} & 0 & 0 \\ 0 & 0 & -\frac{f + n}{f - n} & -\frac{2 f n}{f - n} \\ 0 & 0 & -1 & 0 \end{bmatrix}$$

---

## 4. The Perspective Divide & Viewport Mapping

After multiplying by the composite MVP matrix, the 4th homogeneous component $w_{\text{clip}}$ stores the original distance $-z_{\text{camera}}$.

### Step A: The Hardware Perspective Divide
To convert from 4D clip space to 3D Normalized Device Coordinates (NDC $[-1, +1]$):

$$x_{\text{ndc}} = \frac{x_{\text{clip}}}{w_{\text{clip}}}, \quad y_{\text{ndc}} = \frac{y_{\text{clip}}}{w_{\text{clip}}}, \quad z_{\text{ndc}} = \frac{z_{\text{clip}}}{w_{\text{clip}}}$$

This division by $w$ is the hardware execution of the fundamental $x/z, y/z$ perspective divide!

### Step B: The Viewport Transform (NDC to Screen Pixel Space)
Finally, the GPU maps normalized $[-1, +1]$ range to integer pixel coordinates $(X_{\text{pixel}}, Y_{\text{pixel}})$:

$$X_{\text{pixel}} = (x_{\text{ndc}} + 1) \cdot \frac{\text{Width}}{2}$$
$$Y_{\text{pixel}} = (1 - y_{\text{ndc}}) \cdot \frac{\text{Height}}{2}$$

*(Notice again that $1 - y_{\text{ndc}}$ inverts the vertical axis so that $+Y$ points up in 3D while screen pixel rows count down).*

---

## 5. Source Code Inspection

Open [`05_mvp_transform_math.cpp`](file:///c:/Users/kkhoie/Desktop/ktknaga/qurayshe.github.io/graphicslab/05_3d_math_and_transformations/05_mvp_transform_math.cpp) to inspect a complete $4\times 4$ Matrix library and vertex transformer implemented from scratch in pure C++.
