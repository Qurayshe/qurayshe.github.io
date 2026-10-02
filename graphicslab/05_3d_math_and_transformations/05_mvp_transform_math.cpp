/**
 * 05_mvp_transform_math.cpp
 * 
 * 3D Graphics Mathematics from Scratch:
 *  - 4D Vectors (Vec4) & 4x4 Matrices (Mat4)
 *  - Model Matrix (Translate, Scale, Euler Rotate)
 *  - View Matrix (Camera LookAt)
 *  - Perspective Projection Matrix (FOV Frustum)
 *  - Perspective Divide and Viewport Transform
 *
 * Compile:
 *   g++ -O2 05_mvp_transform_math.cpp -o 05_mvp
 * Run:
 *   ./05_mvp
 */

#include <iostream>
#include <iomanip>
#include <cmath>
#include <array>

constexpr float PI = 3.14159265358979323846f;
inline float to_radians(float degrees) { return degrees * (PI / 180.0f); }

struct Vec3 {
    float x = 0, y = 0, z = 0;

    static Vec3 cross(const Vec3& a, const Vec3& b) {
        return {
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        };
    }

    static float dot(const Vec3& a, const Vec3& b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    Vec3 normalized() const {
        float len = std::sqrt(x * x + y * y + z * z);
        if (len < 1e-6f) return { 0, 0, 0 };
        return { x / len, y / len, z / len };
    }
};

struct Vec4 {
    float x = 0, y = 0, z = 0, w = 1.0f;
};

// 4x4 Row-Major Matrix
struct Mat4 {
    std::array<float, 16> m{};

    static Mat4 identity() {
        Mat4 res;
        res.m[0] = 1.0f; res.m[5] = 1.0f; res.m[10] = 1.0f; res.m[15] = 1.0f;
        return res;
    }

    // Matrix multiplication C = A * B
    static Mat4 multiply(const Mat4& a, const Mat4& b) {
        Mat4 res;
        for (int r = 0; r < 4; ++r) {
            for (int c = 0; c < 4; ++c) {
                float sum = 0.0f;
                for (int k = 0; k < 4; ++k) {
                    sum += a.m[r * 4 + k] * b.m[k * 4 + c];
                }
                res.m[r * 4 + c] = sum;
            }
        }
        return res;
    }

    // Multiply Mat4 by Vec4 (Transforming a vertex)
    Vec4 transform(const Vec4& v) const {
        return {
            m[0]*v.x + m[1]*v.y + m[2]*v.z  + m[3]*v.w,
            m[4]*v.x + m[5]*v.y + m[6]*v.z  + m[7]*v.w,
            m[8]*v.x + m[9]*v.y + m[10]*v.z + m[11]*v.w,
            m[12]*v.x + m[13]*v.y + m[14]*v.z + m[15]*v.w
        };
    }

    // Translation Matrix
    static Mat4 translate(float tx, float ty, float tz) {
        Mat4 res = identity();
        res.m[3] = tx; res.m[7] = ty; res.m[11] = tz;
        return res;
    }

    // Scale Matrix
    static Mat4 scale(float sx, float sy, float sz) {
        Mat4 res = identity();
        res.m[0] = sx; res.m[5] = sy; res.m[10] = sz;
        return res;
    }

    // Rotation around Y axis
    static Mat4 rotate_y(float angle_rad) {
        Mat4 res = identity();
        float c = std::cos(angle_rad), s = std::sin(angle_rad);
        res.m[0] =  c; res.m[2] = s;
        res.m[8] = -s; res.m[10] = c;
        return res;
    }

    // View Matrix (LookAt camera)
    static Mat4 look_at(const Vec3& eye, const Vec3& target, const Vec3& up) {
        Vec3 forward = Vec3{ target.x - eye.x, target.y - eye.y, target.z - eye.z }.normalized();
        Vec3 right = Vec3::cross(forward, up).normalized();
        Vec3 cam_up = Vec3::cross(right, forward);

        Mat4 res = identity();
        res.m[0] = right.x;    res.m[1] = right.y;    res.m[2] = right.z;    res.m[3] = -Vec3::dot(right, eye);
        res.m[4] = cam_up.x;   res.m[5] = cam_up.y;   res.m[6] = cam_up.z;   res.m[7] = -Vec3::dot(cam_up, eye);
        res.m[8] = -forward.x; res.m[9] = -forward.y; res.m[10] = -forward.z; res.m[11] = Vec3::dot(forward, eye);
        return res;
    }

    // Perspective Projection Matrix
    static Mat4 perspective(float fov_deg, float aspect, float near_z, float far_z) {
        Mat4 res{};
        float tan_half_fov = std::tan(to_radians(fov_deg) / 2.0f);
        res.m[0] = 1.0f / (aspect * tan_half_fov);
        res.m[5] = 1.0f / tan_half_fov;
        res.m[10] = -(far_z + near_z) / (far_z - near_z);
        res.m[11] = -(2.0f * far_z * near_z) / (far_z - near_z);
        res.m[14] = -1.0f;
        res.m[15] = 0.0f;
        return res;
    }
};

int main() {
    std::cout << "=== 3D MATRIX TRANSFORMATION PIPELINE DEMO ===\n\n";

    // 1. Define Model Matrix (Scale by 1.5, rotate 45 degrees, shift +2 in Z)
    Mat4 scale_mat = Mat4::scale(1.5f, 1.5f, 1.5f);
    Mat4 rot_mat   = Mat4::rotate_y(to_radians(45.0f));
    Mat4 trans_mat = Mat4::translate(0.0f, 0.0f, 2.0f);
    Mat4 model_mat = Mat4::multiply(trans_mat, Mat4::multiply(rot_mat, scale_mat));

    // 2. Define View Matrix (Camera at (0, 2, -5) looking at origin (0, 0, 0))
    Vec3 eye = { 0.0f, 2.0f, -5.0f };
    Vec3 target = { 0.0f, 0.0f, 0.0f };
    Vec3 up = { 0.0f, 1.0f, 0.0f };
    Mat4 view_mat = Mat4::look_at(eye, target, up);

    // 3. Define Perspective Projection Matrix (60 deg FOV, 16:9 aspect, Near=0.1, Far=100.0)
    Mat4 proj_mat = Mat4::perspective(60.0f, 16.0f / 9.0f, 0.1f, 100.0f);

    // 4. Combine into complete MVP matrix: MVP = P * V * M
    Mat4 vp_mat  = Mat4::multiply(proj_mat, view_mat);
    Mat4 mvp_mat = Mat4::multiply(vp_mat, model_mat);

    // 5. Test Vertex in Local Model Space: (1.0, 1.0, 1.0)
    Vec4 local_vertex = { 1.0f, 1.0f, 1.0f, 1.0f };
    std::cout << "Local Object Vertex : (" << local_vertex.x << ", " << local_vertex.y << ", " << local_vertex.z << ")\n";

    // Step A: World Space
    Vec4 world_vertex = model_mat.transform(local_vertex);
    std::cout << "World Space Vertex  : (" << world_vertex.x << ", " << world_vertex.y << ", " << world_vertex.z << ")\n";

    // Step B: Clip Space via MVP
    Vec4 clip_vertex = mvp_mat.transform(local_vertex);
    std::cout << "Clip Space (4D)     : (" << clip_vertex.x << ", " << clip_vertex.y << ", " << clip_vertex.z << ", w=" << clip_vertex.w << ")\n";

    // Step C: Perspective Divide -> Normalized Device Coordinates (NDC)
    float ndc_x = clip_vertex.x / clip_vertex.w;
    float ndc_y = clip_vertex.y / clip_vertex.w;
    float ndc_z = clip_vertex.z / clip_vertex.w;
    std::cout << "NDC Space [-1, +1]  : (" << ndc_x << ", " << ndc_y << ", " << ndc_z << ")\n";

    // Step D: Viewport Mapping to 1920x1080 Screen Pixels
    int screen_w = 1920, screen_h = 1080;
    int pixel_x = static_cast<int>((ndc_x + 1.0f) * 0.5f * screen_w);
    int pixel_y = static_cast<int>((1.0f - (ndc_y + 1.0f) * 0.5f) * screen_h); // Inverted for screen Y
    std::cout << "Screen Pixel Coords : (" << pixel_x << " px, " << pixel_y << " px)\n";

    return 0;
}
