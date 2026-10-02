/**
 * 02_bresenham_wireframe.c
 * 
 * Bresenham's Integer Line Algorithm & 3D Wireframe Cube Projection
 * 
 * Compile:
 *   gcc -O2 02_bresenham_wireframe.c -lm -o 02_wireframe
 * Run:
 *   ./02_wireframe -> outputs "wireframe_cube.ppm"
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>

#define WIDTH 640
#define HEIGHT 640

typedef struct { uint8_t r, g, b; } ColorRGB;
static ColorRGB framebuffer[HEIGHT][WIDTH];

void clear_screen(ColorRGB color) {
    for (int y = 0; y < HEIGHT; ++y) {
        for (int x = 0; x < WIDTH; ++x) {
            framebuffer[y][x] = color;
        }
    }
}

void put_pixel(int x, int y, ColorRGB color) {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        framebuffer[y][x] = color;
    }
}

// Full 8-Octant Bresenham's Line Algorithm
void draw_line(int x0, int y0, int x1, int y1, ColorRGB color) {
    int dx = abs(x1 - x0);
    int dy = -abs(y1 - y0);
    int sx = (x0 < x1) ? 1 : -1;
    int sy = (y0 < y1) ? 1 : -1;
    int err = dx + dy;

    while (1) {
        put_pixel(x0, y0, color);
        if (x0 == x1 && y0 == y1) break;
        int e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}

// 3D Point
typedef struct { float x, y, z; } Vec3;
typedef struct { int x, y; } Point2D;

// Perspective project a 3D point onto the 2D viewport
Point2D project(Vec3 p, float fov_scale, float camera_dist) {
    // Simple pinhole camera model
    float z = p.z + camera_dist;
    if (z <= 0.1f) z = 0.1f; // Prevent division by zero
    int px = (int)(WIDTH / 2.0f + (p.x * fov_scale / z));
    int py = (int)(HEIGHT / 2.0f - (p.y * fov_scale / z)); // Invert Y for screen coords
    return (Point2D){ px, py };
}

// Rotate vector around X and Y axes
Vec3 rotate_xy(Vec3 v, float angle_x, float angle_y) {
    // Rotate Y
    float cos_y = cosf(angle_y), sin_y = sinf(angle_y);
    float x1 = v.x * cos_y + v.z * sin_y;
    float z1 = -v.x * sin_y + v.z * cos_y;

    // Rotate X
    float cos_x = cosf(angle_x), sin_x = sinf(angle_x);
    float y2 = v.y * cos_x - z1 * sin_x;
    float z2 = v.y * sin_x + z1 * cos_x;

    return (Vec3){ x1, y2, z2 };
}

int main(void) {
    clear_screen((ColorRGB){ 10, 12, 20 });

    // 8 Vertices of a Unit Cube [-1, 1]
    Vec3 cube_vertices[8] = {
        { -1.0f, -1.0f, -1.0f },
        {  1.0f, -1.0f, -1.0f },
        {  1.0f,  1.0f, -1.0f },
        { -1.0f,  1.0f, -1.0f },
        { -1.0f, -1.0f,  1.0f },
        {  1.0f, -1.0f,  1.0f },
        {  1.0f,  1.0f,  1.0f },
        { -1.0f,  1.0f,  1.0f }
    };

    // 12 Edges connecting vertices
    int edges[12][2] = {
        {0, 1}, {1, 2}, {2, 3}, {3, 0}, // Front face
        {4, 5}, {5, 6}, {6, 7}, {7, 4}, // Back face
        {0, 4}, {1, 5}, {2, 6}, {3, 7}  // Connecting edges
    };

    // Rotate the cube in 3D
    float angle_x = 0.55f; // ~31 degrees
    float angle_y = 0.78f; // ~45 degrees
    Point2D projected_pts[8];

    for (int i = 0; i < 8; ++i) {
        Vec3 rot = rotate_xy(cube_vertices[i], angle_x, angle_y);
        projected_pts[i] = project(rot, 500.0f, 3.5f);
    }

    // Draw edges using Bresenham's algorithm
    ColorRGB wire_color = { 0, 240, 255 }; // Cyan wireframe
    for (int i = 0; i < 12; ++i) {
        Point2D p0 = projected_pts[edges[i][0]];
        Point2D p1 = projected_pts[edges[i][1]];
        draw_line(p0.x, p0.y, p1.x, p1.y, wire_color);
    }

    // Output to PPM
    FILE* fp = fopen("wireframe_cube.ppm", "wb");
    if (fp) {
        fprintf(fp, "P6\n%d %d\n255\n", WIDTH, HEIGHT);
        fwrite(framebuffer, sizeof(ColorRGB), WIDTH * HEIGHT, fp);
        fclose(fp);
        printf("Saved 3D wireframe cube to wireframe_cube.ppm\n");
    }

    return 0;
}
