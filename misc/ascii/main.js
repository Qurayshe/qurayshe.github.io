/**
 * ASCII Filter — UI controller
 * -----------------------------------------------------------------------------
 * Owns the state object, the offscreen sampling canvas and every control.
 * Rendering is coalesced through requestAnimationFrame: dragging a slider only
 * marks the view dirty, so a burst of input events produces one frame.
 *
 * The heavy lifting lives in ./ascii-engine.js (sampler + WebGL2/Canvas2D
 * renderers). Frame-based design: see renderNow() — feeding a video element
 * later is just swapping `source.el` and calling renderNow() from a rAF loop.
 */

import {
  RAMP_PRESETS,
  AsciiSampler,
  createRenderer,
  buildGlyphAtlas,
  measureGlyphCell,
  fontSpec,
  computeRows,
  normalizeCharset,
  parseHexColor,
} from './ascii-engine.js';

/** Every tunable default in one place (mirrors the markup's initial values). */
const DEFAULTS = Object.freeze({
  cols: 90,
  glyphPx: 10,
  renderScale: 2,
  rampPreset: 'classic',
  customRamp: ' .:-=+*#%@',
  invert: false,
  dither: false,
  brightness: 0,
  contrast: 100,
  gamma: 100,
  edge: 0,
  smooth: 0,
  autoLevels: false,
  colorMode: 'mono',
  ink: '#111111',
  highlight: '#ff70a6',
  paper: '#ffffff',
  transparent: false,
  font: "'JetBrains Mono', monospace",
  bold: true,
});

const g = { ...DEFAULTS };

const SAMPLE_IMAGE = './img/sample.png';

(() => {
  const $ = (sel) => document.querySelector(sel);

  /* ------------------------------------------------------------------ refs */
  const els = {
    canvas: $('#asciiCanvas'),
    stage: $('#stageWrap'),
    dropzone: $('#dropzoneBox'),
    fileInput: $('#fileInput'),
    rampSelect: $('#rampSelect'),
    customRampRow: $('#customRampRow'),
    customRampInput: $('#customRampInput'),
    rampPreview: $('#rampPreview'),
    rampLengthChip: $('#rampLengthChip'),
    fontSelect: $('#fontSelect'),
    statGrid: $('#statGrid'),
    statGlyphs: $('#statGlyphs'),
    statTime: $('#statTime'),
    statEngine: $('#statEngine'),
    sourceName: $('#sourceName'),
    sourceDim: $('#sourceDim'),
    toast: $('#toastBox'),
    toastMsg: $('#toastMsg'),
    toastIcon: $('#toastIcon'),
    titleBadge: $('#titleBadge'),
    colorModeGroup: $('#colorModeGroup'),
    scaleGroup: $('#scaleGroup'),
    inkRow: $('#inkRow'),
    highlightRow: $('#highlightRow'),
  };

  /* --------------------------------------------------------------- runtime */
  const sampler = new AsciiSampler();
  let renderer = null;
  let source = null; // { el, width, height, name }
  let objectUrl = null;
  let charset = normalizeCharset(RAMP_PRESETS.classic);
  let grid = { cols: 0, rows: 0, cellW: 0, cellH: 0 };
  let rebuildToken = 0;
  let rafId = 0;
  let rebuildQueued = false;
  let lastRenderMs = 0;

  // Offscreen canvases: grid = cols x rows (tiny, read back every frame),
  // mid = one intermediate step so huge photos don't alias when squashed.
  const gridCanvas = document.createElement('canvas');
  const gridCtx = gridCanvas.getContext('2d', { willReadFrequently: true });
  const midCanvas = document.createElement('canvas');
  const midCtx = midCanvas.getContext('2d');

  /* --------------------------------------------------------------- helpers */
  const hexToRgb255 = parseHexColor;

  function toast(message, icon = '✨') {
    if (!els.toast) return;
    els.toastMsg.textContent = message;
    els.toastIcon.textContent = icon;
    els.toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => els.toast.classList.remove('show'), 2400);
  }

  function activeRamp() {
    if (g.rampPreset === 'custom') return normalizeCharset(g.customRamp);
    return normalizeCharset(RAMP_PRESETS[g.rampPreset] || RAMP_PRESETS.classic);
  }

  function fontPx() {
    return Math.max(4, g.glyphPx * g.renderScale);
  }

  function currentFontSpec() {
    return fontSpec(g.font, g.bold, fontPx());
  }

  function paperRgb() {
    return hexToRgb255(g.paper);
  }

  /* ------------------------------------------------------- render pipeline */
  function sampleOptions() {
    return {
      charset,
      invert: g.invert,
      dither: g.dither,
      brightness: g.brightness / 100,
      contrast: g.contrast / 100,
      gamma: g.gamma / 100,
      edge: g.edge / 100,
      smooth: g.smooth,
      autoLevels: g.autoLevels,
      colorMode: g.colorMode,
      ink: hexToRgb255(g.ink),
      highlight: hexToRgb255(g.highlight),
    };
  }

  function renderOptions() {
    const paper = paperRgb();
    return {
      background: g.transparent
        ? [0, 0, 0, 0]
        : [paper[0] / 255, paper[1] / 255, paper[2] / 255, 1],
      backgroundCss: g.paper,
      inkCss: g.ink,
      mono: g.colorMode === 'mono',
    };
  }

  /** Squash the source into a cols x rows buffer (two-step for big images). */
  function drawSourceToGrid() {
    const { cols, rows } = grid;
    const sw = source.width;
    const sh = source.height;

    gridCtx.setTransform(1, 0, 0, 1, 0, 0);
    gridCtx.imageSmoothingEnabled = true;
    gridCtx.imageSmoothingQuality = 'high';

    if (Math.min(sw / cols, sh / rows) > 3) {
      const iw = Math.max(cols, Math.round(cols * 4));
      const ih = Math.max(rows, Math.round(rows * 4));
      midCanvas.width = iw;
      midCanvas.height = ih;
      midCtx.setTransform(1, 0, 0, 1, 0, 0);
      midCtx.imageSmoothingEnabled = true;
      midCtx.imageSmoothingQuality = 'high';
      midCtx.drawImage(source.el, 0, 0, iw, ih);
      gridCtx.drawImage(midCanvas, 0, 0, iw, ih, 0, 0, cols, rows);
    } else {
      gridCtx.drawImage(source.el, 0, 0, sw, sh, 0, 0, cols, rows);
    }
  }

  /** One full frame: downscale -> sample -> GPU draw. */
  function renderNow() {
    rafId = 0;
    if (!renderer || !source || !grid.cols || !grid.rows) return;

    const t0 = performance.now();
    drawSourceToGrid();
    const image = gridCtx.getImageData(0, 0, grid.cols, grid.rows);
    const cells = sampler.sample(image.data, sampleOptions());
    renderer.renderFrame(cells, grid.cols, grid.rows, renderOptions());
    lastRenderMs = performance.now() - t0;

    if (els.statGrid) els.statGrid.textContent = `${grid.cols} × ${grid.rows}`;
    if (els.statGlyphs) els.statGlyphs.textContent = (grid.cols * grid.rows).toLocaleString();
    if (els.statTime) els.statTime.textContent = `${lastRenderMs.toFixed(1)} ms`;
  }

  function scheduleRender() {
    if (rafId) return;
    rafId = requestAnimationFrame(renderNow);
  }

  /** Rebuild geometry + atlas (cols, glyph size, scale, ramp, font changed). */
  async function rebuild() {
    rebuildQueued = false;
    const token = ++rebuildToken;
    const fontSize = fontPx();
    const spec = currentFontSpec();

    // Wait for the glyph font before measuring / rasterising the atlas.
    try {
      if (document.fonts && document.fonts.load) await document.fonts.load(spec);
    } catch (err) {
      /* offline or unsupported font: fall back silently */
    }
    if (token !== rebuildToken) return; // a newer rebuild superseded this one

    const measured = measureGlyphCell(g.font, g.bold, fontSize);
    const srcW = source ? source.width : 4;
    const srcH = source ? source.height : 3;
    const rows = computeRows(g.cols, srcW, srcH, measured.cellW, measured.cellH);

    grid = { cols: g.cols, rows, cellW: measured.cellW, cellH: measured.cellH };
    charset = activeRamp();

    if (renderer) {
      const atlas = buildGlyphAtlas({
        charset,
        font: spec,
        cellW: measured.cellW,
        cellH: measured.cellH,
      });
      renderer.setAtlas(atlas, { charset, font: spec, cellW: measured.cellW, cellH: measured.cellH });
      renderer.resize(g.cols * measured.cellW, rows * measured.cellH);
    }

    sampler.resize(g.cols, rows);
    gridCanvas.width = g.cols;
    gridCanvas.height = rows;

    els.canvas.classList.toggle('transparent-bg', g.transparent);
    renderNow();
  }

  function scheduleRebuild() {
    if (rebuildQueued) return;
    rebuildQueued = true;
    setTimeout(() => {
      rebuild().catch((err) => {
        console.error('[ascii] rebuild failed', err);
        toast('something went sideways while rebuilding', '😵');
      });
    }, 0);
  }

  /* ---------------------------------------------------------------- source */
  function updateSourceUi() {
    if (!source) return;
    if (els.sourceName) els.sourceName.textContent = source.name;
    if (els.sourceDim) els.sourceDim.textContent = `${source.width} × ${source.height} px`;
    els.stage.classList.remove('is-empty');
  }

  function makeTestCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 640, 480);
    bg.addColorStop(0, '#a349a1');
    bg.addColorStop(0.45, '#00a3e8');
    bg.addColorStop(1, '#ffe66d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 640, 480);

    // soft sun
    const sun = ctx.createRadialGradient(455, 150, 10, 455, 150, 130);
    sun.addColorStop(0, '#fffdf5');
    sun.addColorStop(0.55, '#ffe66d');
    sun.addColorStop(1, 'rgba(255, 230, 109, 0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(455, 150, 130, 0, Math.PI * 2);
    ctx.fill();

    // mountains
    ctx.fillStyle = '#4b2a5e';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(150, 235);
    ctx.lineTo(300, 480);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a1636';
    ctx.beginPath();
    ctx.moveTo(210, 480);
    ctx.lineTo(405, 195);
    ctx.lineTo(600, 480);
    ctx.closePath();
    ctx.fill();

    // ground + reflection bands (nice ramp test)
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 400, 640, 80);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 - i * 0.09})`;
      ctx.fillRect(24 + i * 60, 410 + (i % 3) * 8, 46, 6);
    }

    // big foreground text for edge-boost testing
    ctx.fillStyle = '#fffdf5';
    ctx.font = "700 74px 'DynaPuff', 'Patrick Hand', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('ASCII', 320, 120);

    return canvas;
  }

  function loadImageSource(src, name, revoke) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (objectUrl && objectUrl !== src) URL.revokeObjectURL(objectUrl);
        objectUrl = revoke ? src : null;
        source = {
          el: img,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          name,
        };
        updateSourceUi();
        resolve(source);
      };
      img.onerror = () => reject(new Error('image failed to load: ' + src));
      img.src = src;
    });
  }

  function useCanvasSource(canvas, name) {
    source = { el: canvas, width: canvas.width, height: canvas.height, name };
    updateSourceUi();
    return Promise.resolve(source);
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast('that file is not an image', '🤔');
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      await loadImageSource(url, file.name || 'pasted-image.png', true);
      scheduleRebuild();
      toast(`loaded ${file.name || 'image'}`, '🖼️');
    } catch (err) {
      URL.revokeObjectURL(url);
      toast('could not read that image', '😵');
    }
  }

  /* ------------------------------------------------------------ UI syncing */
  function updateRampUi() {
    charset = activeRamp();
    if (els.rampPreview) els.rampPreview.textContent = charset.join('');
    if (els.rampLengthChip) els.rampLengthChip.textContent = `${charset.length} chars`;
    if (els.customRampRow) els.customRampRow.hidden = g.rampPreset !== 'custom';
  }

  function updateColorModeUi() {
    if (els.inkRow) els.inkRow.hidden = g.colorMode === 'source';
    if (els.highlightRow) els.highlightRow.hidden = g.colorMode !== 'duotone';
    if (els.colorModeGroup) {
      els.colorModeGroup.querySelectorAll('.segmented-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.mode === g.colorMode);
      });
    }
  }

  function markSwatches() {
    const mark = (containerId, value) => {
      const wrap = $('#' + containerId);
      if (!wrap) return;
      wrap.querySelectorAll('.color-swatch-btn').forEach((btn) => {
        btn.classList.toggle(
          'active',
          String(btn.dataset.color).toLowerCase() === String(value).toLowerCase()
        );
      });
    };
    mark('inkSwatches', g.ink);
    mark('highlightSwatches', g.highlight);
    mark('paperSwatches', g.paper);
  }

  function syncUiFromState() {
    const setRange = (id, value, labelId, format) => {
      const input = $('#' + id);
      if (!input) return;
      input.value = String(value);
      const label = labelId ? $('#' + labelId) : null;
      if (label) label.textContent = format ? format(value) : String(value);
    };

    setRange('colsSlider', g.cols, 'lblCols', (v) => String(v));
    setRange('glyphSlider', g.glyphPx, 'lblGlyph', (v) => `${v}px`);
    setRange('brightnessSlider', g.brightness, 'lblBrightness', (v) => String(v));
    setRange('contrastSlider', g.contrast, 'lblContrast', (v) => String(v));
    setRange('gammaSlider', g.gamma, 'lblGamma', (v) => (v / 100).toFixed(2));
    setRange('edgeSlider', g.edge, 'lblEdge', (v) => String(v));
    setRange('smoothSlider', g.smooth, 'lblSmooth', (v) => String(v));

    const setToggle = (id, value) => {
      const input = $('#' + id);
      if (input) input.checked = !!value;
    };
    setToggle('invertToggle', g.invert);
    setToggle('ditherToggle', g.dither);
    setToggle('autoLevelsToggle', g.autoLevels);
    setToggle('transparentToggle', g.transparent);
    setToggle('boldToggle', g.bold);

    const setColor = (id, value) => {
      const input = $('#' + id);
      if (input) input.value = value;
    };
    setColor('inkColorPicker', g.ink);
    setColor('highlightColorPicker', g.highlight);
    setColor('paperColorPicker', g.paper);

    if (els.rampSelect) els.rampSelect.value = g.rampPreset;
    if (els.customRampInput) els.customRampInput.value = g.customRamp;
    if (els.fontSelect) els.fontSelect.value = g.font;

    if (els.scaleGroup) {
      els.scaleGroup.querySelectorAll('.segmented-btn').forEach((btn) => {
        btn.classList.toggle('active', Number(btn.dataset.scale) === g.renderScale);
      });
    }

    updateRampUi();
    updateColorModeUi();
    markSwatches();
    els.canvas.classList.toggle('transparent-bg', g.transparent);
  }

  /* --------------------------------------------------------------- binding */
  function bindRange(id, key, labelId, format, needsRebuild) {
    const input = $('#' + id);
    if (!input) return;
    const label = labelId ? $('#' + labelId) : null;
    const sync = () => {
      g[key] = Number(input.value);
      if (label) label.textContent = format ? format(g[key]) : String(g[key]);
      if (needsRebuild) scheduleRebuild();
      else scheduleRender();
    };
    input.addEventListener('input', sync);
  }

  function bindToggle(id, key, needsRebuild) {
    const input = $('#' + id);
    if (!input) return;
    input.addEventListener('change', () => {
      g[key] = input.checked;
      if (needsRebuild) scheduleRebuild();
      else scheduleRender();
    });
  }

  function bindColorPicker(id, key, swatchContainerId) {
    const input = $('#' + id);
    if (!input) return;
    input.addEventListener('input', () => {
      g[key] = input.value;
      markSwatches();
      scheduleRender();
    });
    const wrap = $('#' + swatchContainerId);
    if (!wrap) return;
    wrap.querySelectorAll('.color-swatch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        g[key] = btn.dataset.color;
        input.value = g[key];
        markSwatches();
        scheduleRender();
      });
    });
  }

  function bindSegmented(groupId, key, attribute, valueParser, needsRebuild) {
    const group = $('#' + groupId);
    if (!group) return;
    group.querySelectorAll('.segmented-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = btn.dataset[attribute];
        g[key] = valueParser ? valueParser(raw) : raw;
        group.querySelectorAll('.segmented-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        updateColorModeUi();
        if (needsRebuild) scheduleRebuild();
        else scheduleRender();
      });
    });
  }

  function bindControls() {
    /* ramp */
    if (els.rampSelect) {
      els.rampSelect.addEventListener('change', () => {
        g.rampPreset = els.rampSelect.value;
        updateRampUi();
        scheduleRebuild();
      });
    }
    if (els.customRampInput) {
      els.customRampInput.addEventListener('input', () => {
        g.customRamp = els.customRampInput.value;
        if (g.rampPreset !== 'custom') {
          g.rampPreset = 'custom';
          if (els.rampSelect) els.rampSelect.value = 'custom';
        }
        updateRampUi();
        scheduleRebuild();
      });
    }

    /* tone & detail */
    bindRange('colsSlider', 'cols', 'lblCols', (v) => String(v), true);
    bindRange('glyphSlider', 'glyphPx', 'lblGlyph', (v) => `${v}px`, true);
    bindRange('brightnessSlider', 'brightness', 'lblBrightness', (v) => String(v), false);
    bindRange('contrastSlider', 'contrast', 'lblContrast', (v) => String(v), false);
    bindRange('gammaSlider', 'gamma', 'lblGamma', (v) => (v / 100).toFixed(2), false);
    bindRange('edgeSlider', 'edge', 'lblEdge', (v) => String(v), false);
    bindRange('smoothSlider', 'smooth', 'lblSmooth', (v) => String(v), false);

    bindToggle('invertToggle', 'invert', false);
    bindToggle('ditherToggle', 'dither', false);
    bindToggle('autoLevelsToggle', 'autoLevels', false);

    /* ink & colours */
    bindSegmented('colorModeGroup', 'colorMode', 'mode', null, false);
    bindColorPicker('inkColorPicker', 'ink', 'inkSwatches');
    bindColorPicker('highlightColorPicker', 'highlight', 'highlightSwatches');
    bindColorPicker('paperColorPicker', 'paper', 'paperSwatches');
    bindToggle('transparentToggle', 'transparent', false);

    /* font */
    if (els.fontSelect) {
      els.fontSelect.addEventListener('change', () => {
        g.font = els.fontSelect.value;
        scheduleRebuild();
      });
    }
    bindToggle('boldToggle', 'bold', true);

    /* raster scale */
    bindSegmented('scaleGroup', 'renderScale', 'scale', Number, true);

    /* title wobble */
    if (els.titleBadge) {
      els.titleBadge.addEventListener('click', () => {
        els.titleBadge.classList.remove('is-wobbling');
        void els.titleBadge.offsetWidth;
        els.titleBadge.classList.add('is-wobbling');
      });
    }
  }

  /* --------------------------------------------------------------- exports */
  function canvasBlob() {
    return new Promise((resolve) => {
      if (!els.canvas.toBlob) {
        resolve(null);
        return;
      }
      els.canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  function requireSource() {
    if (source) return true;
    toast('load an image first!', '🖼️');
    return false;
  }

  async function downloadPng() {
    if (!requireSource()) return;
    const blob = await canvasBlob();
    if (!blob) {
      toast('PNG export is not supported here', '😵');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascii-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('saved ascii.png', '💾');
  }

  async function copyPng() {
    if (!requireSource()) return;
    try {
      const blob = await canvasBlob();
      if (!blob) throw new Error('no blob');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('PNG copied to clipboard', '📋');
    } catch (err) {
      toast('clipboard blocked — use Download PNG', '🚫');
    }
  }

  async function copyText() {
    if (!requireSource()) return;
    try {
      await navigator.clipboard.writeText(sampler.toText());
      toast('characters copied as text', '📄');
    } catch (err) {
      toast('clipboard blocked — use the .txt download', '🚫');
    }
  }

  function downloadTxt() {
    if (!requireSource()) return;
    const blob = new Blob([sampler.toText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascii-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('saved ascii.txt', '⬇');
  }

  function resetAll() {
    Object.assign(g, DEFAULTS);
    syncUiFromState();
    scheduleRebuild();
    toast('back to defaults', '↺');
  }

  /* -------------------------------------------------------------- io wiring */
  function bindIo() {
    const samplePlink = $('#samplePlink');
    const sampleTestCard = $('#sampleTestCard');

    if (samplePlink) {
      samplePlink.addEventListener('click', async () => {
        try {
          await loadImageSource(SAMPLE_IMAGE, 'sample.png');
          scheduleRebuild();
          toast('plink!', '🐱');
        } catch (err) {
          toast('sample failed to load', '😵');
        }
      });
    }

    if (sampleTestCard) {
      sampleTestCard.addEventListener('click', async () => {
        await useCanvasSource(makeTestCard(), 'test-card.png');
        scheduleRebuild();
        toast('test card ready', '🌈');
      });
    }

    if (els.fileInput) {
      els.fileInput.addEventListener('change', () => {
        const file = els.fileInput.files && els.fileInput.files[0];
        if (file) handleFile(file);
        els.fileInput.value = '';
      });
    }

    if (els.dropzone) {
      els.dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (els.fileInput) els.fileInput.click();
        }
      });
    }

    // Drag & drop anywhere on the page
    const setDrag = (on) => {
      if (els.dropzone) els.dropzone.classList.toggle('drag-over', on);
      if (els.stage) els.stage.classList.toggle('drag-over', on);
    };
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      setDrag(true);
    });
    window.addEventListener('dragleave', (e) => {
      if (!e.relatedTarget) setDrag(false);
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      setDrag(false);
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    // Paste from the clipboard
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image/') === 0) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
          }
          return;
        }
      }
    });

    const bindClick = (sel, fn) => {
      const node = $(sel);
      if (node) node.addEventListener('click', fn);
    };
    bindClick('#btnDownloadPng', downloadPng);
    bindClick('#btnCopyPng', copyPng);
    bindClick('#btnCopyText', copyText);
    bindClick('#btnDownloadTxt', downloadTxt);
    bindClick('#btnReset', resetAll);
  }

  /* ------------------------------------------------------------------ boot */
  async function init() {
    if (!els.canvas) return;

    try {
      renderer = await createRenderer(els.canvas, 'auto');
    } catch (err) {
      // WebGL2 bound the canvas before failing; swap in a fresh node for 2D.
      const fresh = els.canvas.cloneNode(false);
      els.canvas.replaceWith(fresh);
      els.canvas = fresh;
      try {
        renderer = await createRenderer(fresh, 'canvas2d');
      } catch (err2) {
        console.error('[ascii] no renderer available', err2);
        toast('this browser cannot render the preview', '😵');
        return;
      }
    }

    if (els.statEngine) els.statEngine.textContent = renderer.backend;

    bindControls();
    bindIo();
    syncUiFromState();

    // Glyph fonts must be ready before we measure / rasterise the atlas.
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    } catch (err) {
      /* ignore */
    }

    try {
      await loadImageSource(SAMPLE_IMAGE, 'sample.png');
    } catch (err) {
      await useCanvasSource(makeTestCard(), 'test-card.png');
    }

    await rebuild();

    // Late font swaps (slow network) deserve a re-rasterised atlas.
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', () => scheduleRebuild());
    }

    if (els.statEngine) els.statEngine.textContent = renderer.backend;

    // Handy for tinkering in the console (and for future video/GIF loops).
    window.asciiFilter = {
      state: g,
      DEFAULTS,
      sampler,
      get renderer() {
        return renderer;
      },
      renderNow,
      rebuild,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
