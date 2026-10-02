/**
 * Module 07: GPU SIMT Pipeline Emulator (C++20)
 * 
 * Demonstrates how modern GPU hardware executes vertex and fragment processing
 * in lockstep SIMT (Single Instruction, Multiple Threads) 32-wide Warps.
 * Emulates warp divergence, thread masking, and fixed-function rasterization stages.
 */

#include <iostream>
#include <vector>
#include <array>
#include <cmath>
#include <cstdint>
#include <iomanip>

constexpr size_t WARP_SIZE = 32;

struct Vec4 {
    float x, y, z, w;
};

struct VertexInput {
    Vec4 position;
    Vec4 color;
    Vec4 normal;
};

struct FragmentInput {
    float screenX, screenY;
    float depthZ;
    Vec4 interpolatedColor;
    bool activeMask;
};

// 1. Programmable Vertex Shader Stage (SIMT Execution)
struct VertexShaderWarp {
    void execute(const std::array<VertexInput, WARP_SIZE>& inputs,
                 std::array<Vec4, WARP_SIZE>& clipPositions,
                 std::array<Vec4, WARP_SIZE>& outColors,
                 uint32_t activeThreadMask) 
    {
        // Each lane in the 32-wide warp executes in lockstep
        for (size_t lane = 0; lane < WARP_SIZE; ++lane) {
            if (!(activeThreadMask & (1u << lane))) continue; // Masked lane

            const auto& in = inputs[lane];
            // Simulate MVP Projection: clipPos = P * V * M * localPos
            clipPositions[lane] = {
                in.position.x * 1.2f,
                in.position.y * 1.2f,
                in.position.z * 0.9f + 0.1f,
                in.position.z + 2.0f
            };
            outColors[lane] = in.color;
        }
    }
};

// 2. Programmable Fragment Shader Stage with Warp Divergence Detection
struct FragmentShaderWarp {
    struct FragmentResult {
        uint32_t colorRGBA;
        bool depthPass;
    };

    void execute(const std::array<FragmentInput, WARP_SIZE>& fragments,
                 std::array<FragmentResult, WARP_SIZE>& outputs,
                 uint32_t activeThreadMask)
    {
        uint32_t branchAMask = 0;
        uint32_t branchBMask = 0;

        // Warp instruction: evaluate condition across all 32 lanes
        for (size_t lane = 0; lane < WARP_SIZE; ++lane) {
            if (!(activeThreadMask & (1u << lane))) continue;
            if (fragments[lane].interpolatedColor.x > 0.5f) {
                branchAMask |= (1u << lane);
            } else {
                branchBMask |= (1u << lane);
            }
        }

        // Detect hardware warp divergence!
        bool isDivergent = (branchAMask != 0) && (branchBMask != 0);
        if (isDivergent) {
            std::cout << "[SIMT HW] Warp divergence detected! Both branches serialized.\n"
                      << "          Branch A lanes: " << std::hex << branchAMask << "\n"
                      << "          Branch B lanes: " << std::hex << branchBMask << std::dec << "\n";
        }

        // Pass 1: Execute Branch A for masked threads
        for (size_t lane = 0; lane < WARP_SIZE; ++lane) {
            if (branchAMask & (1u << lane)) {
                // High brightness specular pass
                uint8_t r = 255;
                uint8_t g = static_cast<uint8_t>(fragments[lane].interpolatedColor.y * 255.0f);
                uint8_t b = static_cast<uint8_t>(fragments[lane].interpolatedColor.z * 255.0f);
                outputs[lane] = { (255u << 24) | (b << 16) | (g << 8) | r, true };
            }
        }

        // Pass 2: Execute Branch B for masked threads (serialized penalty)
        for (size_t lane = 0; lane < WARP_SIZE; ++lane) {
            if (branchBMask & (1u << lane)) {
                // Diffuse baseline pass
                uint8_t r = static_cast<uint8_t>(fragments[lane].interpolatedColor.x * 180.0f);
                uint8_t g = static_cast<uint8_t>(fragments[lane].interpolatedColor.y * 180.0f);
                uint8_t b = static_cast<uint8_t>(fragments[lane].interpolatedColor.z * 180.0f);
                outputs[lane] = { (255u << 24) | (b << 16) | (g << 8) | r, true };
            }
        }
    }
};

int main() {
    std::cout << "=== GPU SIMT Lockstep Execution Simulator ===\n";
    std::cout << "Hardware Warp Size: " << WARP_SIZE << " threads\n\n";

    // Setup input batch of 32 vertices
    std::array<VertexInput, WARP_SIZE> vertices{};
    for (size_t i = 0; i < WARP_SIZE; ++i) {
        float fi = static_cast<float>(i) / static_cast<float>(WARP_SIZE);
        vertices[i] = {
            { fi * 2.0f - 1.0f, std::sin(fi * 3.1415f), 1.0f, 1.0f },
            { fi, 1.0f - fi, 0.5f, 1.0f },
            { 0.0f, 1.0f, 0.0f, 0.0f }
        };
    }

    // Run Vertex Warp
    VertexShaderWarp vsWarp;
    std::array<Vec4, WARP_SIZE> clipPositions{};
    std::array<Vec4, WARP_SIZE> colors{};
    uint32_t fullMask = 0xFFFFFFFF; // all 32 lanes active
    vsWarp.execute(vertices, clipPositions, colors, fullMask);

    std::cout << "[Stage: Vertex Shader] Processed " << WARP_SIZE << " vertices in 1 cycle.\n";
    std::cout << "Lane 0 ClipPos:  (" << clipPositions[0].x << ", " << clipPositions[0].y << ", " << clipPositions[0].z << ")\n";
    std::cout << "Lane 16 ClipPos: (" << clipPositions[16].x << ", " << clipPositions[16].y << ", " << clipPositions[16].z << ")\n\n";

    // Setup Fragment Warp with varying colors to trigger branch divergence
    std::array<FragmentInput, WARP_SIZE> fragments{};
    for (size_t i = 0; i < WARP_SIZE; ++i) {
        float r = (i % 2 == 0) ? 0.8f : 0.2f; // alternating branch condition
        fragments[i] = { static_cast<float>(i * 10), 100.0f, 0.5f, { r, 0.4f, 0.7f, 1.0f }, true };
    }

    FragmentShaderWarp fsWarp;
    std::array<FragmentShaderWarp::FragmentResult, WARP_SIZE> fsOutputs{};
    fsWarp.execute(fragments, fsOutputs, fullMask);

    std::cout << "[Stage: Raster Operations / ROP] All fragments written to VRAM.\n";
    return 0;
}
