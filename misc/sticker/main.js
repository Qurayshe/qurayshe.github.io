/**
 * WhatsApp Sticker Maker — 512×512 Static (≤100KB) & Animated (≤500KB) WebP Tool
 * Features recommended 16px transparent safe margin (480×480 content area),
 * drag-to-reposition, die-cut outline, and automatic file-size fitting.
 */
import {
  decodeImageFile,
  extractVideoFrames,
  encodeWebPWithSizeLimit,
  formatBytes,
} from '../gif/codecs.js';

const STICKER_SIZE = 512;
const STATIC_LIMIT = 100 * 1024;   // 100 KB
const ANIM_LIMIT = 500 * 1024;     // 500 KB

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const state = {
  frames: [],
  mediaName: 'plink.png',
  videoEl: null,
  videoUrl: null,

  // Playback
  currentFrame: 0,
  isPlaying: true,
  playTimer: null,

  // Framing & Margin
  useMargin: true,
  marginPx: 16,
  showGuide: true,
  fitMode: 'contain', // 'contain' | 'cover' | 'stretch'
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  flipH: false,
  roundPct: 0,
  outlinePx: 0,

  // Compression & Speed
  autoFit: true,
  quality: 0.85,
  speed: 1,

  // Export
  lastBlobUrl: null,
  isExporting: false,
};

const canvas = $('#stickerCanvas');
const ctx = canvas.getContext('2d');
const contentBuf = document.createElement('canvas');
contentBuf.width = STICKER_SIZE;
contentBuf.height = STICKER_SIZE;
const contentCtx = contentBuf.getContext('2d');

const outlineBuf = document.createElement('canvas');
outlineBuf.width = STICKER_SIZE;
outlineBuf.height = STICKER_SIZE;
const outlineCtx = outlineBuf.getContext('2d');

function showToast(msg, icon = '✨') {
  const box = $('#toastBox');
  $('#toastIcon').textContent = icon;
  $('#toastMsg').textContent = msg;
  box.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => box.classList.remove('show'), 2600);
}

function setProgress(visible, text = '', pct = 0) {
  const box = $('#exportStatusBox');
  box.hidden = !visible;
  if (visible) {
    $('#exportStatusText').textContent = text;
    $('#exportPercentText').textContent = `${Math.round(pct * 100)}%`;
    $('#exportProgressFill').style.width = `${Math.round(pct * 100)}%`;
  }
}

function activeMargin() {
  return state.useMargin ? state.marginPx : 0;
}

/**
 * Renders one sticker frame onto targetCtx (512×512).
 * includeGuide is true ONLY for live preview, never for export.
 */
function renderStickerFrame(frameObj, targetCtx, includeGuide = false) {
  targetCtx.clearRect(0, 0, STICKER_SIZE, STICKER_SIZE);
  if (!frameObj) return;

  const margin = activeMargin();
  const innerSize = Math.max(64, STICKER_SIZE - margin * 2);

  // 1. Render content into contentBuf (clipped to safe box & optional rounded corners)
  contentCtx.clearRect(0, 0, STICKER_SIZE, STICKER_SIZE);
  contentCtx.save();

  const clipR = (innerSize * state.roundPct) / 100;
  contentCtx.beginPath();
  if (clipR > 0) {
    contentCtx.roundRect(margin, margin, innerSize, innerSize, clipR);
  } else {
    contentCtx.rect(margin, margin, innerSize, innerSize);
  }
  contentCtx.clip();

  const src = frameObj.canvas;
  const sw = src.width || 1;
  const sh = src.height || 1;
  let drawW = innerSize;
  let drawH = innerSize;

  if (state.fitMode === 'contain') {
    const s = Math.min(innerSize / sw, innerSize / sh);
    drawW = sw * s;
    drawH = sh * s;
  } else if (state.fitMode === 'cover') {
    const s = Math.max(innerSize / sw, innerSize / sh);
    drawW = sw * s;
    drawH = sh * s;
  }

  drawW *= state.zoom;
  drawH *= state.zoom;

  contentCtx.translate(STICKER_SIZE / 2 + state.offsetX, STICKER_SIZE / 2 + state.offsetY);
  if (state.flipH) contentCtx.scale(-1, 1);
  contentCtx.drawImage(src, -drawW / 2, -drawH / 2, drawW, drawH);
  contentCtx.restore();

  // 2. Optional white die-cut sticker outline
  if (state.outlinePx > 0) {
    outlineCtx.clearRect(0, 0, STICKER_SIZE, STICKER_SIZE);
    const r = state.outlinePx;
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      outlineCtx.drawImage(contentBuf, Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r));
    }
    outlineCtx.globalCompositeOperation = 'source-in';
    outlineCtx.fillStyle = '#ffffff';
    outlineCtx.fillRect(0, 0, STICKER_SIZE, STICKER_SIZE);
    outlineCtx.globalCompositeOperation = 'source-over';
    targetCtx.drawImage(outlineBuf, 0, 0);
  }

  // 3. Draw sticker content
  targetCtx.drawImage(contentBuf, 0, 0);

  // 4. Optional preview-only 16px safe-zone guide
  if (includeGuide && state.showGuide && margin > 0) {
    targetCtx.save();
    targetCtx.strokeStyle = 'rgba(37, 211, 102, 0.9)';
    targetCtx.lineWidth = 2;
    targetCtx.setLineDash([8, 6]);
    targetCtx.strokeRect(margin + 1, margin + 1, innerSize - 2, innerSize - 2);
    targetCtx.restore();
  }
}

function updateSpecPills() {
  const isAnim = state.frames.length > 1;
  $('#specModePill').textContent = isAnim
    ? `Animated · ${state.frames.length}f (≤ 500 KB)`
    : 'Static (≤ 100 KB)';
  const m = activeMargin();
  const inner = STICKER_SIZE - m * 2;
  $('#specMarginPill').textContent = m > 0 ? `Margin: ${m}px (${inner}×${inner})` : 'Margin: 0px (Full 512)';

  $('#playbackCard').hidden = !isAnim;
  $('#animSpeedRow').hidden = !isAnim;

  const scrubber = $('#scrubber');
  scrubber.max = Math.max(0, state.frames.length - 1);
  if (state.currentFrame >= state.frames.length) state.currentFrame = 0;
  scrubber.value = state.currentFrame;
  $('#frameReadout').textContent = `Frame ${state.frames.length ? state.currentFrame + 1 : 0} / ${state.frames.length}`;
}

function renderPreview() {
  if (!state.frames.length) return;
  if (state.currentFrame >= state.frames.length) state.currentFrame = 0;
  renderStickerFrame(state.frames[state.currentFrame], ctx, true);
  updateSpecPills();
}

function stopPlayback() {
  clearTimeout(state.playTimer);
  state.playTimer = null;
  state.isPlaying = false;
  $('#btnPlayPause').textContent = '▶ Play';
}

function scheduleNext() {
  clearTimeout(state.playTimer);
  if (!state.isPlaying || state.frames.length <= 1) return;
  const f = state.frames[state.currentFrame % state.frames.length];
  const delay = Math.max(20, Math.round((f.delay || 100) / Math.max(0.25, state.speed)));
  state.playTimer = setTimeout(() => {
    state.currentFrame = (state.currentFrame + 1) % state.frames.length;
    renderPreview();
    scheduleNext();
  }, delay);
}

function startPlayback() {
  state.isPlaying = true;
  $('#btnPlayPause').textContent = '⏸ Pause';
  renderPreview();
  scheduleNext();
}

function setMedia(frames, name = 'sticker') {
  state.frames = frames;
  state.mediaName = name;
  state.currentFrame = 0;
  state.offsetX = 0;
  state.offsetY = 0;
  $('#videoSection').hidden = true;
  $('#specSizePill').textContent = 'Not exported yet';
  $('#specSizePill').className = 'stat-chip';
  $('#resultBox').hidden = true;
  startPlayback();
}

/* ==========================================================================
   Inputs & Samples
   ========================================================================== */
async function handleFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  if (files.length === 1 && files[0].type.startsWith('video/')) {
    const file = files[0];
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
    state.videoUrl = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.src = state.videoUrl;
    await new Promise((resolve, reject) => {
      v.onloadedmetadata = resolve;
      v.onerror = reject;
    });
    state.videoEl = v;
    const dur = Math.max(0.5, v.duration || 3);
    $('#vidStart').max = dur.toFixed(1);
    $('#vidStart').value = 0;
    $('#lblVidStart').textContent = '0.0s';
    $('#vidEnd').max = dur.toFixed(1);
    const defEnd = Math.min(dur, 3.5);
    $('#vidEnd').value = defEnd.toFixed(1);
    $('#lblVidEnd').textContent = `${defEnd.toFixed(1)}s`;
    $('#videoDurLabel').textContent = `${dur.toFixed(1)}s`;
    $('#videoSection').hidden = false;
    state.mediaName = file.name;
    showToast('Video loaded! Trim & click Extract Sticker Frames.', '🎬');
    return;
  }

  try {
    if (files.length === 1) {
      const decoded = await decodeImageFile(files[0]);
      setMedia(decoded.frames, files[0].name);
      showToast(`Loaded ${files[0].name} (${decoded.frames.length}f)`, '💚');
      return;
    }

    const frames = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      const decoded = await decodeImageFile(f);
      decoded.frames.forEach((fr) => frames.push({ canvas: fr.canvas, delay: fr.delay || 120 }));
    }
    if (frames.length) {
      setMedia(frames, files[0].name);
      showToast(`Created ${frames.length}-frame animated sticker!`, '💚');
    }
  } catch (err) {
    showToast(`Could not load file: ${err.message}`, '⚠️');
  }
}

function generateDoodleSticker() {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 480;
  const g = c.getContext('2d');

  // Cute star-shaped blorbo sticker with transparent background
  g.fillStyle = '#ffe66d';
  g.strokeStyle = '#111111';
  g.lineWidth = 14;
  g.lineJoin = 'round';
  g.beginPath();
  const cx = 240, cy = 240, spikes = 10, outerR = 200, innerR = 145;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
  g.stroke();

  // Happy face
  g.fillStyle = '#111111';
  g.beginPath();
  g.arc(195, 225, 16, 0, Math.PI * 2);
  g.arc(285, 225, 16, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ff70a6';
  g.beginPath();
  g.arc(165, 255, 18, 0, Math.PI * 2);
  g.arc(315, 255, 18, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(240, 245, 34, 0.15 * Math.PI, 0.85 * Math.PI);
  g.lineWidth = 10;
  g.stroke();

  setMedia([{ canvas: c, delay: 100 }], 'doodle-sticker.png');
}

async function loadSample(url, name) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], name, { type: blob.type });
    await handleFiles([file]);
  } catch {
    generateDoodleSticker();
  }
}

/* ==========================================================================
   WebP Export (512×512 with WhatsApp 100KB / 500KB Auto-Fit)
   ========================================================================== */
async function exportSticker() {
  if (state.isExporting || !state.frames.length) return;
  state.isExporting = true;
  try {
    const isAnim = state.frames.length > 1;
    const limit = isAnim ? ANIM_LIMIT : STATIC_LIMIT;
    setProgress(true, isAnim ? 'Rendering animated sticker…' : 'Encoding static WebP…', 0.05);

    const rendered = state.frames.map((f) => {
      const c = document.createElement('canvas');
      c.width = STICKER_SIZE;
      c.height = STICKER_SIZE;
      renderStickerFrame(f, c.getContext('2d'), false);
      return {
        canvas: c,
        delay: Math.max(20, Math.round((f.delay || 100) / Math.max(0.25, state.speed))),
      };
    });

    const { blob, qualityUsed, framesUsed, fitted } = await encodeWebPWithSizeLimit(rendered, {
      width: STICKER_SIZE,
      height: STICKER_SIZE,
      initialQuality: state.quality,
      maxBytes: limit,
      autoFit: state.autoFit,
      onProgress: (p) => setProgress(true, 'Encoding & fitting WebP…', p),
    });

    if (state.lastBlobUrl) URL.revokeObjectURL(state.lastBlobUrl);
    state.lastBlobUrl = URL.createObjectURL(blob);

    const sizePill = $('#specSizePill');
    sizePill.textContent = `${formatBytes(blob.size)} / ${isAnim ? '500 KB' : '100 KB'} ${fitted ? '✓' : '⚠'}`;
    sizePill.className = `stat-chip ${fitted ? 'good' : 'fail'}`;

    $('#resultBox').hidden = false;
    $('#resultPreview').src = state.lastBlobUrl;
    const baseName = state.mediaName.replace(/\.[^.]+$/, '') || 'sticker';
    const outName = `${baseName}-whatsapp.webp`;
    $('#resultSummary').textContent = `${outName} · ${formatBytes(blob.size)} · q=${Math.round(qualityUsed * 100)}%${isAnim ? ` · ${framesUsed}f` : ''}`;
    const dl = $('#btnDownloadResult');
    dl.href = state.lastBlobUrl;
    dl.download = outName;

    showToast(
      fitted
        ? `WhatsApp sticker ready (${formatBytes(blob.size)})!`
        : `Exported (${formatBytes(blob.size)}) — exceeds WhatsApp limit.`,
      fitted ? '💚' : '⚠️'
    );
  } catch (err) {
    showToast(`Export failed: ${err.message}`, '⚠️');
  } finally {
    state.isExporting = false;
    setProgress(false);
  }
}

/* ==========================================================================
   Events & Drag-to-Reposition
   ========================================================================== */
function wireEvents() {
  const dropzone = $('#dropzoneBox');
  $('#fileInput').addEventListener('change', (e) => handleFiles(e.target.files));
  ['dragenter', 'dragover'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
    })
  );
  dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
  document.addEventListener('paste', (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (files.length) handleFiles(files);
  });

  // Samples
  $('#samplePlink').addEventListener('click', () => loadSample('../caption/img/sample.png', 'plink.png'));
  $('#sampleKirby').addEventListener('click', () => loadSample('../caption/img/sample.gif', 'kirby.gif'));
  $('#sampleBlorbo').addEventListener('click', generateDoodleSticker);

  // Video extract
  $('#vidStart').addEventListener('input', (e) => ($('#lblVidStart').textContent = `${parseFloat(e.target.value).toFixed(1)}s`));
  $('#vidEnd').addEventListener('input', (e) => ($('#lblVidEnd').textContent = `${parseFloat(e.target.value).toFixed(1)}s`));
  $('#vidFps').addEventListener('input', (e) => ($('#lblVidFps').textContent = `${e.target.value} fps`));
  $('#btnExtractVideo').addEventListener('click', async () => {
    if (!state.videoEl) return;
    setProgress(true, 'Extracting frames…', 0);
    try {
      const decoded = await extractVideoFrames(state.videoEl, {
        startSec: parseFloat($('#vidStart').value) || 0,
        endSec: parseFloat($('#vidEnd').value) || 3,
        fps: parseInt($('#vidFps').value, 10) || 12,
        maxWidth: STICKER_SIZE,
        maxFrames: 80,
        onProgress: (p) => setProgress(true, 'Extracting frames…', p),
      });
      setMedia(decoded.frames, state.mediaName);
      showToast(`Extracted ${decoded.frames.length} sticker frames!`, '🎬');
    } catch (err) {
      showToast(`Video error: ${err.message}`, '⚠️');
    } finally {
      setProgress(false);
    }
  });

  // Margin & Guide
  const syncMarginRow = () => {
    const row = $('#marginSliderRow');
    row.style.opacity = state.useMargin ? '1' : '0.45';
    row.style.pointerEvents = state.useMargin ? 'auto' : 'none';
    $('#marginSlider').disabled = !state.useMargin;
  };
  $('#toggleMargin').addEventListener('change', (e) => {
    state.useMargin = e.target.checked;
    syncMarginRow();
    renderPreview();
  });
  $('#marginSlider').addEventListener('input', (e) => {
    state.marginPx = parseInt(e.target.value, 10) || 0;
    $('#lblMargin').textContent = `${state.marginPx}px`;
    renderPreview();
  });
  $('#toggleGuide').addEventListener('change', (e) => {
    state.showGuide = e.target.checked;
    renderPreview();
  });

  // Fit, Zoom, Flip, Center
  $$('#fitGroup .segmented-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      $$('#fitGroup .segmented-btn').forEach((b) => b.classList.toggle('active', b === btn));
      state.fitMode = btn.dataset.fit;
      renderPreview();
    })
  );
  $('#zoomSlider').addEventListener('input', (e) => {
    state.zoom = (parseInt(e.target.value, 10) || 100) / 100;
    $('#lblZoom').textContent = `${e.target.value}%`;
    renderPreview();
  });
  $('#btnFlipH').addEventListener('click', () => {
    state.flipH = !state.flipH;
    renderPreview();
  });
  $('#btnCenter').addEventListener('click', () => {
    state.offsetX = 0;
    state.offsetY = 0;
    renderPreview();
  });

  // Shape & Outline
  $('#roundSlider').addEventListener('input', (e) => {
    state.roundPct = parseInt(e.target.value, 10) || 0;
    $('#lblRound').textContent = `${state.roundPct}%`;
    renderPreview();
  });
  $('#outlineSlider').addEventListener('input', (e) => {
    state.outlinePx = parseInt(e.target.value, 10) || 0;
    $('#lblOutline').textContent = state.outlinePx ? `${state.outlinePx}px` : 'Off';
    renderPreview();
  });

  // Compression & Speed
  $('#toggleAutoFit').addEventListener('change', (e) => (state.autoFit = e.target.checked));
  $('#qualitySlider').addEventListener('input', (e) => {
    state.quality = (parseInt(e.target.value, 10) || 85) / 100;
    $('#lblQuality').textContent = `${e.target.value}%`;
  });
  $('#speedSlider').addEventListener('input', (e) => {
    state.speed = parseFloat(e.target.value) || 1;
    $('#lblSpeed').textContent = `${state.speed.toFixed(2)}×`;
    if (state.isPlaying) scheduleNext();
  });

  // Playback
  $('#btnPlayPause').addEventListener('click', () => (state.isPlaying ? stopPlayback() : startPlayback()));
  $('#btnPrev').addEventListener('click', () => {
    stopPlayback();
    const n = state.frames.length || 1;
    state.currentFrame = (state.currentFrame - 1 + n) % n;
    renderPreview();
  });
  $('#btnNext').addEventListener('click', () => {
    stopPlayback();
    const n = state.frames.length || 1;
    state.currentFrame = (state.currentFrame + 1) % n;
    renderPreview();
  });
  $('#scrubber').addEventListener('input', (e) => {
    stopPlayback();
    state.currentFrame = parseInt(e.target.value, 10) || 0;
    renderPreview();
  });

  // Drag on canvas to reposition
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const scale = STICKER_SIZE / (rect.width || 1);
    state.offsetX += Math.round((e.clientX - lastX) * scale);
    state.offsetY += Math.round((e.clientY - lastY) * scale);
    lastX = e.clientX;
    lastY = e.clientY;
    renderPreview();
  });
  const stopDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  // Reset
  $('#btnReset').addEventListener('click', () => {
    state.useMargin = true;
    state.marginPx = 16;
    state.showGuide = true;
    state.fitMode = 'contain';
    state.zoom = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    state.flipH = false;
    state.roundPct = 0;
    state.outlinePx = 0;
    state.autoFit = true;
    state.quality = 0.85;
    state.speed = 1;

    $('#toggleMargin').checked = true;
    $('#marginSlider').value = 16;
    $('#lblMargin').textContent = '16px';
    $('#toggleGuide').checked = true;
    $('#zoomSlider').value = 100;
    $('#lblZoom').textContent = '100%';
    $('#roundSlider').value = 0;
    $('#lblRound').textContent = '0%';
    $('#outlineSlider').value = 0;
    $('#lblOutline').textContent = 'Off';
    $('#toggleAutoFit').checked = true;
    $('#qualitySlider').value = 85;
    $('#lblQuality').textContent = '85%';
    $('#speedSlider').value = 1;
    $('#lblSpeed').textContent = '1.00×';
    $$('#fitGroup .segmented-btn').forEach((b) => b.classList.toggle('active', b.dataset.fit === 'contain'));
    syncMarginRow();
    renderPreview();
    showToast('Settings reset!', '↺');
  });

  // Exports
  $('#btnExportSticker').addEventListener('click', exportSticker);
  $('#btnDownloadPng').addEventListener('click', () => {
    if (!state.frames.length) return;
    const out = document.createElement('canvas');
    out.width = STICKER_SIZE;
    out.height = STICKER_SIZE;
    renderStickerFrame(state.frames[state.currentFrame], out.getContext('2d'), false);
    const a = document.createElement('a');
    a.href = out.toDataURL('image/png');
    a.download = 'whatsapp-sticker.png';
    a.click();
    showToast('Saved 512×512 PNG!', '🖼️');
  });
}

wireEvents();
generateDoodleSticker();
