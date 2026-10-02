// 09_pbr_shader.wgsl
// WebGPU Shading Language (WGSL) Physically Based Rendering (PBR) Shader

struct MaterialUniforms {
    albedo: vec3f,
    roughness: f32,
    metallic: f32,
    ao: f32,
};

struct SceneUniforms {
    lightPos: vec3f,
    lightColor: vec3f,
    cameraPos: vec3f,
};

@group(0) @binding(0) var<uniform> material: MaterialUniforms;
@group(0) @binding(1) var<uniform> scene: SceneUniforms;

const PI: f32 = 3.14159265359;

// GGX Microfacet Distribution
fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;

    let num = a2;
    var denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / max(denom, 0.0000001);
}

// Schlick-GGX Geometry Function
fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = roughness + 1.0;
    let k = (r * r) / 8.0;
    let num = NdotV;
    let denom = NdotV * (1.0 - k) + k;
    return num / denom;
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    let ggx2 = geometrySchlickGGX(NdotV, roughness);
    let ggx1 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

// Fresnel-Schlick Approximation
fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (vec3f(1.0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

@fragment
fn fs_main(
    @location(0) worldPos: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f
) -> @location(0) vec4f {
    let N = normalize(normal);
    let V = normalize(scene.cameraPos - worldPos);

    var F0 = vec3f(0.04);
    F0 = mix(F0, material.albedo, material.metallic);

    let L = normalize(scene.lightPos - worldPos);
    let H = normalize(V + L);
    let dist = length(scene.lightPos - worldPos);
    let attenuation = 1.0 / (dist * dist);
    let radiance = scene.lightColor * attenuation;

    let NDF = distributionGGX(N, H, material.roughness);
    let G = geometrySmith(N, V, L, material.roughness);
    let F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    let numerator = NDF * G * F;
    let denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    let specular = numerator / denominator;

    let kS = F;
    var kD = vec3f(1.0) - kS;
    kD *= 1.0 - material.metallic;

    let NdotL = max(dot(N, L), 0.0);
    let Lo = (kD * material.albedo / PI + specular) * radiance * NdotL;

    let ambient = vec3f(0.03) * material.albedo * material.ao;
    var color = ambient + Lo;

    // Tonemap & Gamma correction
    color = color / (color + vec3f(1.0));
    color = pow(color, vec3f(1.0 / 2.2));

    return vec4f(color, 1.0);
}
