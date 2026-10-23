# QR Code Doodle Studio 📱✨

A cute, expressive, and feature-packed QR code generator and interactive drawing studio. Built with the same playful cream-and-ink doodle aesthetic as the **Heart Locket Maker** (`heardlockettool`) and **Petpet** on `qurayshe.github.io`.

---

## ✨ Features

1. **Shape Hole Carving for Full-Resolution Photos & Graphics**:
   - Carves a custom-shaped "hole" in the QR code (💖 Heart, ⚪ Circle, ⭐ Star, 🔲 Rounded Square, ⬛ Square, 💎 Diamond, ⬡ Hexagon).
   - Places a **full-resolution photo, avatar, or logo** cleanly inside the hole with pan, zoom, rotation, and custom borders (Doodle Ink Wobble, Clean Outline, Sticker Frame).
   - Because error correction (ECC Level H = 30%) absorbs the hole, the photo is **never downscaled to chunky QR blocks** and remains crystal clear!
   - Real-time scannability check continuously verifies phone camera readability using `jsQR`.

2. **Direct Pixel Art & Small Image Embedding**:
   - Translates tiny images or pixel art (e.g. 12×12, 16×16, 24×24, 32×32) directly into the black & white QR modules without manual pixel drawing.
   - Built-in cute presets: 💖 Heart, 🐱 Cat, ⭐ Star, 👻 Ghost, 🍄 Mushroom, 🙂 Smiley.
   - Multiple binarization modes: **Floyd-Steinberg error diffusion dithering**, **Atkinson retro dithering**, and adjustable thresholding.
   - **Smart Mask Optimizer**: scans all 8 QR masking patterns to automatically choose the mask that naturally aligns best with your artwork, saving error correction budget!

3. **Interactive Pixel Painting & Editing**:
   - Draw dark or light modules directly on the grid with mouse or touch.
   - Tools: Pencil (Dark), Pencil (Light), Rectangle fill, and Restore/Eraser (reverts modified modules to clean QR code).
   - Full Undo / Redo history (`Ctrl+Z`, `Ctrl+Y`).
   - Grid toggle and coordinate tooltip.

4. **QR Studio & Inspector**:
   - ISO/IEC 18004 compliant breakdown.
   - Colored area overlay: Finder patterns, Separators, Timing tracks, Alignment patterns, Dark module, Format bits, Version blocks, and Data codewords.
   - Step-by-step construction simulation.
   - Dotted rendering mode (custom dot size, rounded corners, or circles).

5. **Export & Sharing**:
   - Crisp PNG download at 600px, 1024px (HD), or 2048px (Print).
   - Clean vector SVG download.
   - 1-click Copy Image to Clipboard.

---

## 🚀 Dependencies

Completely self-contained client-side application with zero build steps or server requirements:
- `vendor/qrcodegen.js`: Nayuki's ISO/IEC 18004 Model 2 QR Code generator.
- `vendor/jsQR.js`: Cozmo's pure JavaScript QR code scanner for live validation.
