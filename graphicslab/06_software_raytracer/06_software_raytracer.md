# Module 06: Software Raytracer from Scratch in C++

> *"Rasterization projects 3D triangles forward onto the screen. Raytracing shoots rays backward from your eye into the virtual world."*

While rasterization is lightning-fast and dominates real-time gaming, **Raytracing** is the physical gold standard of computer graphics. In this module, we construct a complete software raytracer in pure C++ with **shadow rays, surface normals, diffuse Lambertian shading, Blinn-Phong specular reflections, and recursive mirror reflections**.

---

## 1. The Core Philosophy: Reverse Light Transport

Real light leaves the Sun or a light bulb, bounces trillions of times, and a minute fraction enters your pupil. Simulating every photon from a light source forward is computationally impossible.

Arthur Appel (1968) and Turner Whitted (1980) realized: **reverse the flow**!
1. For every pixel $(x, y)$ on the screen, cast a **Primary Ray** from the camera eye through the pixel into the 3D scene.
2. Find the closest geometric surface intersected by the ray.
3. At the hit point:
   - Shoot **Shadow Rays** toward light sources to determine if the point is in shadow.
   - Calculate diffuse and specular reflections.
   - Recursively cast **Secondary Reflection Rays** into the scene to render shiny mirrors.

```
Raytracing Pipeline:
  Camera Eye
      O
       \   Primary Ray
        \
         ▼ [Pixel (x, y)]
          \
           \
            * Hit Point P on Sphere
           / \
 Shadow   /   \  Reflection Ray
  Ray    /     \
        ▼       ▼
     [Light]  [Another Object]
```

---

## 2. Ray-Sphere Mathematical Intersection

A ray is defined by origin $\vec{O}$ and normalized direction $\vec{D}$:
$$\vec{P}(t) = \vec{O} + t \vec{D} \quad (t > 0)$$

A sphere is defined by center $\vec{C}$ and radius $r$:
$$\|\vec{P} - \vec{C}\|^2 = r^2 \implies (\vec{P} - \vec{C}) \cdot (\vec{P} - \vec{C}) = r^2$$

Substitute the ray equation $\vec{P}(t)$ into the sphere equation:
$$(\vec{O} + t \vec{D} - \vec{C}) \cdot (\vec{O} + t \vec{D} - \vec{C}) = r^2$$

Let $\vec{V} = \vec{O} - \vec{C}$. Expanding gives a standard **Quadratic Equation**:
$$a t^2 + b t + c = 0$$
where:
$$a = \vec{D} \cdot \vec{D} = 1 \quad (\text{since } \vec{D} \text{ is unit length})$$
$$b = 2 (\vec{V} \cdot \vec{D})$$
$$c = (\vec{V} \cdot \vec{V}) - r^2$$

### The Discriminant $\Delta$:
$$\Delta = b^2 - 4ac$$
- If $\Delta < 0$: No intersection (ray misses the sphere).
- If $\Delta \ge 0$: Ray hits the sphere! The closest positive intersection distance is:
  $$t = \frac{-b - \sqrt{\Delta}}{2a}$$

The surface normal at hit point $\vec{P}$ is simply:
$$\vec{N} = \frac{\vec{P} - \vec{C}}{r}$$

---

## 3. Shading Models: Lambertian Diffuse & Blinn-Phong Specular

At hit point $\vec{P}$ with surface normal $\vec{N}$ and light direction $\vec{L} = \text{normalize}(\vec{P}_{\text{light}} - \vec{P})$:

### 1. Lambertian Diffuse:
Brightness is proportional to the cosine of the angle between surface normal and light:
$$I_{\text{diffuse}} = \max(0, \vec{N} \cdot \vec{L})$$

### 2. Blinn-Phong Specular Highlight:
Given view direction $\vec{V} = \text{normalize}(\vec{O} - \vec{P})$, compute the half-way vector:
$$\vec{H} = \text{normalize}(\vec{L} + \vec{V})$$
$$I_{\text{specular}} = (\max(0, \vec{N} \cdot \vec{H}))^{\text{shininess}}$$

### 3. Shadow Rays:
Cast a new ray from $\vec{P} + \epsilon \vec{N}$ toward the light. If any object blocks the path before the light, $I_{\text{diffuse}} = 0$ (point is in shadow!).
*(Note: $\epsilon \approx 0.001$ offsets the shadow ray to prevent self-intersection acne).*

Open [`06_software_raytracer.cpp`](#graphics/06_software_raytracer) to inspect the complete C++ raytracer that renders 3D shaded spheres with shadows and reflective floor planes!
