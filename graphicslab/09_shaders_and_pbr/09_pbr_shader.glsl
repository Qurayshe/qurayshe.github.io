// 09_pbr_shader.glsl
// Physically Based Rendering (PBR) Cook-Torrance Microfacet Fragment Shader
// Compatible with modern OpenGL Core Profile (4.5+) and Vulkan GLSL

#version 450 core

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec3 vNormal;
layout(location = 2) in vec2 vTexCoords;

layout(location = 0) out vec4 FragColor;

// Material Uniforms
layout(binding = 0) uniform MaterialBlock {
    vec3  albedo;
    float roughness;
    float metallic;
    float ao; // Ambient Occlusion
} material;

// Scene Lighting Uniforms
layout(binding = 1) uniform LightBlock {
    vec3 lightPos;
    vec3 lightColor;
    vec3 cameraPos;
} scene;

const float PI = 3.14159265359;

// 1. Normal Distribution Function: Trowbridge-Reitz GGX
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / max(denom, 0.0000001);
}

// 2. Geometry Shadowing Function: Schlick-GGX
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// 3. Fresnel Equation: Fresnel-Schlick Approximation
vec3 FresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(scene.cameraPos - vWorldPos);

    // Base reflectivity: 0.04 for dielectrics, tinted albedo for metals
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, material.albedo, material.metallic);

    // Reflectance equation per light source
    vec3 L = normalize(scene.lightPos - vWorldPos);
    vec3 H = normalize(V + L);
    float distance = length(scene.lightPos - vWorldPos);
    float attenuation = 1.0 / (distance * distance);
    vec3 radiance = scene.lightColor * attenuation;

    // Cook-Torrance BRDF specular terms
    float NDF = DistributionGGX(N, H, material.roughness);
    float G   = GeometrySmith(N, V, L, material.roughness);
    vec3  F   = FresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    // Energy conservation: diffuse ratio kD = 1.0 - specular ratio kS
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - material.metallic; // Metals have zero diffuse reflection!

    // Outgoing radiance
    float NdotL = max(dot(N, L), 0.0);
    vec3 Lo = (kD * material.albedo / PI + specular) * radiance * NdotL;

    // Ambient lighting
    vec3 ambient = vec3(0.03) * material.albedo * material.ao;
    vec3 color = ambient + Lo;

    // HDR Reinhard Tonemapping & Gamma Correction (linear to sRGB)
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0 / 2.2));

    FragColor = vec4(color, 1.0);
}
