# QR Code Studio

QR code generator and editor with support for shape hole cutouts and pixel art embedding.

## Features

- **Shape cutouts**: Reserve a shape (heart, circle, star, rounded square, square, diamond, hexagon) to embed full-resolution images without QR module pixelation.
- **Pixel art embedding**: Downsample and dither small images (12x12 to 32x32) directly into QR modules.
- **Interactive editor**: Paint, erase, or restore modules with live scannability verification via jsQR.
- **QR inspector**: View functional areas (finder, timing, format, data/ECC) and dotted rendering.
- **Export**: PNG (up to 2048px), SVG, and clipboard.

## Dependencies

- `vendor/qrcodegen.js`: Nayuki QR code generator.
- `vendor/jsQR.js`: jsQR scanner for live validation.
