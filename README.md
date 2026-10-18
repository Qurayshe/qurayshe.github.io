# 💝 Heart Locket Maker

An original, from-scratch recreation of the [makesweet heart locket](https://makesweet.com/my/heart-locket) experience as a fully client-side static page — put photos or text inside a 3D gold heart locket that opens and closes, then download the animation as a **GIF** or **MP4/WebM video**.

Everything is procedural: the locket geometry is generated at runtime from the classic parametric heart curve (`x = 16sin³t, y = 13cos t − 5cos 2t − 2cos 3t − cos 4t`) extruded via `THREE.Shape` → `THREE.ExtrudeGeometry`. **No assets were copied from makesweet** (their code/templates are licensed PolyForm-Noncommercial 1.0.0) — this is inspiration-only, and the UI credits them.

## Features

- **3D heart locket** that opens (hinged clamshell) to reveal two heart-shaped recesses, then closes, on a gentle looping timeline with idle sway & sparkle dust
- **Two independent sides** — each can hold a photo *or* text (or be left empty):
  - 📷 photos via a modern dropzone — drag & drop a file, paste an image, paste an image URL, or click to browse (drag on the canvas to reposition, arrow keys nudge, shift = 10×) — **animated gifs play inside the locket**, looping in step with the locket animation (and baked into the export)
  - ✏️ text with font / color / size controls
  - ↔/↕ flip, size & rotation sliders, reset
  - 🎨 a side holding a **photo** shows the locket's **finish colour** inside the heart (recess base + lining), so transparent or off-centre photos blend with the shell instead of showing a white ring — text/empty sides keep the warm cream lining
- **Locket styling**: **pink matte by default**, with gold / rose gold / silver / red enamel as alternates, plus backdrop color, sparkle toggle, a **transparent-backdrop** toggle and a **time** slider (loop length, 0.6–12s) with a matching editable **speed** box
- **Export**: GIF at 10/15/20 fps with a **compress toggle** (on = one shared global palette via [gifenc](https://github.com/mattdesl/gifenc) — much smaller files, though smooth gradients can shimmer; off = the classic per-frame-palette gif.js look) and a **colors control** (256/128/64/32, applied while compressed) — with a genuine **transparent background** when the backdrop is hidden — or video via `MediaRecorder` (MP4 where the browser supports it — Safari, recent Chrome — otherwise WebM), at 400×300 or 800×600
- Drag-to-orbit the camera in the preview (OrbitControls)

## URL parameters

Handy for sharing a specific look or for screenshot testing:

| Param | Effect |
| --- | --- |
| `?t=0.5` | Pin a pose, `0` = closed, `0.5` = fully open, `1` = closed again |
| `?autoplay=0` | Start paused instead of playing |
| `?finish=gold` | Preselect a finish (`pink`, `gold`, `rosegold`, `silver`, `enamel`) |
| `?cam=3.4,1.2,3.4` | Camera position (useful for checking the locket from the side) |
| `?speed=2` | Playback speed multiplier (0.5–10); the "time" slider follows it |
| `?transparent=1` | Start with the backdrop hidden (transparent GIF export) |

Example: `index.html?t=0.5&autoplay=0&finish=gold`

## Run locally

Web workers (used by the GIF encoder) need http(s), not `file://`:

```
cd heardlockettool
python -m http.server 8080
# open http://localhost:8080
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure — two-column layout (preview + controls), themed like the blorbo/petpet pages |
| `style.css` | Self-contained **Blorbo Doodle** theme (cream dotted paper, wobbly ink borders, sketchy buttons) — the same look as `misc/blorbo` & `misc/petpet`, no parent-site CSS dependency |
| `main.js` | All app logic: procedural locket, textures, timeline, UI, export |
| `vendor/gif.js`, `vendor/gif.worker.js` | [gif.js](https://github.com/jnordberg/gif.js) GIF encoder (MIT), vendored from the petpet tool — the "compress off" path (fresh palette per frame) |
| `vendor/gifenc.esm.js` | [gifenc](https://github.com/mattdesl/gifenc) (MIT) — fast pure-JS GIF encoder with palette optimization; lazy-loaded when "compress" is on |
| `vendor/omggif.js` | [omggif](https://github.com/deanm/omggif) GIF decoder (MIT) — reads uploaded animated gifs frame by frame (one-line browser-global shim appended at the bottom when vendoring) |

Dependencies loaded from CDN (same URLs the main site uses): **Three.js r128** + **OrbitControls**, plus Google Fonts — the blorbo/petpet doodle faces (**DynaPuff**, **Patrick Hand**, **Gaegu**, **Shantell Sans**) for the page chrome, and **Caveat** / **Inter** for the text you can type inside the locket.

## Implementation notes

**Recess levels and the bevel gotcha.** `THREE.ExtrudeGeometry` with `bevelEnabled`
extends the mesh by `bevelThickness` **beyond** the nominal `depth` at *both* ends.
So a shell extruded with `depth: SHELL_DEPTH` actually has its solid front face at
`SHELL_DEPTH + bevelThickness`. If you place the lining/photo planes relative to
`SHELL_DEPTH` they end up buried inside the solid shell and never render. All recess
levels are therefore derived from `SHELL_FRONT = SHELL_DEPTH + BEVEL_T` (see the
constants block near the top of `main.js`).

**Recess sizing / the bezel.** `RECESS_SCALE` is the rim opening, `FLOOR_SCALE` the
lining and `PLANE_SCALE` the content plane. The content plane is deliberately
*larger* than the rim opening so the photo/text fills the whole recess and slides
under the rim — that keeps the visible bezel thin and leaves no gap ring between
the content and the rim. Raise `PLANE_SCALE` for less bezel, lower it for more.

**No culling artifacts.** The shell, lining and content materials are all
`THREE.DoubleSide`, and the lid's lining is rotated to face its recess opening.
Without that, interior surfaces get back-face culled and the locket looks like it
has a hole through it when seen edge-on mid-swing.

**Seamless loop.** Everything in `applyTime(t)` must be periodic over `t ∈ [0, 1]`
or the GIF/video visibly jumps when it wraps. The sparkle rotation is a full
`2π` turn per loop for exactly that reason — a fractional turn (e.g. `0.6π`)
makes the last frame snap back to the first.

**Hinge.** A barrel plus three knuckles sit on the hinge axis so the two halves
read as one connected object; the wedge of space that opens between them mid-swing
then looks like a hinge instead of a hole.

**Where the hinge sits vertically.** The heart only reaches its full half-width
over a narrow band of `y`: with `HEART_SPAN = 2` the right edge is `x ≈ 1.0` for
`y ≈ 0.32 … 0.52` and falls away fast either side (`0.83` at `y = 0`, `0.55` at
`y = 0.9`). `HINGE_Y = OUTLINE.halfH * 0.46` (≈ `0.42`) centres the barrel on that
band, so the barrel and the three knuckles straddle **both** halves' hinge edges
(knuckle surface at `x = 0.963` vs the heart edge at `0.965 / 1.000 / 0.955` at the
three knuckle heights). Centred at `y = 0` the barrel instead sits beside the
heart's waist in open space — a `0.15`-unit air gap — and reads as floating in
midair.

**Photo sides take the finish colour.** The recess base is painted per side in
`paintRecessBase(ctx, sideKey)`: cream for text/empty, the selected finish for a
side holding a photo — with a neutral vignette and watermark there, because the
brown-tinted one would muddy pinks and golds. Each half has its own lining
material (`liningMaterialA` for the back shell, `liningMaterialB` for the lid), so
`refreshLiningColor(sideKey)` can tint just that half's plate, and `applyFinish()`
re-tints the linings and repaints the recess of any photo side when the finish
changes.

**Animated gifs.** Uploaded gifs are decoded up front in `decodeGif()` (omggif):
every frame is composited onto one persistent RGBA buffer — exactly how GIF
disposal codes are meant to work, including disposal 2 = restore-to-background —
then scaled down to `MAX_TEX_SIZE` and capped at `GIF_MAX_FRAMES`. Playback is
deliberately *not* wall-clock driven: `updateGifFrames()` picks the frame from the
locket timeline inside `applyTime(t)`, so preview and the frame-by-frame export
show the same animation, a gif always loops in step with the locket, and the
texture is only repainted when the frame index actually changes.

**Time vs speed.** A loop lasts `durationSeconds()` = `BASE_DURATION / speed`.
The "time" slider edits the loop length (0.6–12s) directly; the "speed" number
box is that same setting as a multiplier, and `syncSpeedUI()` keeps the two in
step in both directions (the number box wins outside the slider's range).

**Transparent GIF export.** Neither encoder composites alpha the way we need —
both mark a single *colour* as the transparent index. So with the backdrop
hidden the renderer clears with alpha 0 (`alpha: true` + `applyBackdrop()`),
`captureFrame()` flattens those alpha-0 pixels onto a magenta key (255, 0, 255)
that no locket colour can collide with, and the GIF is built marking that key
transparent: gif.js via `transparent: 0xff00ff`, gifenc via the key colour's
palette index (looked up with `findColorIndex`). Video formats carry no alpha
at all, so `exportVideo()` puts the backdrop colour back for the recording pass.

**GIF optimization.** The **compress** toggle picks the encoder. On (default),
`exportGifOptimized()` samples 8 evenly spaced frames, quantizes them *once*
into a single global palette (gifenc's pnn quantizer, capped at the "colors"
control: 256/128/64/32) and writes every frame against it — no per-frame local
colour tables, which is exactly the size lever gifsicle would pull (gifsicle
itself is a native GPL binary, so its palette reduction is reimplemented here
in pure JS, ~9 KB). One palette for the whole loop is what makes the files
small, but it also fixes gifenc's 5-6-5 colour prequantization across frames,
so smooth gradients can shimmer or flicker as the locket moves. Off switches to
`exportGifClassic` — the original gif.js worker pipeline, which quantizes every
frame fresh (smooth, bigger) and ignores "colors". The gifenc module is only
loaded while compression is on; if it can't load (e.g. the page is opened over
`file://`), `exportGif()` falls back to gif.js anyway.

**Page theme.** The chrome is the same **Blorbo Doodle** theme as `misc/blorbo`
and `misc/petpet`: the shared palette variables, `Patrick Hand` / `DynaPuff` type,
hand-drawn `--wobble` borders, hard offset ink shadows, springy press feedback, a
top credit banner and a bottom credit card. `style.css` stays self-contained — the
only things shared with the site are palette values and font families — so it
looks identical inside the site's misc iframe and when this folder is opened on
its own.

## Integrating into qurayshe.github.io

The tool is standalone by design. To add it to the portfolio site as a misc tool:

1. Copy this folder to `qurayshe.github.io/misc/heartlocket/`
2. In `index.html` (site root), add a dropdown entry next to the petpet one (~line 99):

```html
<a class="dropdown-item" href="#misc/heartlocket" role="menuitem">
  <span class="dropdown-item-badge badge-misc">💝 Locket</span>
  <div class="dropdown-item-info">
    <div class="dropdown-item-title">Heart Locket Maker</div>
    <div class="dropdown-item-desc">3D heart locket that opens to reveal your photos — GIF/video export</div>
  </div>
</a>
```

3. In `js/modules/search-modal.js`, add an entry to the misc index (~line 232):

```js
{
  type: 'misc',
  category: 'Misc Tools',
  id: 'misc-heartlocket',
  title: 'Heart Locket Maker',
  description: '3D heart locket with photos inside, GIF export',
  keywords: 'heart locket photo gif animation valentine love meme beloved 3d three.js misc',
  route: '#misc/heartlocket'
},
```

That's it — the router (`js/app.js:onMiscActive`) automatically points the misc iframe at `./misc/<tool>/index.html`.

## Credits

- [makesweet heart locket](https://makesweet.com/my/heart-locket) — the original concept (this rebuild copies none of their assets; their templates are PolyForm-Noncommercial)
- [gif.js](https://github.com/jnordberg/gif.js) by Johan Nordberg (MIT) — GIF encoding
- [omggif](https://github.com/deanm/omggif) by Dean McNamee (MIT) — animated GIF decoding
- [gifenc](https://github.com/mattdesl/gifenc) by Matt DesLauriers (MIT) — fast GIF encoding with palette optimization
- [Three.js](https://threejs.org/) — 3D rendering
