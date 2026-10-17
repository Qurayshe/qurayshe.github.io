# 💝 Heart Locket Maker

An original, from-scratch recreation of the [makesweet heart locket](https://makesweet.com/my/heart-locket) experience as a fully client-side static page — put photos or text inside a 3D gold heart locket that opens and closes, then download the animation as a **GIF** or **MP4/WebM video**.

Everything is procedural: the locket geometry is generated at runtime from the classic parametric heart curve (`x = 16sin³t, y = 13cos t − 5cos 2t − 2cos 3t − cos 4t`) extruded via `THREE.Shape` → `THREE.ExtrudeGeometry`. **No assets were copied from makesweet** (their code/templates are licensed PolyForm-Noncommercial 1.0.0) — this is inspiration-only, and the UI credits them.

## Features

- **3D heart locket** that opens (hinged clamshell) to reveal two heart-shaped recesses, then closes, on a gentle looping timeline with idle sway & sparkle dust
- **Two independent sides** — each can hold a photo *or* text (or be left empty):
  - 📷 upload photos (drag on the canvas to reposition, arrow keys nudge, shift = 10×)
  - ✏️ text with font / color / size controls
  - ↔/↕ flip, size & rotation sliders, reset
- **Locket styling**: **pink matte by default**, with gold / rose gold / silver / red enamel as alternates, plus backdrop color, sparkle toggle and playback speed
- **Export**: GIF (via [gif.js](https://github.com/jnordberg/gif.js)) at 10/15/20 fps, or video via `MediaRecorder` (MP4 where the browser supports it — Safari, recent Chrome — otherwise WebM), at 400×300 or 800×600
- Drag-to-orbit the camera in the preview (OrbitControls)

## URL parameters

Handy for sharing a specific look or for screenshot testing:

| Param | Effect |
| --- | --- |
| `?t=0.5` | Pin a pose, `0` = closed, `0.5` = fully open, `1` = closed again |
| `?autoplay=0` | Start paused instead of playing |
| `?finish=gold` | Preselect a finish (`pink`, `gold`, `rosegold`, `silver`, `enamel`) |

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
| `index.html` | Page structure — two-column layout (preview + controls) |
| `style.css` | Self-contained romantic plum & gold theme (no parent-site CSS dependency) |
| `main.js` | All app logic: procedural locket, textures, timeline, UI, export |
| `vendor/gif.js`, `vendor/gif.worker.js` | [gif.js](https://github.com/jnordberg/gif.js) GIF encoder (MIT), vendored from the petpet tool |

Dependencies loaded from CDN (same URLs the main site uses): **Three.js r128** + **OrbitControls**, plus Google Fonts (Fraunces, Inter, Caveat).

## Implementation note: the recess levels

`THREE.ExtrudeGeometry` with `bevelEnabled` extends the mesh by `bevelThickness`
**beyond** the nominal `depth` at *both* ends. So a shell extruded with
`depth: SHELL_DEPTH` actually has its solid front face at `SHELL_DEPTH + bevelThickness`.
If you place the lining/photo planes relative to `SHELL_DEPTH` they end up buried
inside the solid shell and never render. All recess levels in `main.js` are
therefore derived from `SHELL_FRONT = SHELL_DEPTH + BEVEL_T` (see the constants
block near the top). Keep that in mind if you change `SHELL_DEPTH`, `RIM_HEIGHT`
or the bevel values.

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
- [Three.js](https://threejs.org/) — 3D rendering
