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

## 1. Why 4x4 Matrices? (Homogeneous Coordinates)

A 3D coordinate has 3 dimensions $(x, y, z)$. With a $3 \times 3$ matrix, you can easily perform **Rotation** and **Scaling**:
$$\begin{bmatrix} x' \\ y' \\ z' \end{bmatrix} = \begin{bmatrix} m_{00} & m_{01} & m_{02} \\ m_{10} & m_{11} & m_{12} \\ m_{20} & m_{21} & m_{22} \end{bmatrix} \begin{bmatrix} x \\ y \\ z \end{bmatrix}$$

However, you **cannot** perform Translation (shifting position by $t_x, t_y, t_z$) as a pure matrix multiplication in 3D! Translation requires addition: $\vec{v}' = \vec{v} + \vec{t}$.

By introducing a 4th component $w$ (setting $w = 1$ for points, and $w = 0$ for directional vectors), we enter **Homogeneous Coordinates**:
$$\begin{bmatrix} x' \\ y' \\ z' \\ 1 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 & t_x \\ 0 & 1 & 0 & t_y \\ 0 & 0 & 1 & t_z \\ 0 & 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ z \\ 1 \end{bmatrix}$$

This allows translation, rotation, scaling, and perspective projection to be concatenated into a **single composite $4\times 4$ matrix**!

---

## 2. Constructing the Matrices from Scratch

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

## 3. The Perspective Divide

After multiplying by $\mathbf{P}$, the 4th component $w_{\text{clip}}$ stores the original distance $-z_{\text{camera}}$.
To convert from 4D clip space to 3D Normalized Device Coordinates (NDC $[-1, +1]$):

$$x_{\text{ndc}} = \frac{x_{\text{clip}}}{w_{\text{clip}}}, \quad y_{\text{ndc}} = \frac{y_{\text{clip}}}{w_{\text{clip}}}, \quad z_{\text{ndc}} = \frac{z_{\text{clip}}}{w_{\text{clip}}}$$

This simple division by $w$ is the mathematical reason why objects shrink with distance!

Open [`05_mvp_transform_math.cpp`](file:///c:/Users/kkhoie/Desktop/ktknaga/qurayshe.github.io/graphicslab/05_3d_math_and_transformations/05_mvp_transform_math.cpp) to inspect a complete $4\times 4$ Matrix library and vertex transformer implemented from scratch in pure C++.
