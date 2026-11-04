/**
 * ASCII Filter Engine
 * -----------------------------------------------------------------------------
 * Turns a raster image into character art and paints it with a single instanced
 * GPU draw call (WebGL2), with a Canvas2D fallback for browsers without it.
 *
 * Why this shape?
 *  - Canvas2D `fillText` per cell costs 10-200 ms for a dense grid -> unusable
 *    for GIF/video. Here every glyph is an instance: 1 draw call per frame.
 *  - Per-cell payload is only 4 bytes (char index + 8-bit RGB), so a frame
 *    uploads ~30 KB instead of re-rasterising text.
 *  - `renderFrame(source)` is frame-based by design: feeding an <img>, an
 *    <HTMLVideoElement> or a decoded GIF frame is the same code path.
 *
 * BACKENDS
 *  - `AsciiWebGL2Renderer`  : glyph-atlas texture + instanced quads (default)
 *  - `AsciiCanvas2DRenderer` : portable fallback, per-glyph `fillText`
 *  A WebGPU backend can be dropped in later behind the same contract
 *  (see README) — nothing in this file assumes WebGL2 outside its class.
 *
 * Everything at module scope is DOM-free so the maths is unit-testable in Node.
 */

/* ==========================================================================
   1. Character ramps (ordered light -> dark)
   ========================================================================== */
export const RAMP_PRESETS = Object.freeze({
  classic: ' .:-=+*#%@',
  blocks: ' ░▒▓█',
  detailed: ` .'\`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$`,
  minimal: ' .*#',
  dots: ' .·•●',
  binary: ' 01',
});

/** 4x4 ordered Bayer matrix remapped to (-0.5, 0.5), summing to zero. */
export const BAYER4 = Object.freeze([
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
].map((v) => (v + 0.5) / 16 - 0.5));

/** Rec. 709 luminance coefficients (perceptual weighting). */
const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

/* ==========================================================================
   2. Small pure helpers
   ========================================================================== */
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Clean a user-supplied ramp: collapse whitespace runs into a single space,
 * drop newlines and tabs, remove duplicates (order preserved) and guarantee at
 * least two distinct glyphs so the mapping maths never divides by zero.
 * @param {string} raw
 * @returns {string[]} array of single characters, light -> dark
 */
export function normalizeCharset(raw) {
  const source = String(raw == null ? '' : raw).replace(/[\r\n\t]/g, ' ');
  const seen = new Set();
  const out = [];
  for (const ch of source) {
    if (seen.has(ch)) continue;
    seen.add(ch);
    out.push(ch);
  }
  if (out.length < 2) return [' ', '█'];
  return out.slice(0, 120);
}

/**
 * Rows needed so the rendered grid keeps the source aspect ratio, accounting
 * for the fact that a character cell is taller than it is wide.
 * @returns {number} integer row count (>= 1)
 */
export function computeRows(cols, srcW, srcH, cellW, cellH) {
  const w = Math.max(1, srcW || 1);
  const h = Math.max(1, srcH || 1);
  const cw = Math.max(1, cellW || 1);
  const ch = Math.max(1, cellH || 1);
  const rows = Math.round((cols * h * cw) / (w * ch));
  return Math.max(1, rows);
}

/** '#abc' | '#aabbcc' -> [r, g, b] (0-255). Falls back to black. */
export function parseHexColor(hex) {
  const value = String(hex || '').trim().replace('#', '');
  if (value.length === 3) {
    const r = parseInt(value[0] + value[0], 16);
    const g = parseInt(value[1] + value[1], 16);
    const b = parseInt(value[2] + value[2], 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) return [r, g, b];
  } else if (value.length === 6) {
    const num = parseInt(value, 16);
    if (!Number.isNaN(num)) return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  return [0, 0, 0];
}

/* ==========================================================================
   3. Sampler — image pixels  ->  per-cell glyph index + colour
   ========================================================================== */
export class AsciiSampler {
  constructor() {
    this.cols = 0;
    this.rows = 0;
    this.length = 0;
    /** @type {Float32Array} luminance 0..1 per cell */
    this.lum = new Float32Array(0);
    /** @type {Float32Array} scratch buffers reused between frames */
    this.blurBuf = new Float32Array(0);
    this.edgeBuf = new Float32Array(0);
    /** @type {Uint8Array} 4 bytes per cell: [charIndex, r, g, b] */
    this.cells = new Uint8Array(0);
    this.charset = [' ', '█'];
  }

  /** (Re)allocate the working buffers for a cols x rows grid. */
  resize(cols, rows) {
    const length = Math.max(1, cols * rows);
    if (length === this.length && cols === this.cols && rows === this.rows) return;
    this.cols = cols;
    this.rows = rows;
    this.length = length;
    this.lum = new Float32Array(length);
    this.blurBuf = new Float32Array(length);
    this.edgeBuf = new Float32Array(length);
    this.cells = new Uint8Array(length * 4);
  }

  /**
   * Sample an RGBA buffer (already downscaled to cols x rows).
   * @param {Uint8ClampedArray|Uint8Array} rgba
   * @param {object} opts
   * @returns {Uint8Array} packed cells (4 bytes / cell)
   */
  sample(rgba, opts) {
    const cols = this.cols;
    const rows = this.rows;
    const len = this.length;
    if (!len) return this.cells;

    const charset = opts.charset && opts.charset.length >= 2 ? opts.charset : [' ', '█'];
    this.charset = charset;
    const levels = charset.length;
    const step = 1 / (levels - 1);

    const contrast = typeof opts.contrast === 'number' ? opts.contrast : 1;
    const brightness = typeof opts.brightness === 'number' ? opts.brightness : 0;
    const gamma = typeof opts.gamma === 'number' && opts.gamma > 0 ? opts.gamma : 1;
    const invert = !!opts.invert;
    const dither = !!opts.dither;
    const colorMode = opts.colorMode || 'mono';
    const ink = opts.ink || [17, 17, 17];
    const highlight = opts.highlight || [255, 112, 166];

    // --- 1. luminance -----------------------------------------------------
    const lum = this.lum;
    for (let i = 0, p = 0; i < len; i++, p += 4) {
      lum[i] = (LUMA_R * rgba[p] + LUMA_G * rgba[p + 1] + LUMA_B * rgba[p + 2]) / 255;
    }

    // --- 2. optional histogram stretch ------------------------------------
    if (opts.autoLevels) this._autoLevels();

    // --- 3. optional smoothing -------------------------------------------
    const passes = Math.max(0, Math.min(3, opts.smooth | 0));
    for (let p = 0; p < passes; p++) this._blurOnce();

    // --- 4. tone curve ----------------------------------------------------
    const gammaPass = Math.abs(gamma - 1) > 0.001;
    const toneIsIdentity = !gammaPass && contrast === 1 && brightness === 0;
    if (!toneIsIdentity) {
      for (let i = 0; i < len; i++) {
        let v = (lum[i] - 0.5) * contrast + 0.5 + brightness;
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        if (gammaPass) v = Math.pow(v, gamma);
        lum[i] = v;
      }
    }

    // --- 5. optional edge boost (Sobel) ----------------------------------
    const edgeAmount = Math.max(0, Math.min(1, opts.edge || 0));
    if (edgeAmount > 0) this._applyEdges(edgeAmount);

    // --- 6. map to glyph index + colour ----------------------------------
    const cells = this.cells;
    for (let y = 0, i = 0, o = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++, i++, o += 4) {
        let l = lum[i];
        if (dither) l += BAYER4[((y & 3) << 2) + (x & 3)] * step;
        if (invert) l = 1 - l;
        if (l < 0) l = 0;
        else if (l > 1) l = 1;

        // ramp[0] is the lightest glyph, so bright pixels start at index 0
        cells[o] = Math.round((1 - l) * (levels - 1));

        if (colorMode === 'source') {
          const p = i * 4;
          cells[o + 1] = rgba[p];
          cells[o + 2] = rgba[p + 1];
          cells[o + 3] = rgba[p + 2];
        } else if (colorMode === 'duotone') {
          cells[o + 1] = ink[0] + (highlight[0] - ink[0]) * l;
          cells[o + 2] = ink[1] + (highlight[1] - ink[1]) * l;
          cells[o + 3] = ink[2] + (highlight[2] - ink[2]) * l;
        } else {
          cells[o + 1] = ink[0];
          cells[o + 2] = ink[1];
          cells[o + 3] = ink[2];
        }
      }
    }

    return cells;
  }

  /** Stretch luminance so the darkest cell becomes 0 and the brightest 1. */
  _autoLevels() {
    const lum = this.lum;
    const len = this.length;
    let min = 1;
    let max = 0;
    for (let i = 0; i < len; i++) {
      const v = lum[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min;
    if (range < 0.02) return; // flat image, nothing to stretch
    const scale = 1 / range;
    for (let i = 0; i < len; i++) lum[i] = (lum[i] - min) * scale;
  }

  /** Join the current grid into plain text (rows separated by \n). */
  /** One separable 3x3 box blur pass (horizontal then vertical, in place). */
  _blurOnce() {
    const { cols, rows, lum, blurBuf } = this;
    const lastX = cols - 1;
    const lastY = rows - 1;

    // horizontal pass -> scratch
    for (let y = 0; y < rows; y++) {
      const row = y * cols;
      for (let x = 0; x < cols; x++) {
        const x0 = x > 0 ? x - 1 : 0;
        const x1 = x < lastX ? x + 1 : lastX;
        blurBuf[row + x] = (lum[row + x0] + lum[row + x] + lum[row + x1]) / 3;
      }
    }
    // vertical pass -> back into lum
    for (let y = 0; y < rows; y++) {
      const y0 = y > 0 ? y - 1 : 0;
      const y1 = y < lastY ? y + 1 : lastY;
      const row = y * cols;
      const up = y0 * cols;
      const down = y1 * cols;
      for (let x = 0; x < cols; x++) {
        lum[row + x] = (blurBuf[up + x] + blurBuf[row + x] + blurBuf[down + x]) / 3;
      }
    }
  }

  /** Darken cells that sit on an edge so outlines render as dense glyphs. */
  _applyEdges(amount) {
    const { cols, rows, lum, edgeBuf } = this;
    const lastX = cols - 1;
    const lastY = rows - 1;
    edgeBuf.set(lum);

    for (let y = 0; y < rows; y++) {
      const y0 = y > 0 ? y - 1 : 0;
      const y1 = y < lastY ? y + 1 : lastY;
      for (let x = 0; x < cols; x++) {
        const x0 = x > 0 ? x - 1 : 0;
        const x1 = x < lastX ? x + 1 : lastX;
        const a = edgeBuf[y0 * cols + x0];
        const b = edgeBuf[y0 * cols + x];
        const c = edgeBuf[y0 * cols + x1];
        const d = edgeBuf[y * cols + x0];
        const f = edgeBuf[y * cols + x1];
        const g = edgeBuf[y1 * cols + x0];
        const h = edgeBuf[y1 * cols + x];
        const k = edgeBuf[y1 * cols + x1];

        const gx = -a - 2 * d - g + c + 2 * f + k;
        const gy = -a - 2 * b - c + g + 2 * h + k;
        let mag = Math.sqrt(gx * gx + gy * gy);
        if (mag > 1) mag = 1;

        const i = y * cols + x;
        const boosted = lum[i] - mag * amount;
        lum[i] = boosted < 0 ? 0 : boosted;
      }
    }
  }

  toText() {
    const { cols, rows, cells, charset } = this;
    const lines = new Array(rows);
    for (let y = 0; y < rows; y++) {
      let line = '';
      for (let x = 0; x < cols; x++) {
        line += charset[cells[(y * cols + x) * 4]] || ' ';
      }
      lines[y] = line.replace(/\s+$/, '');
    }
    return lines.join('\n');
  }
}

/* ==========================================================================
   4. Glyph atlas (browser only)
   ========================================================================== */
/** Build a canvas `font` shorthand for the given family/weight/size. */
export function fontSpec(fontFamily, bold, fontSize) {
  return `${bold ? 700 : 400} ${fontSize}px ${fontFamily}`;
}

/**
 * Measure the character cell for a font at a given pixel size.
 * Cell width is the widest of the ramp-heavy glyphs so nothing gets clipped.
 */
export function measureGlyphCell(family, bold, fontSize) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = fontSpec(family, bold, fontSize);
  const widest = Math.max(
    ctx.measureText('█').width,
    ctx.measureText('@').width,
    ctx.measureText('M').width,
    fontSize * 0.45
  );
  return {
    cellW: Math.max(2, Math.ceil(widest)),
    cellH: Math.max(3, Math.ceil(fontSize * 1.16)),
  };
}

/**
 * Rasterise every glyph of the ramp, once, into a padded atlas.
 * White glyphs on transparent, so the shader can tint them per instance.
 * @returns {{canvas: HTMLCanvasElement, atlasCols: number, atlasRows: number, cellW: number, cellH: number}}
 */
export function buildGlyphAtlas({ charset, font, cellW, cellH, pad = 1 }) {
  const atlasCols = Math.max(1, Math.ceil(Math.sqrt(charset.length)));
  const atlasRows = Math.max(1, Math.ceil(charset.length / atlasCols));
  const cellWp = cellW + pad * 2;
  const cellHp = cellH + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = atlasCols * cellWp;
  canvas.height = atlasRows * cellHp;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = font;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < charset.length; i++) {
    const ch = charset[i];
    if (!ch || ch === ' ') continue; // space = empty cell, cheaper to skip
    const cx = (i % atlasCols) * cellWp + pad + cellW / 2;
    const cy = Math.floor(i / atlasCols) * cellHp + pad + cellH / 2;
    ctx.fillText(ch, cx, cy);
  }

  return { canvas, atlasCols, atlasRows, cellW, cellH, pad, cellWp, cellHp };
}

/* ==========================================================================
   5. WebGL2 instanced renderer
   ========================================================================== */
const VERT_SRC = `#version 300 es
precision highp float;

in vec2 a_corner;   // 0..1 quad corner
in uvec4 a_data;    // charIndex, r, g, b  (4 bytes / cell)

uniform vec2 u_cell;        // glyph cell size in device px
uniform vec2 u_canvas;      // drawing buffer size
uniform vec2 u_atlasGrid;   // atlas columns, rows
uniform vec2 u_atlasCell;   // padded atlas cell size
uniform vec2 u_atlasPx;     // atlas texture size
uniform float u_pad;        // padding around each glyph cell
uniform int u_cols;         // grid columns

out vec2 v_uv;
out vec3 v_color;

void main() {
  int gi = gl_InstanceID;
  int col = gi % u_cols;
  int row = gi / u_cols;

  float ci = float(a_data.x);
  float ax = mod(ci, u_atlasGrid.x);
  float ay = floor(ci / u_atlasGrid.x);

  // quad position in device pixels -> clip space (y flipped: origin top-left)
  vec2 px = vec2(float(col), float(row)) * u_cell + a_corner * u_cell;
  vec2 clip = (px / u_canvas) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);

  // atlas UV: step inside the padding that surrounds every glyph cell
  vec2 texPx = vec2(ax * u_atlasCell.x + u_pad, ay * u_atlasCell.y + u_pad) + a_corner * u_cell;
  v_uv = vec2(texPx.x / u_atlasPx.x, 1.0 - texPx.y / u_atlasPx.y);

  v_color = vec3(a_data.yzw) / 255.0;
}`;

const FRAG_SRC = `#version 300 es
precision highp float;

uniform sampler2D u_atlas;

in vec2 v_uv;
in vec3 v_color;
out vec4 fragColor;

void main() {
  float a = texture(u_atlas, v_uv).a;
  fragColor = vec4(v_color * a, a); // premultiplied
}`;

/** Cheap feature probe (uses a throwaway canvas so the real one stays free). */
export function supportsWebGL2() {
  try {
    const probe = document.createElement('canvas');
    return !!probe.getContext('webgl2');
  } catch (err) {
    return false;
  }
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('ASCII shader compile failed: ' + log);
  }
  return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
  const program = gl.createProgram();
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('ASCII program link failed: ' + log);
  }
  return program;
}

/**
 * Instanced glyph renderer.
 * Contract shared with the Canvas2D fallback:
 *   init(canvas) · setAtlas(atlas, meta) · renderFrame(cells, cols, rows, opts) · dispose()
 */
export class AsciiWebGL2Renderer {
  constructor() {
    this.backend = 'webgl2';
    this.gl = null;
    this.canvas = null;
    this.capacity = 0;
    this.cellW = 8;
    this.cellH = 14;
    this.atlasCols = 1;
    this.atlasRows = 1;
    this.atlasCellW = 10;
    this.atlasCellH = 16;
    this.atlasPxW = 10;
    this.atlasPxH = 16;
    this.pad = 1;
  }

  async init(canvas) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 context unavailable');

    this.gl = gl;
    this.canvas = canvas;
    this.program = createProgram(gl, VERT_SRC, FRAG_SRC);

    this.uniforms = {
      cell: gl.getUniformLocation(this.program, 'u_cell'),
      canvas: gl.getUniformLocation(this.program, 'u_canvas'),
      atlasGrid: gl.getUniformLocation(this.program, 'u_atlasGrid'),
      atlasCell: gl.getUniformLocation(this.program, 'u_atlasCell'),
      atlasPx: gl.getUniformLocation(this.program, 'u_atlasPx'),
      pad: gl.getUniformLocation(this.program, 'u_pad'),
      cols: gl.getUniformLocation(this.program, 'u_cols'),
      atlas: gl.getUniformLocation(this.program, 'u_atlas'),
    };

    gl.useProgram(this.program);

    // static quad corners (0..1), shared by every instance
    const cornerLoc = gl.getAttribLocation(this.program, 'a_corner');
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(cornerLoc);
    gl.vertexAttribPointer(cornerLoc, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(cornerLoc, 0);
    this.quadBuf = quadBuf;

    // per-cell instance data: 4 unsigned bytes, advanced once per cell
    this.dataLoc = gl.getAttribLocation(this.program, 'a_data');
    this.instBuf = gl.createBuffer();
    this._allocate(8192);

    // glyph atlas texture
    this.texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(this.uniforms.atlas, 0);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  _allocate(capacity) {
    const gl = this.gl;
    this.capacity = Math.max(1024, capacity);
    this.cellData = new Uint8Array(this.capacity * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.cellData.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.dataLoc);
    gl.vertexAttribIPointer(this.dataLoc, 4, gl.UNSIGNED_BYTE, 4, 0);
    gl.vertexAttribDivisor(this.dataLoc, 1);
  }

  /** Upload the freshly rasterised glyph atlas. */
  setAtlas(atlas, meta) {
    const gl = this.gl;
    this.pad = atlas.pad == null ? 1 : atlas.pad;
    this.cellW = atlas.cellW;
    this.cellH = atlas.cellH;
    this.atlasCols = atlas.atlasCols;
    this.atlasRows = atlas.atlasRows;
    this.atlasCellW = atlas.cellW + this.pad * 2;
    this.atlasCellH = atlas.cellH + this.pad * 2;
    this.atlasPxW = atlas.canvas.width;
    this.atlasPxH = atlas.canvas.height;
    this.meta = meta;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
  }

  resize(width, height) {
    if (!this.canvas) return;
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
  }

  /**
   * Paint one frame.
   * @param {Uint8Array} cells 4 bytes per cell (charIndex, r, g, b)
   * @param {number} cols grid columns
   * @param {number} rows grid rows
   * @param {{background?: number[]}} opts background = premultiplied rgba 0..1
   */
  renderFrame(cells, cols, rows, opts = {}) {
    const gl = this.gl;
    if (!gl || gl.isContextLost()) return;
    const count = cols * rows;
    if (!count) return;

    while (count > this.capacity) this._allocate(this.capacity * 2);

    const bytes = count * 4;
    this.cellData.set(cells.subarray(0, bytes));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.cellData, 0, bytes);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const bg = opts.background || [0, 0, 0, 0];
    gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const u = this.uniforms;
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform2f(u.cell, this.cellW, this.cellH);
    gl.uniform2f(u.canvas, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.atlasGrid, this.atlasCols, this.atlasRows);
    gl.uniform2f(u.atlasCell, this.atlasCellW, this.atlasCellH);
    gl.uniform2f(u.atlasPx, this.atlasPxW, this.atlasPxH);
    gl.uniform1f(u.pad, this.pad);
    gl.uniform1i(u.cols, cols);

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
  }

  dispose() {
    const gl = this.gl;
    if (!gl) return;
    gl.deleteTexture(this.texture);
    gl.deleteBuffer(this.instBuf);
    gl.deleteBuffer(this.quadBuf);
    gl.deleteProgram(this.program);
    this.gl = null;
  }
}

/* ==========================================================================
   6. Canvas2D fallback renderer (same contract, no GPU required)
   ========================================================================== */
export class AsciiCanvas2DRenderer {
  constructor() {
    this.backend = 'canvas2d';
    this.ctx = null;
    this.canvas = null;
    this.meta = null;
  }

  async init(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas2D context unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
  }

  setAtlas(atlas, meta) {
    this.meta = meta || null;
    this.cellW = atlas.cellW;
    this.cellH = atlas.cellH;
  }

  resize(width, height) {
    if (!this.canvas) return;
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
  }

  renderFrame(cells, cols, rows, opts = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const meta = this.meta || {};
    const charset = meta.charset || [' ', '█'];
    const cellW = this.cellW || 8;
    const cellH = this.cellH || 14;
    const bg = opts.background || [0, 0, 0, 1];

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    if (bg[3] < 0.02) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.fillStyle = opts.backgroundCss || '#ffffff';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    ctx.font = meta.font || '400 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const halfW = cellW / 2;
    const halfH = cellH / 2;

    if (opts.mono) {
      ctx.fillStyle = opts.inkCss || '#111111';
      for (let y = 0; y < rows; y++) {
        const cy = y * cellH + halfH;
        for (let x = 0; x < cols; x++) {
          const o = (y * cols + x) * 4;
          const ch = charset[cells[o]];
          if (!ch || ch === ' ') continue;
          ctx.fillText(ch, x * cellW + halfW, cy);
        }
      }
      return;
    }

    // per-glyph colour (source / duotone modes)
    let current = -1;
    for (let y = 0; y < rows; y++) {
      const cy = y * cellH + halfH;
      for (let x = 0; x < cols; x++) {
        const o = (y * cols + x) * 4;
        const ch = charset[cells[o]];
        if (!ch || ch === ' ') continue;
        const key = (cells[o + 1] << 16) | (cells[o + 2] << 8) | cells[o + 3];
        if (key !== current) {
          current = key;
          ctx.fillStyle = `rgb(${cells[o + 1]},${cells[o + 2]},${cells[o + 3]})`;
        }
        ctx.fillText(ch, x * cellW + halfW, cy);
      }
    }
  }

  dispose() {
    this.ctx = null;
    this.canvas = null;
  }
}

/**
 * Pick a backend: WebGL2 when available, otherwise Canvas2D.
 * @param {HTMLCanvasElement} canvas
 * @param {'auto'|'webgl2'|'canvas2d'} prefer
 */
export async function createRenderer(canvas, prefer = 'auto') {
  const tryGpu = prefer === 'auto' || prefer === 'webgl2';
  if (tryGpu && supportsWebGL2()) {
    const renderer = new AsciiWebGL2Renderer();
    try {
      await renderer.init(canvas);
      return renderer;
    } catch (err) {
      // The canvas is now bound to WebGL2, so a 2D context is impossible here.
      console.warn('[ascii] WebGL2 init failed, falling back is not possible on this canvas:', err);
      renderer.dispose();
      throw err;
    }
  }
  if (prefer === 'webgl2') throw new Error('WebGL2 was requested but is unavailable');
  const renderer = new AsciiCanvas2DRenderer();
  await renderer.init(canvas);
  return renderer;
}



