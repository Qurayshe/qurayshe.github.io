// ============================================================================
// Module 11: GPU Quad Overdraw & Helper Lane Waste Simulator in C++
// Simulates hardware 2x2 pixel quad dispatch, measures helper thread overhead,
// and outputs a color-coded Quad Overdraw Heatmap (replicating NVIDIA Nsight).
// ============================================================================

#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <fstream>
#include <cstdint>

constexpr int WIDTH  = 320;
constexpr int HEIGHT = 240;

struct Vec2 {
    float x, y;
};

struct Triangle2D {
    Vec2 p0, p1, p2;
};

// Returns signed area for edge equation
float edgeFunction(const Vec2& a, const Vec2& b, const Vec2& c) {
    return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

int main() {
    std::cout << "Starting GPU Quad Overdraw Simulation (" << WIDTH << "x" << HEIGHT << ")..." << std::endl;

    // Buffer tracking how many quads touch each pixel
    std::vector<int> pixelCoverageCount(WIDTH * HEIGHT, 0);
    std::vector<int> quadTouchCount(WIDTH * HEIGHT, 0);

    // Generate a set of tiny micro-triangles to simulate high-poly sub-pixel geometry
    std::vector<Triangle2D> scene;

    // 1. Large background triangle (optimal quad coverage)
    scene.push_back({{20, 20}, {140, 20}, {80, 180}});

    // 2. Cluster of 150 dense micro-triangles (sub-pixel geometry catastrophe)
    for (int i = 0; i < 150; ++i) {
        float cx = 200.0f + (i % 15) * 6.0f + (i * 0.3f);
        float cy = 40.0f + (i / 15) * 16.0f + ((i % 3) * 2.0f);
        float sz = 2.5f + (i % 4) * 1.5f; // Small micro-triangles (< 4 pixels)
        scene.push_back({{cx, cy}, {cx + sz, cy}, {cx + sz * 0.5f, cy + sz}});
    }

    uint64_t totalPixelShaded = 0;
    uint64_t totalHelperLanes = 0;
    uint64_t totalQuadDispatches = 0;

    // Rasterize in hardware 2x2 Quad tiles
    for (const auto& tri : scene) {
        int minX = std::max(0, (int)std::min({tri.p0.x, tri.p1.x, tri.p2.x}));
        int maxX = std::min(WIDTH - 1, (int)std::max({tri.p0.x, tri.p1.x, tri.p2.x}));
        int minY = std::max(0, (int)std::min({tri.p0.y, tri.p1.y, tri.p2.y}));
        int maxY = std::min(HEIGHT - 1, (int)std::max({tri.p0.y, tri.p1.y, tri.p2.y}));

        // Snap bounding box to 2x2 quad alignment
        minX = (minX / 2) * 2;
        maxX = (maxX / 2) * 2;
        minY = (minY / 2) * 2;
        maxY = (maxY / 2) * 2;

        for (int qy = minY; qy <= maxY; qy += 2) {
            for (int qx = minX; qx <= maxX; qx += 2) {
                // Test the 4 pixels in this quad: (qx, qy), (qx+1, qy), (qx, qy+1), (qx+1, qy+1)
                bool covered[4] = {false, false, false, false};
                int coveredCount = 0;

                int dx[4] = {0, 1, 0, 1};
                int dy[4] = {0, 0, 1, 1};

                for (int i = 0; i < 4; ++i) {
                    int px = qx + dx[i];
                    int py = qy + dy[i];
                    if (px < WIDTH && py < HEIGHT) {
                        Vec2 p = {(float)px + 0.5f, (float)py + 0.5f};
                        float w0 = edgeFunction(tri.p1, tri.p2, p);
                        float w1 = edgeFunction(tri.p2, tri.p0, p);
                        float w2 = edgeFunction(tri.p0, tri.p1, p);
                        if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                            covered[i] = true;
                            coveredCount++;
                        }
                    }
                }

                // If ANY pixel in the quad is covered, the GPU MUST dispatch the ENTIRE quad!
                if (coveredCount > 0) {
                    totalQuadDispatches++;
                    totalPixelShaded += coveredCount;
                    totalHelperLanes += (4 - coveredCount);

                    for (int i = 0; i < 4; ++i) {
                        int px = qx + dx[i];
                        int py = qy + dy[i];
                        if (px < WIDTH && py < HEIGHT) {
                            quadTouchCount[py * WIDTH + px]++;
                            if (covered[i]) {
                                pixelCoverageCount[py * WIDTH + px]++;
                            }
                        }
                    }
                }
            }
        }
    }

    // Print Profiling Metrics (as seen in NVIDIA Nsight & AMD RGP)
    std::cout << "\n========================================================" << std::endl;
    std::cout << "           GPU PROFILING METRICS REPORT                  " << std::endl;
    std::cout << "========================================================" << std::endl;
    std::cout << "Total 2x2 Quads Dispatched : " << totalQuadDispatches << std::endl;
    std::cout << "Total Shader Invocations   : " << totalQuadDispatches * 4 << std::endl;
    std::cout << "Useful Pixels Shaded       : " << totalPixelShaded << std::endl;
    std::cout << "Wasted Helper Invocations  : " << totalHelperLanes << std::endl;

    float efficiency = (float)totalPixelShaded / (totalQuadDispatches * 4) * 100.0f;
    std::cout << "Hardware ALU Efficiency    : " << efficiency << " %" << std::endl;

    // Export Color-Coded Quad Overdraw Heatmap (Nsight Color Ramp)
    // 0x = Black, 1x = Green, 2x = Yellow, 3x = Orange, 4x+ = Crimson/Purple
    std::ofstream ppm("quad_overdraw_heatmap.ppm", std::ios::binary);
    ppm << "P6\n" << WIDTH << " " << HEIGHT << "\n255\n";

    for (int y = 0; y < HEIGHT; ++y) {
        for (int x = 0; x < WIDTH; ++x) {
            int overdraw = quadTouchCount[y * WIDTH + x];
            uint8_t r = 0, g = 0, b = 0;

            if (overdraw == 0) {
                r = 10; g = 14; b = 20; // Background void
            } else if (overdraw == 1) {
                r = 16; g = 185; b = 129; // Green (Optimal)
            } else if (overdraw == 2) {
                r = 234; g = 179; b = 8; // Yellow (Minor overdraw)
            } else if (overdraw <= 4) {
                r = 249; g = 115; b = 22; // Orange (Moderate overdraw)
            } else {
                r = 239; g = 68; b = 68; // Crimson (Severe quad waste)
            }

            ppm.put(r);
            ppm.put(g);
            ppm.put(b);
        }
    }

    std::cout << "Overdraw heatmap exported to quad_overdraw_heatmap.ppm" << std::endl;
    return 0;
}

