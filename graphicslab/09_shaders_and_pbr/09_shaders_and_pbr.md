# Module 09: Modern Shaders & Physically Based Rendering (PBR)

> *"Before 2012, game engines used plastic hacks like Phong shading. Modern engines obey the laws of physics: Energy Conservation, Fresnel Reflections, and Microfacet Distributions."*

This module bridges the gap from raw CPU rasterization to **Modern Shading Theory**: how modern game engines (Unreal Engine 5, Unity, Frostbite, Cyberpunk 2077) simulate realistic metals, plastics, glass, and dielectric surfaces using **Physically Based Rendering (PBR)**.

---

## 1. The Shading Evolution

```
[1970s: Flat Shading] ───────> 1 color per triangle. Visible sharp facets.
          │
          ▼
[1971: Gouraud Shading] ─────> Calculate lighting at 3 vertices, interpolate across face.
          │                     Artifact: Misses specular highlights in triangle interiors!
          ▼
[1975: Blinn-Phong] ─────────> Interpolate normals, evaluate lighting per pixel.
          │                     Artifact: Violates energy conservation (shiny surfaces emit extra light!).
          ▼
[2010s+: Cook-Torrance PBR] ─> Microfacet BRDF. Energy conserving. Roughness + Metallic workflow.
```

---

## 2. The Cook-Torrance Reflectance Equation

The total reflected radiance $L_o(p, \omega_o)$ is given by the rendering equation:

$$L_o(p, \omega_o) = \int_{\Omega} \left( k_d \frac{c}{\pi} + k_s \frac{D \cdot F \cdot G}{4 (\omega_o \cdot n)(\omega_i \cdot n)} \right) L_i(p, \omega_i) (n \cdot \omega_i) \, d\omega_i$$

Where the specular term is the product of three physical functions ($D, F, G$):

### 1. Normal Distribution Function $D$ (GGX / Trowbridge-Reitz)
Models the statistical distribution of microscopic surface scratches (microfacets) aligned with the halfway vector $H$:
$$D_{\text{GGX}}(n, h, \alpha) = \frac{\alpha^2}{\pi \left( (n \cdot h)^2 (\alpha^2 - 1) + 1 \right)^2}$$
- $\alpha = \text{roughness}^2$. Smooth surfaces ($\alpha \approx 0$) concentrate all reflection into a tiny bright specular spot; rough surfaces spread it into a soft glow.

### 2. Fresnel Function $F$ (Schlick's Approximation)
Reflectance increases dramatically at glancing angles (grazing angles):
$$F(h, v, F_0) = F_0 + (1 - F_0)(1 - (h \cdot v))^5$$
- For dielectrics (plastics, wood, stone), $F_0 \approx 0.04$.
- For metals (gold, copper, iron), $F_0$ is tinted to the base albedo color.

### 3. Geometric Shadowing Function $G$ (Smith Model with Schlick-GGX)
Accounts for microfacets casting shadows on or occluding neighboring microfacets:
$$G(n, v, l, k) = G_1(n, v, k) \cdot G_1(n, l, k)$$
where:
$$G_1(n, v, k) = \frac{n \cdot v}{(n \cdot v)(1 - k) + k}, \quad k = \frac{(\text{roughness} + 1)^2}{8}$$

---

## 3. The Metallic-Roughness Parameter Workflow

Modern 3D assets are authored with just 3 primary texture maps:
1. **Albedo (Base Color)**: Diffuse color for dielectrics; specular reflectance for metals.
2. **Roughness $[0.0, 1.0]$**: How microscopically smooth ($0.0$) or rough ($1.0$) the surface is.
3. **Metallic $[0.0, 1.0]$**: Binary or blend between dielectric non-conductor ($0.0$) and pure conductor ($1.0$).

Open [`09_pbr_shader.glsl`](#graphics/09_shaders_and_pbr) and [`09_pbr_shader.wgsl`](#graphics/09_shaders_and_pbr) to see production-ready implementations in both OpenGL/Vulkan GLSL and WebGPU WGSL.
