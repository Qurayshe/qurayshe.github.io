# Module 09: Modern Shaders, Diffuse, Phong & Physically Based Rendering (PBR)

> *"Before 2012, game engines used ad-hoc plastic hacks like Phong shading. Modern engines obey the immutable laws of physics: Energy Conservation, Microfacet Distributions, and Helmholtz Reciprocity."*

This module bridges the gap between raw triangle rasterization and **Physical Shading Theory**: how modern renderers simulate the behavior of light hitting metals, plastics, skin, glass, and rough matter using **Radiometry, Empirical Models (Phong & Blinn-Phong), and Physically Based Rendering (Cook-Torrance Microfacet BRDF)**.

---

## 1. Foundations of Radiometry & Light Measurement

To write physically correct lighting equations, we must first understand the fundamental physical quantities of **Radiometry**:

```
Radiometric Quantities Hierarchy:
┌────────────────────────────────────────────────────────────────────────┐
│ Radiant Energy Q [Joules, J]                                           │
│ -> Total energy of electromagnetic radiation                           │
├────────────────────────────────────────────────────────────────────────┤
│ Radiant Flux Φ = dQ / dt [Watts, W]                                    │
│ -> Energy passing through a surface per unit time (Total light power)  │
├────────────────────────────────────────────────────────────────────────┤
│ Radiant Intensity I = dΦ / dω [Watts / steradian, W·sr⁻¹]              │
│ -> Flux per unit solid angle emitted by a point source                 │
├────────────────────────────────────────────────────────────────────────┤
│ Irradiance E = dΦ / dA [Watts / m², W·m⁻²]                             │
│ -> Flux incident upon a surface per unit surface area                  │
├────────────────────────────────────────────────────────────────────────┤
│ Radiance L = d²Φ / (dA · cosθ · dω) [Watts / (m² · sr)]                │
│ -> Flux per unit projected surface area per unit solid angle           │
│ -> **THE FUNDAMENTAL QUANTITY COMPUTED BY GRAPHICS ENGINES!**           │
└────────────────────────────────────────────────────────────────────────┘
```

### Solid Angle ($\Omega$) & Projected Solid Angle ($\Omega^\perp$)
A **Solid Angle** measures the 2D angular area subtended by an object on a unit sphere. The infinitesimal solid angle $d\omega$ in spherical coordinates $(\theta, \phi)$ is:

$$d\omega = \frac{dA}{r^2} = \sin\theta \, d\theta \, d\phi$$

Integrating over the entire upper hemisphere $\Omega^+$ gives:

$$\int_{\Omega^+} d\omega = \int_0^{2\pi} d\phi \int_0^{\frac{\pi}{2}} \sin\theta \, d\theta = 2\pi [-\cos\theta]_0^{\frac{\pi}{2}} = 2\pi \text{ steradians}$$

The **Projected Solid Angle** weights the solid angle by the cosine of the inclination angle ($\cos\theta = \mathbf{n} \cdot \omega$), accounting for geometric foreshortening:

$$d\omega^\perp = \cos\theta \, d\omega = \cos\theta \sin\theta \, d\theta \, d\phi$$

Integrating over the hemisphere yields:

$$\int_{\Omega^+} \cos\theta \, d\omega = \int_0^{2\pi} d\phi \int_0^{\frac{\pi}{2}} \cos\theta \sin\theta \, d\theta = 2\pi \left[ \frac{\sin^2\theta}{2} \right]_0^{\frac{\pi}{2}} = \pi$$

> [!IMPORTANT]
> The integral of projected solid angle over a hemisphere is exactly $\pi$. This mathematical constant is the reason why all diffuse BRDF formulations contain a division by $\pi$!

---

## 2. The Rendering Equation (James T. Kajiya, 1986)

The foundation of all modern graphics rendering is the **Rendering Equation**, formulated by James T. Kajiya in 1986. It is a Fredholm integral equation of the second kind that models the equilibrium radiance of light transport:

$$L_o(\mathbf{x}, \omega_o) = L_e(\mathbf{x}, \omega_o) + \int_{\Omega^+} f_r(\mathbf{x}, \omega_i, \omega_o) L_i(\mathbf{x}, \omega_i) (\mathbf{n} \cdot \omega_i) \, d\omega_i$$

Where:
- $L_o(\mathbf{x}, \omega_o)$: Total outgoing radiance leaving surface point $\mathbf{x}$ in view direction $\omega_o$.
- $L_e(\mathbf{x}, \omega_o)$: Emitted radiance from surface point $\mathbf{x}$ (non-zero only for emissive light sources).
- $\int_{\Omega^+}$: Continuous integral over the upper hemisphere oriented along surface normal $\mathbf{n}$.
- $f_r(\mathbf{x}, \omega_i, \omega_o)$: The **Bidirectional Reflectance Distribution Function (BRDF)**.
- $L_i(\mathbf{x}, \omega_i)$: Incoming radiance arriving from incident light direction $\omega_i$.
- $(\mathbf{n} \cdot \omega_i) = \cos\theta_i$: Lambert cosine term representing surface foreshortening.

For discrete point or directional lights, the continuous integral collapses into a finite summation:

$$L_o(\mathbf{x}, \omega_o) = L_e(\mathbf{x}, \omega_o) + \sum_{k=1}^N f_r(\mathbf{x}, \omega_{i,k}, \omega_o) \cdot \frac{\mathbf{\Phi}_k}{4\pi d_k^2} \cdot \max(0, \mathbf{n} \cdot \omega_{i,k})$$

---

## 3. The Anatomy of a BRDF

The **Bidirectional Reflectance Distribution Function (BRDF)** $f_r(\omega_i, \omega_o)$ is defined as the ratio of differential reflected outgoing radiance $dL_o(\omega_o)$ to differential incident irradiance $dE_i(\omega_i)$:

$$f_r(\omega_i, \omega_o) = \frac{dL_o(\omega_o)}{dE_i(\omega_i)} = \frac{dL_o(\omega_o)}{L_i(\omega_i) (\mathbf{n} \cdot \omega_i) d\omega_i} \quad \left[\text{units: } \text{sr}^{-1}\right]$$

### The 3 Laws of Physical BRDFs:
1. **Positivity**: Light cannot be negative.
   $$f_r(\omega_i, \omega_o) \ge 0$$
2. **Helmholtz Reciprocity**: The physics of light transport is symmetrical under path reversal. Swapping light direction and view direction yields the exact same BRDF value:
   $$f_r(\omega_i, \omega_o) = f_r(\omega_o, \omega_i)$$
3. **Energy Conservation**: A passive surface cannot reflect more radiant power than it receives. The total hemispherical reflectance must be less than or equal to $1$:
   $$\forall \omega_o, \quad \int_{\Omega^+} f_r(\omega_i, \omega_o) (\mathbf{n} \cdot \omega_i) \, d\omega_i \le 1$$

---

## 4. Diffuse Reflection Models

Diffuse reflection occurs when incident light penetrates into the surface, undergoes multiple internal scattering events within dielectric micro-structures, and re-emerges in random directions.

```
Diffuse Light Subsurface Scattering:
 Incident Light (ω_i)
        \
         ▼
 ═════════*════════════════════════════ Surface Boundary
          │  Internal Multiple
          └──► Scattering ──┐
                            ▼
 ═══════════════════════════*══════════ Surface Boundary
                             \  Reflected Outward (ω_o)
                              ▼ (Random Direction)
```

---

### 4.1 Lambertian Diffuse (Johann Heinrich Lambert, 1760)
An ideal matte Lambertian surface scatters incident light with **equal radiance in all outgoing directions**:

$$L_o(\omega_o) = \text{constant}$$

Therefore, the BRDF $f_{\text{Lambert}}$ is constant:

$$f_{\text{Lambert}} = \frac{\rho}{\pi}$$

Where $\rho \in [0, 1]^3$ is the surface **Diffuse Albedo** (the fraction of incident light reflected).

#### Mathematical Proof of the $\frac{1}{\pi}$ Factor:
Assume an ideal white diffuse reflector with albedo $\rho = 1.0$ illuminated by uniform irradiance $E_i$. By conservation of energy, the total reflected flux $\Phi_o$ must equal incident flux $\Phi_i$:

$$E_i = \int_{\Omega^+} L_o (\mathbf{n} \cdot \omega_o) \, d\omega_o$$

Since $L_o$ is constant:

$$E_i = L_o \int_{\Omega^+} \cos\theta_o \, d\omega_o = L_o \cdot \pi$$

$$L_o = \frac{E_i}{\pi} \implies f_{\text{Lambert}} = \frac{L_o}{E_i} = \frac{1}{\pi}$$

Including surface albedo $\rho$:

$$f_{\text{diffuse}} = \frac{\rho}{\pi}$$

> [!WARNING]
> In naive computer graphics, developers often omit the $\frac{1}{\pi}$ divisor and compute `albedo * dot(N, L)`. This causes diffuse surfaces to reflect **$\pi \approx 3.14159$ times too much light**, blowing out dynamic range and destroying physical balance with specular highlights!

---

### 4.2 Oren-Nayar Rough Diffuse Model (Michael Oren & Shree Nayar, 1994)
Lambert's model assumes microscopic surface flatness. Real-world matte materials (moon regolith, concrete, unglazed clay, drywall, rough plaster) exhibit **retro-reflection** toward the light source and flattening of limb darkening.

Oren and Nayar modeled surfaces as micro-cavities consisting of symmetric V-grooves with Gaussian roughness standard deviation $\sigma$:

$$f_{\text{Oren-Nayar}} = \frac{\rho}{\pi} \left( A + B \max(0, \cos(\phi_i - \phi_o)) \sin\alpha \tan\beta \right)$$

Where:
$$A = 1.0 - 0.5 \frac{\sigma^2}{\sigma^2 + 0.33}, \quad B = 0.45 \frac{\sigma^2}{\sigma^2 + 0.09}$$
$$\alpha = \max(\theta_i, \theta_o), \quad \beta = \min(\theta_i, \theta_o)$$

- When $\sigma = 0$, $A = 1$ and $B = 0$, simplifying exactly to the standard Lambertian model $\frac{\rho}{\pi}$.
- When $\sigma > 0$, surfaces retain brightness near silhouette edges and brighten when the viewer looks directly along the light direction.

---

### 4.3 Disney Principled Diffuse (Brent Burley, SIGGRAPH 2012)
Used widely in modern production engines (Frostbite, Unreal Engine, Blender Cycles), Burley's empirical model produces retro-reflection at grazing incidence based on surface roughness:

$$f_{\text{DisneyDiffuse}} = \frac{\rho}{\pi} F_{\text{diffuse}}$$

$$F_{\text{diffuse}} = \left( 1 + (F_{D90} - 1)(1 - \cos\theta_i)^5 \right) \left( 1 + (F_{D90} - 1)(1 - \cos\theta_o)^5 \right)$$

Where:
$$F_{D90} = 0.5 + 2.0 \cdot \text{roughness} \cdot (\cos\theta_d)^2, \quad \cos\theta_d = \mathbf{L} \cdot \mathbf{H}$$

---

## 5. Empirical Specular Shading Models

Before microfacet physics became feasible in real-time, graphics relied on empirical geometric reflections.

---

### 5.1 Classical Phong Reflection Model (Bui Tuong Phong, 1975)
Phong modeled specular reflection by computing the ideal geometric mirror reflection vector $\mathbf{R}$ and measuring its proximity to view direction $\mathbf{V}$:

$$\mathbf{R} = \text{reflect}(-\mathbf{L}, \mathbf{N}) = 2(\mathbf{N} \cdot \mathbf{L})\mathbf{N} - \mathbf{L}$$

$$I_{\text{Phong}} = k_a I_a + k_d I_d \max(0, \mathbf{N} \cdot \mathbf{L}) + k_s I_s \left( \max(0, \mathbf{R} \cdot \mathbf{V}) \right)^n$$

Where:
- $k_a, k_d, k_s$: Ambient, diffuse, and specular reflection coefficients.
- $n$: Specular shininess exponent (higher values produce tighter, sharper specular spots).

#### The Energy-Conserving Phong Normalization Factor:
Classical Phong violates energy conservation: as shininess $n$ increases, the integrated energy diverges without scaling. The mathematically normalized Phong BRDF is:

$$f_{\text{Phong, norm}} = \frac{n + 2}{2\pi} (\mathbf{R} \cdot \mathbf{V})^n$$

#### Flaws of Classical Phong:
1. When the angle between $\mathbf{R}$ and $\mathbf{V}$ exceeds $90^\circ$, $(\mathbf{R} \cdot \mathbf{V}) < 0$, creating harsh cut-off artifacts.
2. Surfaces appear like shiny plastic: specular highlights are pure white regardless of angle.
3. Calculating $\mathbf{R} = 2(\mathbf{N} \cdot \mathbf{L})\mathbf{N} - \mathbf{L}$ per pixel requires non-trivial ALU cycles.

---

### 5.2 Blinn-Phong Model (Jim Blinn, 1977)
Jim Blinn observed that rather than reflecting light vector $\mathbf{L}$ across normal $\mathbf{N}$, one can compute the **Halfway Vector** $\mathbf{H}$ between light $\mathbf{L}$ and viewer $\mathbf{V}$:

$$\mathbf{H} = \frac{\mathbf{L} + \mathbf{V}}{\|\mathbf{L} + \mathbf{V}\|}$$

$$I_{\text{Blinn-Phong}} = k_a I_a + k_d I_d \max(0, \mathbf{N} \cdot \mathbf{L}) + k_s I_s \left( \max(0, \mathbf{N} \cdot \mathbf{H}) \right)^m$$

```
Blinn-Phong Halfway Vector Geometry:
            Normal N
               ▲
               │   Halfway H
        Light  │   /
          L \  │  /  View V
             \ │ /  /
              \│/  /
       ────────*──────── Surface
```

#### Why Blinn-Phong is Computationally & Physically Superior:
1. **Constant $\mathbf{H}$ for Directional Lights**: If the light is directional and the camera is far (or orthographic), $\mathbf{H}$ is **constant across the entire mesh**! The GPU avoids computing reflection vectors per pixel.
2. **Elliptical Highlights at Grazing Angles**: At glancing angles, Blinn-Phong naturally stretches highlights along the grazing axis, matching real physical observations.
3. **Exponent Relationship**: The angle between $\mathbf{N}$ and $\mathbf{H}$ is roughly half the angle between $\mathbf{R}$ and $\mathbf{V}$. To achieve visual equivalence with Phong shininess $n$:
   $$m_{\text{Blinn}} \approx 4 \cdot n_{\text{Phong}}$$
4. **Energy Conservation Normalization Factor**:
   $$f_{\text{Blinn, norm}} = \frac{m + 8}{8\pi} (\mathbf{N} \cdot \mathbf{H})^m$$

---

## 6. Physically Based Rendering (PBR) & Cook-Torrance Microfacet BRDF

Modern graphics represents surfaces not as smooth geometric planes, but as collections of microscopic mirror facets called **Microfacets**. Each microfacet is an optically flat ideal Fresnel mirror with its own micro-normal $\mathbf{m}$.

```
Microfacet Statistical Model:
 Incoming Light L              Outgoing View V
      \                               ▲
       \     Micro-facet m           /
        ▼      Normal h             /
   _/\_/\_/\_/\_/\_/\_/\_/\_/\_/\_/\_/\_/\_/\
  ══════════════════════════════════════════ Macro Surface Normal N
```

Only microfacets whose micro-normal $\mathbf{m}$ is oriented exactly along the halfway vector $\mathbf{H} = \frac{\mathbf{L} + \mathbf{V}}{\|\mathbf{L} + \mathbf{V}\|}$ can reflect light from $\mathbf{L}$ into view direction $\mathbf{V}$!

The complete **Cook-Torrance Specular BRDF** is formulated as:

$$f_{\text{spec}}(\mathbf{L}, \mathbf{V}) = \frac{D(\mathbf{H}) \cdot F(\mathbf{V}, \mathbf{H}) \cdot G(\mathbf{L}, \mathbf{V}, \mathbf{H})}{4 (\mathbf{N} \cdot \mathbf{L}) (\mathbf{N} \cdot \mathbf{V})}$$

Where:
- $D(\mathbf{H})$: **Normal Distribution Function (NDF)** (statistical concentration of microfacets aligned with $\mathbf{H}$).
- $F(\mathbf{V}, \mathbf{H})$: **Fresnel Function** (fraction of light reflected as a function of incident angle).
- $G(\mathbf{L}, \mathbf{V}, \mathbf{H})$: **Geometric Shadowing/Masking Function** (fraction of microfacets occluded by neighboring facets).
- $4 (\mathbf{N} \cdot \mathbf{L}) (\mathbf{N} \cdot \mathbf{V})$: Correction factor transforming microfacet projected area to macro surface area.

---

### 6.1 Normal Distribution Function $D(\mathbf{H})$: GGX / Trowbridge-Reitz
The GGX distribution (Trowbridge & Reitz, 1975; Walter et al., 2007) is the universal industry standard in Unreal Engine, Unity, and Frostbite:

$$D_{\text{GGX}}(\mathbf{N}, \mathbf{H}, \alpha) = \frac{\alpha^2}{\pi \left( (\mathbf{N} \cdot \mathbf{H})^2 (\alpha^2 - 1) + 1 \right)^2}$$

Where:
- $\alpha = \text{roughness}^2$ (Disney's perceptual mapping: squaring roughness creates a linear visual progression).
- **Integral Normalization Property**:
  $$\int_{\Omega^+} D(\mathbf{H}) (\mathbf{N} \cdot \mathbf{H}) \, d\omega_h = 1$$
- For smooth surfaces ($\alpha \to 0$), $D$ approaches a Dirac delta function, creating pinpoint sharp reflections. For rough surfaces ($\alpha \to 1$), $D$ produces long, soft specular tails.

---

### 6.2 Fresnel Function $F$: Schlick's Approximation
When light hits an interface between two optical media with refractive indices $n_1$ and $n_2$, reflection increases dramatically toward glancing incidence ($90^\circ$).

#### The Exact Fresnel Equations (Maxwell's Electrodynamics):
For unpolarized light, reflectance is the mean of perpendicular (s) and parallel (p) polarization states:

$$r_s = \frac{n_1 \cos\theta_i - n_2 \cos\theta_t}{n_1 \cos\theta_i + n_2 \cos\theta_t}, \quad r_p = \frac{n_2 \cos\theta_i - n_1 \cos\theta_t}{n_2 \cos\theta_i + n_1 \cos\theta_t}$$

$$F = \frac{|r_s|^2 + |r_p|^2}{2}$$

#### Christophe Schlick's Fast Empirical Approximation (1994):
$$\mathbf{F}(\mathbf{V}, \mathbf{H}, \mathbf{F}_0) = \mathbf{F}_0 + (1 - \mathbf{F}_0) \left( 1 - (\mathbf{V} \cdot \mathbf{H}) \right)^5$$

Where $\mathbf{F}_0$ is the **Specular Reflectance at Normal Incidence ($0^\circ$)**:

$$\mathbf{F}_0 = \left( \frac{n_1 - n_2}{n_1 + n_2} \right)^2$$

| Material Class | Typical $F_0$ | Physical Mechanism |
| :--- | :--- | :--- |
| **Dielectrics (Water, Glass, Plastic)** | $0.02 - 0.05$ (Achromatic $0.04$) | Transmitted light enters subsurface; diffuse scattering active ($k_d > 0$) |
| **Metals / Conductors (Gold, Copper, Iron)** | **Tinted Base Color** ($0.6 - 0.95$) | Free conduction electrons absorb light immediately; **zero diffuse scattering** ($k_d = 0$)! |

---

### 6.3 Geometric Shadowing/Masking Function $G$ & Modern Visibility Function $V$
Microfacets can be occluded in two ways:
1. **Light Shadowing**: Neighboring microfacets block incoming light $\mathbf{L}$.
2. **View Masking**: Neighboring microfacets block outgoing sightline $\mathbf{V}$.

```
Geometric Occlusion Mechanisms:
    Shadowing (Light Blocked)             Masking (Eye Blocked)
           L                                         V
          \                                         /
           ▼                                       /
         /\                                       /\
        /  \   * Microfacet                      /  \   * Microfacet
       /    \ /  (In Shadow!)                   /    \ /  (Masked from View!)
```

#### The Smith Model with Schlick-GGX:
$$G(\mathbf{N}, \mathbf{V}, \mathbf{L}, k) = G_1(\mathbf{N}, \mathbf{V}, k) \cdot G_1(\mathbf{N}, \mathbf{L}, k)$$

$$G_1(\mathbf{N}, \mathbf{X}, k) = \frac{\mathbf{N} \cdot \mathbf{X}}{(\mathbf{N} \cdot \mathbf{X})(1 - k) + k}$$

Where for direct analytic lighting: $k = \frac{(\text{roughness} + 1)^2}{8}$.

#### Modern Height-Correlated Smith-GGX Visibility Formulation:
Modern engines combine the $G$ term and the $4 (\mathbf{N} \cdot \mathbf{L}) (\mathbf{N} \cdot \mathbf{V})$ denominator into a unified **Visibility Function** $V(\mathbf{L}, \mathbf{V})$:

$$f_{\text{spec}} = D(\mathbf{H}) \cdot F(\mathbf{V}, \mathbf{H}) \cdot V(\mathbf{L}, \mathbf{V})$$

$$V(\mathbf{L}, \mathbf{V}) = \frac{0.5}{(\mathbf{N} \cdot \mathbf{L}) \sqrt{(\mathbf{N} \cdot \mathbf{V})^2(1 - \alpha^2) + \alpha^2} + (\mathbf{N} \cdot \mathbf{V}) \sqrt{(\mathbf{N} \cdot \mathbf{L})^2(1 - \alpha^2) + \alpha^2}}$$

This formulation is numerically stable at grazing angles and models height correlation between incoming and outgoing microfacet slopes!

---

### 6.4 Energy Conservation in the Metallic-Roughness Workflow
To guarantee energy conservation:

$$k_s = \mathbf{F}(\mathbf{V}, \mathbf{H})$$
$$k_d = (1 - k_s) \cdot (1 - \text{metallic})$$

$$f_r(\mathbf{L}, \mathbf{V}) = k_d \frac{\text{albedo}}{\pi} + f_{\text{spec}}(\mathbf{L}, \mathbf{V})$$

- If $\text{metallic} = 1.0$: $k_d = 0$, completely disabling diffuse reflection. The surface behaves as a pure metallic conductor.
- If $\text{metallic} = 0.0$: $k_d = 1.0 - k_s$, behaving as a dielectric with $F_0 = 0.04$.

---

## 7. Image-Based Lighting (IBL) & The Split-Sum Approximation

For environment cubemap reflections, evaluating the spherical rendering equation per pixel in real time is computationally prohibitive. Epic Games (Brian Karis, 2013) introduced the **Split-Sum Approximation**:

$$\int_{\Omega^+} L_i(\omega_i) f_r(\omega_i, \omega_o) (\mathbf{n} \cdot \omega_i) \, d\omega_i \approx \left( \int_{\Omega^+} L_i(\omega_i) \, d\omega_i \right) \left( \int_{\Omega^+} f_r(\omega_i, \omega_o) (\mathbf{n} \cdot \omega_i) \, d\omega_i \right)$$

1. **Pre-Filtered Environment Map**: The scene environment is convolved at multiple roughness mip levels into a cubemap pyramid.
2. **2D BRDF Integration LUT**: A precomputed $256 \times 256$ 2D texture encodes $F_0$ scale and bias as a function of roughness and $\cos\theta = \mathbf{n} \cdot \mathbf{v}$:

$$L_{\text{specular, IBL}} = \text{PrefilteredColor}(\mathbf{R}, \text{roughness}) \cdot \left( \mathbf{F}_0 \cdot \text{LUT.r} + \text{LUT.g} \right)$$

Inspect [`09_shading_comparison_models.glsl`](#graphics/09_shaders_and_pbr) to see live shader implementations comparing Lambert, Oren-Nayar, Classical Phong, Blinn-Phong, and Cook-Torrance GGX PBR!
