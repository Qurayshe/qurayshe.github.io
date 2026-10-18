/**
 * Heart Locket Maker — interactive 3D locket that opens to reveal photos or text.
 * Original procedural design (no assets copied from makesweet; their templates are
 * PolyForm-Noncommercial). Geometry: parametric heart -> THREE.Shape -> ExtrudeGeometry.
 * Export: GIF via gif.js (vendored from jnordberg/gif.js), video via MediaRecorder.
 */

"use strict";

/* ==========================================================================
   Constants & state
   ========================================================================== */

const TEX_SIZE = 512;            // content texture resolution (square)
const SHELL_DEPTH = 0.16;        // locket half thickness
const RIM_HEIGHT = 0.055;        // raised rim around the photo recess
const HEART_SPAN = 2.0;          // locket width in world units
const BASE_DURATION = 6.0;       // animation length in seconds at 100% speed
const MAX_OPEN_ANGLE = Math.PI * 0.96; // lid rotation when fully open (~173°)

// ExtrudeGeometry with bevel extends the mesh by bevelThickness BEYOND the
// nominal depth on BOTH ends, so the shell's solid front face is not at
// `depth` but at `depth + BEVEL_T`. Every recess level below is derived from
// that, otherwise the photo planes end up buried inside the solid shell.
const BEVEL_T = 0.02;                              // outer shell bevel thickness
const RIM_BEVEL = 0.008;                           // rim bevel thickness
const RIM_SINK = 0.012;                            // rim base buried into the shell (kills junction cracks)
const SHELL_FRONT = SHELL_DEPTH + BEVEL_T;         // front face of a shell (0.18)
const FLOOR_OFF = 0.006;                           // lining sits above the face
const CONTENT_OFF = 0.012;                         // photo plane sits above the face
// Recess sizes. The content plane is deliberately LARGER than the rim opening so
// the photo/text fills the whole recess and slides under the rim (no gap ring).
const RECESS_SCALE = 0.93;                         // rim opening (hole) as a fraction of the heart
const FLOOR_SCALE = 0.95;                          // lining, slightly larger than the opening
const PLANE_SCALE = 0.97;                          // content plane rectangle
const CONTENT_CLIP_MARGIN = 2;                     // heart clip margin inside the texture canvas
const BACK_RIM_TOP = SHELL_FRONT + RIM_HEIGHT + 2 * RIM_BEVEL - RIM_SINK; // 0.239
const LID_RIM_EXTENT = RIM_HEIGHT + 2 * RIM_BEVEL - RIM_SINK;             // 0.059
const HINGE_Z = BACK_RIM_TOP + LID_RIM_EXTENT;                            // 0.298 when closed

// Animated GIF support. We decode every frame up front (via vendored omggif)
// and then swap which decoded frame the photo plane shows, driven by the same
// timeline clock that opens the locket — so the gif loops in sync with the
// animation for free. GIF_MAX_FRAMES keeps huge gifs from blowing up memory.
const GIF_MAX_FRAMES = 300;
const MAX_TEX_SIZE = 1024;  // cap for decoded gif frames (upscales to plane)

// Locket finishes. "pink" is the default matte enamel; the rest are metals.
const FINISHES = Object.freeze({
  pink:     { color: 0xe0709c, metalness: 0.12, roughness: 0.70, envIntensity: 0.45 },
  gold:     { color: 0xffd76a, metalness: 1.0,  roughness: 0.30, envIntensity: 1.15 },
  rosegold: { color: 0xffb48a, metalness: 1.0,  roughness: 0.32, envIntensity: 1.10 },
  silver:   { color: 0xe8eef2, metalness: 1.0,  roughness: 0.24, envIntensity: 1.20 },
  enamel:   { color: 0xc11f3d, metalness: 0.15, roughness: 0.42, envIntensity: 0.90 },
});

// Inner lining (the satin plate behind the content plane). Text/empty sides
// keep this warm cream; a side holding a photo takes the locket's finish
// colour instead, so the inside of the heart matches the locket — see
// refreshLiningColor() and paintRecessBase().
const DEFAULT_LINING_COLOR = 0xe9d3b4;

const FONT_STACKS = Object.freeze({
  serif:   'Georgia, "Times New Roman", serif',
  cursive: '"Caveat", "Comic Sans MS", cursive',
  sans:    '"Inter", system-ui, sans-serif',
  comic:   '"Comic Sans MS", "Comic Neue", "Comic Sans", cursive',
});

const DEFAULT_SIDE = () => ({
  mode: "text",           // "photo" | "text" | "empty"
  img: null,              // HTMLImageElement once uploaded
  gif: null,              // decoded animated gif: { frames: [canvas], delays: [ms], duration }
  _gifFrame: -1,          // last decoded frame pushed to the texture (skip redundant redraws)
  text: "",
  font: "cursive",
  textColor: "#6b2737",
  textSize: 52,           // px within the TEX_SIZE canvas
  offsetX: 0,             // content offset in texture px (canvas space, y down)
  offsetY: 0,
  scale: 95,              // percent
  rotation: 0,            // degrees
  flipH: false,
  flipV: false,
});

const state = {
  sides: { A: DEFAULT_SIDE(), B: DEFAULT_SIDE() },
  selected: "A",
  playing: true,
  t: 0,                   // normalized time [0, 1)
  speed: 1.0,             // playback multiplier (loop duration = BASE_DURATION / speed)
  finish: "pink",         // finish key from FINISHES
  bgColor: "#2a1220",
  sparkle: true,
  transparentBg: false,   // hide backdrop so GIF export keeps transparency
  exporting: false,
};

/* ==========================================================================
   Small utilities
   ========================================================================== */

const $ = (sel) => document.querySelector(sel);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, f) => a + (b - a) * f;

/** Classic parametric heart: x = 16sin³t, y = 13cos t − 5cos 2t − 2cos 3t − cos 4t */
function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y };
}

/**
 * Sample the heart and normalize into a span×span-ish box centered on origin.
 * Returns raw-normalized coords where width = HEART_SPAN and height follows aspect.
 */
function heartOutline(samples = 160, span = HEART_SPAN) {
  const pts = [];
  for (let i = 0; i < samples; i++) {
    // t from π (bottom tip sweep) full loop; shift so the shape reads upright
    const t = (i / samples) * Math.PI * 2 + Math.PI / 2;
    pts.push(heartPoint(t));
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const s = span / (maxX - minX);
  return {
    pts: pts.map((p) => ({ x: (p.x - cx) * s, y: (p.y - cy) * s })),
    width: span,
    height: (maxY - minY) * s,
    halfW: span / 2,
    halfH: ((maxY - minY) * s) / 2,
  };
}

const OUTLINE = heartOutline();

/** THREE.Shape from the normalized outline (optionally inset by factor). */
function heartShape(factor = 1) {
  const shape = new THREE.Shape();
  OUTLINE.pts.forEach((p, i) => {
    const x = p.x * factor, y = p.y * factor;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

/** Path2D of the heart filling a TEX_SIZE canvas (y-down canvas space). */
function heartPath2D(canvasSize = TEX_SIZE, margin = 6) {
  const path = new Path2D();
  const usable = canvasSize - margin * 2;
  const s = usable / OUTLINE.width;
  const cx = canvasSize / 2, cy = canvasSize / 2;
  OUTLINE.pts.forEach((p, i) => {
    const x = cx + p.x * s;
    const y = cy - p.y * s; // canvas y is down
    if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
  });
  path.closePath();
  return path;
}

/* ==========================================================================
   Three.js scene
   ========================================================================== */

const canvas = $("#glcanvas");
// alpha: true lets the backdrop clear to transparent (see applyBackdrop) so the
// GIF export can carry a real alpha channel instead of a solid colour.
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true, // needed for frame capture during export
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;

const scene = new THREE.Scene();
scene.background = new THREE.Color(state.bgColor);

const camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 100);
camera.position.set(0, 0.15, 5.6);

const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 3.2;
controls.maxDistance = 9;
controls.target.set(0, 0, 0);

/* --------------------------------------------------------------------------
   Lighting: soft studio setup + procedural environment for metal reflections
   -------------------------------------------------------------------------- */

function buildEnvironment() {
  // Tiny equirect canvas: warm gradient sky + two bright "softbox" blobs
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 512; envCanvas.height = 256;
  const ctx = envCanvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, "#fff6e2");
  grad.addColorStop(0.35, "#c9a189");
  grad.addColorStop(0.55, "#54303f");
  grad.addColorStop(1.0, "#12070d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  const blob = (x, y, r, bright) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,250,${bright})`);
    g.addColorStop(1, "rgba(255,255,250,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(120, 60, 90, 0.95);   // key softbox
  blob(390, 90, 70, 0.65);   // fill softbox
  blob(256, 220, 110, 0.20); // warm floor bounce

  const texture = new THREE.CanvasTexture(envCanvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.encoding = THREE.sRGBEncoding;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(texture).texture;
  pmrem.dispose();
  texture.dispose();
  return envMap;
}

scene.environment = buildEnvironment();

const keyLight = new THREE.DirectionalLight(0xfff0dd, 1.15);
keyLight.position.set(3.5, 4, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffd9e4, 0.40);
fillLight.position.set(-4, 1, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffc9de, 0.60);
rimLight.position.set(0, -2, -4);
scene.add(rimLight);

// Soft frontal fill so recess interiors (floors, linings) never read as a
// black hole when the locket is viewed at an angle.
const frontFill = new THREE.DirectionalLight(0xfff2f6, 0.45);
frontFill.position.set(0, 0.6, 6);
scene.add(frontFill);

scene.add(new THREE.AmbientLight(0xffffff, 0.26));

/* --------------------------------------------------------------------------
   Materials
   -------------------------------------------------------------------------- */

// Shell material, driven by the selected finish. DoubleSide so interior
// surfaces (recess walls, linings) can never be back-face culled when the
// locket is seen edge-on mid-swing.
const shellMaterial = new THREE.MeshStandardMaterial({
  color: FINISHES[state.finish].color,
  metalness: FINISHES[state.finish].metalness,
  roughness: FINISHES[state.finish].roughness,
  envMapIntensity: FINISHES[state.finish].envIntensity,
  side: THREE.DoubleSide,
});

// Inner lining: warm satin cream so photos pop against the shell. One material
// per locket half, so the half showing a photo can be tinted to the finish
// colour (refreshLiningColor) without touching the other half.
function makeLiningMaterial() {
  return new THREE.MeshStandardMaterial({
    color: DEFAULT_LINING_COLOR,
    metalness: 0.30,
    roughness: 0.62,
    envMapIntensity: 0.6,
    side: THREE.DoubleSide,
  });
}

const liningMaterialA = makeLiningMaterial(); // back shell — side A (left photo)
const liningMaterialB = makeLiningMaterial(); // lid — side B (right photo)

/* --------------------------------------------------------------------------
   Procedural locket construction
   Back shell: recess faces +Z. Lid: recess faces -Z, hinged at heart's left
   edge, rotates open around the Y axis. Photos sit on planes inside each.
   -------------------------------------------------------------------------- */

const locket = new THREE.Group();
scene.add(locket);

function rimShapeWithHole() {
  const rimShape = heartShape(1);
  const hole = new THREE.Path();
  heartOutline(160, HEART_SPAN * RECESS_SCALE).pts.forEach((p, i) => {
    if (i === 0) hole.moveTo(p.x, p.y); else hole.lineTo(p.x, p.y);
  });
  hole.closePath();
  rimShape.holes.push(hole);
  return rimShape;
}

// --- Back shell (fixed) ----------------------------------------------------
// Outer solid spans z: -BEVEL_T .. SHELL_FRONT; the recess (lining + photo)
// sits on top of SHELL_FRONT, ringed by the rim.
function buildBackShell() {
  const group = new THREE.Group();

  const outerGeo = new THREE.ExtrudeGeometry(heartShape(1), {
    depth: SHELL_DEPTH, bevelEnabled: true, bevelThickness: BEVEL_T,
    bevelSize: BEVEL_T, bevelSegments: 3, curveSegments: 4,
  });

  const rimGeo = new THREE.ExtrudeGeometry(rimShapeWithHole(), {
    depth: RIM_HEIGHT, bevelEnabled: true, bevelThickness: RIM_BEVEL,
    bevelSize: RIM_BEVEL, bevelSegments: 2, curveSegments: 4,
  });
  // Rim base sunk into the shell so the junction is buried (no hairline crack)
  rimGeo.translate(0, 0, SHELL_FRONT - RIM_SINK + RIM_BEVEL);

  // Satin lining the photo rests on (slightly larger than the rim opening)
  const floorGeo = new THREE.ShapeGeometry(heartShape(FLOOR_SCALE));
  floorGeo.translate(0, 0, SHELL_FRONT + FLOOR_OFF);

  group.add(
    new THREE.Mesh(outerGeo, shellMaterial),
    new THREE.Mesh(rimGeo, shellMaterial),
    new THREE.Mesh(floorGeo, liningMaterialA)
  );
  group.children[0].name = "shellA"; // outer cap for click-selection
  return group;
}

// --- Lid (hinged at the heart's RIGHT edge, swings open toward +X) ---------
// Hinge on the right so that when open the back shell (side A) reads as the
// LEFT photo and the lid (side B) as the RIGHT photo, matching the UI labels.
// Built in hinge-local coords with its recess opening toward -Z: the outer
// shell occupies z: 0 .. SHELL_FRONT and the rim hangs down from z = 0.
function buildLid() {
  const hinge = new THREE.Group();
  hinge.position.set(OUTLINE.halfW, 0, HINGE_Z);

  const swing = new THREE.Group();
  hinge.add(swing);

  const outerGeo = new THREE.ExtrudeGeometry(heartShape(1), {
    depth: SHELL_DEPTH, bevelEnabled: true, bevelThickness: BEVEL_T,
    bevelSize: BEVEL_T, bevelSegments: 3, curveSegments: 4,
  });
  // Shift so the shell's -Z face lands exactly on the hinge plane (z = 0)
  outerGeo.translate(-OUTLINE.halfW, 0, BEVEL_T);

  const rimGeo = new THREE.ExtrudeGeometry(rimShapeWithHole(), {
    depth: RIM_HEIGHT, bevelEnabled: true, bevelThickness: RIM_BEVEL,
    bevelSize: RIM_BEVEL, bevelSegments: 2, curveSegments: 4,
  });
  // Rim base sunk into the lid's shell; extends toward the recess opening (-Z)
  rimGeo.translate(-OUTLINE.halfW, 0, RIM_SINK + RIM_BEVEL);

  const floorGeo = new THREE.ShapeGeometry(heartShape(FLOOR_SCALE));
  // Face the lining toward the recess opening (-Z), not into the shell
  floorGeo.rotateY(Math.PI);
  floorGeo.translate(-OUTLINE.halfW, 0, -FLOOR_OFF);

  swing.add(
    new THREE.Mesh(outerGeo, shellMaterial),
    new THREE.Mesh(rimGeo, shellMaterial),
    new THREE.Mesh(floorGeo, liningMaterialB)
  );
  swing.children[0].name = "shellB"; // outer cap for click-selection
  return { hinge, swing };
}

const backShell = buildBackShell();
locket.add(backShell);

const lid = buildLid();
locket.add(lid.hinge);

/* --------------------------------------------------------------------------
   Hinge barrel: a real knuckle along the hinge axis so the two halves read as
   one connected object (and the gap between them mid-swing reads as a hinge,
   not a hole).
   -------------------------------------------------------------------------- */

// Vertical position of the hinge. The heart outline only reaches its full
// half-width (x ≈ ±halfW) over a narrow band of y: with HEART_SPAN = 2 the
// right edge is x ≈ 1.0 for y ≈ 0.32 .. 0.52 and falls away fast either side
// (0.83 at y = 0). Centring the barrel on that band keeps the barrel and the
// three knuckles straddling BOTH halves' hinge edges; at y = 0 the barrel sits
// beside the heart's waist in open space and reads as floating in midair.
const HINGE_Y = OUTLINE.halfH * 0.46;   // ≈ 0.42
const HINGE_X = OUTLINE.halfW + 0.018;  // just outside the heart's widest point

const hingeParts = new THREE.Group();
{
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.040, 0.040, 0.44, 24),
    shellMaterial
  );
  barrel.position.set(HINGE_X, HINGE_Y, HINGE_Z);
  hingeParts.add(barrel);

  for (const dy of [-0.19, 0, 0.19]) {
    const knuckle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.085, 24),
      shellMaterial
    );
    knuckle.position.set(HINGE_X, HINGE_Y + dy, HINGE_Z);
    hingeParts.add(knuckle);
  }
}
locket.add(hingeParts);

/* --------------------------------------------------------------------------
   Photo planes (heart-clipped canvas textures) inside each shell
   -------------------------------------------------------------------------- */

function makeContentTexture() {
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = TEX_SIZE;
  const texture = new THREE.CanvasTexture(cnv);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return { canvas: cnv, ctx: cnv.getContext("2d"), texture };
}

const contentA = makeContentTexture(); // back shell — left photo
const contentB = makeContentTexture(); // lid — right photo

function makeContentPlane(content) {
  const size = HEART_SPAN * PLANE_SCALE;
  const geo = new THREE.PlaneGeometry(size, size * (OUTLINE.height / OUTLINE.width));
  const mat = new THREE.MeshStandardMaterial({
    map: content.texture,
    transparent: true,
    alphaTest: 0.04,
    metalness: 0.0,
    roughness: 0.85,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

const planeA = makeContentPlane(contentA);
// Sit on the recess lining, above the shell's front face and below the rim top
planeA.position.set(0, 0, SHELL_FRONT + CONTENT_OFF);
backShell.add(planeA);

const planeB = makeContentPlane(contentB);
// Lid recess opens toward -Z; photo sits just inside the shell's face
planeB.position.set(-OUTLINE.halfW, 0, -CONTENT_OFF);
planeB.rotation.y = Math.PI; // face -Z (toward back shell) when closed
lid.swing.add(planeB);

/* ==========================================================================
   Content texture painting (per side)
   ========================================================================== */

/** CSS hex string for the currently selected finish (2D canvas painting). */
function finishCssColor() {
  return `#${FINISHES[state.finish].color.toString(16).padStart(6, "0")}`;
}

/**
 * Recess base painted under the content.
 *
 * Text/empty sides get the warm cream satin look. A side holding a PHOTO gets
 * the locket's finish colour instead, so the inside of the heart matches the
 * locket (and any transparent or off-centre parts of the photo blend with the
 * shell rather than showing a white/cream ring).
 */
function paintRecessBase(ctx, sideKey) {
  const side = sideKey ? state.sides[sideKey] : null;
  const useFinish = !!side && side.mode === "photo";

  ctx.fillStyle = useFinish ? finishCssColor() : "#f3e2c9";
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  const g = ctx.createRadialGradient(
    TEX_SIZE / 2, TEX_SIZE / 2, TEX_SIZE * 0.18,
    TEX_SIZE / 2, TEX_SIZE / 2, TEX_SIZE * 0.62
  );
  if (useFinish) {
    // Neutral shading so the finish colour stays true — the brown-tinted
    // vignette below would muddy pinks and golds.
    g.addColorStop(0, "rgba(255,255,255,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0.14)");
  } else {
    g.addColorStop(0, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(120,80,60,0.22)");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // faint watermark heart (darkened finish colour / plum for the cream base)
  ctx.save();
  ctx.globalAlpha = useFinish ? 0.14 : 0.12;
  ctx.fillStyle = useFinish ? "#000000" : "#6b2737";
  ctx.translate(TEX_SIZE / 2, TEX_SIZE / 2);
  ctx.scale(0.42, 0.42);
  ctx.translate(-TEX_SIZE / 2, -TEX_SIZE / 2);
  ctx.fill(heartPath2D(TEX_SIZE, 20));
  ctx.restore();
}

/** Greedy word wrap; returns array of lines that fit maxWidth. */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Redraw one side's content canvas from its state and flag the texture for
 * upload. Transform order: content drawn centered at (center + offset),
 * rotated, scaled, flipped — then clipped to the heart.
 *
 * `timeSec` (optional) is the locket timeline position used to pick which
 * frame of an animated gif to draw; it defaults to the current preview time.
 */
function drawSide(which, timeSec) {
  const side = state.sides[which];
  const content = which === "A" ? contentA : contentB;
  const { ctx, texture } = content;

  ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
  ctx.save();
  ctx.clip(heartPath2D(TEX_SIZE, CONTENT_CLIP_MARGIN));

  paintRecessBase(ctx, which);

  if (side.mode !== "empty") {
    ctx.save();
    const cx = TEX_SIZE / 2 + side.offsetX;
    const cy = TEX_SIZE / 2 + side.offsetY;
    ctx.translate(cx, cy);
    ctx.rotate((side.rotation * Math.PI) / 180);
    const f = side.scale / 100;
    ctx.scale(side.flipH ? -f : f, side.flipV ? -f : f);

    if (side.mode === "photo" && (side.img || side.gif)) {
      // Animated gifs hand over the frame that belongs at this locket time;
      // static images just use the decoded <img>.
      const src = side.gif
        ? side.gif.frames[gifFrameIndex(side.gif, timeSec !== undefined ? timeSec : state.t * durationSeconds())]
        : side.img;
      // "cover"-fit the image into a TEX_SIZE box before user scaling
      const base = Math.max(TEX_SIZE / src.width, TEX_SIZE / src.height);
      const w = src.width * base, h = src.height * base;
      ctx.drawImage(src, -w / 2, -h / 2, w, h);
    } else if (side.mode === "text") {
      const txt = side.text || "…";
      ctx.font = `700 ${side.textSize}px ${FONT_STACKS[side.font]}`;
      ctx.fillStyle = side.textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(255,245,235,0.7)";
      ctx.shadowBlur = 4;
      const lines = wrapText(ctx, txt, TEX_SIZE * 0.62);
      const lineH = side.textSize * 1.18;
      const y0 = -((lines.length - 1) * lineH) / 2;
      lines.forEach((ln, i) => ctx.fillText(ln, 0, y0 + i * lineH));
    }
    ctx.restore();
  }

  ctx.restore();
  texture.needsUpdate = true;
}

function drawBothSides() {
  drawSide("A");
  drawSide("B");
}

/**
 * Keep one half's lining plate in step with its content: a side holding a photo
 * shows the locket finish colour inside, text/empty sides keep the cream lining.
 */
function refreshLiningColor(sideKey) {
  const mat = sideKey === "A" ? liningMaterialA : liningMaterialB;
  const useFinish = state.sides[sideKey].mode === "photo";
  mat.color.setHex(useFinish ? FINISHES[state.finish].color : DEFAULT_LINING_COLOR);
}

function refreshBothLinings() {
  refreshLiningColor("A");
  refreshLiningColor("B");
}

/* ==========================================================================
   Animated GIF content (decoded with the vendored omggif library)
   ========================================================================== */

/**
 * Decode an animated GIF into full-size canvases plus per-frame delays (ms).
 * Frames composite onto one persistent RGBA buffer — that is how GIF disposal
 * codes are meant to work — and are scaled down when the gif is bigger than
 * MAX_TEX_SIZE so a huge gif can't blow up memory.
 */
function decodeGif(arrayBuffer) {
  const reader = new omggif.GifReader(new Uint8Array(arrayBuffer));
  const w = reader.width, h = reader.height;
  if (!w || !h) throw new Error("gif has no frames");

  const outScale = Math.min(1, MAX_TEX_SIZE / Math.max(w, h));
  const ow = Math.max(1, Math.round(w * outScale));
  const oh = Math.max(1, Math.round(h * outScale));

  const total = reader.numFrames();
  const step = Math.max(1, Math.ceil(total / GIF_MAX_FRAMES));

  const buf = new Uint8Array(w * h * 4);
  const full = document.createElement("canvas");
  full.width = w; full.height = h;
  const fullCtx = full.getContext("2d");

  const frames = [];
  const delays = [];
  let last = null;

  for (let i = 0; i < total; i += step) {
    // Disposal 2 = "restore to background": wipe the previous frame's rect
    // before painting the next one on top.
    if (last && last.disposal === 2) {
      for (let row = last.y; row < last.y + last.height; row++) {
        buf.fill(0, (row * w + last.x) * 4, (row * w + last.x + last.width) * 4);
      }
    }
    reader.decodeAndBlitFrameRGBA(i, buf);
    last = reader.frameInfo(i);

    fullCtx.putImageData(new ImageData(new Uint8ClampedArray(buf), w, h), 0, 0);
    const frame = document.createElement("canvas");
    frame.width = ow; frame.height = oh;
    frame.getContext("2d").drawImage(full, 0, 0, ow, oh);
    frames.push(frame);

    // GCE delays are hundredths of a second. Browsers treat ~0 delays as
    // ~100ms, so clamp tiny values instead of rendering them at 60fps.
    delays.push(Math.max(20, (last.delay > 1 ? last.delay : 10) * 10));
  }

  return { frames, delays, duration: delays.reduce((a, b) => a + b, 0) };
}

/** Which decoded gif frame belongs at `timeSec` (loops over the gif duration). */
function gifFrameIndex(gif, timeSec) {
  if (!gif || gif.frames.length < 2) return 0;
  // small epsilon keeps boundaries like 900ms from landing on the previous
  // frame because of float error (0.15 * 6 * 1000 === 899.9999999999999)
  let ms = (timeSec * 1000 + 1e-6) % gif.duration;
  if (ms < 0) ms += gif.duration;
  let acc = 0;
  for (let i = 0; i < gif.delays.length; i++) {
    acc += gif.delays[i];
    if (ms < acc) return i;
  }
  return gif.frames.length - 1;
}

/**
 * Advance each photo side made of an animated gif to the frame that belongs at
 * locket time `timeSec`. Called from applyTime(), so the live preview and the
 * frame-by-frame export stay in sync for free — and repaints only when the
 * frame index actually changes.
 */
function updateGifFrames(timeSec) {
  for (const key of ["A", "B"]) {
    const side = state.sides[key];
    if (!side.gif || side.mode !== "photo") continue;
    const idx = gifFrameIndex(side.gif, timeSec);
    if (idx !== side._gifFrame) {
      side._gifFrame = idx;
      drawSide(key, timeSec);
    }
  }
}

/* ==========================================================================
   Sparkle dust (background ambience)
   ========================================================================== */

const SPARKLE_COUNT = 90;
const sparkleGeo = new THREE.BufferGeometry();
{
  const positions = new Float32Array(SPARKLE_COUNT * 3);
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const r = 2.2 + Math.random() * 2.6;
    const a = Math.random() * Math.PI * 2;
    positions[i * 3 + 0] = Math.cos(a) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
    positions[i * 3 + 2] = Math.sin(a) * r - 0.8;
  }
  sparkleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
}
// Soft round sprite so sparkles render as glowy dots rather than hard squares
function makeSparkleTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,244,214,0.75)");
  g.addColorStop(1.0, "rgba(255,230,180,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

const sparkleMat = new THREE.PointsMaterial({
  color: 0xffd98a,
  size: 0.16,            // big enough to read while the dust drifts past
  map: makeSparkleTexture(),
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
scene.add(sparkles);

/* ==========================================================================
   Animation timeline — deterministic applyTime(t) drives everything
   Phases: closed hold (0-0.10) -> open (0.10-0.38) -> showcase (0.38-0.66)
           -> close (0.66-0.92) -> settle (0.92-1)
   ========================================================================== */

const smoothstep = (a, b, x) => {
  const f = clamp((x - a) / (b - a), 0, 1);
  return f * f * (3 - 2 * f);
};

/** Eased open amount 0..1 from normalized time. */
function openAmount(t) {
  const opening = smoothstep(0.10, 0.38, t);
  const closing = smoothstep(0.66, 0.92, t);
  return clamp(opening - closing, 0, 1);
}

function applyTime(t) {
  const open = openAmount(t);

  // Lid hinges on the right edge and swings open toward +X
  lid.swing.rotation.y = open * MAX_OPEN_ANGLE;

  // Recenter: open pair spans HEART_SPAN*2 wide, shift left by half a span
  locket.position.x = -open * (HEART_SPAN / 2);

  // Gentle idle life: sway when closed, breathe when open
  const swayAmp = lerp(0.16, 0.05, open);
  locket.rotation.y = Math.sin(t * Math.PI * 2) * swayAmp;
  locket.rotation.x = Math.sin(t * Math.PI * 2 + 1.3) * 0.05 * (1 - open * 0.5);
  locket.position.y = Math.sin(t * Math.PI * 4) * 0.045;

  // Sparkle drift: a FULL turn per loop so the animation loops seamlessly
  // (any fractional turn makes the last frame jump back to the first).
  if (state.sparkle) {
    sparkles.visible = true;
    sparkles.rotation.y = t * Math.PI * 2;
    sparkleMat.opacity = 0.55 + 0.35 * Math.sin(t * Math.PI * 6);
  } else {
    sparkles.visible = false;
  }

  // Animated gif photos advance on this same clock (and only repaint when the
  // frame index actually changes), so the preview and a frame-by-frame export
  // show exactly the same animation.
  updateGifFrames(t * durationSeconds());
}

/* ==========================================================================
   Render loop & canvas sizing
   ========================================================================== */

function durationSeconds() {
  return BASE_DURATION / state.speed;
}

function resizeRenderer() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resizeRenderer);

let lastNow = performance.now();

function frame(now) {
  const dt = Math.min(0.1, (now - lastNow) / 1000);
  lastNow = now;

  // During export the exporter drives rendering itself (GIF captures
  // synchronously; video has its own rAF tick) — don't double-render.
  if (!state.exporting) {
    if (state.playing) {
      state.t = (state.t + dt / durationSeconds()) % 1;
      syncScrubUI();
    }
    applyTime(state.t);
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

/* ==========================================================================
   Selection & drag-to-move (raycast onto photo planes)
   ========================================================================== */

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let dragging = null;      // "A" | "B" | null
let dragGrabOffset = null; // relative grab: delta between hit point & content offset

function setPointerNDC(event) {
  const rect = canvas.getBoundingClientRect();
  pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

/** Which locket side the pointer is over (photo plane or shell cap). */
function pickSide(event) {
  setPointerNDC(event);
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(
    [planeA, planeB, backShell.children[0], lid.swing.children[0]], false
  );
  if (!hits.length) return null;
  const obj = hits[0].object;
  if (obj === planeA || obj === backShell.children[0]) return "A";
  return "B";
}

/** Convert a raycast hit on a photo plane into texture-pixel coords. */
function hitToTextureOffset(which, event) {
  setPointerNDC(event);
  raycaster.setFromCamera(pointerNDC, camera);
  const plane = which === "A" ? planeA : planeB;
  const hits = raycaster.intersectObject(plane, false);
  if (!hits.length) return null;

  const local = plane.worldToLocal(hits[0].point.clone());
  const w = plane.geometry.parameters.width;
  const h = plane.geometry.parameters.height;
  // worldToLocal accounts for planeB's π rotation, so local x maps straight
  // to texture u. Canvas y is down, plane y is up => negate.
  const u = local.x / (w / 2);   // -1..1 across plane width (texture space)
  const v = local.y / (h / 2);
  return {
    offsetX: u * (TEX_SIZE / 2),
    offsetY: -v * (TEX_SIZE / 2),
  };
}

canvas.addEventListener("pointerdown", (event) => {
  if (state.exporting || event.button !== 0) return;
  const side = pickSide(event);
  if (!side) return;
  selectSide(side);

  // Only drag when grabbing the photo plane itself (not the bare shell)
  setPointerNDC(event);
  raycaster.setFromCamera(pointerNDC, camera);
  const plane = side === "A" ? planeA : planeB;
  const planeHit = raycaster.intersectObject(plane, false)[0];
  if (planeHit) {
    const cur = state.sides[side];
    const off = hitToTextureOffset(side, event);
    // relative grab: remember where inside the content the pointer landed
    dragGrabOffset = {
      x: off.offsetX - cur.offsetX,
      y: off.offsetY - cur.offsetY,
    };
    dragging = side;
    controls.enabled = false; // don't orbit while moving a photo
    canvas.setPointerCapture(event.pointerId);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const off = hitToTextureOffset(dragging, event);
  if (off && dragGrabOffset) {
    const side = state.sides[dragging];
    side.offsetX = clamp(off.offsetX - dragGrabOffset.x, -TEX_SIZE, TEX_SIZE);
    side.offsetY = clamp(off.offsetY - dragGrabOffset.y, -TEX_SIZE, TEX_SIZE);
    drawSide(dragging);
  }
});

function stopDrag(event) {
  if (!dragging) return;
  dragging = null;
  dragGrabOffset = null;
  controls.enabled = true;
  try { canvas.releasePointerCapture(event.pointerId); } catch (_) { /* noop */ }
}

canvas.addEventListener("pointerup", stopDrag);
canvas.addEventListener("pointercancel", stopDrag);

// Arrow-key nudging for the selected side
canvas.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 40 : 4;
  const side = state.sides[state.selected];
  let moved = true;
  switch (event.key) {
    case "ArrowLeft": side.offsetX -= step; break;
    case "ArrowRight": side.offsetX += step; break;
    case "ArrowUp": side.offsetY -= step; break;
    case "ArrowDown": side.offsetY += step; break;
    default: moved = false;
  }
  if (moved) {
    event.preventDefault();
    drawSide(state.selected);
  }
});

/* ==========================================================================
   UI wiring
   ========================================================================== */

const $play = $("#play");
const $scrub = $("#scrub");
const $timeIndicator = $("#timeIndicator");
const $durationLabel = $("#durationLabel");
const $sideChipName = $("#sideChipName");
const $adjustTarget = document.querySelector(".adjust-target");
const $scale = $("#scale");
const $rotate = $("#rotate");

function syncScrubUI() {
  $scrub.value = String(Math.round(state.t * 1000));
  $timeIndicator.textContent = `${(state.t * durationSeconds()).toFixed(1)}s`;
  $durationLabel.textContent = `${durationSeconds().toFixed(1)}s`;
}

/** Push the selected side's state into the adjust sliders & chips. */
function refreshAdjustUI() {
  const side = state.sides[state.selected];
  const label = state.selected === "A" ? "left photo" : "right photo";
  $sideChipName.textContent = label;
  if ($adjustTarget) $adjustTarget.textContent = `(${label})`;
  $("#selectA").classList.toggle("active", state.selected === "A");
  $("#selectB").classList.toggle("active", state.selected === "B");
  $scale.value = String(side.scale);
  $rotate.value = String(side.rotation);
}

function selectSide(which) {
  state.selected = which;
  refreshAdjustUI();
}

/* --------------------------------------------------------------------------
   Playback controls
   -------------------------------------------------------------------------- */

$play.addEventListener("click", () => {
  state.playing = !state.playing;
  $play.classList.toggle("paused", !state.playing);
});

$("#prev").addEventListener("click", () => {
  state.playing = false;
  $play.classList.add("paused");
  state.t = (state.t - 0.02 + 1) % 1;
  syncScrubUI();
});

$("#next").addEventListener("click", () => {
  state.playing = false;
  $play.classList.add("paused");
  state.t = (state.t + 0.02) % 1;
  syncScrubUI();
});

$scrub.addEventListener("input", () => {
  state.t = Number($scrub.value) / 1000;
  $timeIndicator.textContent = `${(state.t * durationSeconds()).toFixed(1)}s`;
});

/* --------------------------------------------------------------------------
   Side selection buttons
   -------------------------------------------------------------------------- */

$("#selectA").addEventListener("click", () => selectSide("A"));
$("#selectB").addEventListener("click", () => selectSide("B"));

/* --------------------------------------------------------------------------
   Mode radios (per side)
   -------------------------------------------------------------------------- */

function wireMode(sideKey) {
  document.querySelectorAll(`input[name="mode${sideKey}"]`).forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      state.sides[sideKey].mode = radio.value;
      $(`#photoPanel${sideKey}`).hidden = radio.value !== "photo";
      $(`#textPanel${sideKey}`).hidden = radio.value !== "text";
      refreshLiningColor(sideKey);
      selectSide(sideKey);
      drawSide(sideKey);
    });
  });
}
wireMode("A");
wireMode("B");

/* --------------------------------------------------------------------------
   Photo intake (per side): the dropzone accepts click-to-browse, drag & drop
   of files, pasted clipboard images and pasted/dropped image URLs. All paths
   funnel into usePhotoBlob(), so animated gifs keep working everywhere.
   -------------------------------------------------------------------------- */

/** DataTransfer carries real files (not just text/URL drags)? */
function hasFiles(dt) {
  if (!dt || !dt.types) return false;
  return Array.prototype.indexOf.call(dt.types, "Files") !== -1;
}

/** Switch a side to photo mode with the given payload and repaint. */
function commitPhoto(sideKey, { img = null, gif = null, label }) {
  const side = state.sides[sideKey];
  side.img = img;
  side.gif = gif;
  side._gifFrame = -1;
  const photoRadio = document.querySelector(`input[name="mode${sideKey}"][value="photo"]`);
  photoRadio.checked = true;
  side.mode = "photo";
  $(`#photoPanel${sideKey}`).hidden = false;
  $(`#textPanel${sideKey}`).hidden = true;
  $(`#fileName${sideKey}`).textContent =
    gif ? `${label} · ${gif.frames.length} frames` : label;
  refreshLiningColor(sideKey);
  selectSide(sideKey);
  drawSide(sideKey);
}

/** Show a status/error message in the side's file-name slot. */
function photoStatus(sideKey, message) {
  $(`#fileName${sideKey}`).textContent = message;
}

/**
 * Load a Blob/File into a side. Animated gifs are decoded frame by frame
 * (omggif) so they can play back inside the locket; anything else stays a
 * plain static image. Shared by picked files, dropped files and fetched URLs.
 */
function usePhotoBlob(sideKey, blob, label) {
  const url = URL.createObjectURL(blob);

  const loadStatic = () => {
    const img = new Image();
    img.onload = () => {
      commitPhoto(sideKey, { img, label });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      photoStatus(sideKey, "could not load that image :(");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const isGif = blob.type === "image/gif" || /\.gif$/i.test(label);
  if (isGif && typeof omggif !== "undefined" && typeof blob.arrayBuffer === "function") {
    blob.arrayBuffer().then((buffer) => {
      try {
        commitPhoto(sideKey, { gif: decodeGif(buffer), label });
      } catch (err) {
        console.warn("gif decode failed — falling back to the first frame", err);
        loadStatic();
        return;
      }
      URL.revokeObjectURL(url);
    }, loadStatic);
  } else {
    loadStatic();
  }
}

/** Accept a File from the picker or a drop. */
function usePhotoFile(sideKey, file) {
  if (!file) return;
  usePhotoBlob(sideKey, file, file.name || "image");
}

/**
 * Accept an image URL (pasted or dropped). Fetched to a blob so the texture
 * canvas stays untainted — WebGL rejects cross-origin images — and so .gif
 * URLs still animate. If the fetch is blocked, retry as a CORS-attributed
 * <img> before giving up.
 */
function usePhotoUrl(sideKey, rawUrl) {
  const url = rawUrl.trim();
  if (!url) return;
  let label = "linked image";
  try {
    const u = new URL(url);
    label = decodeURIComponent(u.pathname.split("/").pop() || u.hostname) || u.hostname;
  } catch (err) { /* keep the generic label (e.g. odd data: URLs) */ }
  photoStatus(sideKey, "loading image…");

  const viaImg = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => commitPhoto(sideKey, { img, label });
    img.onerror = () =>
      photoStatus(sideKey, "could not load that URL (host may block cross-origin images) :(");
    img.src = url;
  };

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .then((blob) => usePhotoBlob(sideKey, blob, label))
    .catch(viaImg);
}

function wireUpload(sideKey) {
  const fileInput = $(`#file${sideKey}`);
  const zone = $(`#drop${sideKey}`);

  // Click or keyboard (Enter/Space) → native file picker
  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) usePhotoFile(sideKey, file);
    fileInput.value = ""; // allow re-picking the same file
  });

  // Drag & drop. A depth counter survives the dragenter/dragleave pairs
  // fired while the pointer crosses the zone's inner elements.
  let dragDepth = 0;
  zone.addEventListener("dragenter", (e) => {
    if (!hasFiles(e.dataTransfer)) return;
    e.preventDefault();
    dragDepth++;
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragover", (e) => {
    if (!hasFiles(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });
  zone.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) zone.classList.remove("dragover");
  });
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDepth = 0;
    zone.classList.remove("dragover");
    const dt = e.dataTransfer;
    const file = dt.files && dt.files[0];
    if (file) {
      usePhotoFile(sideKey, file);
      return;
    }
    // Dragged a link / image URL over from another tab
    const text = (dt.getData("text/uri-list") || dt.getData("text/plain") || "").trim();
    if (/^(https?:\/\/|data:image\/)/i.test(text)) usePhotoUrl(sideKey, text);
  });
}
wireUpload("A");
wireUpload("B");

// Paste anywhere outside a text field (typing keeps the browser's normal text
// paste): a clipboard image — or an image URL — lands on the selected side.
document.addEventListener("paste", (e) => {
  const target = e.target;
  if (target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
    return;
  }
  const dt = e.clipboardData;
  if (!dt) return;

  const imageFile = (dt.files ? Array.from(dt.files) : [])
    .find((f) => f.type && f.type.indexOf("image/") === 0);
  if (imageFile) {
    e.preventDefault();
    usePhotoFile(state.selected, imageFile);
    return;
  }
  const text = (dt.getData("text/plain") || "").trim();
  if (/^(https?:\/\/\S+|data:image\/)/i.test(text)) {
    e.preventDefault();
    usePhotoUrl(state.selected, text);
  }
});

// Dropping a file anywhere else would make the browser navigate to it and
// lose the whole session — swallow those drops outside our zones.
["dragover", "drop"].forEach((type) => {
  window.addEventListener(type, (e) => {
    if (hasFiles(e.dataTransfer)) e.preventDefault();
  });
});

/* --------------------------------------------------------------------------
   Text controls (per side)
   -------------------------------------------------------------------------- */

function wireText(sideKey) {
  const side = state.sides[sideKey];
  const input = $(`#textInput${sideKey}`);
  side.text = input.value; // seed from HTML default
  input.addEventListener("input", (e) => {
    side.text = e.target.value;
    drawSide(sideKey);
  });

  $(`#font${sideKey}`).addEventListener("change", (e) => {
    side.font = e.target.value;
    drawSide(sideKey);
  });
  $(`#textColor${sideKey}`).addEventListener("input", (e) => {
    side.textColor = e.target.value;
    drawSide(sideKey);
  });
  $(`#textSize${sideKey}`).addEventListener("input", (e) => {
    side.textSize = Number(e.target.value);
    drawSide(sideKey);
  });
}
wireText("A");
wireText("B");

/* --------------------------------------------------------------------------
   Adjust controls (selected side)
   -------------------------------------------------------------------------- */

$scale.addEventListener("input", () => {
  const side = state.sides[state.selected];
  side.scale = Number($scale.value);
  drawSide(state.selected);
});

$rotate.addEventListener("input", () => {
  const side = state.sides[state.selected];
  side.rotation = Number($rotate.value);
  drawSide(state.selected);
});

$("#flipH").addEventListener("click", () => {
  const side = state.sides[state.selected];
  side.flipH = !side.flipH;
  drawSide(state.selected);
});

$("#flipV").addEventListener("click", () => {
  const side = state.sides[state.selected];
  side.flipV = !side.flipV;
  drawSide(state.selected);
});

$("#resetAdj").addEventListener("click", () => {
  const side = state.sides[state.selected];
  side.offsetX = 0;
  side.offsetY = 0;
  side.scale = 95;
  side.rotation = 0;
  side.flipH = false;
  side.flipV = false;
  refreshAdjustUI();
  drawSide(state.selected);
});

/* --------------------------------------------------------------------------
   Locket style controls
   -------------------------------------------------------------------------- */

function applyFinish(key) {
  const m = FINISHES[key];
  if (!m) return;
  state.finish = key;
  shellMaterial.color.setHex(m.color);
  shellMaterial.metalness = m.metalness;
  shellMaterial.roughness = m.roughness;
  shellMaterial.envMapIntensity = m.envIntensity;
  shellMaterial.needsUpdate = true;

  // Photo sides show the finish colour inside the heart, so both the lining
  // plates and the painted recess bases have to follow the new finish.
  refreshBothLinings();
  for (const sideKey of ["A", "B"]) {
    if (state.sides[sideKey].mode === "photo") drawSide(sideKey);
  }
}

/**
 * Backdrop: either the scene's solid background colour, or nothing at all when
 * the transparent toggle is on — the renderer then clears with alpha 0 and the
 * canvas gets a checkerboard so "nothing" is visible in the preview. The GIF
 * export keeps that alpha (see captureFrame/exportGif).
 */
function applyBackdrop() {
  scene.background = state.transparentBg ? null : new THREE.Color(state.bgColor);
  renderer.setClearAlpha(state.transparentBg ? 0 : 1);
  canvas.classList.toggle("checker", state.transparentBg);
}

$("#metal").addEventListener("change", (e) => applyFinish(e.target.value));

$("#bgcolor").addEventListener("input", (e) => {
  state.bgColor = e.target.value;
  applyBackdrop();
});

$("#transparentBg").addEventListener("change", (e) => {
  state.transparentBg = e.target.checked;
  applyBackdrop();
});

$("#sparkle").addEventListener("change", (e) => {
  state.sparkle = e.target.checked;
});

/* --------------------------------------------------------------------------
   Time & speed. One locket loop lasts `durationSeconds()` = BASE_DURATION /
   speed. The "time" slider edits that length directly (0.6s .. 12s); the
   "speed" number box is the very same setting expressed as a multiplier, kept
   in sync in both directions.
   -------------------------------------------------------------------------- */

const $timeSlider = $("#timeSlider");
const $speedInput = $("#speedInput");
const $durationPill = $("#durationPill");

const SPEED_MIN = 0.5;  // 12s loop at BASE_DURATION = 6
const SPEED_MAX = 10;   // 0.6s loop at BASE_DURATION = 6

function syncSpeedUI() {
  $timeSlider.value = String(clamp(durationSeconds(), 0.6, 12));
  $speedInput.value = String(Number(state.speed.toFixed(2)));
  if ($durationPill) $durationPill.textContent = `${durationSeconds().toFixed(1)}s`;
}

function setSpeed(speed) {
  state.speed = clamp(Number(speed) || 1, SPEED_MIN, SPEED_MAX);
  syncSpeedUI();
  syncScrubUI();
}

$timeSlider.addEventListener("input", () => setSpeed(BASE_DURATION / Number($timeSlider.value)));
$speedInput.addEventListener("change", () => setSpeed($speedInput.value));

/* ==========================================================================
   Export — GIF (gifenc, gif.js fallback) & video (MediaRecorder)
   ========================================================================== */

const $exportStatus = $("#exportStatus");
const $progressFill = $("#progressFill");
const $progressText = $("#progressText");

function setExportStatus(visible, pct, label) {
  $exportStatus.hidden = !visible;
  if (pct !== undefined) $progressFill.style.width = `${Math.round(pct * 100)}%`;
  if (label !== undefined) $progressText.textContent = label;
}

function parseExportSize() {
  const [w, h] = $("#expsize").value.split("x").map(Number);
  return { w, h };
}

/* The "compress" toggle picks the GIF encoder: on = gifenc with one shared
   global palette (tiny files, but smooth gradients can shimmer), off = the
   classic gif.js pipeline, which quantizes every frame fresh (smooth, bigger).
   The "colors" control only means anything while compression is on. */
const $expCompress = $("#expcompress");
const $expColors = $("#expcolors");

function syncExportOptionsUI() {
  $expColors.disabled = !$expCompress.checked;
}
$expCompress.addEventListener("change", syncExportOptionsUI);
syncExportOptionsUI();

/**
 * Render one frame at time t into a 2D capture canvas at (w, h).
 * Temporarily resizes the renderer so the export resolution is exact.
 */
function captureFrame(captureCtx, t, w, h) {
  applyTime(t);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  captureCtx.clearRect(0, 0, w, h);
  captureCtx.drawImage(renderer.domElement, 0, 0, w, h);

  // gif.js marks ONE colour as the transparent index — it ignores alpha
  // entirely — so a transparent backdrop is flattened onto a magenta key that
  // no locket colour can collide with. exportGif() hands that key to the
  // encoder, which writes it out as real GIF transparency.
  if (state.transparentBg) {
    const keyed = captureCtx.getImageData(0, 0, w, h);
    const d = keyed.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) {
        d[i] = 255; d[i + 1] = 0; d[i + 2] = 255; d[i + 3] = 255;
      }
    }
    captureCtx.putImageData(keyed, 0, 0);
  }
}

function restorePreviewSize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  resizeRenderer();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Human file size for the export "done" message. */
function fmtBytes(n) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

/* --------------------------------------------------------------------------
   GIF export — two encoders, picked by the "compress" toggle:
   · exportGifOptimized (compress on): vendored gifenc ESM, lazily imported.
     One shared global palette (size = the "colors" control) for the whole loop
     — the same size levers gifsicle pulls, in pure JS. A single palette makes
     smooth gradients shimmer as the locket moves, hence the toggle.
   · exportGifClassic (compress off, or gifenc unavailable): the original
     gif.js web-worker pipeline with a fresh per-frame palette — the smooth
     look, larger files. Ignores "colors".
   -------------------------------------------------------------------------- */

async function exportGif() {
  if (state.exporting) return;
  state.exporting = true; // claim synchronously so double-clicks can't race the await

  // "compress" off → straight to the classic gif.js pipeline, whose fresh
  // per-frame palette is the smooth look (no shared-palette shimmer).
  // On → lazy-load the optimized encoder; fall back if it can't load.
  let gifenc = null;
  if ($expCompress.checked) {
    try {
      gifenc = await import("./vendor/gifenc.esm.js");
    } catch (err) {
      console.warn("gifenc unavailable — falling back to gif.js", err);
    }
  }
  if (!gifenc && typeof GIF === "undefined") {
    alert("GIF library not loaded yet — check your connection and reload.");
    state.exporting = false;
    return;
  }

  const wasPlaying = state.playing;
  state.playing = false;
  $play.classList.add("paused");

  const { w, h } = parseExportSize();
  const fps = Number($("#expfps").value);
  const frameCount = Math.max(8, Math.round(durationSeconds() * fps));
  const frameDelay = Math.round(1000 / fps);

  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = w;
  captureCanvas.height = h;
  const captureCtx = captureCanvas.getContext("2d");

  /** Shared finish line: download, report the size, restore preview state. */
  const done = (blob, suffix) => {
    restorePreviewSize();
    downloadBlob(blob, `heart-locket-${w}x${h}${suffix}.gif`);
    setExportStatus(true, 1, `done! ${fmtBytes(blob.size)} ♥ (status hides in 3s)`);
    setTimeout(() => setExportStatus(false), 3000);
    state.exporting = false;
    state.playing = wasPlaying;
    $play.classList.toggle("paused", !state.playing);
  };

  if (gifenc) {
    const colors = clamp(Number($("#expcolors").value) || 256, 2, 256);
    exportGifOptimized(gifenc, { colors, w, h, frameCount, frameDelay, captureCtx, done });
  } else {
    exportGifClassic({ w, h, frameCount, frameDelay, captureCtx, done });
  }
}

/** Original gif.js pipeline (kept as fallback). */
function exportGifClassic({ w, h, frameCount, frameDelay, captureCtx, done }) {
  const gif = new GIF({
    workers: 2,
    workerScript: "./vendor/gif.worker.js",
    width: w,
    height: h,
    quality: 10,
    dither: false,
    // gif.js matches a single colour to the transparent index (it ignores the
    // alpha channel), and captureFrame() has already flattened alpha onto this
    // magenta key — so this is what makes the export genuinely transparent.
    transparent: state.transparentBg ? 0xff00ff : null,
  });

  setExportStatus(true, 0, `rendering ${frameCount} frames… 0%`);

  // Render frames in small async batches so the UI can breathe
  let i = 0;
  const batch = () => {
    const batchEnd = Math.min(i + 6, frameCount);
    for (; i < batchEnd; i++) {
      const t = i / frameCount;
      captureFrame(captureCtx, t, w, h);
      gif.addFrame(captureCtx, { copy: true, delay: frameDelay });
    }
    setExportStatus(true, (i / frameCount) * 0.5, `rendering frames… ${Math.round((i / frameCount) * 100)}%`);
    if (i < frameCount) {
      setTimeout(batch, 0);
    } else {
      gif.on("start", () => setExportStatus(true, 0.5, "encoding gif… 0%"));
      gif.on("progress", (p) =>
        setExportStatus(true, 0.5 + p * 0.5, `encoding gif… ${Math.round(p * 100)}%`)
      );
      gif.on("finished", (blob) => done(blob, ""));
      gif.render();
    }
  };
  setTimeout(batch, 30);
}

/**
 * Optimized GIF export via gifenc (ESM module, lazily imported by exportGif).
 *
 * Size strategy — the levers gifsicle would pull, in pure JS:
 *  · ONE global palette for the whole loop (the first frame carries it; later
 *    frames omit their local colour table) — quantized once from 8 evenly
 *    spaced sample frames, so colours stay consistent across the animation
 *    and no palette is repeated per frame.
 *  · Palette size = the "colors" control (256…32). The locket is flat art, so
 *    64 colours is usually indistinguishable while files shrink hard.
 *
 * Transparency reuses the magenta key that captureFrame() flattens alpha
 * onto: find that colour's palette index and mark it transparent on every
 * frame (GIF stores the flag per frame, not globally).
 */
function exportGifOptimized(gifenc, opts) {
  const { colors, w, h, frameCount, frameDelay, captureCtx, done } = opts;
  const { GIFEncoder, quantize, applyPalette } = gifenc;

  // Pass 1 — sample evenly spaced frames to quantize one shared palette from.
  const sampleCount = Math.min(8, frameCount);
  const bytesPerFrame = w * h * 4;
  const samples = new Uint8Array(bytesPerFrame * sampleCount);
  let s = 0;
  const sampleStep = () => {
    const batchEnd = Math.min(s + 2, sampleCount);
    for (; s < batchEnd; s++) {
      const t = Math.floor((s * frameCount) / sampleCount) / frameCount;
      captureFrame(captureCtx, t, w, h);
      samples.set(captureCtx.getImageData(0, 0, w, h).data, s * bytesPerFrame);
    }
    setExportStatus(true, (s / sampleCount) * 0.1, `sampling colours… ${s}/${sampleCount}`);
    if (s < sampleCount) {
      setTimeout(sampleStep, 0);
    } else {
      setTimeout(buildPalette, 0); // let the status paint before the heavy quantize
    }
  };

  // Pass 2 — quantize once, then capture + index + write every frame.
  const buildPalette = () => {
    setExportStatus(true, 0.1, "building palette…");
    setTimeout(() => {
      const palette = quantize(samples, colors);
      const keyIndex =
        state.transparentBg ? findColorIndex(palette, 255, 0, 255) : -1;
      encodeFrames(palette, keyIndex);
    }, 20);
  };

  const encodeFrames = (palette, keyIndex) => {
    const gif = GIFEncoder();
    let i = 0;
    const batch = () => {
      const batchEnd = Math.min(i + 4, frameCount);
      for (; i < batchEnd; i++) {
        captureFrame(captureCtx, i / frameCount, w, h);
        const index = applyPalette(captureCtx.getImageData(0, 0, w, h).data, palette);
        const frameOpts = {
          delay: frameDelay,
          // GIF stores transparency per frame, so every frame gets the key
          // index; the palette + loop count ride on the first frame only.
          transparent: keyIndex >= 0,
          transparentIndex: keyIndex >= 0 ? keyIndex : 0,
        };
        if (i === 0) {
          frameOpts.palette = palette; // becomes the GLOBAL colour table
          frameOpts.repeat = 0;        // loop forever (matches gif.js default)
        }
        gif.writeFrame(index, w, h, frameOpts);
      }
      setExportStatus(true, 0.1 + (i / frameCount) * 0.9,
        `encoding optimized gif… ${Math.round((i / frameCount) * 100)}%`);
      if (i < frameCount) {
        setTimeout(batch, 0);
      } else {
        gif.finish();
        done(new Blob([gif.bytes()], { type: "image/gif" }), colors < 256 ? `-${colors}c` : "");
      }
    };
    setTimeout(batch, 0);
  };

  setTimeout(sampleStep, 30);
}

/** Palette index of the colour nearest (r, g, b); exact matches win. */
function findColorIndex(palette, r, g, b) {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const c = palette[i];
    const dr = c[0] - r;
    const dg = c[1] - g;
    const db = c[2] - b;
    const d = dr * dr + dg * dg + db * db;
    if (d === 0) return i;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/* --------------------------------------------------------------------------
   Video export (MediaRecorder; mp4 where supported, else webm)
   -------------------------------------------------------------------------- */

function pickVideoMime() {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
}

function exportVideo() {
  if (state.exporting) return;
  const mime = pickVideoMime();
  if (!mime) {
    alert("MediaRecorder is not supported in this browser — use the GIF export instead!");
    return;
  }

  state.exporting = true;
  const wasPlaying = state.playing;
  state.playing = false;
  $play.classList.add("paused");

  // Video formats can't store an alpha channel, so record with the backdrop
  // colour back on — otherwise the "hidden" background records as flat black.
  const wasTransparent = state.transparentBg;
  if (wasTransparent) {
    state.transparentBg = false;
    applyBackdrop();
  }

  const { w, h } = parseExportSize();
  const durMs = durationSeconds() * 1000;

  // Resize GL canvas to export resolution for the recording pass.
  // pixelRatio 1 so the captured bitmap matches the chosen size exactly.
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  const overlay = $("#recordingOverlay");
  overlay.hidden = false;

  const stream = canvas.captureStream(30); // auto-capture at 30fps (broad support)
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 6_000_000,
  });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

  const start = performance.now();
  const t0 = state.t; // resume from same spot after

  recorder.onstop = () => {
    overlay.hidden = true;
    restorePreviewSize();
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(chunks, { type: mime });
    downloadBlob(blob, `heart-locket-${w}x${h}.${ext}`);
    setExportStatus(true, 1, `saved .${ext}! ♥`);
    setTimeout(() => setExportStatus(false), 2000);
    state.exporting = false;
    state.t = t0;
    state.playing = wasPlaying;
    $play.classList.toggle("paused", !state.playing);
    if (wasTransparent) {
      state.transparentBg = true;
      applyBackdrop();
    }
  };

  recorder.start();

  const tick = (now) => {
    const elapsed = now - start;
    const t = (t0 + elapsed / 1000 / durationSeconds()) % 1;
    applyTime(t);
    renderer.render(scene, camera);
    setExportStatus(true, Math.min(1, elapsed / durMs), `recording… ${Math.min(100, Math.round((elapsed / durMs) * 100))}%`);
    if (elapsed < durMs) {
      requestAnimationFrame(tick);
    } else {
      recorder.stop();
    }
  };
  requestAnimationFrame(tick);
}

$("#exportGif").addEventListener("click", exportGif);
$("#exportVideo").addEventListener("click", exportVideo);

/* ==========================================================================
   Init
   ========================================================================== */

function init() {
  // Optional deep-link params: ?t=0.5 pins a pose (0..1), ?autoplay=0 starts paused,
  // ?finish=gold picks a locket finish
  const params = new URLSearchParams(location.search);
  const tParam = parseFloat(params.get("t"));
  if (!Number.isNaN(tParam)) state.t = clamp(tParam, 0, 0.999);
  if (params.get("autoplay") === "0") {
    state.playing = false;
    $play.classList.add("paused");
  }
  const finishParam = params.get("finish");
  if (finishParam && FINISHES[finishParam]) {
    $("#metal").value = finishParam;
    applyFinish(finishParam);
  }
  const camParam = params.get("cam");
  if (camParam) {
    const parts = camParam.split(",").map(Number);
    if (parts.length === 3 && parts.every((v) => !Number.isNaN(v))) {
      camera.position.set(parts[0], parts[1], parts[2]);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }
  const speedParam = parseFloat(params.get("speed"));
  if (!Number.isNaN(speedParam)) state.speed = clamp(speedParam, SPEED_MIN, SPEED_MAX);
  if (params.get("transparent") === "1") {
    state.transparentBg = true;
    $("#transparentBg").checked = true;
  }

  // Default both sides to text mode so the tool shows something immediately
  for (const key of ["A", "B"]) {
    const textRadio = document.querySelector(`input[name="mode${key}"][value="text"]`);
    if (textRadio) textRadio.checked = true;
    state.sides[key].mode = "text";
    $(`#photoPanel${key}`).hidden = true;
    $(`#textPanel${key}`).hidden = false;
  }

  drawBothSides();
  refreshBothLinings();
  refreshAdjustUI();
  syncScrubUI();
  syncSpeedUI();
  applyBackdrop();
  resizeRenderer();
  applyTime(state.t);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);

  // Repaint once webfonts finish loading so text uses the real faces
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => drawBothSides());
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}








