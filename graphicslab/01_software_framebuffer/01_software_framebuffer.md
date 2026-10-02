# Module 01: The Software Framebuffer & Image Synthesis

> *"Before GPUs, vertex shaders, and display drivers existed, computer graphics was simply a block of linear RAM in CPU memory."*

Every 3D game, rendering engine, or windowing system ultimately boils down to a single objective: **calculating color values and writing them into a 2D grid of pixels**.

In this module, we build a complete **Software Framebuffer from scratch in standard C99**, with zero external libraries or windowing dependencies. We will output real viewable image files using the Netpbm PPM (Portable Pixmap) format.

---

## 1. How Displays Work: The Framebuffer in Memory

A physical monitor is a 2D grid of subpixels (Red, Green, Blue). In software, memory is fundamentally 1D (a continuous linear address space from byte $0$ to byte $N$).

To map a 2D coordinate $(x, y)$ onto a 1D linear array in memory:

```
2D Pixel Grid (Width = W, Height = H):
(0,0) ───────> X (Width - 1)
  │   [ (0,0)  (1,0)  (2,0) ... ]   <- Row 0
  │   [ (0,1)  (1,1)  (2,1) ... ]   <- Row 1
  ▼   [ (0,2)  (1,2)  (2,2) ... ]   <- Row 2
  Y
```

### The Pitch & Stride Formula
In row-major order:
$$\text{Pixel Index} = y \times \text{Width} + x$$

If each pixel contains 4 channels (Red, Green, Blue, Alpha) at 1 byte each (RGBA32 format, 32 bits per pixel):
$$\text{Byte Offset} = (y \times \text{Width} + x) \times 4$$
$$\text{Row Stride (Pitch)} = \text{Width} \times 4 \text{ bytes}$$

---

## 2. Color Encodings & Memory Layout

In systems programming, channel order matters immensely due to CPU endianness and GPU hardware requirements:

1. **RGBA32 (Linear 4-byte struct)**:
   ```c
   typedef struct {
       uint8_t r; // Byte 0
       uint8_t g; // Byte 1
       uint8_t b; // Byte 2
       uint8_t a; // Byte 3
   } PixelRGBA;
   ```
2. **BGRA32 (DirectX & Windows DIB default)**: Windows GDI and many GPU scanout buffers historically store Blue first in memory for x86 little-endian DWORD packing (`0xAARRGGBB`).
3. **RGB24 (Packed 3-byte)**:
   ```c
   typedef struct { uint8_t r, g, b; } PixelRGB; // Size = 3 bytes
   ```
   *Warning*: RGB24 has unaligned 3-byte memory access, which degrades CPU memory bandwidth and SIMD cache line throughput. RGBA32 (aligned to 4 bytes) is preferred in high-performance graphics engines.

---

## 3. Alpha Blending Math (Porter-Duff "Over" Operator)

When drawing a semi-transparent pixel $(R_s, G_s, B_s, \alpha_s)$ over an existing background pixel $(R_d, G_d, B_d)$, we calculate linear interpolation:

$$C_{\text{out}} = C_{\text{src}} \times \alpha_{\text{src}} + C_{\text{dst}} \times (1 - \alpha_{\text{src}})$$

In integer arithmetic (avoiding expensive floating-point conversions in software rasterizers):
```c
uint32_t alpha = src.a;
uint32_t inv_alpha = 255 - alpha;

out.r = (uint8_t)((src.r * alpha + dst.r * inv_alpha) / 255);
out.g = (uint8_t)((src.g * alpha + dst.g * inv_alpha) / 255);
out.b = (uint8_t)((src.b * alpha + dst.b * inv_alpha) / 255);
```

---

## 4. The Netpbm PPM Format: Zero-Dependency Image Output

How can a C program output an image file without linking `libpng` or `stb_image`?
By writing a **Netpbm PPM (P6 binary)** file!

A binary PPM file has a trivial header followed by raw uncompressed RGB bytes:
```text
P6
<Width> <Height>
255
<Binary RGBRGBRGB... bytes>
```

You can view `.ppm` files in Photoshop, GIMP, VS Code extensions, or convert them with ImageMagick (`magick output.ppm output.png`).

---

## 5. Summary & Code Inspection

Open [`01_software_framebuffer.c`](file:///c:/Users/kkhoie/Desktop/ktknaga/qurayshe.github.io/graphicslab/01_software_framebuffer/01_software_framebuffer.c) to see a complete implementation of:
1. Dynamic heap-allocated framebuffer (`Framebuffer* fb_create(width, height)`)
2. Clear screen, draw pixel with boundary safety
3. Solid rectangle rasterization
4. Alpha blended gradient circle rendering
5. Fast PPM binary file serialization
