// ============================================================================
// 13_frame_debugger_simulation.cpp
// Deterministic 9-Event GPU Frame Dissection Simulator & Pipeline State Inspector
// ============================================================================

#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <cmath>
#include <cstdint>

// Pipeline State Structures reflecting RenderDoc / Nsight capture states
enum class RasterizerCullMode { None, Front, Back };
enum class DepthCompareOp { Never, Less, Equal, LessOrEqual, Greater, GreaterOrEqual, Always };
enum class BlendFactor { Zero, One, SrcAlpha, OneMinusSrcAlpha, DestColor, OneMinusDestColor };
enum class ResourceState { Common, RenderTarget, DepthWrite, DepthRead, PixelShaderResource, Present };

struct PipelineState {
    std::string passName;
    std::string apiCall;
    std::string renderTargetFormat;
    RasterizerCullMode cullMode;
    bool depthTestEnable;
    bool depthWriteEnable;
    DepthCompareOp depthFunc;
    bool blendEnable;
    BlendFactor srcBlend;
    BlendFactor dstBlend;
    ResourceState inputLayout;
    ResourceState outputLayout;
    uint32_t drawCount;
    uint32_t triangleCount;
    float gpuDurationMs;
};

struct FrameEvent {
    uint32_t eventId;
    std::string name;
    std::string category;
    PipelineState state;
    std::string primitiveMethod;
    std::string modernMethod;
    std::string debugVisualization;
};

class FrameDissectionSession {
public:
    std::vector<FrameEvent> events;

    FrameDissectionSession() {
        populateEvents();
    }

    void populateEvents() {
        // Event 0: Clears & Barriers
        events.push_back({
            0,
            "Clear Render Targets & Depth-Stencil",
            "Setup / Barriers",
            {
                "EID 0: Clear Pass",
                "vkCmdClearColorImage / vkCmdClearDepthStencilImage",
                "RT0: R16G16B16A16_SFLOAT, DS: D32_SFLOAT, S: S8_UINT",
                RasterizerCullMode::None,
                false, false, DepthCompareOp::Always,
                false, BlendFactor::One, BlendFactor::Zero,
                ResourceState::Common, ResourceState::RenderTarget,
                0, 0, 0.04f
            },
            "vkCmdClearColorImage (CPU-issued slow clear)",
            "Fast hardware clear metadata flag reset (Z-Cull fast-clear)",
            "All targets display clear color (Black 0,0,0,0 / Depth 0.0)"
        });

        // Event 1: Depth Pre-Pass
        events.push_back({
            1,
            "Early Depth Pre-Pass (Opaque Geometry)",
            "Rasterization",
            {
                "EID 1: Depth Pre-Pass",
                "vkCmdDrawIndexed(18420 indices)",
                "DS: D32_SFLOAT (Reverse-Z)",
                RasterizerCullMode::Back,
                true, true, DepthCompareOp::Greater,
                false, BlendFactor::One, BlendFactor::Zero,
                ResourceState::RenderTarget, ResourceState::DepthWrite,
                14, 6140, 0.28f
            },
            "Forward Standard-Z (Near 0.0, Far 1.0; severe Z-fighting)",
            "Reverse-Z (Near 1.0, Far 0.0; IEEE 754 precision matched to 1/z)",
            "Monochrome linear depth ramp showing depth occlusions"
        });

        // Event 2: Shadow Map Generation
        events.push_back({
            2,
            "Perspective / Cascaded Shadow Mapping",
            "Shadows",
            {
                "EID 2: Shadow Depth Pass",
                "vkCmdDrawIndexed(Light Frustum)",
                "DS: D16_UNORM (Shadow Map 2048x2048)",
                RasterizerCullMode::Front, // Front-face culling eliminates self-shadow acne
                true, true, DepthCompareOp::Less,
                false, BlendFactor::One, BlendFactor::Zero,
                ResourceState::DepthWrite, ResourceState::PixelShaderResource,
                8, 4200, 0.42f
            },
            "Standard Orthographic Hard Shadow Maps (jagged aliasing)",
            "Perspective Shadow Maps (PSM) with PCF 5x5 / PCSS soft penumbra",
            "Depth buffer rendered from light's perspective point-of-view"
        });

        // Event 3: G-Buffer Base Pass
        events.push_back({
            3,
            "G-Buffer Base Pass (MRT 3 Targets)",
            "Geometry Rasterization",
            {
                "EID 3: G-Buffer Base Pass",
                "vkCmdDrawIndexed(MRT Output)",
                "RT0: R8G8B8A8_SRGB, RT1: R16G16_SNORM, RT2: R10G10B10A2",
                RasterizerCullMode::Back,
                true, false, DepthCompareOp::Equal, // Equal test against depth prepass: ZERO overdraw!
                false, BlendFactor::One, BlendFactor::Zero,
                ResourceState::RenderTarget, ResourceState::PixelShaderResource,
                14, 6140, 1.15f
            },
            "Fat 128-bit G-Buffer (WorldPos 32-bit, Normals 32-bit, High Bandwidth)",
            "Compact 64-bit Visibility Buffer with reconstructed barycentrics",
            "RGB Albedo, Encoded Normal Vectors (Octahedral), Roughness/Metal"
        });

        // Event 4: Ambient Occlusion
        events.push_back({
            4,
            "Ambient Occlusion Evaluation",
            "Screen-Space Shading",
            {
                "EID 4: Ambient Occlusion",
                "vkCmdDispatch(Compute 64x64 groups)",
                "RT: R8_UNORM (Half-Resolution AO Buffer)",
                RasterizerCullMode::None,
                false, false, DepthCompareOp::Always,
                false, BlendFactor::One, BlendFactor::Zero,
                ResourceState::PixelShaderResource, ResourceState::PixelShaderResource,
                1, 2, 0.35f
            },
            "SSAO (Hemisphere stochastic sampling, high noise, halo bleeding)",
            "GTAO / HBAO (Horizon angle integration, surface tangent aware)",
            "Grayscale occlusion mask (White = open, Black = occluded crevice)"
        });

        // Event 5: Specular Reflections (SSR)
        events.push_back({
            5,
            "Screen-Space Reflections (SSR)",
            "Raymarching",
            {
                "EID 5: SSR Raymarch Pass",
                "vkCmdDispatch(Compute SSR Tile)",
                "RT: R11G11B10_FLOAT (Reflection Buffer)",
                RasterizerCullMode::None,
                false, false, DepthCompareOp::Always,
                false, BlendFactor::One, BlendFactor::Zero,
                ResourceState::PixelShaderResource, ResourceState::PixelShaderResource,
                1, 2, 0.85f
            },
            "Static Environment Cubemaps (completely misses dynamic objects)",
            "Hierarchical Hi-Z 2.5D DDA Raymarching with Cubemap Fallback",
            "Specular reflection rays marching depth buffer with roughness blur"
        });

        // Event 6: Deferred Lighting Integration
        events.push_back({
            6,
            "Deferred Stencil / Clustered Lighting",
            "Lighting",
            {
                "EID 6: Deferred Shading Pass",
                "vkCmdDraw(Fullscreen Quad) + Stencil Volumes",
                "RT: R16G16B16A16_SFLOAT (HDR Scene Color)",
                RasterizerCullMode::None,
                false, false, DepthCompareOp::Always,
                true, BlendFactor::One, BlendFactor::One, // Additive blending for multiple lights
                ResourceState::PixelShaderResource, ResourceState::RenderTarget,
                6, 128, 1.45f
            },
            "Blinn-Phong Empirical Specular Highlights (not energy-conserving)",
            "Cook-Torrance Microfacet GGX + Split-Sum IBL (physically correct)",
            "Direct diffuse + specular irradiance modulated by AO and shadows"
        });

        // Event 7: Anti-Aliasing (AA)
        events.push_back({
            7,
            "Temporal Anti-Aliasing (TAA) / FXAA",
            "Post-Processing",
            {
                "EID 7: Anti-Aliasing Pass",
                "vkCmdDraw(Fullscreen Triangle)",
                "RT: R16G16B16A16_SFLOAT (Resolved Scene)",
                RasterizerCullMode::None,
                false, false, DepthCompareOp::Always,
                false, BlendFactor::One, BlendFactor::Zero,
                ResourceState::RenderTarget, ResourceState::PixelShaderResource,
                1, 1, 0.45f
            },
            "4x MSAA (4x VRAM multiplier) or FXAA (blurs fine textures)",
            "TAA (Halton jitter + Velocity reprojection + YCoCg variance clipping)",
            "Subpixel edge smoothing, specular glint temporal stabilization"
        });

        // Event 8: Tone Mapping & Presentation
        events.push_back({
            8,
            "HDR Color Grading & ACES Tone Mapping",
            "Display / Output",
            {
                "EID 8: Presentation Pass",
                "vkCmdDraw(Fullscreen Triangle)",
                "RT: B8G8R8A8_SRGB (Swapchain Backbuffer)",
                RasterizerCullMode::None,
                false, false, DepthCompareOp::Always,
                false, BlendFactor::One, BlendFactor::Zero,
                ResourceState::PixelShaderResource, ResourceState::Present,
                1, 1, 0.18f
            },
            "Hard RGB Clamp (blown-out highlights) or Simple Reinhard",
            "ACES Filmic Cinematic Curve (Narkowicz Fit) + Rec. 709 sRGB Gamma",
            "Final calibrated display image ready for GPU flip / present"
        });
    }

    void printDissection() const {
        std::cout << "================================================================================\n";
        std::cout << "          RENDERDOC / NSIGHT FRAME DISSECTION RUNTIME REPLAY SUMMARY           \n";
        std::cout << "================================================================================\n";
        float totalTime = 0.0f;
        uint32_t totalTriangles = 0;

        for (const auto& ev : events) {
            totalTime += ev.state.gpuDurationMs;
            totalTriangles += ev.state.triangleCount;

            std::cout << "\n[" << ev.eventId << "] " << ev.name << " (" << ev.category << ")\n";
            std::cout << "    API Call:        " << ev.state.apiCall << "\n";
            std::cout << "    Target:          " << ev.state.renderTargetFormat << "\n";
            std::cout << "    Depth State:     " << (ev.state.depthTestEnable ? "ENABLED" : "DISABLED")
                      << " | Write: " << (ev.state.depthWriteEnable ? "ON" : "OFF") << "\n";
            std::cout << "    GPU Duration:    " << std::fixed << std::setprecision(2) << ev.state.gpuDurationMs << " ms\n";
            std::cout << "    Primitive Way:   " << ev.primitiveMethod << "\n";
            std::cout << "    Modern Way:      " << ev.modernMethod << "\n";
        }

        std::cout << "\n--------------------------------------------------------------------------------\n";
        std::cout << "TOTAL FRAME TIME: " << totalTime << " ms | FPS: " << (1000.0f / totalTime)
                  << " | TOTAL TRIANGLES: " << totalTriangles << "\n";
        std::cout << "================================================================================\n";
    }
};

int main() {
    FrameDissectionSession session;
    session.printDissection();
    return 0;
}

