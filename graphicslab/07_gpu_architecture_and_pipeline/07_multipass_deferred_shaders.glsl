// ============================================================================
// Module 07: Modern Multi-Pass Rendering Architecture Shaders (GLSL 450 Core)
// Illustrates complete pipeline passes:
//   Pass 1: Geometry Pass (G-Buffer Generation via Multiple Render Targets)
//   Pass 2: Cascaded Shadow Map Depth Pass & PCF Shadow Evaluation
//   Pass 3: Screen-Space Ambient Occlusion (SSAO) Pass
//   Pass 4: Deferred Lighting Pass (Directional + Point Lights with PBR/Blinn-Phong)
//   Pass 5: Post-Processing HDR Tone Mapping (ACES Filmic) & Gamma Correction
// ============================================================================

#version 450 core

// ============================================================================
// PASS 1: GEOMETRY PASS (G-BUFFER GENERATION - MULTIPLE RENDER TARGETS MRT)
// ============================================================================
#ifdef GBUFFER_PASS

#ifdef VERTEX_SHADER
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoords;
layout (location = 3) in vec3 aTangent;

layout (std140, binding = 0) uniform CameraData {
    mat4 view;
    mat4 projection;
    vec3 cameraPosition;
};

uniform mat4 model;
uniform mat3 normalMatrix;

out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vTexCoords;
out mat3 vTBN;

void main() {
    vec4 worldPos = model * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    vTexCoords = aTexCoords;

    // Construct orthonormal tangent-bitangent-normal (TBN) frame
    vec3 T = normalize(normalMatrix * aTangent);
    vec3 N = normalize(normalMatrix * aNormal);
    T = normalize(T - dot(T, N) * N); // Gram-Schmidt re-orthogonalization
    vec3 B = cross(N, T);
    vTBN = mat3(T, B, N);
    vNormal = N;

    gl_Position = projection * view * worldPos;
}
#endif // GBUFFER_PASS VERTEX_SHADER

#ifdef FRAGMENT_SHADER
in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoords;
in mat3 vTBN;

// G-Buffer Multiple Render Targets (MRT) written simultaneously in one draw call
layout (location = 0) out vec4 gPosition;       // RGB16F: World Pos XYZ, A: Linear Depth
layout (location = 1) out vec4 gNormal;         // RGB16F: World Normal XYZ, A: Roughness
layout (location = 2) out vec4 gAlbedoSpec;     // RGBA8:   Base Color RGB, A: Metallic
layout (location = 3) out vec4 gMaterialExtra;  // RGBA8:   Emissive R, G, B, A: Ambient Occlusion

uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D metallicRoughnessMap;
uniform sampler2D aoMap;

void main() {
    // 1. Position & Linear Depth
    gPosition.xyz = vWorldPos;
    gPosition.w = gl_FragCoord.z;

    // 2. Normal Mapping via Tangent Space
    vec3 tangentNormal = texture(normalMap, vTexCoords).rgb * 2.0 - 1.0;
    vec3 worldNormal = normalize(vTBN * tangentNormal);
    gNormal.xyz = worldNormal;

    // Sample material parameters
    vec4 metalRough = texture(metallicRoughnessMap, vTexCoords);
    gNormal.w = metalRough.g; // Roughness encoded in alpha channel

    // 3. Albedo & Metallic
    gAlbedoSpec.rgb = texture(albedoMap, vTexCoords).rgb;
    gAlbedoSpec.a = metalRough.b; // Metallic encoded in alpha channel

    // 4. Material Extra (Emissive + Cavity/AO)
    gMaterialExtra.rgb = vec3(0.0); // Non-emissive default
    gMaterialExtra.a = texture(aoMap, vTexCoords).r;
}
#endif // GBUFFER_PASS FRAGMENT_SHADER

#endif // GBUFFER_PASS


// ============================================================================
// PASS 2: SHADOW PASS (LIGHT DEPTH MAP GENERATION & FILTERING)
// ============================================================================
#ifdef SHADOW_PASS

#ifdef VERTEX_SHADER
layout (location = 0) in vec3 aPosition;

uniform mat4 lightSpaceMatrix; // Projection * View from light's perspective
uniform mat4 model;

void main() {
    gl_Position = lightSpaceMatrix * model * vec4(aPosition, 1.0);
}
#endif // SHADOW_PASS VERTEX_SHADER

#ifdef FRAGMENT_SHADER
// Color writes are disabled! Hardware writes directly to Depth Attachment.
void main() {
    // gl_FragDepth is automatically written by fixed-function rasterizer
}
#endif // SHADOW_PASS FRAGMENT_SHADER

#endif // SHADOW_PASS


// ============================================================================
// PASS 3: SCREEN-SPACE AMBIENT OCCLUSION (SSAO) PASS
// ============================================================================
#ifdef SSAO_PASS

#ifdef VERTEX_SHADER
// Full-screen triangle generated entirely in vertex shader without vertex buffer
out vec2 vUV;
void main() {
    vUV = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
}
#endif // SSAO_PASS VERTEX_SHADER

#ifdef FRAGMENT_SHADER
in vec2 vUV;
layout (location = 0) out float FragSSAO;

layout (binding = 0) uniform sampler2D gPositionDepth;
layout (binding = 1) uniform sampler2D gNormal;
layout (binding = 2) uniform sampler2D texNoise; // 4x4 tiling random rotation vectors

layout (std140, binding = 1) uniform SSAOBlock {
    mat4 projection;
    mat4 view;
    vec3 samples[64]; // Hemisphere sample kernel
    float radius;
    float bias;
};

void main() {
    vec3 fragPos = texture(gPositionDepth, vUV).xyz;
    vec3 normal = texture(gNormal, vUV).xyz;
    vec2 noiseScale = textureSize(gPositionDepth, 0) / 4.0;
    vec3 randomVec = normalize(texture(texNoise, vUV * noiseScale).xyz);

    // Create TBN frame around view-space surface normal
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for (int i = 0; i < 64; ++i) {
        // Reorient sample from tangent space to world space
        vec3 samplePos = TBN * samples[i];
        samplePos = fragPos + samplePos * radius;

        // Project sample point onto screen coordinates
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * view * offset;
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        // Compare sample depth against geometry depth stored in G-Buffer
        float sampleDepth = texture(gPositionDepth, offset.xy).z;
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    FragSSAO = 1.0 - (occlusion / 64.0);
}
#endif // SSAO_PASS FRAGMENT_SHADER

#endif // SSAO_PASS


// ============================================================================
// PASS 4: DEFERRED LIGHTING ACCUMULATION PASS
// ============================================================================
#ifdef DEFERRED_LIGHTING_PASS

#ifdef VERTEX_SHADER
out vec2 vUV;
void main() {
    vUV = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
}
#endif // DEFERRED_LIGHTING_PASS VERTEX_SHADER

#ifdef FRAGMENT_SHADER
in vec2 vUV;
layout (location = 0) out vec4 FragHDRColor;

layout (binding = 0) uniform sampler2D gPosition;
layout (binding = 1) uniform sampler2D gNormal;
layout (binding = 2) uniform sampler2D gAlbedoSpec;
layout (binding = 3) uniform sampler2D gMaterialExtra;
layout (binding = 4) uniform sampler2D shadowMap;
layout (binding = 5) uniform sampler2D ssaoTexture;

struct DirectionalLight {
    vec3 direction;
    vec3 color;
    float intensity;
};

struct PointLight {
    vec3 position;
    vec3 color;
    float intensity;
    float radius;
};

uniform DirectionalLight sunLight;
uniform PointLight pointLights[16];
uniform int numPointLights;
uniform vec3 cameraPos;
uniform mat4 lightSpaceMatrix;

// Percentage Closer Filtering (PCF) 3x3 kernel for smooth shadow edges
float CalculatePCFShadow(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;
    if (projCoords.z > 1.0) return 0.0;

    // Adaptive slope-scale depth bias to eliminate shadow acne
    float bias = max(0.005 * (1.0 - dot(normal, lightDir)), 0.0005);

    float shadow = 0.0;
    vec2 texelSize = 1.0 / textureSize(shadowMap, 0);
    for (int x = -1; x <= 1; ++x) {
        for (int y = -1; y <= 1; ++y) {
            float pcfDepth = texture(shadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
            shadow += projCoords.z - bias > pcfDepth ? 1.0 : 0.0;
        }
    }
    return shadow / 9.0;
}

void main() {
    // Unpack G-Buffer MRT textures
    vec3 fragPos   = texture(gPosition, vUV).xyz;
    vec3 normal    = texture(gNormal, vUV).xyz;
    float roughness= texture(gNormal, vUV).w;
    vec3 albedo    = texture(gAlbedoSpec, vUV).rgb;
    float metallic = texture(gAlbedoSpec, vUV).a;
    float ssao     = texture(ssaoTexture, vUV).r;

    // Discard skybox fragments (depth == 0)
    if (length(normal) < 0.1) {
        FragHDRColor = vec4(0.02, 0.04, 0.08, 1.0); // Ambient void
        return;
    }

    vec3 N = normalize(normal);
    vec3 V = normalize(cameraPos - fragPos);

    // Ambient Term modulated by SSAO
    vec3 ambient = vec3(0.03) * albedo * ssao;

    // 1. Sun Directional Light Calculation
    vec3 L = normalize(-sunLight.direction);
    vec3 H = normalize(L + V);
    float NdotL = max(dot(N, L), 0.0);

    // Specular Blinn-Phong highlight
    float shininess = mix(128.0, 4.0, roughness);
    float spec = pow(max(dot(N, H), 0.0), shininess);
    vec3 specularColor = mix(vec3(0.04), albedo, metallic);

    vec4 fragPosLightSpace = lightSpaceMatrix * vec4(fragPos, 1.0);
    float shadow = CalculatePCFShadow(fragPosLightSpace, N, L);

    vec3 directLight = (albedo * NdotL + specularColor * spec) * sunLight.color * sunLight.intensity;
    vec3 accumulatedLight = ambient + (1.0 - shadow) * directLight;

    // 2. Accumulate Point Lights
    for (int i = 0; i < numPointLights; ++i) {
        vec3 toLight = pointLights[i].position - fragPos;
        float dist = length(toLight);
        if (dist > pointLights[i].radius) continue;

        vec3 pL = normalize(toLight);
        vec3 pH = normalize(pL + V);
        float pNdotL = max(dot(N, pL), 0.0);

        // Physical inverse-square attenuation with smooth radius windowing
        float atten = 1.0 / (dist * dist + 1.0);
        float window = clamp(1.0 - pow(dist / pointLights[i].radius, 4.0), 0.0, 1.0);
        atten *= window * window;

        float pSpec = pow(max(dot(N, pH), 0.0), shininess);
        accumulatedLight += (albedo * pNdotL + specularColor * pSpec) * pointLights[i].color * pointLights[i].intensity * atten;
    }

    FragHDRColor = vec4(accumulatedLight, 1.0);
}
#endif // DEFERRED_LIGHTING_PASS FRAGMENT_SHADER

#endif // DEFERRED_LIGHTING_PASS


// ============================================================================
// PASS 5: POST-PROCESSING TONE MAPPING & GAMMA PASS
// ============================================================================
#ifdef POST_PROCESS_PASS

#ifdef VERTEX_SHADER
out vec2 vUV;
void main() {
    vUV = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(vUV * 2.0 - 1.0, 0.0, 1.0);
}
#endif // POST_PROCESS_PASS VERTEX_SHADER

#ifdef FRAGMENT_SHADER
in vec2 vUV;
layout (location = 0) out vec4 FinalColor;

layout (binding = 0) uniform sampler2D hdrSceneTexture;
layout (binding = 1) uniform sampler2D bloomTexture;

uniform float exposure;

// ACES Filmic Tone Mapping Curve (Stephen Hill / Krzysztof Narkowicz fit)
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    vec3 hdrColor = texture(hdrSceneTexture, vUV).rgb;
    vec3 bloomColor = texture(bloomTexture, vUV).rgb;

    // Additive Bloom blend
    hdrColor += bloomColor * 0.8;

    // Exposure adjustment: E = color * 2^(exposure)
    vec3 exposed = hdrColor * vec3(exposure);

    // Apply ACES Filmic tone mapping
    vec3 ldrColor = ACESFilm(exposed);

    // Gamma correction to sRGB space (gamma = 2.2)
    ldrColor = pow(ldrColor, vec3(1.0 / 2.2));

    FinalColor = vec4(ldrColor, 1.0);
}
#endif // POST_PROCESS_PASS FRAGMENT_SHADER

#endif // POST_PROCESS_PASS

