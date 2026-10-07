// ============================================================================
// Module 09: Complete Shading Models Comparison & Analytical BRDF Formulations
// Implements side-by-side in modern GLSL (Core 450):
//   1. Lambertian Diffuse (with 1/PI normalization)
//   2. Oren-Nayar Rough Diffuse BRDF
//   3. Disney Burley Diffuse (Retro-reflection grazing)
//   4. Classical Phong Specular (with (n+2)/(2*PI) energy conservation)
//   5. Blinn-Phong Specular (with Halfway Vector & (m+8)/(8*PI) normalization)
//   6. Cook-Torrance Microfacet Specular BRDF (GGX + Schlick + Smith)
//   7. Height-Correlated Smith-GGX Visibility Formulation V(L, V)
// ============================================================================

#version 450 core

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec3 vNormal;
layout(location = 2) in vec2 vTexCoords;

layout(location = 0) out vec4 FragColor;

const float PI = 3.14159265358979323846;
const float INV_PI = 0.31830988618379067154;

// Shading Model Selector Uniform:
// 0 = Lambert Diffuse
// 1 = Oren-Nayar Rough Diffuse
// 2 = Classical Phong
// 3 = Blinn-Phong Specular (Normalized)
// 4 = Cook-Torrance GGX PBR
// 5 = Combined Disney + Cook-Torrance Full PBR
uniform int uShadingModel;

uniform vec3 uAlbedo;
uniform float uRoughness;
uniform float uMetallic;
uniform float uShininess; // For Phong / Blinn-Phong

uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uCameraPos;

// ============================================================================
// 1. DIFFUSE BRDF MODELS
// ============================================================================

// 1.1 Lambertian Diffuse BRDF
// Formula: f_diffuse = rho / PI
// Why / PI? Integrating cos(theta) over the hemisphere gives PI.
vec3 Diffuse_Lambert(vec3 albedo) {
    return albedo * INV_PI;
}

// 1.2 Oren-Nayar Rough Diffuse BRDF (1994)
// Models surfaces with micro-cavities (clay, moon dust, plaster, fabric)
// sigma is surface roughness standard deviation [0.0 = Lambert, 1.0 = extremely rough]
vec3 Diffuse_OrenNayar(vec3 albedo, float roughness, vec3 N, vec3 L, vec3 V) {
    float sigma = roughness;
    float sigma2 = sigma * sigma;

    float A = 1.0 - 0.5 * (sigma2 / (sigma2 + 0.33));
    float B = 0.45 * (sigma2 / (sigma2 + 0.09));

    float NdotL = dot(N, L);
    float NdotV = dot(N, V);

    float theta_i = acos(clamp(NdotL, -1.0, 1.0));
    float theta_r = acos(clamp(NdotV, -1.0, 1.0));

    float alpha = max(theta_i, theta_r);
    float beta  = min(theta_i, theta_r);

    // Azimuthal difference: cos(phi_i - phi_r)
    vec3 projL = normalize(L - N * NdotL);
    vec3 projV = normalize(V - N * NdotV);
    float cosPhiDiff = max(0.0, dot(projL, projV));

    float C = sin(alpha) * tan(beta);
    return albedo * INV_PI * (A + (B * cosPhiDiff * C));
}

// 1.3 Disney Burley Diffuse (Brent Burley, SIGGRAPH 2012)
// Simulates retro-reflection at grazing incidence
vec3 Diffuse_Burley(vec3 albedo, float roughness, float NdotL, float NdotV, float LdotH) {
    float FD90 = 0.5 + 2.0 * roughness * LdotH * LdotH;
    float lightScatter = 1.0 + (FD90 - 1.0) * pow(1.0 - NdotL, 5.0);
    float viewScatter  = 1.0 + (FD90 - 1.0) * pow(1.0 - NdotV, 5.0);
    return albedo * INV_PI * (lightScatter * viewScatter);
}

// ============================================================================
// 2. EMPIRICAL SPECULAR MODELS (PHONG & BLINN-PHONG)
// ============================================================================

// 2.1 Classical Phong Specular (Bui Tuong Phong, 1975)
// Reflection vector: R = 2*(N.L)*N - L
// Energy-conserved normalization factor: (n + 2) / (2 * PI)
vec3 Specular_ClassicalPhong(vec3 N, vec3 L, vec3 V, float shininess) {
    vec3 R = reflect(-L, N);
    float RdotV = max(dot(R, V), 0.0);
    
    // Normalization factor ensures integrated specular radiance does not exceed 1
    float normFactor = (shininess + 2.0) / (2.0 * PI);
    float spec = normFactor * pow(RdotV, shininess);
    return vec3(spec);
}

// 2.2 Blinn-Phong Specular (Jim Blinn, 1977)
// Halfway vector: H = (L + V) / ||L + V||
// Energy-conserved normalization factor: (m + 8) / (8 * PI)
vec3 Specular_BlinnPhong(vec3 N, vec3 H, float shininess) {
    float NdotH = max(dot(N, H), 0.0);

    // Jim Blinn normalization factor
    float normFactor = (shininess + 8.0) / (8.0 * PI);
    float spec = normFactor * pow(NdotH, shininess);
    return vec3(spec);
}

// ============================================================================
// 3. PHYSICALLY BASED RENDERING (COOK-TORRANCE MICROFACET SPECULAR BRDF)
// ============================================================================

// 3.1 Normal Distribution Function D(H): GGX / Trowbridge-Reitz
float Distribution_GGX(vec3 N, vec3 H, float roughness) {
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float denom = (NdotH2 * (alpha2 - 1.0) + 1.0);
    return alpha2 / (PI * denom * denom + 1e-7);
}

// 3.2 Fresnel Function F(V, H): Schlick's Approximation
vec3 Fresnel_Schlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// 3.3 Geometric Shadowing / Masking G: Smith Model with Schlick-GGX
float Geometry_SchlickGGX(float NdotDot, float roughness) {
    float k = ((roughness + 1.0) * (roughness + 1.0)) / 8.0;
    return NdotDot / (NdotDot * (1.0 - k) + k);
}

float Geometry_Smith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    return Geometry_SchlickGGX(NdotV, roughness) * Geometry_SchlickGGX(NdotL, roughness);
}

// 3.4 Modern Height-Correlated Smith-GGX Visibility Function V(L, V)
// Note: V = G / (4 * (N.L) * (N.V))
// Directly computes the combined shadowing and denominator in one numerically stable function!
float Visibility_HeightCorrelatedGGX(float NdotL, float NdotV, float roughness) {
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float gv = NdotL * sqrt(NdotV * NdotV * (1.0 - alpha2) + alpha2);
    float gl = NdotV * sqrt(NdotL * NdotL * (1.0 - alpha2) + alpha2);
    return 0.5 / max(gv + gl, 1e-7);
}

// ============================================================================
// MAIN SHADING EVALUATOR
// ============================================================================
void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 L = normalize(uLightPos - vWorldPos);
    vec3 H = normalize(L + V);

    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float LdotH = max(dot(L, H), 0.0);

    // Distance light attenuation
    float dist = length(uLightPos - vWorldPos);
    float attenuation = 1.0 / (dist * dist + 1.0);
    vec3 radiance = uLightColor * uLightIntensity * attenuation;

    vec3 F0 = mix(vec3(0.04), uAlbedo, uMetallic);
    vec3 finalColor = vec3(0.0);

    switch (uShadingModel) {
        // --- 0: PURE LAMBERTIAN DIFFUSE ---
        case 0: {
            vec3 diffuse = Diffuse_Lambert(uAlbedo);
            finalColor = diffuse * radiance * NdotL;
            break;
        }

        // --- 1: OREN-NAYAR ROUGH DIFFUSE ---
        case 1: {
            vec3 diffuse = Diffuse_OrenNayar(uAlbedo, uRoughness, N, L, V);
            finalColor = diffuse * radiance * NdotL;
            break;
        }

        // --- 2: CLASSICAL PHONG REFLECTION ---
        case 2: {
            vec3 ambient = 0.05 * uAlbedo;
            vec3 diffuse = uAlbedo * NdotL;
            vec3 spec = Specular_ClassicalPhong(N, L, V, uShininess);
            finalColor = ambient + (diffuse + spec) * radiance;
            break;
        }

        // --- 3: BLINN-PHONG SPECULAR ---
        case 3: {
            vec3 ambient = 0.05 * uAlbedo;
            vec3 diffuse = uAlbedo * NdotL;
            vec3 spec = Specular_BlinnPhong(N, H, uShininess);
            finalColor = ambient + (diffuse + spec) * radiance;
            break;
        }

        // --- 4: COOK-TORRANCE SPECULAR PBR (Standard Smith) ---
        case 4: {
            float D = Distribution_GGX(N, H, uRoughness);
            vec3  F = Fresnel_Schlick(LdotH, F0);
            float G = Geometry_Smith(N, V, L, uRoughness);

            vec3 specular = (D * F * G) / max(4.0 * NdotL * NdotV, 1e-5);
            vec3 kD = (vec3(1.0) - F) * (1.0 - uMetallic);
            vec3 diffuse = kD * Diffuse_Lambert(uAlbedo);

            finalColor = (diffuse + specular) * radiance * NdotL;
            break;
        }

        // --- 5: FULL PBR (Disney Diffuse + Height-Correlated Smith GGX Specular) ---
        default: {
            float D = Distribution_GGX(N, H, uRoughness);
            vec3  F = Fresnel_Schlick(LdotH, F0);
            float Vis = Visibility_HeightCorrelatedGGX(NdotL, NdotV, uRoughness);

            vec3 specular = D * F * Vis;
            vec3 kD = (vec3(1.0) - F) * (1.0 - uMetallic);
            vec3 diffuse = kD * Diffuse_Burley(uAlbedo, uRoughness, NdotL, NdotV, LdotH);

            finalColor = (diffuse + specular) * radiance * NdotL;
            break;
        }
    }

    // Reinhard Tone Mapping + sRGB Gamma Correction
    finalColor = finalColor / (finalColor + vec3(1.0));
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    FragColor = vec4(finalColor, 1.0);
}

