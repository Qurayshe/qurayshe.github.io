# 🔤 ASCII Filter ✨

A client-side **ASCII art filter** styled in the signature **Blorbo Doodle** aesthetic of
`misc/blorbo`, `misc/petpet`, `misc/caption`, `misc/qrcode` and `misc/heartlocket`.

Drop in an image, tune the ramp / dither / tone / ink, and export a crisp **PNG** or the raw
characters as **plain text**. Everything runs in the browser — no build step, no server.

---

## 🌟 Features

- **Live preview that *is* the export**
  The visible canvas is rasterised at `glyph size × raster scale`, so downloading never
  re-renders a "different" image — what you see is the PNG.
- **Character ramps**
  `Classic .:-=+*#%@` · `Blocks ░▒▓█` · `Detailed` (70 levels) · `Minimal` · `Dots` · `Binary`,
  plus a **custom ramp** field (whitespace collapsed, duplicates removed, min 2 glyphs).
  Ramps run **light → dark**: bright pixels take the first character.
- **Tone & detail**
  Resolution (30–220 columns) · glyph size · brightness · contrast · gamma · **edge boost**
  (Sobel, traces outlines as dense glyphs) · **smooth** (1–3 separable box-blur passes on the
  luminance grid) · **auto levels** (histogram stretch).
- **Dithering** — ordered 4×4 Bayer, offset by exactly one ramp step so gradients break up
  instead of banding.
- **Colour modes**
  **Ink** (one ink colour on paper, with a transparent-background toggle) ·
  **Source** (every glyph takes the pixel's own colour) · **Duotone** (ink → highlight gradient).
- **Glyph fonts** — JetBrains Mono, VT323 (terminal), Silkscreen (pixel), Space Mono, Courier New,
  with a bold toggle. The atlas is re-rasterised after `document.fonts.load()` resolves.
- **Input** — drag & drop anywhere, click to browse, or `Ctrl/Cmd+V` paste; two built-in samples
  (the plink cat photo + a procedural test card).
- **Export** — Download PNG · Copy PNG (`navigator.clipboard.write`, the iframe already ships
  `allow="clipboard-write"`) · Copy `.txt` · Download `.txt`.
- **Live stats** — grid size, glyph count, frame time and the active render backend.

---

## 📁 File Structure

```
misc/ascii/
├── index.html        # Markup: preview stage, control sections, credits
├── style.css         # Blorbo doodle theme (paper dots, wobbly borders, sketchy buttons)
├── main.js           # State, control binding, rAF-coalesced rendering, exports
├── ascii-engine.js   # Sampler maths + WebGL2 instanced renderer + Canvas2D fallback
├── img/sample.png    # Plink cat sample (shared with misc/caption)
└── README.md
```

---

## ⚙️ How it works

```
<img> / <video> / GIF frame
        │  drawImage (two-step downscale when the ratio is > 3)
        ▼
  offscreen cols × rows canvas  ──getImageData──▶  Float32 luminance
                                                      │ auto levels
                                                      │ box blur × n
                                                      │ brightness / contrast / gamma
                                                      │ Sobel edge boost
                                                      ▼
                                       ramp index + colour  =  4 bytes / cell
                                                      │ bufferSubData (~30 KB)
                                                      ▼

### Why this is fast

| Choice | Effect |
|---|---|
| Glyph **atlas** baked once per (font, size, ramp, weight) | No text layout per frame, ever |
| **One instanced draw call** for the whole grid | ~7 400 glyphs in a single submission instead of 7 400 `fillText` calls (10–200 ms) |
| **4 bytes per cell** (`charIndex`, r, g, b) via a `uvec4` attribute | Frame upload is ~30 KB, no per-frame allocations |
| Typed-array reuse (`AsciiSampler`) | Zero GC churn while dragging sliders |
| Sampling at **grid resolution**, not source resolution | A 4000×3000 photo costs the same as a 400×300 one |
| `requestAnimationFrame` + dirty flag | Slider bursts collapse into a single frame |
| `willReadFrequently` on the tiny grid canvas | Cheap `getImageData` |

Typical frame on a laptop: **2–4 ms** for 100 × 74 cells at 2× raster scale.

### Backend roadmap (WebGPU)

`createRenderer()` returns any object satisfying:

```js
init(canvas) · setAtlas(atlas, meta) · renderFrame(cells, cols, rows, opts) · dispose()
```

`AsciiWebGL2Renderer` and `AsciiCanvas2DRenderer` both implement it, so a WebGPU backend
(`ascii-webgpu.js`) can be added **without touching the UI or the sampler**.

Why WebGL2 shipped first:

- For 7k–40k tiny instanced quads both APIs are vsync-capped; an independent 2026 three.js
  benchmark measured native WebGPU at ~0.150 ms CPU submission vs **~0.035 ms for WebGL** at
  10 000 instances — i.e. no win for this shape of workload.
- Reach: WebGL2 ≈ 98% of browsers vs WebGPU ≈ 86% (Safari 26+, Firefox 141+ on Windows only).
  ([caniuse](https://caniuse.com/webgpu))

Where WebGPU *would* pay off is the streaming case: a compute pass can write the per-cell
`array<u32>` straight into a storage buffer, removing the CPU readback entirely. That is the
planned `?backend=webgpu` follow-up when GIF/video decoding lands. (The same trick is possible
in WebGL2 via `texelFetch` in the vertex shader, so even that is not a hard requirement.)

### Adding GIF / video later

The engine is already frame-based:

```js
// inside a rAF loop, once per decoded frame:
source = { el: videoElement, width: videoElement.videoWidth, height: videoElement.videoHeight };
await window.asciiFilter.rebuild(); // only when the source dimensions change
```

`renderNow()` handles the rest — it draws the *current* frame, samples it, and issues one draw
call. For GIFs, decode with `omggif` (already vendored in `misc/caption/vendor/`) into a canvas
and feed that canvas as `source.el`.

---

## 🎛️ Controls cheat-sheet

| Control | What it does |
|---|---|
| Resolution | Columns in the grid (rows follow the source aspect + glyph aspect) |
| Glyph size | Glyph height in output pixels, before raster scale |
| Raster scale | `1× / 2× / 3×` supersampling of the exported canvas |
| Edge boost | Mixes in Sobel magnitude, darkening edges so outlines read as dense glyphs |
| Smooth | Box-blur passes on the luminance grid (calms noisy photos) |
| Auto levels | Stretches min→max luminance across the whole ramp |
| Invert | Flips glyph density (pairs nicely with black paper + white ink) |

---

## ✅ Browser support

Chromium 90+, Firefox 90+, Safari 15+ (WebGL2). Without WebGL2 the Canvas2D fallback still
renders everything — just slower at high densities.

---

## 📜 Credits

Built on pure web standards: `CanvasRenderingContext2D`, `WebGL2` (instanced arrays) and
`Clipboard API`. No third-party runtime dependencies.
