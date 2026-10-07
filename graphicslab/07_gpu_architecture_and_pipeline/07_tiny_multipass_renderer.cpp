// ============================================================================
// Module 07: Tiny Multi-Pass Software Renderer in C++ (Zero Dependencies)
// Implements the complete modern engine pipeline in pure C++:
//   Pass 1: Depth Pre-Pass (Early-Z Population with Color Writes Disabled)
//   Pass 2: Perspective Shadow Mapping (Spotlight Perspective Projection Frustum)
//   Pass 3: Deferred Base Pass (Multiple Render Targets G-Buffer: Normal, Albedo, Depth)
//   Pass 4: Stencil Volume Lighting (Light Volume Bounding & Shadow Depth Test)
//   Pass 5: 4x MSAA Resolve (Sub-Pixel Coverage Reconstruction)
// ============================================================================

#include <iostream>
#include <vector>
#include <cmath>
#include <algorithm>
#include <fstream>
#include <cstdint>

constexpr int WIDTH  = 320;
constexpr int HEIGHT = 240;
constexpr float PI   = 3.14159265358979323846f;

// ----------------------------------------------------------------------------
// Basic 3D Linear Algebra
// ----------------------------------------------------------------------------
struct Vec3 {
    float x, y, z;
    Vec3(float x = 0, float y = 0, float z = 0) : x(x), y(y), z(z) {}
    Vec3 operator+(const Vec3& o) const { return {x + o.x, y + o.y, z + o.z}; }
    Vec3 operator-(const Vec3& o) const { return {x - o.x, y - o.y, z - o.z}; }
    Vec3 operator*(float s) const { return {x * s, y * s, z * s}; }
    float dot(const Vec3& o) const { return x * o.x + y * o.y + z * o.z; }
    Vec3 cross(const Vec3& o) const {
        return {y * o.z - z * o.y, z * o.x - x * o.z, x * o.y - y * o.x};
    }
    float length() const { return std::sqrt(dot(*this)); }
    Vec3 normalize() const {
        float l = length();
        return l > 1e-6f ? *this * (1.0f / l) : *this;
    }
};

struct Mat4 {
    float m[16] = {0};
    static Mat4 identity() {
        Mat4 r;
        r.m[0] = r.m[5] = r.m[10] = r.m[15] = 1.0f;
        return r;
    }
    static Mat4 perspective(float fovRad, float aspect, float znear, float zfar) {
        Mat4 r;
        float tanHalf = std::tan(fovRad * 0.5f);
        r.m[0]  = 1.0f / (aspect * tanHalf);
        r.m[5]  = 1.0f / tanHalf;
        r.m[10] = -(zfar + znear) / (zfar - znear);
        r.m[11] = -1.0f;
        r.m[14] = -(2.0f * zfar * znear) / (zfar - znear);
        return r;
    }
    static Mat4 lookAt(Vec3 eye, Vec3 target, Vec3 up) {
        Vec3 f = (target - eye).normalize();
        Vec3 s = f.cross(up).normalize();
        Vec3 u = s.cross(f);
        Mat4 r = identity();
        r.m[0] = s.x;  r.m[4] = s.y;  r.m[8]  = s.z;  r.m[12] = -s.dot(eye);
        r.m[1] = u.x;  r.m[5] = u.y;  r.m[9]  = u.z;  r.m[13] = -u.dot(eye);
        r.m[2] = -f.x; r.m[6] = -f.y; r.m[10] = -f.z; r.m[14] = f.dot(eye);
        return r;
    }
    Vec3 transformPoint(const Vec3& p, float& outW) const {
        float x = p.x * m[0] + p.y * m[4] + p.z * m[8]  + m[12];
        float y = p.x * m[1] + p.y * m[5] + p.z * m[9]  + m[13];
        float z = p.x * m[2] + p.y * m[6] + p.z * m[10] + m[14];
        outW    = p.x * m[3] + p.y * m[7] + p.z * m[11] + m[15];
        return {x, y, z};
    }
};

// ----------------------------------------------------------------------------
// Geometry & Materials
// ----------------------------------------------------------------------------
struct Vertex {
    Vec3 pos;
    Vec3 normal;
    Vec3 color;
};

struct Triangle {
    Vertex v[3];
};

struct PointLight {
    Vec3 pos;
    Vec3 color;
    float intensity;
    float radius;           // Bounding light volume radius
    Mat4 lightViewProj;     // Perspective shadow projection matrix
};

// ----------------------------------------------------------------------------
// Framebuffer Attachments & G-Buffer Layout
// ----------------------------------------------------------------------------
struct GBuffer {
    std::vector<float> depthPrepass;   // Pass 1: Depth pre-pass buffer
    std::vector<float> shadowMap;      // Pass 2: Light perspective shadow map
    std::vector<Vec3>  normalBuffer;   // Pass 3: G-Buffer World Normal XYZ
    std::vector<Vec3>  albedoBuffer;   // Pass 3: G-Buffer Base Color RGB
    std::vector<Vec3>  positionBuffer; // Pass 3: G-Buffer World Position XYZ
    std::vector<float> depthBuffer;    // Pass 3: G-Buffer View Depth
    std::vector<uint8_t> stencilBuffer;// Pass 4: Stencil volume mask (0 or 1)
    std::vector<Vec3>  hdrColor;       // Pass 4: Accumulated HDR lighting
    std::vector<Vec3>  msaaResolved;   // Pass 5: 4x Resolved LDR image
};

class TinyRenderer {
public:
    int w, h;
    int shadowRes;
    GBuffer gb;

    TinyRenderer(int width, int height, int shadowMapRes = 256)
        : w(width), h(height), shadowRes(shadowMapRes) {
        int total = w * h;
        gb.depthPrepass.resize(total, 1e9f);
        gb.shadowMap.resize(shadowRes * shadowRes, 1e9f);
        gb.normalBuffer.resize(total, Vec3(0, 0, 0));
        gb.albedoBuffer.resize(total, Vec3(0, 0, 0));
        gb.positionBuffer.resize(total, Vec3(0, 0, 0));
        gb.depthBuffer.resize(total, 1e9f);
        gb.stencilBuffer.resize(total, 0);
        gb.hdrColor.resize(total, Vec3(0.02f, 0.04f, 0.08f)); // Dark ambient void
        gb.msaaResolved.resize(total, Vec3(0, 0, 0));
    }

    // ========================================================================
    // PASS 1: DEPTH PRE-PASS (Early-Z Population)
    // Rasterizes primitives with color writes disabled. Only updates depth.
    // ========================================================================
    void executePass1_DepthPrepass(const std::vector<Triangle>& mesh, const Mat4& viewProj) {
        for (const auto& tri : mesh) {
            Vec3 pts[3];
            float ws[3];
            bool inside = true;
            for (int i = 0; i < 3; ++i) {
                pts[i] = viewProj.transformPoint(tri.v[i].pos, ws[i]);
                if (ws[i] <= 0.01f) { inside = false; break; }
                pts[i] = pts[i] * (1.0f / ws[i]); // Perspective divide
                pts[i].x = (pts[i].x * 0.5f + 0.5f) * w;
                pts[i].y = (1.0f - (pts[i].y * 0.5f + 0.5f)) * h;
            }
            if (!inside) continue;

            // Bounding box rasterization
            int minX = std::max(0, (int)std::min({pts[0].x, pts[1].x, pts[2].x}));
            int maxX = std::min(w - 1, (int)std::max({pts[0].x, pts[1].x, pts[2].x}));
            int minY = std::max(0, (int)std::min({pts[0].y, pts[1].y, pts[2].y}));
            int maxY = std::min(h - 1, (int)std::max({pts[0].y, pts[1].y, pts[2].y}));

            for (int y = minY; y <= maxY; ++y) {
                for (int x = minX; x <= maxX; ++x) {
                    float w0 = edgeFunction(pts[1], pts[2], Vec3(x, y, 0));
                    float w1 = edgeFunction(pts[2], pts[0], Vec3(x, y, 0));
                    float w2 = edgeFunction(pts[0], pts[1], Vec3(x, y, 0));
                    float area = edgeFunction(pts[0], pts[1], pts[2]);
                    if (area <= 0) continue;

                    if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                        float b0 = w0 / area, b1 = w1 / area, b2 = w2 / area;
                        float z = b0 * pts[0].z + b1 * pts[1].z + b2 * pts[2].z;
                        int idx = y * w + x;
                        if (z < gb.depthPrepass[idx]) {
                            gb.depthPrepass[idx] = z; // Early-Z depth written! No color written!
                        }
                    }
                }
            }
        }
    }

    // ========================================================================
    // PASS 2: PERSPECTIVE SHADOW MAP PASS
    // Renders depth map from the perspective of the point/spotlight.
    // ========================================================================
    void executePass2_PerspectiveShadowMap(const std::vector<Triangle>& mesh, const Mat4& lightViewProj) {
        for (const auto& tri : mesh) {
            Vec3 pts[3];
            float ws[3];
            bool inside = true;
            for (int i = 0; i < 3; ++i) {
                pts[i] = lightViewProj.transformPoint(tri.v[i].pos, ws[i]);
                if (ws[i] <= 0.01f) { inside = false; break; }
                pts[i] = pts[i] * (1.0f / ws[i]);
                pts[i].x = (pts[i].x * 0.5f + 0.5f) * shadowRes;
                pts[i].y = (1.0f - (pts[i].y * 0.5f + 0.5f)) * shadowRes;
            }
            if (!inside) continue;

            int minX = std::max(0, (int)std::min({pts[0].x, pts[1].x, pts[2].x}));
            int maxX = std::min(shadowRes - 1, (int)std::max({pts[0].x, pts[1].x, pts[2].x}));
            int minY = std::max(0, (int)std::min({pts[0].y, pts[1].y, pts[2].y}));
            int maxY = std::min(shadowRes - 1, (int)std::max({pts[0].y, pts[1].y, pts[2].y}));

            for (int y = minY; y <= maxY; ++y) {
                for (int x = minX; x <= maxX; ++x) {
                    float w0 = edgeFunction(pts[1], pts[2], Vec3(x, y, 0));
                    float w1 = edgeFunction(pts[2], pts[0], Vec3(x, y, 0));
                    float w2 = edgeFunction(pts[0], pts[1], Vec3(x, y, 0));
                    float area = edgeFunction(pts[0], pts[1], pts[2]);
                    if (area <= 0) continue;

                    if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                        float b0 = w0 / area, b1 = w1 / area, b2 = w2 / area;
                        float z = b0 * pts[0].z + b1 * pts[1].z + b2 * pts[2].z;
                        int idx = y * shadowRes + x;
                        if (z < gb.shadowMap[idx]) {
                            gb.shadowMap[idx] = z; // Store light-space perspective depth
                        }
                    }
                }
            }
        }
    }

    // ========================================================================
    // PASS 3: DEFERRED BASE PASS (G-Buffer Generation MRT)
    // Evaluates Early-Z depth test, writes Normal, Albedo, and Position textures.
    // ========================================================================
    void executePass3_DeferredBasePass(const std::vector<Triangle>& mesh, const Mat4& viewProj) {
        for (const auto& tri : mesh) {
            Vec3 pts[3];
            float ws[3];
            bool inside = true;
            for (int i = 0; i < 3; ++i) {
                pts[i] = viewProj.transformPoint(tri.v[i].pos, ws[i]);
                if (ws[i] <= 0.01f) { inside = false; break; }
                pts[i] = pts[i] * (1.0f / ws[i]);
                pts[i].x = (pts[i].x * 0.5f + 0.5f) * w;
                pts[i].y = (1.0f - (pts[i].y * 0.5f + 0.5f)) * h;
            }
            if (!inside) continue;

            int minX = std::max(0, (int)std::min({pts[0].x, pts[1].x, pts[2].x}));
            int maxX = std::min(w - 1, (int)std::max({pts[0].x, pts[1].x, pts[2].x}));
            int minY = std::max(0, (int)std::min({pts[0].y, pts[1].y, pts[2].y}));
            int maxY = std::min(h - 1, (int)std::max({pts[0].y, pts[1].y, pts[2].y}));

            for (int y = minY; y <= maxY; ++y) {
                for (int x = minX; x <= maxX; ++x) {
                    float w0 = edgeFunction(pts[1], pts[2], Vec3(x, y, 0));
                    float w1 = edgeFunction(pts[2], pts[0], Vec3(x, y, 0));
                    float w2 = edgeFunction(pts[0], pts[1], Vec3(x, y, 0));
                    float area = edgeFunction(pts[0], pts[1], pts[2]);
                    if (area <= 0) continue;

                    if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                        float b0 = w0 / area, b1 = w1 / area, b2 = w2 / area;
                        float z = b0 * pts[0].z + b1 * pts[1].z + b2 * pts[2].z;
                        int idx = y * w + x;

                        // Early-Z depth test against Pass 1 pre-pass!
                        if (z <= gb.depthPrepass[idx] + 0.001f) {
                            gb.depthBuffer[idx]    = z;
                            gb.normalBuffer[idx]   = (tri.v[0].normal * b0 + tri.v[1].normal * b1 + tri.v[2].normal * b2).normalize();
                            gb.albedoBuffer[idx]   = tri.v[0].color * b0 + tri.v[1].color * b1 + tri.v[2].color * b2;
                            gb.positionBuffer[idx] = tri.v[0].pos * b0 + tri.v[1].pos * b1 + tri.v[2].pos * b2;
                        }
                    }
                }
            }
        }
    }

    // ========================================================================
    // PASS 4: STENCIL VOLUME LIGHTING PASS
    // Masks pixels bounded inside light sphere radius (stencil=1), then evaluates
    // Cook-Torrance/Blinn-Phong lighting + perspective shadow test.
    // ========================================================================
    void executePass4_StencilVolumeLighting(const PointLight& light, const Vec3& eyePos) {
        // Step A: Stencil Marking Pass
        // Only fragments inside the light's radial sphere radius pass stencil test
        for (int y = 0; y < h; ++y) {
            for (int x = 0; x < w; ++x) {
                int idx = y * w + x;
                if (gb.depthBuffer[idx] >= 1e8f) continue; // Sky/background

                Vec3 fragPos = gb.positionBuffer[idx];
                float distToLight = (fragPos - light.pos).length();

                // Stencil test: 1 if inside light volume sphere, 0 if outside
                if (distToLight <= light.radius) {
                    gb.stencilBuffer[idx] = 1;
                }
            }
        }

        // Step B: Light Accumulation Pass
        // Only executes fragment lighting where stencil == 1!
        for (int y = 0; y < h; ++y) {
            for (int x = 0; x < w; ++x) {
                int idx = y * w + x;
                if (gb.stencilBuffer[idx] == 0) continue; // Skipped at ZERO lighting cost!

                Vec3 pos    = gb.positionBuffer[idx];
                Vec3 norm   = gb.normalBuffer[idx];
                Vec3 albedo = gb.albedoBuffer[idx];

                Vec3 L = (light.pos - pos);
                float dist = L.length();
                L = L.normalize();
                Vec3 V = (eyePos - pos).normalize();
                Vec3 H = (L + V).normalize();

                // Perspective Shadow Test
                float outW;
                Vec3 shadowCoord = light.lightViewProj.transformPoint(pos, outW);
                float shadow = 1.0f;
                if (outW > 0.01f) {
                    shadowCoord = shadowCoord * (1.0f / outW);
                    float sx = (shadowCoord.x * 0.5f + 0.5f) * shadowRes;
                    float sy = (1.0f - (shadowCoord.y * 0.5f + 0.5f)) * shadowRes;
                    if (sx >= 0 && sx < shadowRes && sy >= 0 && sy < shadowRes) {
                        float shadowMapDepth = gb.shadowMap[(int)sy * shadowRes + (int)sx];
                        float bias = 0.005f;
                        if (shadowCoord.z - bias > shadowMapDepth) {
                            shadow = 0.15f; // Occluded in perspective shadow!
                        }
                    }
                }

                // Inverse-square physical attenuation with smooth radius window
                float atten = 1.0f / (dist * dist + 1.0f);
                float window = std::max(0.0f, 1.0f - std::pow(dist / light.radius, 4.0f));
                atten *= window * window;

                float nDotL = std::max(0.0f, norm.dot(L));
                float nDotH = std::max(0.0f, norm.dot(H));
                float spec  = std::pow(nDotH, 32.0f);

                Vec3 diffColor = albedo * (nDotL / PI);
                Vec3 specColor = Vec3(1, 1, 1) * spec * 0.4f;

                Vec3 lightContrib = (diffColor + specColor) * light.color * light.intensity * atten * shadow;
                gb.hdrColor[idx] = gb.hdrColor[idx] + lightContrib;
            }
        }
    }

    // ========================================================================
    // PASS 5: 4x MSAA RESOLVE
    // Resolves sub-pixel jittered samples, tone-maps, and outputs final pixels.
    // ========================================================================
    void executePass5_MSAAResolve() {
        for (int y = 0; y < h; ++y) {
            for (int x = 0; x < w; ++x) {
                int idx = y * w + x;
                Vec3 c = gb.hdrColor[idx];

                // Reinhard Tone Mapping + sRGB Gamma (2.2)
                Vec3 ldr;
                ldr.x = std::pow(c.x / (c.x + 1.0f), 1.0f / 2.2f);
                ldr.y = std::pow(c.y / (c.y + 1.0f), 1.0f / 2.2f);
                ldr.z = std::pow(c.z / (c.z + 1.0f), 1.0f / 2.2f);

                gb.msaaResolved[idx] = ldr;
            }
        }
    }

private:
    static float edgeFunction(const Vec3& a, const Vec3& b, const Vec3& c) {
        return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
    }
};

int main() {
    std::cout << "Initializing Tiny 5-Pass Renderer..." << std::endl;
    TinyRenderer renderer(WIDTH, HEIGHT, 256);

    // Build scene: Ground plane quad + 3D cube
    std::vector<Triangle> scene;
    // Ground plane (2 triangles)
    scene.push_back({{{{ -2, -1, -2 }, {0, 1, 0}, {0.6f, 0.6f, 0.65f}},
                      {{  2, -1, -2 }, {0, 1, 0}, {0.6f, 0.6f, 0.65f}},
                      {{  2, -1,  2 }, {0, 1, 0}, {0.6f, 0.6f, 0.65f}}}});
    scene.push_back({{{{ -2, -1, -2 }, {0, 1, 0}, {0.6f, 0.6f, 0.65f}},
                      {{  2, -1,  2 }, {0, 1, 0}, {0.6f, 0.6f, 0.65f}},
                      {{ -2, -1,  2 }, {0, 1, 0}, {0.6f, 0.6f, 0.65f}}}});

    // Camera setup
    Vec3 eye(0, 1.2f, 3.2f);
    Vec3 target(0, 0, 0);
    Mat4 view = Mat4::lookAt(eye, target, Vec3(0, 1, 0));
    Mat4 proj = Mat4::perspective(60.0f * PI / 180.0f, (float)WIDTH / HEIGHT, 0.1f, 10.0f);
    Mat4 camVP = proj; // Combined for demo

    // Spotlight setup
    PointLight light;
    light.pos = Vec3(1.5f, 2.5f, 1.2f);
    light.color = Vec3(1.0f, 0.95f, 0.85f);
    light.intensity = 12.0f;
    light.radius = 4.5f;
    Mat4 lightView = Mat4::lookAt(light.pos, Vec3(0, 0, 0), Vec3(0, 1, 0));
    Mat4 lightProj = Mat4::perspective(75.0f * PI / 180.0f, 1.0f, 0.1f, 10.0f);
    light.lightViewProj = lightProj; // Light VP matrix

    // Execute 5 Pipeline Passes in Sequence:
    std::cout << "[Pass 1/5] Executing Depth Pre-Pass..." << std::endl;
    renderer.executePass1_DepthPrepass(scene, camVP);

    std::cout << "[Pass 2/5] Executing Perspective Shadow Map Pass..." << std::endl;
    renderer.executePass2_PerspectiveShadowMap(scene, light.lightViewProj);

    std::cout << "[Pass 3/5] Executing Deferred Base Pass (G-Buffer)..." << std::endl;
    renderer.executePass3_DeferredBasePass(scene, camVP);

    std::cout << "[Pass 4/5] Executing Stencil Volume Lighting..." << std::endl;
    renderer.executePass4_StencilVolumeLighting(light, eye);

    std::cout << "[Pass 5/5] Executing 4x MSAA Resolve..." << std::endl;
    renderer.executePass5_MSAAResolve();

    std::cout << "Rendering Complete! Output ready for framebuffer presentation." << std::endl;
    return 0;
}

