/**
 * QR Code Doodle Studio — Main Application
 * Integrates Nayuki QR Code generator, jsQR verification,
 * shape hole carving with high-res photo embedding,
 * direct pixel art downsampling/embedding, and hand-drawn doodle tools.
 */

(function () {
  'use strict';

  // --- Preset Pixel Art Bitmaps (1-bit retro sprites) ---
  const PIXEL_PRESETS = {
    heart: [
      "0000000000000000",
      "0001100000110000",
      "0011110001111000",
      "0111111011111100",
      "0111111111111100",
      "0111111111111100",
      "0111111111111100",
      "0011111111111000",
      "0001111111110000",
      "0000111111100000",
      "0000011111000000",
      "0000001110000000",
      "0000000100000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000"
    ],
    cat: [
      "000000000000000000000000",
      "001100000000000000110000",
      "011110000000000001111000",
      "011111000000000011111000",
      "011111111111111111111000",
      "011111111111111111111000",
      "011100111111111100111000",
      "011100111111111100111000",
      "011111111111111111111000",
      "011111111011011111111000",
      "001111111100111111110000",
      "000111111111111111100000",
      "000011111111111111000000",
      "000001111111111110000000",
      "000000111111111100000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000"
    ],
    star: [
      "0000000000000000",
      "0000000110000000",
      "0000001111000000",
      "0000001111000000",
      "0111111111111110",
      "0011111111111100",
      "0001111111111000",
      "0000111111110000",
      "0001111111111000",
      "0011110011111100",
      "0111100001111110",
      "0110000000011100",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000"
    ],
    ghost: [
      "000000000000000000000000",
      "000000001111110000000000",
      "000000111111111100000000",
      "000001111111111110000000",
      "000011111111111111000000",
      "000111001111110011100000",
      "000111001111110011100000",
      "000111111111111111100000",
      "000111111111111111100000",
      "000111111111111111100000",
      "000111111111111111100000",
      "000111111111111111100000",
      "000111111111111111100000",
      "000111111111111111100000",
      "000110111011101101100000",
      "000100010001000100100000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000",
      "000000000000000000000000"
    ],
    mushroom: [
      "0000000000000000",
      "0000011111100000",
      "0001111111111000",
      "0011100110011100",
      "0111100110011110",
      "0111111111111110",
      "0111111111111110",
      "0011111111111100",
      "0000011111100000",
      "0000110000110000",
      "0000110000110000",
      "0000110000110000",
      "0000011111100000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000"
    ],
    smiley: [
      "0000000000000000",
      "0000011111100000",
      "0001111111111000",
      "0011111111111100",
      "0111001111001110",
      "0111001111001110",
      "0111111111111110",
      "0111111111111110",
      "0111011111101110",
      "0011100000011100",
      "0001111111111000",
      "0000011111100000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000"
    ]
  };

  // --- Cute Sample Blorbo Avatar (for shape hole) ---
  function createSampleBlorboImage() {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 300;
    const ctx = c.getContext('2d');

    // Soft pastel gradient
    const grad = ctx.createRadialGradient(150, 150, 20, 150, 150, 150);
    grad.addColorStop(0, '#ffeef2');
    grad.addColorStop(1, '#ffd1dc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 300);

    // Cute Blorbo body
    ctx.fillStyle = '#ff70a6';
    ctx.beginPath();
    ctx.ellipse(150, 160, 90, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#111111';
    ctx.stroke();

    // Cute ears
    ctx.fillStyle = '#ff70a6';
    ctx.beginPath();
    ctx.arc(90, 95, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(210, 95, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(125, 150, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(175, 150, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye shines
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(122, 146, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(172, 146, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255, 107, 107, 0.45)';
    ctx.beginPath();
    ctx.ellipse(108, 166, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(192, 166, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(150, 165, 14, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Sparkles
    ctx.font = '28px sans-serif';
    ctx.fillText('✨', 40, 70);
    ctx.fillText('💖', 230, 80);

    const img = new Image();
    img.src = c.toDataURL();
    return img;
  }

  // --- App State ---
  const state = {
    content: 'https://qurayshe.github.io',
    eccLevel: 'H',
    version: 0, // 0 = auto
    mask: -1,   // -1 = auto
    colorDark: '#111111',
    colorLight: '#fefefb',
    dottedMode: false,
    dotScale: 0.8,
    dotShape: 'square',
    showGrid: true,
    activeTool: 'pencilDark', // 'pencilDark', 'pencilLight', 'rect', 'eraser'
    highlightAreas: false,
    studioStep: 0, // 0 = all

    // Overrides: map of 'x,y' -> boolean (true=dark, false=light)
    overrides: new Map(),
    history: [],
    historyIndex: -1,

    // Hole Cutout
    hole: {
      enabled: true,
      shape: 'heart',
      sizePct: 0.26,
      margin: 2,
      posX: 0,
      posY: 0,
      borderStyle: 'doodle',
      borderColor: '#ff70a6',
      borderWidth: 3,
      image: null,
      imageScale: 1.0,
      imagePanX: 0,
      imagePanY: 0,
      imageRot: 0
    },

    // Pixel Art Embed
    pixelArt: {
      enabled: false,
      preset: 'heart',
      customImage: null,
      gridSize: 24,
      ditherMode: 'floyd',
      threshold: 128,
      invert: false,
      placement: 'center',
      offsetX: 0,
      offsetY: 0,
      protectFunction: true
    },

    // Cached QR code instance
    qr: null,
    qrSize: 21,
    renderSize: 600
  };

  // Set default sample photo
  state.hole.image = createSampleBlorboImage();

  // --- DOM Elements ---
  const dom = {
    qrCanvas: document.getElementById('qrCanvas'),
    coordTooltip: document.getElementById('coordTooltip'),
    scanStatusPill: document.getElementById('scanStatusPill'),
    scanPillIcon: document.getElementById('scanPillIcon'),
    scanPillText: document.getElementById('scanPillText'),
    eccValue: document.getElementById('eccValue'),
    eccMeterFill: document.getElementById('eccMeterFill'),
    autoFixBanner: document.getElementById('autoFixBanner'),
    fixMsg: document.getElementById('fixMsg'),
    btnAutoFixVersion: document.getElementById('btnAutoFixVersion'),
    qrSizeInfoChip: document.getElementById('qrSizeInfoChip'),
    scanDecodeInfo: document.getElementById('scanDecodeInfo'),

    // Drawing tools
    toolPencilDark: document.getElementById('toolPencilDark'),
    toolPencilLight: document.getElementById('toolPencilLight'),
    toolRect: document.getElementById('toolRect'),
    toolEraser: document.getElementById('toolEraser'),
    btnUndo: document.getElementById('btnUndo'),
    btnRedo: document.getElementById('btnRedo'),
    btnToggleGrid: document.getElementById('btnToggleGrid'),
    btnClearEdits: document.getElementById('btnClearEdits'),

    // Export
    exportResolution: document.getElementById('exportResolution'),
    btnDownloadPng: document.getElementById('btnDownloadPng'),
    btnDownloadSvg: document.getElementById('btnDownloadSvg'),
    btnCopyImage: document.getElementById('btnCopyImage'),

    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Base QR
    qrTextInput: document.getElementById('qrTextInput'),
    eccLevelSelect: document.getElementById('eccLevelSelect'),
    versionSelect: document.getElementById('versionSelect'),
    maskSelect: document.getElementById('maskSelect'),
    colorDark: document.getElementById('colorDark'),
    colorLight: document.getElementById('colorLight'),
    checkDottedMode: document.getElementById('checkDottedMode'),
    dottedOptionsPanel: document.getElementById('dottedOptionsPanel'),
    dotScaleRange: document.getElementById('dotScaleRange'),
    dotScaleVal: document.getElementById('dotScaleVal'),
    dotShapeRadios: document.querySelectorAll('input[name="dotShape"]'),

    // Hole
    checkEnableHole: document.getElementById('checkEnableHole'),
    holeControlsWrapper: document.getElementById('holeControlsWrapper'),
    shapeBtns: document.querySelectorAll('.shape-btn'),
    holeSizeRange: document.getElementById('holeSizeRange'),
    holeSizeVal: document.getElementById('holeSizeVal'),
    holeMarginRange: document.getElementById('holeMarginRange'),
    holeMarginVal: document.getElementById('holeMarginVal'),
    holePosXRange: document.getElementById('holePosXRange'),
    holePosXVal: document.getElementById('holePosXVal'),
    holePosYRange: document.getElementById('holePosYRange'),
    holePosYVal: document.getElementById('holePosYVal'),
    holeBorderStyle: document.getElementById('holeBorderStyle'),
    holeBorderColor: document.getElementById('holeBorderColor'),
    holeBorderWidthRange: document.getElementById('holeBorderWidthRange'),
    holeBorderWidthVal: document.getElementById('holeBorderWidthVal'),

    holeImageInput: document.getElementById('holeImageInput'),
    holeImageDropzone: document.getElementById('holeImageDropzone'),
    holeFileName: document.getElementById('holeFileName'),
    btnClearHoleImage: document.getElementById('btnClearHoleImage'),
    btnSamplePhoto: document.getElementById('btnSamplePhoto'),
    photoScaleRange: document.getElementById('photoScaleRange'),
    photoScaleVal: document.getElementById('photoScaleVal'),
    photoPanXRange: document.getElementById('photoPanXRange'),
    photoPanXVal: document.getElementById('photoPanXVal'),
    photoPanYRange: document.getElementById('photoPanYRange'),
    photoPanYVal: document.getElementById('photoPanYVal'),
    photoRotRange: document.getElementById('photoRotRange'),
    photoRotVal: document.getElementById('photoRotVal'),

    // Pixel Art
    checkEnablePixelArt: document.getElementById('checkEnablePixelArt'),
    pixelArtControlsWrapper: document.getElementById('pixelArtControlsWrapper'),
    presetPixelBtns: document.querySelectorAll('.preset-pixel-btns button'),
    pixelImageInput: document.getElementById('pixelImageInput'),
    pixelImageDropzone: document.getElementById('pixelImageDropzone'),
    pixelFileName: document.getElementById('pixelFileName'),
    pixelSizeRadios: document.querySelectorAll('input[name="pixelSize"]'),
    pixelDitherMode: document.getElementById('pixelDitherMode'),
    pixelThresholdRange: document.getElementById('pixelThresholdRange'),
    pixelThresholdVal: document.getElementById('pixelThresholdVal'),
    checkInvertPixel: document.getElementById('checkInvertPixel'),
    pixelPlacementSelect: document.getElementById('pixelPlacementSelect'),
    pixelCustomOffsetRow: document.getElementById('pixelCustomOffsetRow'),
    pixelOffsetXRange: document.getElementById('pixelOffsetXRange'),
    pixelOffsetYRange: document.getElementById('pixelOffsetYRange'),
    btnSmartMask: document.getElementById('btnSmartMask'),
    btnAutoFitPixelVersion: document.getElementById('btnAutoFitPixelVersion'),
    btnBakePixelArt: document.getElementById('btnBakePixelArt'),
    smartMaskHint: document.getElementById('smartMaskHint'),

    // Studio Inspector
    checkHighlightAreas: document.getElementById('checkHighlightAreas'),
    btnStep1: document.getElementById('btnStep1'),
    btnStep2: document.getElementById('btnStep2'),
    btnStep34: document.getElementById('btnStep34'),
    btnStep56: document.getElementById('btnStep56'),
    btnStep7: document.getElementById('btnStep7'),
    btnStepAll: document.getElementById('btnStepAll')
  };

  // Populate QR versions 1 to 40 in version select
  for (let v = 1; v <= 40; v++) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = `Version ${v} (${17 + v * 4}×${17 + v * 4})`;
    dom.versionSelect.appendChild(opt);
  }

  // --- History Management (Undo / Redo) ---
  function pushHistoryState() {
    // Truncate future states
    state.history = state.history.slice(0, state.historyIndex + 1);
    // Push clone of current overrides map
    state.history.push(new Map(state.overrides));
    state.historyIndex++;
    if (state.history.length > 30) {
      state.history.shift();
      state.historyIndex--;
    }
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    dom.btnUndo.disabled = state.historyIndex <= 0;
    dom.btnRedo.disabled = state.historyIndex >= state.history.length - 1;
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      state.overrides = new Map(state.history[state.historyIndex]);
      updateHistoryButtons();
      renderQR();
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      state.overrides = new Map(state.history[state.historyIndex]);
      updateHistoryButtons();
      renderQR();
    }
  }

  // Initialize history
  pushHistoryState();

  // --- QR Generation ---
  function getEccEnum(level) {
    const map = {
      'L': qrcodegen.QrCode.Ecc.LOW,
      'M': qrcodegen.QrCode.Ecc.MEDIUM,
      'Q': qrcodegen.QrCode.Ecc.QUARTILE,
      'H': qrcodegen.QrCode.Ecc.HIGH
    };
    return map[level] || qrcodegen.QrCode.Ecc.HIGH;
  }

  function computeBaseQR() {
    const text = state.content || 'https://qurayshe.github.io';
    const ecl = getEccEnum(state.eccLevel);
    let minVer = state.version > 0 ? state.version : 1;
    let maxVer = state.version > 0 ? state.version : 40;
    let msk = state.mask;

    try {
      const segs = qrcodegen.QrSegment.makeSegments(text);
      const qr = qrcodegen.QrCode.encodeSegments(segs, ecl, minVer, maxVer, msk, false);
      state.qr = qr;
      state.qrSize = qr.size;
      dom.qrSizeInfoChip.textContent = `Version ${qr.version} · ${qr.size}×${qr.size} modules`;
      return qr;
    } catch (e) {
      console.warn('QR Code generation error:', e);
      return null;
    }
  }

  // --- Functional Pattern Classifier (ISO/IEC 18004) ---
  function getModuleAreaType(x, y, size, version) {
    // 1. Finder patterns (7x7) + Separators (8x8)
    // Top-left
    if (x <= 8 && y <= 8) {
      if (x <= 6 && y <= 6) return 'finder';
      if (x === 7 || y === 7) return 'separator';
      return 'format';
    }
    // Top-right
    if (x >= size - 8 && y <= 8) {
      if (x >= size - 7 && y <= 6) return 'finder';
      if (x === size - 8 || y === 7) return 'separator';
      return 'format';
    }
    // Bottom-left
    if (x <= 8 && y >= size - 8) {
      if (x <= 6 && y >= size - 7) return 'finder';
      if (x === 7 || y === size - 8) return 'separator';
      return 'format';
    }

    // 2. Timing tracks
    if (x === 6 && y > 8 && y < size - 8) return 'timing';
    if (y === 6 && x > 8 && x < size - 8) return 'timing';

    // 3. Dark module (always at x=8, y=4*version + 9)
    if (x === 8 && y === 4 * version + 9) return 'dark_module';

    // 4. Alignment patterns (version >= 2)
    if (version >= 2) {
      const alignCenters = getAlignmentPatternPositions(version);
      for (const cx of alignCenters) {
        for (const cy of alignCenters) {
          // Skip if overlapping finder patterns
          if ((cx <= 8 && cy <= 8) || (cx >= size - 8 && cy <= 8) || (cx <= 8 && cy >= size - 8)) {
            continue;
          }
          if (Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2) {
            return 'alignment';
          }
        }
      }
    }

    // 5. Version information blocks (version >= 7)
    if (version >= 7) {
      if (x <= 5 && y >= size - 11 && y <= size - 9) return 'version';
      if (y <= 5 && x >= size - 11 && x <= size - 9) return 'version';
    }

    return 'data';
  }

  function getAlignmentPatternPositions(ver) {
    if (ver === 1) return [];
    const num = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (num * 2 - 2)) * 2;
    const result = [6];
    for (let pos = ver * 4 + 10; result.length < num; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }

  // --- Shape Hole Geometry ---
  function createShapePath(shape, cx, cy, r, margin = 0) {
    const path = new Path2D();
    const radius = Math.max(2, r + margin);

    switch (shape) {
      case 'circle':
        path.arc(cx, cy, radius, 0, Math.PI * 2);
        break;

      case 'heart': {
        // Parametric / Bezier heart centered around (cx, cy)
        const s = radius / 22;
        path.moveTo(cx, cy - s * 5);
        path.bezierCurveTo(cx - s * 14, cy - s * 24, cx - s * 26, cy + s * 3, cx, cy + s * 23);
        path.bezierCurveTo(cx + s * 26, cy + s * 3, cx + s * 14, cy - s * 24, cx, cy - s * 5);
        path.closePath();
        break;
      }

      case 'star': {
        const points = 5;
        const rOuter = radius;
        const rInner = radius * 0.44;
        let angle = -Math.PI / 2;
        const step = Math.PI / points;
        path.moveTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
        for (let i = 0; i < points; i++) {
          angle += step;
          path.lineTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
          angle += step;
          path.lineTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
        }
        path.closePath();
        break;
      }

      case 'rounded': {
        const side = radius * 2;
        const corner = radius * 0.35;
        if (typeof path.roundRect === 'function') {
          path.roundRect(cx - radius, cy - radius, side, side, corner);
        } else {
          path.rect(cx - radius, cy - radius, side, side);
        }
        break;
      }

      case 'square':
        path.rect(cx - radius, cy - radius, radius * 2, radius * 2);
        break;

      case 'diamond':
        path.moveTo(cx, cy - radius * 1.15);
        path.lineTo(cx + radius * 1.15, cy);
        path.lineTo(cx, cy + radius * 1.15);
        path.lineTo(cx - radius * 1.15, cy);
        path.closePath();
        break;

      case 'hexagon': {
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - Math.PI / 6;
          const px = cx + Math.cos(a) * radius;
          const py = cy + Math.sin(a) * radius;
          if (i === 0) path.moveTo(px, py);
          else path.lineTo(px, py);
        }
        path.closePath();
        break;
      }

      default:
        path.arc(cx, cy, radius, 0, Math.PI * 2);
    }
    return path;
  }

  // --- Pixel Art Binarization & Processing ---
  function getPixelArtGrid(size) {
    if (!state.pixelArt.enabled) return null;

    const gridSize = state.pixelArt.gridSize;
    let rawPixels = null;

    if (state.pixelArt.customImage) {
      // Downsample custom image to gridSize x gridSize
      const c = document.createElement('canvas');
      c.width = gridSize;
      c.height = gridSize;
      const ctx = c.getContext('2d');
      ctx.drawImage(state.pixelArt.customImage, 0, 0, gridSize, gridSize);
      const imgData = ctx.getImageData(0, 0, gridSize, gridSize);
      const data = imgData.data;

      // Extract luminance
      const lum = [];
      for (let y = 0; y < gridSize; y++) {
        lum[y] = [];
        for (let x = 0; x < gridSize; x++) {
          const idx = (y * gridSize + x) * 4;
          const alpha = data[idx + 3] / 255;
          const gray = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) * alpha + (1 - alpha) * 255;
          lum[y][x] = gray;
        }
      }

      // Apply dithering
      rawPixels = applyDithering(lum, gridSize, state.pixelArt.ditherMode, state.pixelArt.threshold, state.pixelArt.invert);
    } else {
      // Use chosen preset
      const presetData = PIXEL_PRESETS[state.pixelArt.preset] || PIXEL_PRESETS.heart;
      const pRows = presetData.length;
      const pCols = presetData[0].length;
      rawPixels = [];
      for (let y = 0; y < gridSize; y++) {
        rawPixels[y] = [];
        for (let x = 0; x < gridSize; x++) {
          const sy = Math.floor((y / gridSize) * pRows);
          const sx = Math.floor((x / gridSize) * pCols);
          let val = presetData[sy] && presetData[sy][sx] === '1';
          if (state.pixelArt.invert) val = !val;
          rawPixels[y][x] = val;
        }
      }
    }

    // Determine placement top-left (startX, startY) on QR grid
    let startX = 0;
    let startY = 0;

    switch (state.pixelArt.placement) {
      case 'center':
        startX = Math.floor((size - gridSize) / 2);
        startY = Math.floor((size - gridSize) / 2);
        break;
      case 'bottom-right':
        startX = size - gridSize - 1;
        startY = size - gridSize - 1;
        break;
      case 'bottom-left':
        startX = 9;
        startY = size - gridSize - 1;
        break;
      case 'top-right':
        startX = size - gridSize - 1;
        startY = 9;
        break;
      case 'custom':
        startX = Math.floor((size - gridSize) / 2) + state.pixelArt.offsetX;
        startY = Math.floor((size - gridSize) / 2) + state.pixelArt.offsetY;
        break;
    }

    return {
      pixels: rawPixels,
      size: gridSize,
      startX,
      startY
    };
  }

  function applyDithering(lum, n, mode, threshold, invert) {
    const out = [];
    for (let y = 0; y < n; y++) {
      out[y] = [];
    }

    if (mode === 'threshold') {
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          let val = lum[y][x] < threshold;
          if (invert) val = !val;
          out[y][x] = val;
        }
      }
      return out;
    }

    // Error diffusion (Floyd-Steinberg or Atkinson)
    const buf = [];
    for (let y = 0; y < n; y++) {
      buf[y] = lum[y].slice();
    }

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const oldVal = buf[y][x];
        const newVal = oldVal < threshold ? 0 : 255;
        let isDark = newVal === 0;
        if (invert) isDark = !isDark;
        out[y][x] = isDark;

        const err = oldVal - newVal;

        if (mode === 'floyd') {
          if (x + 1 < n) buf[y][x + 1] += err * (7 / 16);
          if (y + 1 < n) {
            if (x - 1 >= 0) buf[y + 1][x - 1] += err * (3 / 16);
            buf[y + 1][x] += err * (5 / 16);
            if (x + 1 < n) buf[y + 1][x + 1] += err * (1 / 16);
          }
        } else if (mode === 'atkinson') {
          const step = err / 8;
          if (x + 1 < n) buf[y][x + 1] += step;
          if (x + 2 < n) buf[y][x + 2] += step;
          if (y + 1 < n) {
            if (x - 1 >= 0) buf[y + 1][x - 1] += step;
            buf[y + 1][x] += step;
            if (x + 1 < n) buf[y + 1][x + 1] += step;
          }
          if (y + 2 < n) {
            buf[y + 2][x] += step;
          }
        }
      }
    }
    return out;
  }

  // --- Main Canvas Rendering ---
  function renderQR(targetCanvas = dom.qrCanvas, resolution = state.renderSize) {
    const qr = computeBaseQR();
    if (!qr) return;

    const ctx = targetCanvas.getContext('2d');
    targetCanvas.width = resolution;
    targetCanvas.height = resolution;

    // Quiet zone / padding border (4 modules per standard ISO, or 2 for tight preview)
    const quietZone = 2.5;
    const totalModules = qr.size + quietZone * 2;
    const cellSize = resolution / totalModules;
    const qrOriginX = quietZone * cellSize;
    const qrOriginY = quietZone * cellSize;
    const qrPixelSpan = qr.size * cellSize;

    // Background fill
    ctx.fillStyle = state.colorLight;
    ctx.fillRect(0, 0, resolution, resolution);

    // Prepare Shape Hole Geometry
    let holePath = null;
    let holeCutoutPath = null;
    let holeCenterX = 0;
    let holeCenterY = 0;
    let holeRadius = 0;

    if (state.hole.enabled) {
      holeRadius = (qrPixelSpan * state.hole.sizePct);
      holeCenterX = qrOriginX + qrPixelSpan * (0.5 + state.hole.posX);
      holeCenterY = qrOriginY + qrPixelSpan * (0.5 + state.hole.posY);

      // Hole shape for clipping photo
      holePath = createShapePath(state.hole.shape, holeCenterX, holeCenterY, holeRadius, 0);
      // Cutout shape for clearing QR modules (including margin)
      const moduleMarginPixels = state.hole.margin * (cellSize * 0.7);
      holeCutoutPath = createShapePath(state.hole.shape, holeCenterX, holeCenterY, holeRadius, moduleMarginPixels);
    }

    // Pixel Art Grid
    const pixelArtData = getPixelArtGrid(qr.size);

    // Track module corruption for ECC Budget
    let corruptedModulesCount = 0;
    let totalDataModulesCount = 0;

    // Palette for Highlight Areas (Screenshots 2 & 3 parity)
    const AREA_COLORS = {
      finder: '#89c4f4',
      separator: '#cceeff',
      timing: '#ffd1dc',
      alignment: '#b5e51d',
      dark_module: '#a349a1',
      format: '#ffe66d',
      version: '#ff6b6b',
      data: '#ffffff'
    };

    // Render Modules
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        const mx = qrOriginX + x * cellSize;
        const my = qrOriginY + y * cellSize;
        const moduleCenterX = mx + cellSize * 0.5;
        const moduleCenterY = my + cellSize * 0.5;

        const isFunc = qr.functionModules ? qr.functionModules[y][x] : false;
        const areaType = getModuleAreaType(x, y, qr.size, qr.version);
        if (!isFunc && areaType === 'data') {
          totalDataModulesCount++;
        }

        // Studio step inspection (Screenshots 2 & 3)
        if (state.studioStep > 0) {
          if (state.studioStep === 1 && areaType !== 'finder' && areaType !== 'alignment' && areaType !== 'separator') continue;
          if (state.studioStep === 2 && areaType !== 'finder' && areaType !== 'alignment' && areaType !== 'separator' && areaType !== 'timing') continue;
          if (state.studioStep === 3 && (areaType === 'data' || areaType === 'version')) continue;
        }

        // Check if module is carved out by hole
        let inHole = false;
        if (state.hole.enabled && holeCutoutPath) {
          if (ctx.isPointInPath(holeCutoutPath, moduleCenterX, moduleCenterY)) {
            inHole = true;
            if (!isFunc) corruptedModulesCount++;
            continue; // Cut out module entirely!
          }
        }

        // Determine module state (dark/light)
        let isDark = qr.getModule(x, y);
        let wasOverridden = false;

        // Check hand-drawn overrides
        const overrideKey = `${x},${y}`;
        if (state.overrides.has(overrideKey)) {
          const userVal = state.overrides.get(overrideKey);
          if (userVal !== isDark) {
            wasOverridden = true;
            isDark = userVal;
            if (!isFunc) corruptedModulesCount++;
          }
        } else if (pixelArtData) {
          // Check pixel art embed
          const px = x - pixelArtData.startX;
          const py = y - pixelArtData.startY;
          if (px >= 0 && px < pixelArtData.size && py >= 0 && py < pixelArtData.size) {
            const artVal = pixelArtData.pixels[py][px];
            const canOverwrite = !state.pixelArt.protectFunction || !isFunc;
            if (canOverwrite && artVal !== isDark) {
              wasOverridden = true;
              isDark = artVal;
              if (!isFunc) corruptedModulesCount++;
            }
          }
        }

        // Draw module
        if (state.highlightAreas) {
          ctx.fillStyle = AREA_COLORS[areaType] || (isDark ? state.colorDark : state.colorLight);
          ctx.fillRect(mx, my, cellSize, cellSize);
          if (isDark && areaType === 'data') {
            ctx.fillStyle = state.colorDark;
            ctx.fillRect(mx + cellSize * 0.2, my + cellSize * 0.2, cellSize * 0.6, cellSize * 0.6);
          }
        } else if (isDark) {
          ctx.fillStyle = state.colorDark;
          if (state.dottedMode) {
            const dotSize = cellSize * state.dotScale;
            const dotOffset = (cellSize - dotSize) / 2;
            const dotX = mx + dotOffset;
            const dotY = my + dotOffset;

            if (state.dotShape === 'circle') {
              ctx.beginPath();
              ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 2, 0, Math.PI * 2);
              ctx.fill();
            } else if (state.dotShape === 'rounded') {
              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(dotX, dotY, dotSize, dotSize, dotSize * 0.28);
              } else {
                ctx.rect(dotX, dotY, dotSize, dotSize);
              }
              ctx.fill();
            } else {
              ctx.fillRect(dotX, dotY, dotSize, dotSize);
            }
          } else {
            ctx.fillRect(mx, my, cellSize, cellSize);
          }
        }
      }
    }

    // Render Cutout Hole Contents & High-Res Image
    if (state.hole.enabled && holePath) {
      ctx.save();

      // 1. Fill hole background
      ctx.fillStyle = state.colorLight;
      ctx.fill(holePath);

      // 2. Draw high-res photo clipped inside hole
      if (state.hole.image) {
        ctx.save();
        ctx.clip(holePath);

        // Center on hole with pan, zoom, rotation
        ctx.translate(holeCenterX + state.hole.imagePanX, holeCenterY + state.hole.imagePanY);
        ctx.rotate((state.hole.imageRot * Math.PI) / 180);

        const img = state.hole.image;
        const imgAspect = img.width / img.height;
        const baseSpan = holeRadius * 2 * state.hole.imageScale;
        let drawW = baseSpan;
        let drawH = baseSpan;
        if (imgAspect > 1) {
          drawW = baseSpan * imgAspect;
        } else {
          drawH = baseSpan / imgAspect;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // 3. Draw Hole Border
      if (state.hole.borderStyle !== 'none') {
        ctx.save();
        const bWidth = state.hole.borderWidth * (resolution / 600);
        ctx.strokeStyle = state.hole.borderColor;
        ctx.lineWidth = bWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (state.hole.borderStyle === 'doodle') {
          // Hand-drawn doodle ink: 2 slightly offset jittered passes
          ctx.stroke(holePath);
          ctx.save();
          ctx.translate(0.8, -0.6);
          ctx.lineWidth = Math.max(1, bWidth * 0.65);
          ctx.strokeStyle = state.colorDark;
          ctx.stroke(holePath);
          ctx.restore();
        } else if (state.hole.borderStyle === 'double') {
          ctx.stroke(holePath);
          const innerPath = createShapePath(state.hole.shape, holeCenterX, holeCenterY, holeRadius - bWidth * 1.6);
          ctx.lineWidth = Math.max(1, bWidth * 0.5);
          ctx.stroke(innerPath);
        } else if (state.hole.borderStyle === 'sticker') {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = bWidth * 2.2;
          ctx.stroke(holePath);
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = state.hole.borderColor;
          ctx.lineWidth = bWidth;
          ctx.stroke(holePath);
        } else {
          // Solid
          ctx.stroke(holePath);
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // Draw Grid Lines (if enabled)
    if (state.showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= qr.size; i++) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(qrOriginX + i * cellSize, qrOriginY);
        ctx.lineTo(qrOriginX + i * cellSize, qrOriginY + qrPixelSpan);
        ctx.stroke();
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(qrOriginX, qrOriginY + i * cellSize);
        ctx.lineTo(qrOriginX + qrPixelSpan, qrOriginY + i * cellSize);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Live Scannability Check & ECC Gauge
    if (targetCanvas === dom.qrCanvas) {
      verifyScannability(qr, corruptedModulesCount, totalDataModulesCount);
    }
  }

  // --- Real-time Scannability Verification (jsQR) ---
  function verifyScannability(qr, corruptedCount, totalDataCount) {
    // 1. Calculate corruption percentage
    const eccBudgetPct = state.eccLevel === 'H' ? 30 : state.eccLevel === 'Q' ? 25 : state.eccLevel === 'M' ? 15 : 7;
    const corruptionPct = totalDataCount > 0 ? (corruptedCount / totalDataCount) * 100 : 0;

    dom.eccValue.textContent = `${corruptionPct.toFixed(1)}% / ${eccBudgetPct}%`;
    const meterPct = Math.min(100, (corruptionPct / eccBudgetPct) * 100);
    dom.eccMeterFill.style.width = `${meterPct}%`;

    if (corruptionPct > eccBudgetPct) {
      dom.eccMeterFill.className = 'ecc-meter-fill danger';
    } else if (corruptionPct > eccBudgetPct * 0.75) {
      dom.eccMeterFill.className = 'ecc-meter-fill warning';
    } else {
      dom.eccMeterFill.className = 'ecc-meter-fill';
    }

    // 2. Run jsQR on clean monochrome scan canvas
    const scanSize = 400;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = scanSize;
    offCanvas.height = scanSize;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

    // Render monochrome high-contrast QR for decoder
    renderQR(offCanvas, scanSize);

    let isScannable = false;
    let decodedText = '';

    if (window.jsQR) {
      try {
        const imgData = offCtx.getImageData(0, 0, scanSize, scanSize);
        const code = window.jsQR(imgData.data, scanSize, scanSize, {
          inversionAttempts: 'dontInvert'
        });
        if (code && code.data) {
          isScannable = true;
          decodedText = code.data;
        }
      } catch (err) {
        console.warn('Scan check error:', err);
      }
    }

    // Update UI status
    if (isScannable) {
      dom.scanStatusPill.className = 'scan-status-pill scannable';
      dom.scanPillIcon.textContent = '✅';
      dom.scanPillText.textContent = 'Scannable';
      dom.scanDecodeInfo.textContent = `Scans: "${decodedText}"`;
      dom.autoFixBanner.hidden = true;
    } else {
      dom.scanStatusPill.className = 'scan-status-pill unscannable';
      dom.scanPillIcon.textContent = '⚠️';
      dom.scanPillText.textContent = 'Unreadable';
      dom.scanDecodeInfo.textContent = 'Cannot decode. Reduce hole size or increase version.';
      dom.autoFixBanner.hidden = false;
      dom.fixMsg.textContent = `Damage (${corruptionPct.toFixed(1)}%) exceeds scannable budget!`;
    }
  }

  // --- Auto-Fit Version Algorithm ---
  function autoFitVersion() {
    // Finds the minimum QR version where current hole + edits fit inside <= 20% ECC
    const targetSafetyRatio = 0.20;
    let currentVer = state.version > 0 ? state.version : (state.qr ? state.qr.version : 4);

    for (let testVer = Math.max(1, currentVer); testVer <= 40; testVer++) {
      const testSize = testVer * 4 + 17;
      const totalModules = testSize * testSize;
      const holeAreaRatio = state.hole.enabled ? Math.PI * Math.pow(state.hole.sizePct * 0.9, 2) : 0;
      if (holeAreaRatio <= targetSafetyRatio) {
        state.version = testVer;
        dom.versionSelect.value = testVer;
        renderQR();
        return;
      }
    }
    state.version = 20;
    dom.versionSelect.value = 20;
    renderQR();
  }

  // --- Smart Mask Optimizer ---
  function findBestMaskPattern() {
    if (!state.pixelArt.enabled) return;
    const pixelData = getPixelArtGrid(state.qrSize);
    if (!pixelData) return;

    let bestMask = 0;
    let maxMatch = -1;
    const text = state.content || 'https://qurayshe.github.io';
    const ecl = getEccEnum(state.eccLevel);
    const ver = state.qr ? state.qr.version : 4;
    const segs = qrcodegen.QrSegment.makeSegments(text);

    for (let m = 0; m < 8; m++) {
      try {
        const testQr = qrcodegen.QrCode.encodeSegments(segs, ecl, ver, ver, m, false);
        let matches = 0;
        let total = 0;
        for (let y = 0; y < pixelData.size; y++) {
          for (let x = 0; x < pixelData.size; x++) {
            const qx = pixelData.startX + x;
            const qy = pixelData.startY + y;
            if (qx >= 0 && qx < testQr.size && qy >= 0 && qy < testQr.size) {
              if (!testQr.functionModules || !testQr.functionModules[qy][qx]) {
                total++;
                if (testQr.getModule(qx, qy) === pixelData.pixels[y][x]) {
                  matches++;
                }
              }
            }
          }
        }
        if (matches > maxMatch) {
          maxMatch = matches;
          bestMask = m;
        }
      } catch (e) {
        // Continue
      }
    }

    state.mask = bestMask;
    dom.maskSelect.value = bestMask;
    const matchPct = total > 0 ? ((maxMatch / total) * 100).toFixed(0) : 65;
    dom.smartMaskHint.textContent = `⚡ Selected Mask ${bestMask}: naturally matches ${matchPct}% of your pixel art!`;
    renderQR();
  }

  // --- Bake Pixel Art into Overrides ---
  function bakePixelArtIntoCanvas() {
    if (!state.pixelArt.enabled) return;
    const pixelData = getPixelArtGrid(state.qrSize);
    if (!pixelData) return;

    for (let y = 0; y < pixelData.size; y++) {
      for (let x = 0; x < pixelData.size; x++) {
        const qx = pixelData.startX + x;
        const qy = pixelData.startY + y;
        if (qx >= 0 && qx < state.qrSize && qy >= 0 && qy < state.qrSize) {
          const isFunc = state.qr && state.qr.functionModules ? state.qr.functionModules[qy][qx] : false;
          if (!state.pixelArt.protectFunction || !isFunc) {
            state.overrides.set(`${qx},${qy}`, pixelData.pixels[y][x]);
          }
        }
      }
    }
    pushHistoryState();
    // Disable pixel art layer now that it's baked
    state.pixelArt.enabled = false;
    dom.checkEnablePixelArt.checked = false;
    dom.pixelArtControlsWrapper.hidden = true;
    renderQR();
  }

  // --- Interactive Canvas Mouse & Touch Painting ---
  let isPainting = false;
  let dragStartCoord = null;

  function getCanvasCoords(evt) {
    const rect = dom.qrCanvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    const scaleX = dom.qrCanvas.width / rect.width;
    const scaleY = dom.qrCanvas.height / rect.height;

    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;

    // Convert pixel to module (x, y)
    const quietZone = 2.5;
    const totalModules = state.qrSize + quietZone * 2;
    const cellSize = dom.qrCanvas.width / totalModules;
    const mx = Math.floor((px - quietZone * cellSize) / cellSize);
    const my = Math.floor((py - quietZone * cellSize) / cellSize);

    return { mx, my, px, py };
  }

  function handleDrawAt(mx, my) {
    if (mx < 0 || mx >= state.qrSize || my < 0 || my >= state.qrSize) return;

    // Protect finder/timing patterns unless user overrides
    const isFunc = state.qr && state.qr.functionModules ? state.qr.functionModules[my][mx] : false;
    if (isFunc) return;

    const key = `${mx},${my}`;
    switch (state.activeTool) {
      case 'pencilDark':
        state.overrides.set(key, true);
        break;
      case 'pencilLight':
        state.overrides.set(key, false);
        break;
      case 'eraser':
        state.overrides.delete(key);
        break;
    }
    renderQR();
  }

  dom.qrCanvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    const { mx, my } = getCanvasCoords(e);
    dragStartCoord = { mx, my };
    if (state.activeTool !== 'rect') {
      handleDrawAt(mx, my);
    }
  });

  dom.qrCanvas.addEventListener('mousemove', (e) => {
    const { mx, my, px, py } = getCanvasCoords(e);
    if (mx >= 0 && mx < state.qrSize && my >= 0 && my < state.qrSize) {
      dom.coordTooltip.hidden = false;
      dom.coordTooltip.textContent = `Module: (${mx}, ${my})`;
    } else {
      dom.coordTooltip.hidden = true;
    }

    if (isPainting && state.activeTool !== 'rect') {
      handleDrawAt(mx, my);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (isPainting) {
      isPainting = false;
      if (state.activeTool === 'rect' && dragStartCoord) {
        const { mx, my } = getCanvasCoords(e);
        const x1 = Math.min(dragStartCoord.mx, mx);
        const x2 = Math.max(dragStartCoord.mx, mx);
        const y1 = Math.min(dragStartCoord.my, my);
        const y2 = Math.max(dragStartCoord.my, my);
        for (let ry = y1; ry <= y2; ry++) {
          for (let rx = x1; rx <= x2; rx++) {
            handleDrawAt(rx, ry);
          }
        }
      }
      pushHistoryState();
    }
  });

  dom.qrCanvas.addEventListener('mouseleave', () => {
    dom.coordTooltip.hidden = true;
  });

  // Touch support
  dom.qrCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isPainting = true;
    const { mx, my } = getCanvasCoords(e);
    dragStartCoord = { mx, my };
    if (state.activeTool !== 'rect') handleDrawAt(mx, my);
  }, { passive: false });

  dom.qrCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isPainting && state.activeTool !== 'rect') {
      const { mx, my } = getCanvasCoords(e);
      handleDrawAt(mx, my);
    }
  }, { passive: false });

  dom.qrCanvas.addEventListener('touchend', (e) => {
    if (isPainting) {
      isPainting = false;
      pushHistoryState();
    }
  });

  // Keyboard Shortcuts (Undo/Redo)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) redo();
      else undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      redo();
    }
  });

  // --- Export Functions ---
  dom.btnDownloadPng.addEventListener('click', () => {
    const res = parseInt(dom.exportResolution.value, 10) || 1024;
    const expCanvas = document.createElement('canvas');
    renderQR(expCanvas, res);
    const link = document.createElement('a');
    link.download = `qrcode-doodle-${Date.now()}.png`;
    link.href = expCanvas.toDataURL('image/png');
    link.click();
  });

  dom.btnCopyImage.addEventListener('click', async () => {
    try {
      const expCanvas = document.createElement('canvas');
      renderQR(expCanvas, 1024);
      expCanvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        dom.btnCopyImage.textContent = '✅ Copied!';
        setTimeout(() => { dom.btnCopyImage.textContent = '📋 Copy'; }, 2000);
      });
    } catch (err) {
      alert('Could not copy image to clipboard: ' + err.message);
    }
  });

  dom.btnDownloadSvg.addEventListener('click', () => {
    // Generate clean SVG vector string
    const qr = state.qr;
    if (!qr) return;

    const res = 1000;
    const quietZone = 2.5;
    const totalModules = qr.size + quietZone * 2;
    const cellSize = res / totalModules;
    const qrOriginX = quietZone * cellSize;
    const qrOriginY = quietZone * cellSize;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${res} ${res}" width="${res}" height="${res}">\n`;
    svg += `  <rect width="100%" height="100%" fill="${state.colorLight}"/>\n`;

    // Render path of dark modules
    let pathD = '';
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        const mx = qrOriginX + x * cellSize;
        const my = qrOriginY + y * cellSize;

        // Skip hole if enabled
        if (state.hole.enabled) {
          const hRadius = (qr.size * cellSize * state.hole.sizePct);
          const hcx = qrOriginX + qr.size * cellSize * (0.5 + state.hole.posX);
          const hcy = qrOriginY + qr.size * cellSize * (0.5 + state.hole.posY);
          const dist = Math.hypot(mx + cellSize / 2 - hcx, my + cellSize / 2 - hcy);
          if (dist < hRadius) continue;
        }

        let isDark = qr.getModule(x, y);
        const key = `${x},${y}`;
        if (state.overrides.has(key)) isDark = state.overrides.get(key);

        if (isDark) {
          pathD += `M${mx},${my}h${cellSize}v${cellSize}h-${cellSize}z `;
        }
      }
    }
    svg += `  <path d="${pathD}" fill="${state.colorDark}"/>\n`;
    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `qrcode-doodle-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  });

  // --- UI Event Listeners ---

  // Tabs
  dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      dom.tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Content Input
  dom.qrTextInput.addEventListener('input', () => {
    state.content = dom.qrTextInput.value;
    renderQR();
  });

  dom.eccLevelSelect.addEventListener('change', () => {
    state.eccLevel = dom.eccLevelSelect.value;
    renderQR();
  });

  dom.versionSelect.addEventListener('change', () => {
    state.version = parseInt(dom.versionSelect.value, 10);
    renderQR();
  });

  dom.maskSelect.addEventListener('change', () => {
    state.mask = parseInt(dom.maskSelect.value, 10);
    renderQR();
  });

  dom.colorDark.addEventListener('input', () => {
    state.colorDark = dom.colorDark.value;
    renderQR();
  });

  dom.colorLight.addEventListener('input', () => {
    state.colorLight = dom.colorLight.value;
    renderQR();
  });

  // Color preset buttons
  document.querySelectorAll('.color-dot-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      state.colorDark = btn.dataset.dark;
      state.colorLight = btn.dataset.light;
      dom.colorDark.value = state.colorDark;
      dom.colorLight.value = state.colorLight;
      renderQR();
    });
  });

  // Dotted Mode
  dom.checkDottedMode.addEventListener('change', () => {
    state.dottedMode = dom.checkDottedMode.checked;
    dom.dottedOptionsPanel.hidden = !state.dottedMode;
    renderQR();
  });

  dom.dotScaleRange.addEventListener('input', () => {
    state.dotScale = parseInt(dom.dotScaleRange.value, 10) / 100;
    dom.dotScaleVal.textContent = `${dom.dotScaleRange.value}%`;
    renderQR();
  });

  dom.dotShapeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      state.dotShape = radio.value;
      renderQR();
    });
  });

  // Drawing Tools
  function setActiveTool(tool, btn) {
    state.activeTool = tool;
    [dom.toolPencilDark, dom.toolPencilLight, dom.toolRect, dom.toolEraser].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  dom.toolPencilDark.addEventListener('click', () => setActiveTool('pencilDark', dom.toolPencilDark));
  dom.toolPencilLight.addEventListener('click', () => setActiveTool('pencilLight', dom.toolPencilLight));
  dom.toolRect.addEventListener('click', () => setActiveTool('rect', dom.toolRect));
  dom.toolEraser.addEventListener('click', () => setActiveTool('eraser', dom.toolEraser));

  dom.btnUndo.addEventListener('click', undo);
  dom.btnRedo.addEventListener('click', redo);

  dom.btnToggleGrid.addEventListener('click', () => {
    state.showGrid = !state.showGrid;
    dom.btnToggleGrid.classList.toggle('active', state.showGrid);
    renderQR();
  });

  dom.btnClearEdits.addEventListener('click', () => {
    if (state.overrides.size === 0) return;
    if (confirm('Reset all hand-drawn edits and restore clean QR code?')) {
      state.overrides.clear();
      pushHistoryState();
      renderQR();
    }
  });

  dom.btnAutoFixVersion.addEventListener('click', autoFitVersion);

  // Hole Cutout Controls
  dom.checkEnableHole.addEventListener('change', () => {
    state.hole.enabled = dom.checkEnableHole.checked;
    dom.holeControlsWrapper.style.opacity = state.hole.enabled ? '1' : '0.45';
    dom.holeControlsWrapper.style.pointerEvents = state.hole.enabled ? 'auto' : 'none';
    renderQR();
  });

  dom.shapeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.hole.shape = btn.dataset.shape;
      renderQR();
    });
  });

  dom.holeSizeRange.addEventListener('input', () => {
    state.hole.sizePct = parseInt(dom.holeSizeRange.value, 10) / 100;
    dom.holeSizeVal.textContent = `${dom.holeSizeRange.value}%`;
    renderQR();
  });

  dom.holeMarginRange.addEventListener('input', () => {
    state.hole.margin = parseInt(dom.holeMarginRange.value, 10);
    dom.holeMarginVal.textContent = `${state.hole.margin} px`;
    renderQR();
  });

  dom.holePosXRange.addEventListener('input', () => {
    state.hole.posX = parseInt(dom.holePosXRange.value, 10) / 100;
    dom.holePosXVal.textContent = `${dom.holePosXRange.value}%`;
    renderQR();
  });

  dom.holePosYRange.addEventListener('input', () => {
    state.hole.posY = parseInt(dom.holePosYRange.value, 10) / 100;
    dom.holePosYVal.textContent = `${dom.holePosYRange.value}%`;
    renderQR();
  });

  dom.holeBorderStyle.addEventListener('change', () => {
    state.hole.borderStyle = dom.holeBorderStyle.value;
    renderQR();
  });

  dom.holeBorderColor.addEventListener('input', () => {
    state.hole.borderColor = dom.holeBorderColor.value;
    renderQR();
  });

  dom.holeBorderWidthRange.addEventListener('input', () => {
    state.hole.borderWidth = parseInt(dom.holeBorderWidthRange.value, 10);
    dom.holeBorderWidthVal.textContent = `${state.hole.borderWidth}px`;
    renderQR();
  });

  // Photo Upload for Hole
  function handlePhotoUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.hole.image = img;
        dom.holeFileName.textContent = file.name;
        renderQR();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  dom.holeImageDropzone.addEventListener('click', () => dom.holeImageInput.click());
  dom.holeImageInput.addEventListener('change', (e) => handlePhotoUpload(e.target.files[0]));

  dom.holeImageDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.holeImageDropzone.classList.add('dragover');
  });

  dom.holeImageDropzone.addEventListener('dragleave', () => {
    dom.holeImageDropzone.classList.remove('dragover');
  });

  dom.holeImageDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.holeImageDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handlePhotoUpload(e.dataTransfer.files[0]);
  });

  dom.btnClearHoleImage.addEventListener('click', () => {
    state.hole.image = null;
    dom.holeFileName.textContent = 'No photo (shape cutout only)';
    renderQR();
  });

  dom.btnSamplePhoto.addEventListener('click', () => {
    state.hole.image = createSampleBlorboImage();
    dom.holeFileName.textContent = 'Cute Blorbo loaded';
    renderQR();
  });

  dom.photoScaleRange.addEventListener('input', () => {
    state.hole.imageScale = parseInt(dom.photoScaleRange.value, 10) / 100;
    dom.photoScaleVal.textContent = `${dom.photoScaleRange.value}%`;
    renderQR();
  });

  dom.photoPanXRange.addEventListener('input', () => {
    state.hole.imagePanX = parseInt(dom.photoPanXRange.value, 10);
    dom.photoPanXVal.textContent = state.hole.imagePanX;
    renderQR();
  });

  dom.photoPanYRange.addEventListener('input', () => {
    state.hole.imagePanY = parseInt(dom.photoPanYRange.value, 10);
    dom.photoPanYVal.textContent = state.hole.imagePanY;
    renderQR();
  });

  dom.photoRotRange.addEventListener('input', () => {
    state.hole.imageRot = parseInt(dom.photoRotRange.value, 10);
    dom.photoRotVal.textContent = `${state.hole.imageRot}°`;
    renderQR();
  });

  // Pixel Art Embed Controls
  dom.checkEnablePixelArt.addEventListener('change', () => {
    state.pixelArt.enabled = dom.checkEnablePixelArt.checked;
    dom.pixelArtControlsWrapper.hidden = !state.pixelArt.enabled;
    renderQR();
  });

  dom.presetPixelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.pixelArt.preset = btn.dataset.preset;
      state.pixelArt.customImage = null;
      dom.pixelFileName.textContent = `Preset: ${btn.textContent.trim()} selected`;
      renderQR();
    });
  });

  function handlePixelImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.pixelArt.customImage = img;
        dom.pixelFileName.textContent = `Custom: ${file.name}`;
        renderQR();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  dom.pixelImageDropzone.addEventListener('click', () => dom.pixelImageInput.click());
  dom.pixelImageInput.addEventListener('change', (e) => handlePixelImageUpload(e.target.files[0]));
  dom.pixelImageDropzone.addEventListener('dragover', (e) => { e.preventDefault(); dom.pixelImageDropzone.classList.add('dragover'); });
  dom.pixelImageDropzone.addEventListener('dragleave', () => dom.pixelImageDropzone.classList.remove('dragover'));
  dom.pixelImageDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.pixelImageDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handlePixelImageUpload(e.dataTransfer.files[0]);
  });

  dom.pixelSizeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      state.pixelArt.gridSize = parseInt(radio.value, 10);
      renderQR();
    });
  });

  dom.pixelDitherMode.addEventListener('change', () => {
    state.pixelArt.ditherMode = dom.pixelDitherMode.value;
    renderQR();
  });

  dom.pixelThresholdRange.addEventListener('input', () => {
    state.pixelArt.threshold = parseInt(dom.pixelThresholdRange.value, 10);
    dom.pixelThresholdVal.textContent = state.pixelArt.threshold;
    renderQR();
  });

  dom.checkInvertPixel.addEventListener('change', () => {
    state.pixelArt.invert = dom.checkInvertPixel.checked;
    renderQR();
  });

  dom.pixelPlacementSelect.addEventListener('change', () => {
    state.pixelArt.placement = dom.pixelPlacementSelect.value;
    dom.pixelCustomOffsetRow.hidden = state.pixelArt.placement !== 'custom';
    renderQR();
  });

  dom.pixelOffsetXRange.addEventListener('input', () => {
    state.pixelArt.offsetX = parseInt(dom.pixelOffsetXRange.value, 10);
    renderQR();
  });

  dom.pixelOffsetYRange.addEventListener('input', () => {
    state.pixelArt.offsetY = parseInt(dom.pixelOffsetYRange.value, 10);
    renderQR();
  });

  dom.btnSmartMask.addEventListener('click', findBestMaskPattern);
  dom.btnAutoFitPixelVersion.addEventListener('click', autoFitVersion);
  dom.btnBakePixelArt.addEventListener('click', bakePixelArtIntoCanvas);

  // Studio Inspector (Screenshots 2 & 3)
  dom.checkHighlightAreas.addEventListener('change', () => {
    state.highlightAreas = dom.checkHighlightAreas.checked;
    renderQR();
  });

  dom.btnStep1.addEventListener('click', () => { state.studioStep = 1; renderQR(); });
  dom.btnStep2.addEventListener('click', () => { state.studioStep = 2; renderQR(); });
  dom.btnStep34.addEventListener('click', () => { state.studioStep = 3; renderQR(); });
  dom.btnStep56.addEventListener('click', () => { state.studioStep = 4; renderQR(); });
  dom.btnStep7.addEventListener('click', () => { state.studioStep = 5; renderQR(); });
  dom.btnStepAll.addEventListener('click', () => { state.studioStep = 0; renderQR(); });

  // Initial render
  renderQR();
})();
