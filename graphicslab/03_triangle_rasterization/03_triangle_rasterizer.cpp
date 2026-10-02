/**
 * 03_triangle_rasterizer.cpp
 * 
 * Triangle Rasterization from Scratch using Barycentric Coordinates
 * Demonstrates smooth vertex color interpolation (Gouraud shading principle).
 *
 * Compile:
 *   g++ -O2 03_triangle_rasterizer.cpp -o 03_rasterizer
 * Run:
 *   ./03_rasterizer -> outputs "triangle_rasterized.ppm"
 */

#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <fstream>

struct Vec2 {
    float x, y;
};

struct ColorRGB {
    float r, g, b; // 0.0f - 1.0f
};

struct Vertex {
    Vec2 pos;
    ColorRGB color;
};

// Compute 2D Edge Function (Cross product of vector AB with vector AP)
inline float edge_function(const Vec2& a, const Vec2& b, const Vec2& p) {
    return (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
}

class SoftwareRenderer {
    int width_;
    int height_;
    std::vector<uint8_t> framebuffer_; // RGBRGB...

public:
    SoftwareRenderer(int w, int h)
        : width_(w), height_(h), framebuffer_(w * h * 3, 20) {} // Clear to dark grey

    void set_pixel(int x, int y, ColorRGB c) {
        if (x < 0 || x >= width_ || y < 0 || y >= height_) return;
        int idx = (y * width_ + x) * 3;
        framebuffer_[idx + 0] = static_cast<uint8_t>(std::clamp(c.r * 255.0f, 0.0f, 255.0f));
        framebuffer_[idx + 1] = static_cast<uint8_t>(std::clamp(c.g * 255.0f, 0.0f, 255.0f));
        framebuffer_[idx + 2] = static_cast<uint8_t>(std::clamp(c.b * 255.0f, 0.0f, 255.0f));
    }

    // Rasterize a single triangle with smooth interpolated vertex colors
    void draw_triangle(const Vertex& v0, const Vertex& v1, const Vertex& v2) {
        // 1. Calculate Axis-Aligned Bounding Box (AABB)
        int min_x = std::max(0, static_cast<int>(std::floor(std::min({v0.pos.x, v1.pos.x, v2.pos.x}))));
        int max_x = std::min(width_ - 1, static_cast<int>(std::ceil(std::max({v0.pos.x, v1.pos.x, v2.pos.x}))));
        int min_y = std::max(0, static_cast<int>(std::floor(std::min({v0.pos.y, v1.pos.y, v2.pos.y}))));
        int max_y = std::min(height_ - 1, static_cast<int>(std::ceil(std::max({v0.pos.y, v1.pos.y, v2.pos.y}))));

        // 2. Compute Total Signed Triangle Area (Twice the area)
        float total_area = edge_function(v0.pos, v1.pos, v2.pos);
        if (std::abs(total_area) < 1e-5f) return; // Degenerate collinear triangle

        float inv_area = 1.0f / total_area;

        // 3. Scanline traversal over Bounding Box
        for (int y = min_y; y <= max_y; ++y) {
            for (int x = min_x; x <= max_x; ++x) {
                // Pixel center at (x + 0.5, y + 0.5)
                Vec2 p = { static_cast<float>(x) + 0.5f, static_cast<float>(y) + 0.5f };

                // Evaluate edge functions
                float w0 = edge_function(v1.pos, v2.pos, p);
                float w1 = edge_function(v2.pos, v0.pos, p);
                float w2 = edge_function(v0.pos, v1.pos, p);

                // Check inside-outside test (supporting clockwise or counter-clockwise winding)
                bool inside_ccw = (w0 >= 0.0f && w1 >= 0.0f && w2 >= 0.0f);
                bool inside_cw  = (w0 <= 0.0f && w1 <= 0.0f && w2 <= 0.0f);

                if (inside_ccw || inside_cw) {
                    // Normalize barycentric weights so w0 + w1 + w2 = 1.0
                    float b0 = w0 * inv_area;
                    float b1 = w1 * inv_area;
                    float b2 = w2 * inv_area;

                    // Interpolate vertex colors across the triangle surface!
                    ColorRGB pixel_color;
                    pixel_color.r = b0 * v0.color.r + b1 * v1.color.r + b2 * v2.color.r;
                    pixel_color.g = b0 * v0.color.g + b1 * v1.color.g + b2 * v2.color.g;
                    pixel_color.b = b0 * v0.color.b + b1 * v1.color.b + b2 * v2.color.b;

                    set_pixel(x, y, pixel_color);
                }
            }
        }
    }

    void export_ppm(const std::string& filename) const {
        std::ofstream out(filename, std::ios::binary);
        if (!out) return;
        out << "P6\n" << width_ << " " << height_ << "\n255\n";
        out.write(reinterpret_cast<const char*>(framebuffer_.data()), framebuffer_.size());
        std::cout << "Exported: " << filename << " (" << width_ << "x" << height_ << ")\n";
    }
};

int main() {
    const int W = 600, H = 600;
    SoftwareRenderer renderer(W, H);

    // Triangle 1: Vibrant Rainbow RGB Triangle
    Vertex v0 = { { 300.0f,  60.0f }, { 1.0f, 0.0f, 0.0f } }; // Pure Red (Top)
    Vertex v1 = { { 520.0f, 480.0f }, { 0.0f, 1.0f, 0.0f } }; // Pure Green (Right)
    Vertex v2 = { {  80.0f, 480.0f }, { 0.0f, 0.0f, 1.0f } }; // Pure Blue (Left)
    renderer.draw_triangle(v0, v1, v2);

    // Triangle 2: Cyan to Amber Accent Triangle
    Vertex t0 = { { 120.0f, 120.0f }, { 0.0f, 0.94f, 1.0f } }; // Cyan
    Vertex t1 = { { 260.0f, 180.0f }, { 1.0f, 0.70f, 0.0f } }; // Amber
    Vertex t2 = { { 160.0f, 320.0f }, { 0.8f, 0.20f, 0.9f } }; // Purple
    renderer.draw_triangle(t0, t1, t2);

    renderer.export_ppm("triangle_rasterized.ppm");
    return 0;
}
