# 💬 Caption Tool ✨

A client-side image, animated GIF, and video meme caption studio styled in the signature **Blorbo Doodle** aesthetic.

Adds a classic top/bottom white banner with black bold text (e.g. the iconic *"plink"* cat meme, Discord/esmBot caption style, iFunny format).

---

## 🌟 Features

- **Multi-Media Support**:
  - **Images**: PNG, JPG, WebP, SVG, BMP.
  - **Animated GIFs**: Full frame-by-frame decoding (`omggif`), real-time interactive preview, timeline scrubbing, and high-quality quantization & re-encoding (`gifenc`).
  - **Videos**: MP4, WebM, MOV. Live video-canvas compositing with frame scrubbing and native `MediaRecorder` export **with synchronized audio**!
  - **Cross-Format Conversion**: Export GIFs as MP4 video or convert videos into animated GIFs.
- **Classic Meme Typography**:
  - **Oswald / Futura** (the authentic Discord / esmBot / Tenor font)
  - **Anton** (ultra-punchy condensed)
  - **Impact** (classic 2010s format)
  - **Montserrat Black**
  - **Arial Black**
  - **DynaPuff & Shantell Sans** (bubbly doodle aesthetic)
  - **Patrick Hand** (hand-drawn doodle)
  - **Comic Neue**
  - **JetBrains Mono**
- **Smart Auto-Fit**:
  - Automatically scales font size and word wrapping to balance text against media width.
  - Manual font size and padding override controls.
  - Top, Bottom, or Both caption bars.
  - Text case transform (As Typed, ALL CAPS, lowercase).
- **Clipboard & Drag-and-Drop**:
  - Drag and drop files anywhere or click the dropzone.
  - Paste directly from clipboard (`Ctrl+V`).
  - 1-click **Copy to Clipboard** (`navigator.clipboard.write`) for pasting memes directly into Discord, Twitter, or Slack!
- **100% Client-Side & GitHub Pages Ready**:
  - Zero server backend, zero node dependencies, pure web standards (`omggif`, `gifenc`, `CanvasRenderingContext2D`, `MediaRecorder`, `Web Audio API`).

---

## 📁 File Structure

```
misc/caption/
├── index.html        # App structure and markup
├── style.css         # Blorbo doodle theme & responsive styling
├── main.js           # Compositing, playback loop & export logic
├── img/
│   ├── sample.png    # Classic "plink" cat photo
│   └── sample.gif    # Kirby wobble animated GIF
└── vendor/
    ├── omggif.js     # Pure JS GIF reader / frame decoder
    ├── gifenc.esm.js # Fast modern GIF encoder (Matt DesLauriers)
    ├── gif.js        # Vendored fallback GIF encoder
    └── gif.worker.js # Web worker for gif.js
```

