/**
 * 04_zbuffer_rasterizer.cpp
 * 
 * Z-Buffer (Depth Buffer) Software Implementation from Scratch
 * Demonstrates:
 *  - Perspective-correct 1/z depth interpolation
 *  - Depth testing for intersecting 3D triangles (hidden surface removal)
 *  - Exporting both the final color image and the raw depth map buffer
 *
 * Compile:
 *   g++ -O2 04_zbuffer_rasterizer.cpp -o 04_zbuffer
 * Run:
 *   ./04_zbuffer -> outputs "zbuffer_color.ppm" and "zbuffer_depth_map.ppm"
 */

#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <limits>

struct Vec3 {
    float x, y, z;
};

struct ColorRGB {
    float r, g, b;
};

struct Vertex3D {
    Vec3 pos;       // Screen coordinates (x, y) with camera-space z
    ColorRGB color;
};

inline float edge_func(const Vec3& a, const Vec3& b, float px, float py) {
    return (px - a.x) * (b.y - a.y) - (py - a.y) * (b.x - a.x);
}

class ZBufferRenderer {
    int width_;
    int height_;
    std::vector<uint8_t> color_buffer_; // RGB
    std::vector<float> depth_buffer_;   // Z depth values

public:
    ZBufferRenderer(int w, int h)
        : width_(w), height_(h),
          color_buffer_(w * h * 3, 15), // Clear color: dark slate
          depth_buffer_(w * h, std::numeric_limits<float>::infinity()) {} // Clear depth: +inf

    void draw_triangle_with_depth(const Vertex3D& v0, const Vertex3D& v1, const Vertex3D& v2) {
        int min_x = std::max(0, static_cast<int>(std::floor(std::min({v0.pos.x, v1.pos.x, v2.pos.x}))));
        int max_x = std::min(width_ - 1, static_cast<int>(std::ceil(std::max({v0.pos.x, v1.pos.x, v2.pos.x}))));
        int min_y = std::max(0, static_cast<int>(std::floor(std::min({v0.pos.y, v1.pos.y, v2.pos.y}))));
        int max_y = std::min(height_ - 1, static_cast<int>(std::ceil(std::max({v0.pos.y, v1.pos.y, v2.pos.y}))));

        float total_area = edge_func(v0.pos, v1.pos, v2.pos.x, v2.pos.y);
        if (std::abs(total_area) < 1e-5f) return;
        float inv_area = 1.0f / total_area;

        // Precompute reciprocal depths 1/z for perspective-correct interpolation
        float inv_z0 = 1.0f / v0.pos.z;
        float inv_z1 = 1.0f / v1.pos.z;
        float inv_z2 = 1.0f / v2.pos.z;

        for (int y = min_y; y <= max_y; ++y) {
            for (int x = min_x; x <= max_x; ++x) {
                float px = static_cast<float>(x) + 0.5f;
                float py = static_cast<float>(y) + 0.5f;

                float w0 = edge_func(v1.pos, v2.pos, px, py);
                float w1 = edge_func(v2.pos, v0.pos, px, py);
                float w2 = edge_func(v0.pos, v1.pos, px, py);

                bool inside_ccw = (w0 >= 0.0f && w1 >= 0.0f && w2 >= 0.0f);
                bool inside_cw  = (w0 <= 0.0f && w1 <= 0.0f && w2 <= 0.0f);

                if (inside_ccw || inside_cw) {
                    float b0 = w0 * inv_area;
                    float b1 = w1 * inv_area;
                    float b2 = w2 * inv_area;

                    // Interpolate reciprocal depth 1/z across screen space
                    float interpolated_inv_z = b0 * inv_z0 + b1 * inv_z1 + b2 * inv_z2;
                    float pixel_z = 1.0f / interpolated_inv_z;

                    int pixel_idx = y * width_ + x;

                    // THE CRITICAL Z-BUFFER DEPTH TEST:
                    if (pixel_z < depth_buffer_[pixel_idx]) {
                        // Closer surface found! Update depth buffer and write color.
                        depth_buffer_[pixel_idx] = pixel_z;

                        ColorRGB col;
                        col.r = b0 * v0.color.r + b1 * v1.color.r + b2 * v2.color.r;
                        col.g = b0 * v0.color.g + b1 * v1.color.g + b2 * v2.color.g;
                        col.b = b0 * v0.color.b + b1 * v1.color.b + b2 * v2.color.b;

                        int c_idx = pixel_idx * 3;
                        color_buffer_[c_idx + 0] = static_cast<uint8_t>(std::clamp(col.r * 255.0f, 0.0f, 255.0f));
                        color_buffer_[c_idx + 1] = static_cast<uint8_t>(std::clamp(col.g * 255.0f, 0.0f, 255.0f));
                        color_buffer_[c_idx + 2] = static_cast<uint8_t>(std::clamp(col.b * 255.0f, 0.0f, 255.0f));
                    }
                }
            }
        }
    }

    void export_color_ppm(const std::string& filename) const {
        std::ofstream out(filename, std::ios::binary);
        if (!out) return;
        out << "P6\n" << width_ << " " << height_ << "\n255\n";
        out.write(reinterpret_cast<const char*>(color_buffer_.data()), color_buffer_.size());
        std::cout << "Exported Color: " << filename << "\n";
    }

    // Export raw depth buffer as greyscale image (closer = brighter)
    void export_depth_map_ppm(const std::string& filename, float min_z, float max_z) const {
        std::ofstream out(filename, std::ios::binary);
        if (!out) return;
        out << "P6\n" << width_ << " " << height_ << "\n255\n";

        std::vector<uint8_t> depth_vis(width_ * height_ * 3, 0);
        for (int i = 0; i < width_ * height_; ++i) {
            float z = depth_buffer_[i];
            uint8_t val = 0;
            if (!std::isinf(z)) {
                float norm = (z - min_z) / (max_z - min_z);
                norm = std::clamp(norm, 0.0f, 1.0f);
                val = static_cast<uint8_t>((1.0f - norm) * 255.0f); // Invert: closest is white
            }
            depth_vis[i * 3 + 0] = val;
            depth_vis[i * 3 + 1] = val;
            depth_vis[i * 3 + 2] = val;
        }

        out.write(reinterpret_cast<const char*>(depth_vis.data()), depth_vis.size());
        std::cout << "Exported Depth Map: " << filename << "\n";
    }
};

int main() {
    const int W = 512, H = 512;
    ZBufferRenderer renderer(W, H);

    // Two Intersecting 3D Triangles that cut through each other:
    // Triangle A (Cyan): slanted from z = 2.0 (front) to z = 8.0 (back)
    Vertex3D a0 = { { 100.0f, 100.0f, 2.0f }, { 0.0f, 0.9f, 1.0f } };
    Vertex3D a1 = { { 400.0f, 120.0f, 5.0f }, { 0.0f, 0.9f, 1.0f } };
    Vertex3D a2 = { { 250.0f, 450.0f, 8.0f }, { 0.0f, 0.9f, 1.0f } };

    // Triangle B (Amber): slanted opposite from z = 8.0 (back) to z = 2.0 (front)
    Vertex3D b0 = { { 420.0f, 150.0f, 8.0f }, { 1.0f, 0.65f, 0.0f } };
    Vertex3D b1 = { { 120.0f, 380.0f, 5.0f }, { 1.0f, 0.65f, 0.0f } };
    Vertex3D b2 = { { 380.0f, 420.0f, 2.0f }, { 1.0f, 0.65f, 0.0f } };

    // Draw both triangles regardless of order - Z-buffer sorts them per-pixel!
    renderer.draw_triangle_with_depth(a0, a1, a2);
    renderer.draw_triangle_with_depth(b0, b1, b2);

    renderer.export_color_ppm("zbuffer_color.ppm");
    renderer.export_depth_map_ppm("zbuffer_depth_map.ppm", 1.5f, 8.5f);
    return 0;
}
