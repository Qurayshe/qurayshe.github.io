/**
 * 01_software_framebuffer.c
 * 
 * Fundamentals of Graphics Programming from Scratch in C:
 *  - 2D Pixel Grid mapped to 1D linear memory
 *  - RGBA32 color packing & memory stride
 *  - Software alpha blending (Porter-Duff 'Over' operator)
 *  - Output to uncompressed Netpbm PPM (P6) binary format
 *
 * Compile:
 *   gcc -O2 01_software_framebuffer.c -o 01_framebuffer
 * Run:
 *   ./01_framebuffer -> outputs "framebuffer_output.ppm"
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <math.h>

// 32-bit RGBA Pixel structure (4 bytes per pixel, memory-aligned)
typedef struct {
    uint8_t r;
    uint8_t g;
    uint8_t b;
    uint8_t a;
} PixelRGBA;

// Software Framebuffer definition
typedef struct {
    uint32_t width;
    uint32_t height;
    uint32_t stride; // Bytes per scanline (width * sizeof(PixelRGBA))
    PixelRGBA* pixels;
} Framebuffer;

// Allocate framebuffer memory
Framebuffer* fb_create(uint32_t width, uint32_t height) {
    Framebuffer* fb = (Framebuffer*)malloc(sizeof(Framebuffer));
    if (!fb) return NULL;

    fb->width = width;
    fb->height = height;
    fb->stride = width * sizeof(PixelRGBA);
    fb->pixels = (PixelRGBA*)calloc(width * height, sizeof(PixelRGBA));

    if (!fb->pixels) {
        free(fb);
        return NULL;
    }
    return fb;
}

// Free framebuffer memory
void fb_destroy(Framebuffer* fb) {
    if (fb) {
        if (fb->pixels) free(fb->pixels);
        free(fb);
    }
}

// Clear framebuffer with a solid background color
void fb_clear(Framebuffer* fb, PixelRGBA color) {
    if (!fb || !fb->pixels) return;
    uint32_t total_pixels = fb->width * fb->height;
    for (uint32_t i = 0; i < total_pixels; ++i) {
        fb->pixels[i] = color;
    }
}

// Put a single pixel with boundary clipping
void fb_set_pixel(Framebuffer* fb, int32_t x, int32_t y, PixelRGBA color) {
    if (!fb || x < 0 || (uint32_t)x >= fb->width || y < 0 || (uint32_t)y >= fb->height) {
        return; // Boundary clipping prevents segmentation faults!
    }
    fb->pixels[y * fb->width + x] = color;
}

// Alpha blend a pixel over the existing background (Porter-Duff Over)
void fb_blend_pixel(Framebuffer* fb, int32_t x, int32_t y, PixelRGBA src) {
    if (!fb || x < 0 || (uint32_t)x >= fb->width || y < 0 || (uint32_t)y >= fb->height) {
        return;
    }

    uint32_t idx = y * fb->width + x;
    PixelRGBA dst = fb->pixels[idx];

    uint32_t alpha = src.a;
    uint32_t inv_alpha = 255 - alpha;

    PixelRGBA out;
    out.r = (uint8_t)((src.r * alpha + dst.r * inv_alpha) / 255);
    out.g = (uint8_t)((src.g * alpha + dst.g * inv_alpha) / 255);
    out.b = (uint8_t)((src.b * alpha + dst.b * inv_alpha) / 255);
    out.a = 255;

    fb->pixels[idx] = out;
}

// Draw a filled rectangle with boundary clipping
void fb_draw_rect(Framebuffer* fb, int32_t x0, int32_t y0, int32_t w, int32_t h, PixelRGBA color) {
    if (!fb) return;

    int32_t x1 = x0 + w;
    int32_t y1 = y0 + h;

    // Clip to screen viewport
    if (x0 < 0) x0 = 0;
    if (y0 < 0) y0 = 0;
    if (x1 > (int32_t)fb->width)  x1 = (int32_t)fb->width;
    if (y1 > (int32_t)fb->height) y1 = (int32_t)fb->height;

    for (int32_t y = y0; y < y1; ++y) {
        for (int32_t x = x0; x < x1; ++x) {
            if (color.a == 255) {
                fb_set_pixel(fb, x, y, color);
            } else {
                fb_blend_pixel(fb, x, y, color);
            }
        }
    }
}

// Draw an anti-aliased gradient circle
void fb_draw_circle(Framebuffer* fb, int32_t cx, int32_t cy, int32_t radius, PixelRGBA color) {
    if (!fb) return;

    int32_t r2 = radius * radius;
    for (int32_t y = -radius; y <= radius; ++y) {
        int32_t py = cy + y;
        if (py < 0 || (uint32_t)py >= fb->height) continue;

        for (int32_t x = -radius; x <= radius; ++x) {
            int32_t px = cx + x;
            if (px < 0 || (uint32_t)px >= fb->width) continue;

            int32_t dist2 = x * x + y * y;
            if (dist2 <= r2) {
                // Soft edge falloff
                float dist = sqrtf((float)dist2);
                float factor = 1.0f - (dist / (float)radius);
                PixelRGBA blended = color;
                blended.a = (uint8_t)(color.a * factor);
                fb_blend_pixel(fb, px, py, blended);
            }
        }
    }
}

// Export framebuffer as Netpbm PPM (P6 binary format)
int fb_save_ppm(const Framebuffer* fb, const char* filepath) {
    if (!fb || !filepath) return -1;

    FILE* fp = fopen(filepath, "wb");
    if (!fp) {
        perror("Failed to open file for PPM export");
        return -1;
    }

    // Write Netpbm Header: P6 = Binary RGB, Width, Height, Max Color Value (255)
    fprintf(fp, "P6\n%u %u\n255\n", fb->width, fb->height);

    // Write binary RGB pixels row by row (dropping the 4th Alpha channel for PPM)
    for (uint32_t y = 0; y < fb->height; ++y) {
        for (uint32_t x = 0; x < fb->width; ++x) {
            PixelRGBA px = fb->pixels[y * fb->width + x];
            fputc(px.r, fp);
            fputc(px.g, fp);
            fputc(px.b, fp);
        }
    }

    fclose(fp);
    return 0;
}

int main(void) {
    printf("=== GRAPHICS LAB: 01 SOFTWARE FRAMEBUFFER ===\n");

    const uint32_t WIDTH = 512;
    const uint32_t HEIGHT = 512;

    Framebuffer* fb = fb_create(WIDTH, HEIGHT);
    if (!fb) {
        fprintf(stderr, "Failed to allocate framebuffer\n");
        return 1;
    }

    // 1. Clear background to dark slate blue
    PixelRGBA bg_color = { 15, 17, 26, 255 };
    fb_clear(fb, bg_color);

    // 2. Draw colored test rectangles
    PixelRGBA cyan  = { 0, 240, 255, 255 };
    PixelRGBA amber = { 255, 180, 0, 255 };
    PixelRGBA purple = { 180, 50, 255, 255 };

    fb_draw_rect(fb, 40, 40, 160, 100, cyan);
    fb_draw_rect(fb, 220, 80, 160, 100, amber);

    // 3. Draw semi-transparent overlapping rectangle (alpha blending test)
    PixelRGBA semi_rose = { 255, 40, 100, 160 }; // Alpha = ~62%
    fb_draw_rect(fb, 120, 60, 200, 150, semi_rose);

    // 4. Draw glowing gradient circles
    fb_draw_circle(fb, 160, 360, 90, purple);
    fb_draw_circle(fb, 320, 340, 110, cyan);

    // 5. Export to PPM image file
    const char* filename = "framebuffer_output.ppm";
    if (fb_save_ppm(fb, filename) == 0) {
        printf("Successfully generated image: %s (%ux%u)\n", filename, WIDTH, HEIGHT);
    }

    // Clean up
    fb_destroy(fb);
    return 0;
}
