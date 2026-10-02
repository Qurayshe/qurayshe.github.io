/**
 * 06_software_raytracer.cpp
 * 
 * Recursive Whitted-Style Software Raytracer from Scratch in C++
 * Features:
 *  - Ray-Sphere quadratic algebraic intersections
 *  - Surface normal generation
 *  - Lambertian diffuse & Blinn-Phong specular shading
 *  - Hard shadow rays
 *  - Recursive reflective surfaces
 *  - Output to Netpbm PPM
 *
 * Compile:
 *   g++ -O3 06_software_raytracer.cpp -o 06_raytracer
 * Run:
 *   ./06_raytracer -> outputs "raytraced_scene.ppm"
 */

#include <iostream>
#include <vector>
#include <cmath>
#include <fstream>
#include <algorithm>
#include <limits>

struct Vec3 {
    float x = 0, y = 0, z = 0;

    Vec3 operator+(const Vec3& o) const { return { x + o.x, y + o.y, z + o.z }; }
    Vec3 operator-(const Vec3& o) const { return { x - o.x, y - o.y, z - o.z }; }
    Vec3 operator*(float s) const { return { x * s, y * s, z * s }; }
    Vec3 operator*(const Vec3& o) const { return { x * o.x, y * o.y, z * o.z }; }

    float dot(const Vec3& o) const { return x * o.x + y * o.y + z * o.z; }

    Vec3 normalized() const {
        float l = std::sqrt(dot(*this));
        if (l < 1e-6f) return { 0, 0, 0 };
        return { x / l, y / l, z / l };
    }
};

struct Ray {
    Vec3 origin;
    Vec3 direction;
};

struct Material {
    Vec3 color;
    float specular = 50.0f; // Shininess power
    float reflectivity = 0.0f; // 0.0 = matte, 1.0 = pure mirror
};

struct Sphere {
    Vec3 center;
    float radius;
    Material material;

    bool intersect(const Ray& ray, float& t_hit) const {
        Vec3 v = ray.origin - center;
        float b = 2.0f * v.dot(ray.direction);
        float c = v.dot(v) - radius * radius;
        float discriminant = b * b - 4.0f * c;

        if (discriminant < 0.0f) return false;

        float sqrt_d = std::sqrt(discriminant);
        float t0 = (-b - sqrt_d) * 0.5f;
        float t1 = (-b + sqrt_d) * 0.5f;

        if (t0 > 0.001f) { t_hit = t0; return true; }
        if (t1 > 0.001f) { t_hit = t1; return true; }
        return false;
    }
};

struct HitInfo {
    float t = std::numeric_limits<float>::infinity();
    Vec3 point;
    Vec3 normal;
    Material material;
};

class RaytracerScene {
public:
    std::vector<Sphere> spheres;
    Vec3 light_pos = { 5.0f, 10.0f, -5.0f };
    Vec3 light_color = { 1.0f, 1.0f, 1.0f };
    Vec3 ambient_light = { 0.08f, 0.08f, 0.12f };

    bool trace(const Ray& ray, HitInfo& hit) const {
        bool found = false;
        hit.t = std::numeric_limits<float>::infinity();

        for (const auto& sphere : spheres) {
            float t_candidate = 0.0f;
            if (sphere.intersect(ray, t_candidate) && t_candidate < hit.t) {
                hit.t = t_candidate;
                hit.point = ray.origin + ray.direction * hit.t;
                hit.normal = (hit.point - sphere.center).normalized();
                hit.material = sphere.material;
                found = true;
            }
        }
        return found;
    }

    Vec3 cast_ray(const Ray& ray, int depth = 0) const {
        if (depth > 3) return { 0, 0, 0 }; // Maximum reflection bounces

        HitInfo hit;
        if (!trace(ray, hit)) {
            // Sky gradient background
            float t = 0.5f * (ray.direction.y + 1.0f);
            return Vec3{ 0.1f, 0.12f, 0.18f } * (1.0f - t) + Vec3{ 0.02f, 0.04f, 0.08f } * t;
        }

        // Shading vectors
        Vec3 light_dir = (light_pos - hit.point).normalized();
        Vec3 view_dir = (ray.origin - hit.point).normalized();
        Vec3 half_dir = (light_dir + view_dir).normalized();

        // 1. Shadow Ray Test
        Ray shadow_ray = { hit.point + hit.normal * 0.001f, light_dir };
        HitInfo shadow_hit;
        bool in_shadow = trace(shadow_ray, shadow_hit);
        float light_dist = (light_pos - hit.point).dot(light_pos - hit.point);
        if (in_shadow && (shadow_hit.point - hit.point).dot(shadow_hit.point - hit.point) > light_dist) {
            in_shadow = false;
        }

        // 2. Ambient Shading
        Vec3 final_color = hit.material.color * ambient_light;

        if (!in_shadow) {
            // 3. Lambertian Diffuse
            float n_dot_l = std::max(0.0f, hit.normal.dot(light_dir));
            Vec3 diffuse = hit.material.color * light_color * n_dot_l;

            // 4. Blinn-Phong Specular Highlight
            float n_dot_h = std::max(0.0f, hit.normal.dot(half_dir));
            float spec_intensity = std::pow(n_dot_h, hit.material.specular);
            Vec3 specular = light_color * spec_intensity * 0.8f;

            final_color = final_color + diffuse + specular;
        }

        // 5. Recursive Mirror Reflection
        if (hit.material.reflectivity > 0.0f) {
            Vec3 reflect_dir = ray.direction - hit.normal * 2.0f * ray.direction.dot(hit.normal);
            Ray reflect_ray = { hit.point + hit.normal * 0.001f, reflect_dir.normalized() };
            Vec3 reflected_color = cast_ray(reflect_ray, depth + 1);
            final_color = final_color * (1.0f - hit.material.reflectivity) + reflected_color * hit.material.reflectivity;
        }

        return final_color;
    }
};

int main() {
    const int WIDTH = 640;
    const int HEIGHT = 480;

    RaytracerScene scene;
    // Main Cyan Sphere (semi-reflective)
    scene.spheres.push_back({ { 0.0f, 0.0f, 3.0f }, 1.0f, { { 0.0f, 0.9f, 1.0f }, 64.0f, 0.35f } });
    // Left Amber Sphere (matte)
    scene.spheres.push_back({ { -2.0f, -0.2f, 3.8f }, 0.8f, { { 1.0f, 0.7f, 0.1f }, 32.0f, 0.1f } });
    // Right Mirror Sphere (highly reflective)
    scene.spheres.push_back({ { 1.8f, -0.3f, 2.5f }, 0.7f, { { 0.95f, 0.95f, 0.95f }, 128.0f, 0.85f } });
    // Huge Floor Sphere emulating ground plane
    scene.spheres.push_back({ { 0.0f, -101.0f, 4.0f }, 100.0f, { { 0.4f, 0.45f, 0.5f }, 16.0f, 0.2f } });

    std::vector<uint8_t> pixels(WIDTH * HEIGHT * 3);
    Vec3 camera_pos = { 0.0f, 0.5f, 0.0f };
    float fov = 1.0f; // Viewport focal distance

    std::cout << "Rendering software raytracer scene (" << WIDTH << "x" << HEIGHT << ")...\n";

    for (int y = 0; y < HEIGHT; ++y) {
        for (int x = 0; x < WIDTH; ++x) {
            // Map pixel to [-1, 1] normalized screen plane
            float px = (2.0f * (x + 0.5f) / static_cast<float>(WIDTH) - 1.0f) * (static_cast<float>(WIDTH) / HEIGHT);
            float py = (1.0f - 2.0f * (y + 0.5f) / static_cast<float>(HEIGHT));

            Ray ray = { camera_pos, Vec3{ px, py, fov }.normalized() };
            Vec3 color = scene.cast_ray(ray);

            int idx = (y * WIDTH + x) * 3;
            pixels[idx + 0] = static_cast<uint8_t>(std::clamp(color.x * 255.0f, 0.0f, 255.0f));
            pixels[idx + 1] = static_cast<uint8_t>(std::clamp(color.y * 255.0f, 0.0f, 255.0f));
            pixels[idx + 2] = static_cast<uint8_t>(std::clamp(color.z * 255.0f, 0.0f, 255.0f));
        }
    }

    std::ofstream out("raytraced_scene.ppm", std::ios::binary);
    out << "P6\n" << WIDTH << " " << HEIGHT << "\n255\n";
    out.write(reinterpret_cast<const char*>(pixels.data()), pixels.size());
    std::cout << "Successfully rendered: raytraced_scene.ppm\n";

    return 0;
}
