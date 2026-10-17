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
const SHELL_FRONT = SHELL_DEPTH + BEVEL_T;         // front face of a shell (0.18)
const FLOOR_OFF = 0.006;                           // lining sits above the face
const CONTENT_OFF = 0.012;                         // photo plane sits above the face
const BACK_RIM_TOP = SHELL_FRONT + RIM_HEIGHT + 2 * RIM_BEVEL; // 0.251
const LID_RIM_EXTENT = RIM_HEIGHT + 2 * RIM_BEVEL;             // 0.071
const HINGE_Z = BACK_RIM_TOP + LID_RIM_EXTENT;                 // 0.322 when closed

// Locket finishes. "pink" is the default matte enamel; the rest are metals.
const FINISHES = Object.freeze({
  pink:     { color: 0xe0709c, metalness: 0.12, roughness: 0.70, envIntensity: 0.45 },
  gold:     { color: 0xffd76a, metalness: 1.0,  roughness: 0.30, envIntensity: 1.15 },
  rosegold: { color: 0xffb48a, metalness: 1.0,  roughness: 0.32, envIntensity: 1.10 },
  silver:   { color: 0xe8eef2, metalness: 1.0,  roughness: 0.24, envIntensity: 1.20 },
  enamel:   { color: 0xc11f3d, metalness: 0.15, roughness: 0.42, envIntensity: 0.90 },
});

const FONT_STACKS = Object.freeze({
  serif:   'Georgia, "Times New Roman", serif',
  cursive: '"Caveat", "Comic Sans MS", cursive',
  sans:    '"Inter", system-ui, sans-serif',
});

const DEFAULT_SIDE = () => ({
  mode: "text",           // "photo" | "text" | "empty"
  img: null,              // HTMLImageElement once uploaded
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
  speed: 1.0,             // playback multiplier
  finish: "pink",         // finish key from FINISHES
  bgColor: "#2a1220",
  sparkle: true,
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
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
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

scene.add(new THREE.AmbientLight(0xffffff, 0.18));

/* --------------------------------------------------------------------------
   Materials
   -------------------------------------------------------------------------- */

// Shell material, driven by the selected finish
const shellMaterial = new THREE.MeshStandardMaterial({
  color: FINISHES[state.finish].color,
  metalness: FINISHES[state.finish].metalness,
  roughness: FINISHES[state.finish].roughness,
  envMapIntensity: FINISHES[state.finish].envIntensity,
});

// Inner lining: warm satin cream so photos pop against the shell
const liningMaterial = new THREE.MeshStandardMaterial({
  color: 0xe9d3b4,
  metalness: 0.30,
  roughness: 0.62,
  envMapIntensity: 0.6,
});

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
  heartOutline(160, HEART_SPAN * 0.82).pts.forEach((p, i) => {
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
  // Rim base flush with the shell face; its bevel dips RIM_BEVEL below that
  rimGeo.translate(0, 0, SHELL_FRONT + RIM_BEVEL);

  // Satin lining the photo rests on (sits above the shell face)
  const floorGeo = new THREE.ShapeGeometry(heartShape(0.82));
  floorGeo.translate(0, 0, SHELL_FRONT + FLOOR_OFF);

  group.add(
    new THREE.Mesh(outerGeo, shellMaterial),
    new THREE.Mesh(rimGeo, shellMaterial),
    new THREE.Mesh(floorGeo, liningMaterial)
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
  // Rim base flush with the shell's -Z face, extending toward the opening
  rimGeo.translate(-OUTLINE.halfW, 0, -(RIM_HEIGHT + RIM_BEVEL));

  const floorGeo = new THREE.ShapeGeometry(heartShape(0.82));
  floorGeo.translate(-OUTLINE.halfW, 0, -FLOOR_OFF);

  swing.add(
    new THREE.Mesh(outerGeo, shellMaterial),
    new THREE.Mesh(rimGeo, shellMaterial),
    new THREE.Mesh(floorGeo, liningMaterial)
  );
  swing.children[0].name = "shellB"; // outer cap for click-selection
  return { hinge, swing };
}

const backShell = buildBackShell();
locket.add(backShell);

const lid = buildLid();
locket.add(lid.hinge);

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

const PLANE_SCALE = 0.80; // fraction of heart span for the content plane

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
    side: THREE.FrontSide,
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

/** Soft vignette + faint heart watermark used as the "empty" recess look. */
function paintRecessBase(ctx) {
  ctx.fillStyle = "#f3e2c9";
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  const g = ctx.createRadialGradient(
    TEX_SIZE / 2, TEX_SIZE / 2, TEX_SIZE * 0.18,
    TEX_SIZE / 2, TEX_SIZE / 2, TEX_SIZE * 0.62
  );
  g.addColorStop(0, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(120,80,60,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // faint watermark heart
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#6b2737";
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
 */
function drawSide(which) {
  const side = state.sides[which];
  const content = which === "A" ? contentA : contentB;
  const { ctx, texture } = content;

  ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
  ctx.save();
  ctx.clip(heartPath2D(TEX_SIZE, 6));

  paintRecessBase(ctx);

  if (side.mode !== "empty") {
    ctx.save();
    const cx = TEX_SIZE / 2 + side.offsetX;
    const cy = TEX_SIZE / 2 + side.offsetY;
    ctx.translate(cx, cy);
    ctx.rotate((side.rotation * Math.PI) / 180);
    const f = side.scale / 100;
    ctx.scale(side.flipH ? -f : f, side.flipV ? -f : f);

    if (side.mode === "photo" && side.img) {
      const img = side.img;
      // "cover"-fit the image into a TEX_SIZE box before user scaling
      const base = Math.max(TEX_SIZE / img.width, TEX_SIZE / img.height);
      const w = img.width * base, h = img.height * base;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
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
const sparkleMat = new THREE.PointsMaterial({
  color: 0xffd98a,
  size: 0.045,
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

  // Sparkle drift
  if (state.sparkle) {
    sparkles.visible = true;
    sparkles.rotation.y = t * Math.PI * 0.6;
    sparkleMat.opacity = 0.55 + 0.35 * Math.sin(t * Math.PI * 6);
  } else {
    sparkles.visible = false;
  }
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
      selectSide(sideKey);
      drawSide(sideKey);
    });
  });
}
wireMode("A");
wireMode("B");

/* --------------------------------------------------------------------------
   Photo upload (per side)
   -------------------------------------------------------------------------- */

function wireUpload(sideKey) {
  const fileInput = $(`#file${sideKey}`);
  $(`#upload${sideKey}`).addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.sides[sideKey].img = img;
      // auto-switch to photo mode if not already
      const photoRadio = document.querySelector(`input[name="mode${sideKey}"][value="photo"]`);
      photoRadio.checked = true;
      state.sides[sideKey].mode = "photo";
      $(`#photoPanel${sideKey}`).hidden = false;
      $(`#textPanel${sideKey}`).hidden = true;
      $(`#fileName${sideKey}`).textContent = file.name;
      selectSide(sideKey);
      drawSide(sideKey);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      $(`#fileName${sideKey}`).textContent = "could not load that file :(";
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
wireUpload("A");
wireUpload("B");

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
}

$("#metal").addEventListener("change", (e) => applyFinish(e.target.value));

$("#bgcolor").addEventListener("input", (e) => {
  state.bgColor = e.target.value;
  scene.background = new THREE.Color(state.bgColor);
});

$("#sparkle").addEventListener("change", (e) => {
  state.sparkle = e.target.checked;
});

$("#speed").addEventListener("input", (e) => {
  state.speed = Number(e.target.value) / 100;
  syncScrubUI();
});

/* ==========================================================================
   Export — GIF (gif.js) & video (MediaRecorder)
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

/* --------------------------------------------------------------------------
   GIF export
   -------------------------------------------------------------------------- */

function exportGif() {
  if (state.exporting) return;
  if (typeof GIF === "undefined") {
    alert("GIF library not loaded yet — check your connection and reload.");
    return;
  }

  state.exporting = true;
  const wasPlaying = state.playing;
  state.playing = false;
  $play.classList.add("paused");

  const { w, h } = parseExportSize();
  const fps = Number($("#expfps").value);
  const frameCount = Math.max(8, Math.round(durationSeconds() * fps));
  const frameDelay = Math.round(1000 / fps);

  const gif = new GIF({
    workers: 2,
    workerScript: "./vendor/gif.worker.js",
    width: w,
    height: h,
    quality: 10,
    dither: false,
  });

  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = w;
  captureCanvas.height = h;
  const captureCtx = captureCanvas.getContext("2d");

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
      gif.on("finished", (blob) => {
        restorePreviewSize();
        downloadBlob(blob, `heart-locket-${w}x${h}.gif`);
        setExportStatus(true, 1, "done! ♥ (status hides in 2s)");
        setTimeout(() => setExportStatus(false), 2000);
        state.exporting = false;
        state.playing = wasPlaying;
        $play.classList.toggle("paused", !state.playing);
      });
      gif.render();
    }
  };
  setTimeout(batch, 30);
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

  // Default both sides to text mode so the tool shows something immediately
  for (const key of ["A", "B"]) {
    const textRadio = document.querySelector(`input[name="mode${key}"][value="text"]`);
    if (textRadio) textRadio.checked = true;
    state.sides[key].mode = "text";
    $(`#photoPanel${key}`).hidden = true;
    $(`#textPanel${key}`).hidden = false;
  }

  drawBothSides();
  refreshAdjustUI();
  syncScrubUI();
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








