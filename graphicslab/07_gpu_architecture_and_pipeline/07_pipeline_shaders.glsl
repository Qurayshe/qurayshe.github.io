// ============================================================================
// Module 07: GPU Programmable Pipeline Shaders (GLSL 450 Core)
// Illustrates Vertex Shader -> Interface Block -> Fragment Shader data flow
// ============================================================================

#version 450 core

// ----------------------------------------------------------------------------
// VERTEX SHADER STAGE (Executes on GPU Vertex Processing Unit / SIMT Warp)
// ----------------------------------------------------------------------------
#ifdef VERTEX_SHADER

layout (location = 0) in vec3 aPosition;   // Mesh vertex position from VBO
layout (location = 1) in vec3 aNormal;     // Vertex normal
layout (location = 2) in vec2 aTexCoords;  // UV coordinates
layout (location = 3) in vec3 aColor;      // Vertex color

// Uniform Buffer Object (UBO) mapped directly from Host RAM to GPU VRAM
layout (std140, binding = 0) uniform CameraUBO {
    mat4 model;
    mat4 view;
    mat4 projection;
    mat3 normalMatrix;
};

// Interface Block: Outputs passed to Primitive Assembly & Rasterizer
out VertexOutput {
    vec3 fragPos;
    vec3 fragNormal;
    vec2 texCoords;
    vec3 vertexColor;
} vs_out;

void main() {
    // 1. Transform vertex from Object Space into World Space
    vec4 worldPos = model * vec4(aPosition, 1.0);
    vs_out.fragPos = worldPos.xyz;

    // 2. Transform normal using inverse-transpose normal matrix (handles non-uniform scaling)
    vs_out.fragNormal = normalize(normalMatrix * aNormal);
    vs_out.texCoords = aTexCoords;
    vs_out.vertexColor = aColor;

    // 3. Emit Homogeneous Clip-Space Position: gl_Position = P * V * M * Local
    gl_Position = projection * view * worldPos;
}

#endif // VERTEX_SHADER

// ----------------------------------------------------------------------------
// FRAGMENT SHADER STAGE (Executes on GPU Fragment Compute Units / Pixel SIMT)
// ----------------------------------------------------------------------------
#ifdef FRAGMENT_SHADER

// Inputs interpolated across triangle surface by fixed-function rasterizer
in VertexOutput {
    vec3 fragPos;
    vec3 fragNormal;
    vec2 texCoords;
    vec3 vertexColor;
} fs_in;

// Output: written to VRAM Framebuffer Color Attachment (RGBA32F / RGBA8)
layout (location = 0) out vec4 FragColor;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 cameraPosition;

void main() {
    // Normalize interpolated surface normal
    vec3 N = normalize(fs_in.fragNormal);
    vec3 L = normalize(lightPosition - fs_in.fragPos);
    vec3 V = normalize(cameraPosition - fs_in.fragPos);
    vec3 H = normalize(L + V); // Blinn-Phong halfway vector

    // 1. Ambient component
    vec3 ambient = 0.12 * fs_in.vertexColor;

    // 2. Diffuse Lambert component
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = NdotL * lightColor * fs_in.vertexColor;

    // 3. Specular Blinn-Phong component
    float NdotH = max(dot(N, H), 0.0);
    float spec = pow(NdotH, 64.0);
    vec3 specular = lightColor * spec * 0.6;

    // Final blended fragment color
    vec3 finalColor = ambient + diffuse + specular;

    // Reinhard Tone Mapping for HDR -> LDR [0, 1]
    finalColor = finalColor / (finalColor + vec3(1.0));

    // Gamma correction (sRGB space)
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    FragColor = vec4(finalColor, 1.0);
}

#endif // FRAGMENT_SHADER
