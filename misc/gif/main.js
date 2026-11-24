/**
 * GIF Studio — Client-Side ezgif-style GIF Maker, Optimizer, Effects & Converter
 */
import {
  decodeGifBuffer,
  decodeImageFile,
  extractVideoFrames,
  encodeGifFrames,
  encodeAnimatedWebP,
  loadImageToCanvas,
  formatBytes,
} from './codecs.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const state = {
  frames: [], // [{ canvas, delay }]
  srcWidth: 320,
  srcHeight: 320,
  srcBytes: 0,
  mediaName: 'doodle.gif',
  videoEl: null,
  videoUrl: null,

  // Playback
  currentFrame: 0,
  isPlaying: true,
  playTimer: null,

  // Transform
  outWidth: 320,
  outHeight: 320,
  lockAspect: true,
  crop: 'none', // 'none' | '1:1' | '16:9' | '4:3'
  rotate: 0,
  flipH: false,
  flipV: false,
  speed: 1,
  reverse: false,
  boomerang: false,

  // Optimize
  maxColors: 256,
  frameDrop: 1,
  webpQuality: 0.82,

  // Effects
  fxBright: 100,
  fxContrast: 100,
  fxSat: 100,
  fxHue: 0,
  fxGray: false,
  fxSepia: false,
  fxInvert: false,
  fxPixel: 1,
  fxRound: 0,
  fxMotion: 'none', // 'none' | 'shake' | 'pulse' | 'spin' | 'rainbow'

  // Text
  overlayText: '',
  textPos: 'bottom',
  textSize: 34,
  textFill: '#ffffff',
  textStroke: '#111111',

  // Result
  lastBlob: null,
  lastBlobUrl: null,
  isExporting: false,
};

const previewCanvas = $('#previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const offCanvas = document.createElement('canvas');
const offCtx = offCanvas.getContext('2d');

function showToast(msg, icon = '✨') {
  const box = $('#toastBox');
  $('#toastIcon').textContent = icon;
  $('#toastMsg').textContent = msg;
  box.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => box.classList.remove('show'), 2600);
}

function setExportProgress(visible, text = '', pct = 0) {
  const box = $('#exportStatusBox');
  box.hidden = !visible;
  if (visible) {
    $('#exportStatusText').textContent = text;
    $('#exportPercentText').textContent = `${Math.round(pct * 100)}%`;
    $('#exportProgressFill').style.width = `${Math.round(pct * 100)}%`;
  }
}

/* ==========================================================================
   Active Frame Sequence Builder (handles reverse, boomerang, drop, static->gif)
   ========================================================================== */
function getEffectiveSequence() {
  if (!state.frames.length) return [];

  // Static-to-GIF procedural motion when 1 frame + motion selected
  let seq = state.frames.map((f, idx) => ({ canvas: f.canvas, delay: f.delay, srcIdx: idx }));
  if (seq.length === 1 && state.fxMotion !== 'none') {
    const base = seq[0];
    seq = Array.from({ length: 12 }, (_, i) => ({
      canvas: base.canvas,
      delay: 75,
      srcIdx: 0,
      motionPhase: i / 12,
    }));
  } else {
    seq = seq.map((item, i) => ({ ...item, motionPhase: seq.length > 1 ? i / seq.length : 0 }));
  }

  if (state.reverse) {
    seq = [...seq].reverse();
  }

  if (state.boomerang && seq.length > 2) {
    const back = seq.slice(1, -1).reverse();
    seq = [...seq, ...back];
  }

  // Frame drop (preserving duration)
  const drop = Math.max(1, state.frameDrop);
  if (drop > 1 && seq.length > drop) {
    const reduced = [];
    for (let i = 0; i < seq.length; i += drop) {
      let delaySum = 0;
      for (let j = i; j < Math.min(seq.length, i + drop); j++) {
        delaySum += seq[j].delay;
      }
      reduced.push({ ...seq[i], delay: delaySum });
    }
    seq = reduced;
  }

  // Speed multiplier
  return seq.map((item) => ({
    ...item,
    delay: Math.max(20, Math.round(item.delay / Math.max(0.25, state.speed))),
  }));
}

function getOutputDimensions() {
  const swapped = state.rotate === 90 || state.rotate === 270;
  let w = Math.max(16, Math.round(state.outWidth));
  let h = Math.max(16, Math.round(state.outHeight));
  if (state.crop !== 'none') {
    const [rw, rh] = state.crop.split(':').map(Number);
    const targetRatio = rw / rh;
    if (w / h > targetRatio) {
      w = Math.max(16, Math.round(h * targetRatio));
    } else {
      h = Math.max(16, Math.round(w / targetRatio));
    }
  }
  return swapped ? { width: h, height: w } : { width: w, height: h };
}

function buildFilterString(motionPhase = 0) {
  const parts = [];
  if (state.fxBright !== 100) parts.push(`brightness(${state.fxBright}%)`);
  if (state.fxContrast !== 100) parts.push(`contrast(${state.fxContrast}%)`);
  if (state.fxSat !== 100) parts.push(`saturate(${state.fxSat}%)`);
  let hue = state.fxHue;
  if (state.fxMotion === 'rainbow') {
    hue = (hue + Math.round(motionPhase * 360)) % 360;
  }
  if (hue !== 0) parts.push(`hue-rotate(${hue}deg)`);
  if (state.fxGray) parts.push('grayscale(100%)');
  if (state.fxSepia) parts.push('sepia(100%)');
  if (state.fxInvert) parts.push('invert(100%)');
  return parts.length ? parts.join(' ') : 'none';
}

/**
 * Render one processed frame onto targetCanvas (with transform, crop, effects, text).
 */
function renderProcessedFrame(seqItem, targetCanvas) {
  const { width, height } = getOutputDimensions();
  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }
  const ctx = targetCanvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  const src = seqItem.canvas;
  const sw = src.width;
  const sh = src.height;

  // Source crop rect
  let sx = 0, sy = 0, cw = sw, ch = sh;
  if (state.crop !== 'none') {
    const [rw, rh] = state.crop.split(':').map(Number);
    const targetRatio = rw / rh;
    if (sw / sh > targetRatio) {
      cw = Math.round(sh * targetRatio);
      sx = Math.round((sw - cw) / 2);
    } else {
      ch = Math.round(sw / targetRatio);
      sy = Math.round((sh - ch) / 2);
    }
  }

  ctx.save();

  // Optional rounded corners clip
  if (state.fxRound > 0) {
    const r = (Math.min(width, height) * state.fxRound) / 100;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, r);
    ctx.clip();
  }

  // Motion FX transforms
  const phase = seqItem.motionPhase || 0;
  const angle = phase * Math.PI * 2;
  let extraTx = 0, extraTy = 0, extraScale = 1, extraRot = 0;
  if (state.fxMotion === 'shake') {
    extraTx = Math.sin(angle * 3) * (width * 0.04);
    extraTy = Math.cos(angle * 4) * (height * 0.04);
    extraScale = 1.08;
  } else if (state.fxMotion === 'pulse') {
    extraScale = 1 + Math.sin(angle) * 0.14;
  } else if (state.fxMotion === 'spin') {
    extraRot = angle;
  }

  ctx.translate(width / 2 + extraTx, height / 2 + extraTy);
  ctx.rotate((state.rotate * Math.PI) / 180 + extraRot);
  ctx.scale((state.flipH ? -1 : 1) * extraScale, (state.flipV ? -1 : 1) * extraScale);

  const swapped = state.rotate === 90 || state.rotate === 270;
  const drawW = swapped ? height : width;
  const drawH = swapped ? width : height;

  ctx.filter = buildFilterString(phase);

  if (state.fxPixel > 1) {
    const pw = Math.max(1, Math.round(drawW / state.fxPixel));
    const ph = Math.max(1, Math.round(drawH / state.fxPixel));
    offCanvas.width = pw;
    offCanvas.height = ph;
    offCtx.imageSmoothingEnabled = true;
    offCtx.clearRect(0, 0, pw, ph);
    offCtx.drawImage(src, sx, sy, cw, ch, 0, 0, pw, ph);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offCanvas, 0, 0, pw, ph, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.imageSmoothingEnabled = true;
  } else {
    ctx.drawImage(src, sx, sy, cw, ch, -drawW / 2, -drawH / 2, drawW, drawH);
  }

  ctx.filter = 'none';
  ctx.restore();

  // Text Overlay
  if (state.overlayText.trim()) {
    ctx.save();
    const fontSize = Math.max(12, Math.round((state.textSize / 320) * Math.min(width, height)));
    ctx.font = `900 ${fontSize}px Impact, 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.14));
    ctx.strokeStyle = state.textStroke;
    ctx.fillStyle = state.textFill;

    let y = height - fontSize * 0.85;
    if (state.textPos === 'top') y = fontSize * 0.85;
    else if (state.textPos === 'center') y = height / 2;

    const text = state.overlayText.trim();
    ctx.strokeText(text, width / 2, y, width - 16);
    ctx.fillText(text, width / 2, y, width - 16);
    ctx.restore();
  }
}

/* ==========================================================================
   Playback Loop & UI Sync
   ========================================================================== */
function updateStats() {
  const seq = getEffectiveSequence();
  const { width, height } = getOutputDimensions();
  $('#statDims').textContent = `${width} × ${height} px`;
  $('#statFrames').textContent = `${seq.length} frame${seq.length === 1 ? '' : 's'}`;
  $('#statOrigSize').textContent = state.srcBytes ? `src: ${formatBytes(state.srcBytes)}` : 'src: generated';

  const scrubber = $('#scrubber');
  scrubber.max = Math.max(0, seq.length - 1);
  if (state.currentFrame >= seq.length) state.currentFrame = 0;
  scrubber.value = state.currentFrame;
  $('#frameReadout').textContent = `Frame ${seq.length ? state.currentFrame + 1 : 0} / ${seq.length}`;
}

function renderCurrentPreview() {
  const seq = getEffectiveSequence();
  if (!seq.length) return;
  if (state.currentFrame >= seq.length) state.currentFrame = 0;
  renderProcessedFrame(seq[state.currentFrame], previewCanvas);
  updateStats();
}

function stopPlayback() {
  clearTimeout(state.playTimer);
  state.playTimer = null;
  state.isPlaying = false;
  $('#btnPlayPause').textContent = '▶ Play';
}

function scheduleNextFrame() {
  clearTimeout(state.playTimer);
  if (!state.isPlaying) return;
  const seq = getEffectiveSequence();
  if (seq.length <= 1) return;
  const item = seq[state.currentFrame % seq.length];
  state.playTimer = setTimeout(() => {
    const curSeq = getEffectiveSequence();
    if (!curSeq.length) return;
    state.currentFrame = (state.currentFrame + 1) % curSeq.length;
    renderCurrentPreview();
    scheduleNextFrame();
  }, item.delay);
}

function startPlayback() {
  state.isPlaying = true;
  $('#btnPlayPause').textContent = '⏸ Pause';
  renderCurrentPreview();
  scheduleNextFrame();
}

function renderFrameStrips() {
  const makerStrip = $('#makerFrameStrip');
  const splitStrip = $('#splitFrameStrip');
  $('#splitCountBadge').textContent = `${state.frames.length} frame${state.frames.length === 1 ? '' : 's'}`;

  makerStrip.innerHTML = '';
  splitStrip.innerHTML = '';

  state.frames.forEach((f, idx) => {
    const thumbUrl = f.canvas.toDataURL('image/png');

    // Maker card (reorder, delete)
    const mCard = document.createElement('div');
    mCard.className = 'frame-card';
    mCard.innerHTML = `
      <img src="${thumbUrl}" alt="Frame ${idx + 1}" />
      <div class="frame-card-meta">#${idx + 1} · ${f.delay}ms</div>
      <div class="frame-card-actions">
        <button class="frame-mini-btn" data-act="left" title="Move left">◀</button>
        <button class="frame-mini-btn" data-act="right" title="Move right">▶</button>
        <button class="frame-mini-btn" data-act="del" title="Remove frame">✕</button>
      </div>
    `;
    mCard.addEventListener('click', (e) => {
      const act = e.target.dataset?.act;
      if (act === 'left' && idx > 0) {
        [state.frames[idx - 1], state.frames[idx]] = [state.frames[idx], state.frames[idx - 1]];
        renderFrameStrips();
        renderCurrentPreview();
      } else if (act === 'right' && idx < state.frames.length - 1) {
        [state.frames[idx + 1], state.frames[idx]] = [state.frames[idx], state.frames[idx + 1]];
        renderFrameStrips();
        renderCurrentPreview();
      } else if (act === 'del' && state.frames.length > 1) {
        state.frames.splice(idx, 1);
        renderFrameStrips();
        renderCurrentPreview();
      } else {
        stopPlayback();
        state.currentFrame = idx;
        renderCurrentPreview();
      }
    });
    makerStrip.appendChild(mCard);

    // Split card (jump or download PNG)
    const sCard = document.createElement('div');
    sCard.className = 'frame-card';
    sCard.innerHTML = `
      <img src="${thumbUrl}" alt="Frame ${idx + 1}" />
      <div class="frame-card-meta">#${idx + 1}</div>
      <div class="frame-card-actions">
        <button class="frame-mini-btn" data-act="dl" title="Download PNG">⬇ PNG</button>
      </div>
    `;
    sCard.addEventListener('click', (e) => {
      if (e.target.dataset?.act === 'dl') {
        const tmp = document.createElement('canvas');
        renderProcessedFrame({ canvas: f.canvas, delay: f.delay, motionPhase: 0 }, tmp);
        const a = document.createElement('a');
        a.href = tmp.toDataURL('image/png');
        a.download = `frame_${String(idx + 1).padStart(3, '0')}.png`;
        a.click();
      } else {
        stopPlayback();
        state.currentFrame = idx;
        renderCurrentPreview();
      }
    });
    splitStrip.appendChild(sCard);
  });
}

function setLoadedMedia({ width, height, frames, name = 'media.gif', bytes = 0 }) {
  state.frames = frames;
  state.srcWidth = width;
  state.srcHeight = height;
  state.outWidth = width;
  state.outHeight = height;
  state.srcBytes = bytes;
  state.mediaName = name;
  state.currentFrame = 0;

  $('#resizeW').value = width;
  $('#resizeH').value = height;
  $('#videoSection').hidden = true;

  renderFrameStrips();
  startPlayback();
}

/* ==========================================================================
   Input Handlers (Files, Multi-Image, Video, Samples, Paste)
   ========================================================================== */
async function handleFiles(fileList, append = false) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  // Single video file
  if (!append && files.length === 1 && files[0].type.startsWith('video/')) {
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
    const defaultEnd = Math.min(dur, 4);
    $('#vidEnd').value = defaultEnd.toFixed(1);
    $('#lblVidEnd').textContent = `${defaultEnd.toFixed(1)}s`;
    $('#videoDurLabel').textContent = `${dur.toFixed(1)}s`;
    $('#videoSection').hidden = false;
    state.srcBytes = file.size;
    state.mediaName = file.name;
    showToast('Video loaded! Set trim & click Extract Video Frames.', '🎬');
    return;
  }

  try {
    if (!append && files.length === 1) {
      const decoded = await decodeImageFile(files[0]);
      setLoadedMedia({ ...decoded, name: files[0].name, bytes: files[0].size });
      showToast(`Loaded ${files[0].name} (${decoded.frames.length} frames)`, '🎞️');
      return;
    }

    // Multiple images -> build GIF maker sequence
    const targetW = append && state.frames.length ? state.srcWidth : null;
    const targetH = append && state.frames.length ? state.srcHeight : null;
    const newFrames = append ? [...state.frames] : [];
    let baseW = targetW;
    let baseH = targetH;
    let totalBytes = append ? state.srcBytes : 0;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      totalBytes += file.size;
      const decoded = await decodeImageFile(file);
      for (const f of decoded.frames) {
        if (!baseW) {
          baseW = f.canvas.width;
          baseH = f.canvas.height;
        }
        const c = document.createElement('canvas');
        c.width = baseW;
        c.height = baseH;
        const cctx = c.getContext('2d');
        // Contain inside baseW x baseH
        const scale = Math.min(baseW / f.canvas.width, baseH / f.canvas.height);
        const dw = Math.round(f.canvas.width * scale);
        const dh = Math.round(f.canvas.height * scale);
        cctx.drawImage(f.canvas, Math.round((baseW - dw) / 2), Math.round((baseH - dh) / 2), dw, dh);
        newFrames.push({ canvas: c, delay: parseInt($('#globalDelay').value, 10) || 100 });
      }
    }

    if (newFrames.length) {
      setLoadedMedia({
        width: baseW,
        height: baseH,
        frames: newFrames,
        name: files[0].name,
        bytes: totalBytes,
      });
      showToast(`Built sequence with ${newFrames.length} frames!`, '🧩');
    }
  } catch (err) {
    console.error(err);
    showToast(`Failed to load file: ${err.message}`, '⚠️');
  }
}

function generateDoodleSample() {
  const size = 240;
  const frames = [];
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, size, size);

    const bounce = Math.abs(Math.sin(t));
    const squashX = 1 + (1 - bounce) * 0.16;
    const squashY = 1 - (1 - bounce) * 0.14;
    const cy = 155 - bounce * 55;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(size / 2, 198, 48 * (0.7 + (1 - bounce) * 0.35), 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bouncing blorbo orb
    ctx.save();
    ctx.translate(size / 2, cy);
    ctx.scale(squashX, squashY);
    ctx.fillStyle = `hsl(${(i * 30) % 360}, 90%, 72%)`;
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes & smile
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(-14, -6, 5, 0, Math.PI * 2);
    ctx.arc(14, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 4, 11, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    frames.push({ canvas: c, delay: 70 });
  }
  setLoadedMedia({ width: size, height: size, frames, name: 'bouncing-doodle.gif', bytes: 0 });
}

async function loadUrlSample(url, name) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], name, { type: blob.type });
    await handleFiles([file], false);
  } catch {
    generateDoodleSample();
  }
}

/* ==========================================================================
   Exporters (GIF, Animated WebP, WebM Video, PNG)
   ========================================================================== */
function showResult(blob, filename) {
  if (state.lastBlobUrl) URL.revokeObjectURL(state.lastBlobUrl);
  state.lastBlob = blob;
  state.lastBlobUrl = URL.createObjectURL(blob);

  const box = $('#resultBox');
  box.hidden = false;
  const img = $('#resultPreview');
  if (blob.type.startsWith('image/')) {
    img.src = state.lastBlobUrl;
    img.hidden = false;
  } else {
    img.hidden = true;
  }

  let delta = '';
  if (state.srcBytes > 0) {
    const diffPct = Math.round(((blob.size - state.srcBytes) / state.srcBytes) * 100);
    delta = diffPct <= 0 ? ` (${diffPct}% smaller!)` : ` (+${diffPct}%)`;
  }
  $('#resultSummary').textContent = `${filename} · ${formatBytes(blob.size)}${delta}`;

  const dl = $('#btnDownloadResult');
  dl.href = state.lastBlobUrl;
  dl.download = filename;
}

function buildRenderedFrames() {
  const seq = getEffectiveSequence();
  const { width, height } = getOutputDimensions();
  return {
    width,
    height,
    rendered: seq.map((item) => {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      renderProcessedFrame(item, c);
      return { canvas: c, delay: item.delay };
    }),
  };
}

async function exportGif() {
  if (state.isExporting || !state.frames.length) return;
  state.isExporting = true;
  try {
    setExportProgress(true, 'Encoding GIF…', 0.05);
    const { width, height, rendered } = buildRenderedFrames();
    const blob = await encodeGifFrames(rendered, {
      width,
      height,
      maxColors: state.maxColors,
      onProgress: (p) => setExportProgress(true, 'Encoding GIF…', p),
    });
    showResult(blob, 'studio-output.gif');
    showToast(`GIF ready (${formatBytes(blob.size)})!`, '🎞️');
  } catch (err) {
    showToast(`GIF export failed: ${err.message}`, '⚠️');
  } finally {
    state.isExporting = false;
    setExportProgress(false);
  }
}

async function exportWebp() {
  if (state.isExporting || !state.frames.length) return;
  state.isExporting = true;
  try {
    setExportProgress(true, 'Encoding WebP…', 0.05);
    const { width, height, rendered } = buildRenderedFrames();
    const blob = await encodeAnimatedWebP(rendered, {
      width,
      height,
      quality: state.webpQuality,
      onProgress: (p) => setExportProgress(true, 'Muxing WebP…', p),
    });
    showResult(blob, 'studio-output.webp');
    showToast(`WebP ready (${formatBytes(blob.size)})!`, '🟢');
  } catch (err) {
    showToast(`WebP export failed: ${err.message}`, '⚠️');
  } finally {
    state.isExporting = false;
    setExportProgress(false);
  }
}

async function exportWebm() {
  if (state.isExporting || !state.frames.length) return;
  if (typeof MediaRecorder === 'undefined') {
    showToast('MediaRecorder is not supported in this browser.', '⚠️');
    return;
  }
  state.isExporting = true;
  try {
    setExportProgress(true, 'Recording WebM…', 0.05);
    const { width, height, rendered } = buildRenderedFrames();
    const recCanvas = document.createElement('canvas');
    recCanvas.width = width;
    recCanvas.height = height;
    const recCtx = recCanvas.getContext('2d');

    const stream = recCanvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (recorder.onstop = r));

    recorder.start();
    for (let i = 0; i < rendered.length; i++) {
      recCtx.clearRect(0, 0, width, height);
      recCtx.drawImage(rendered[i].canvas, 0, 0);
      setExportProgress(true, 'Recording WebM…', (i + 1) / rendered.length);
      await new Promise((r) => setTimeout(r, rendered[i].delay));
    }
    recorder.stop();
    await done;

    const blob = new Blob(chunks, { type: 'video/webm' });
    showResult(blob, 'studio-output.webm');
    showToast(`WebM ready (${formatBytes(blob.size)})!`, '🎬');
  } catch (err) {
    showToast(`WebM export failed: ${err.message}`, '⚠️');
  } finally {
    state.isExporting = false;
    setExportProgress(false);
  }
}

/* ==========================================================================
   Event Wiring
   ========================================================================== */
function wireEvents() {
  // Tool Tabs
  const tabLabels = {
    maker: '🎞️ maker & input',
    transform: '✂️ transform & speed',
    optimize: '🧹 optimize & compress',
    effects: '🪄 effects & motion',
    text: '🔤 text overlay',
    split: '🔀 split & frames',
  };
  $$('.tool-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      $$('.tool-tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.tab-panel').forEach((p) => (p.hidden = p.dataset.panel !== tab));
      $('#activeTabBadge').innerHTML = `<span>${tabLabels[tab] || tab}</span>`;
    });
  });

  // Dropzone & inputs
  const dropzone = $('#dropzoneBox');
  $('#fileInput').addEventListener('change', (e) => handleFiles(e.target.files, false));
  $('#appendFilesInput').addEventListener('change', (e) => handleFiles(e.target.files, true));
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
  dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files, false));
  document.addEventListener('paste', (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (files.length) handleFiles(files, false);
  });

  // Samples
  $('#sampleKirby').addEventListener('click', () => loadUrlSample('../caption/img/sample.gif', 'kirby.gif'));
  $('#samplePlink').addEventListener('click', () => loadUrlSample('../caption/img/sample.png', 'plink.png'));
  $('#sampleDoodle').addEventListener('click', generateDoodleSample);

  // Video extraction
  $('#vidStart').addEventListener('input', (e) => ($('#lblVidStart').textContent = `${parseFloat(e.target.value).toFixed(1)}s`));
  $('#vidEnd').addEventListener('input', (e) => ($('#lblVidEnd').textContent = `${parseFloat(e.target.value).toFixed(1)}s`));
  $('#vidFps').addEventListener('input', (e) => ($('#lblVidFps').textContent = `${e.target.value} fps`));
  $('#vidMaxW').addEventListener('input', (e) => ($('#lblVidMaxW').textContent = `${e.target.value}px`));
  $('#btnExtractVideo').addEventListener('click', async () => {
    if (!state.videoEl) return;
    setExportProgress(true, 'Extracting video frames…', 0);
    try {
      const decoded = await extractVideoFrames(state.videoEl, {
        startSec: parseFloat($('#vidStart').value) || 0,
        endSec: parseFloat($('#vidEnd').value) || 3,
        fps: parseInt($('#vidFps').value, 10) || 12,
        maxWidth: parseInt($('#vidMaxW').value, 10) || 384,
        onProgress: (p) => setExportProgress(true, 'Extracting video frames…', p),
      });
      setLoadedMedia({ ...decoded, name: state.mediaName, bytes: state.srcBytes });
      showToast(`Extracted ${decoded.frames.length} frames!`, '🎬');
    } catch (err) {
      showToast(`Extraction error: ${err.message}`, '⚠️');
    } finally {
      setExportProgress(false);
    }
  });

  // Global delay
  $('#btnApplyDelay').addEventListener('click', () => {
    const ms = Math.max(20, Math.min(3000, parseInt($('#globalDelay').value, 10) || 100));
    state.frames.forEach((f) => (f.delay = ms));
    renderFrameStrips();
    renderCurrentPreview();
    showToast(`Set all frames to ${ms}ms`, '⏱️');
  });

  // Playback
  $('#btnPlayPause').addEventListener('click', () => (state.isPlaying ? stopPlayback() : startPlayback()));
  $('#btnPrev').addEventListener('click', () => {
    stopPlayback();
    const n = getEffectiveSequence().length || 1;
    state.currentFrame = (state.currentFrame - 1 + n) % n;
    renderCurrentPreview();
  });
  $('#btnNext').addEventListener('click', () => {
    stopPlayback();
    const n = getEffectiveSequence().length || 1;
    state.currentFrame = (state.currentFrame + 1) % n;
    renderCurrentPreview();
  });
  $('#scrubber').addEventListener('input', (e) => {
    stopPlayback();
    state.currentFrame = parseInt(e.target.value, 10) || 0;
    renderCurrentPreview();
  });

  // Transform
  $('#lockAspect').addEventListener('change', (e) => (state.lockAspect = e.target.checked));
  $('#resizeW').addEventListener('input', (e) => {
    const w = Math.max(16, Math.min(1200, parseInt(e.target.value, 10) || 16));
    state.outWidth = w;
    if (state.lockAspect && state.srcWidth) {
      state.outHeight = Math.max(16, Math.round((w * state.srcHeight) / state.srcWidth));
      $('#resizeH').value = state.outHeight;
    }
    renderCurrentPreview();
  });
  $('#resizeH').addEventListener('input', (e) => {
    const h = Math.max(16, Math.min(1200, parseInt(e.target.value, 10) || 16));
    state.outHeight = h;
    if (state.lockAspect && state.srcHeight) {
      state.outWidth = Math.max(16, Math.round((h * state.srcWidth) / state.srcHeight));
      $('#resizeW').value = state.outWidth;
    }
    renderCurrentPreview();
  });
  $$('[data-scale-preset]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const s = parseFloat(btn.dataset.scalePreset);
      state.outWidth = Math.max(16, Math.round(state.srcWidth * s));
      state.outHeight = Math.max(16, Math.round(state.srcHeight * s));
      $('#resizeW').value = state.outWidth;
      $('#resizeH').value = state.outHeight;
      renderCurrentPreview();
    })
  );
  $$('[data-width-preset]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const w = parseInt(btn.dataset.widthPreset, 10);
      state.outWidth = w;
      state.outHeight = Math.max(16, Math.round((w * state.srcHeight) / (state.srcWidth || 1)));
      $('#resizeW').value = state.outWidth;
      $('#resizeH').value = state.outHeight;
      renderCurrentPreview();
    })
  );

  $$('#cropGroup .segmented-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      $$('#cropGroup .segmented-btn').forEach((b) => b.classList.toggle('active', b === btn));
      state.crop = btn.dataset.crop;
      renderCurrentPreview();
    })
  );
  $$('#rotateGroup .segmented-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      $$('#rotateGroup .segmented-btn').forEach((b) => b.classList.toggle('active', b === btn));
      state.rotate = parseInt(btn.dataset.rot, 10) || 0;
      renderCurrentPreview();
    })
  );
  $('#btnFlipH').addEventListener('click', () => {
    state.flipH = !state.flipH;
    renderCurrentPreview();
  });
  $('#btnFlipV').addEventListener('click', () => {
    state.flipV = !state.flipV;
    renderCurrentPreview();
  });
  $('#speedSlider').addEventListener('input', (e) => {
    state.speed = parseFloat(e.target.value) || 1;
    $('#lblSpeed').textContent = `${state.speed.toFixed(2)}×`;
    if (state.isPlaying) scheduleNextFrame();
  });
  $('#toggleReverse').addEventListener('change', (e) => {
    state.reverse = e.target.checked;
    renderCurrentPreview();
  });
  $('#toggleBoomerang').addEventListener('change', (e) => {
    state.boomerang = e.target.checked;
    renderCurrentPreview();
  });

  // Optimize
  $('#maxColorsSlider').addEventListener('input', (e) => {
    state.maxColors = parseInt(e.target.value, 10) || 256;
    $('#lblMaxColors').textContent = `${state.maxColors}`;
  });
  $('#frameDropSelect').addEventListener('change', (e) => {
    state.frameDrop = parseInt(e.target.value, 10) || 1;
    renderCurrentPreview();
  });
  $('#webpQualitySlider').addEventListener('input', (e) => {
    state.webpQuality = (parseInt(e.target.value, 10) || 82) / 100;
    $('#lblWebpQuality').textContent = `${e.target.value}%`;
  });

  // Effects
  const bindRange = (id, lblId, key, suffix = '%', offVal = null) => {
    $(id).addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      state[key] = v;
      $(lblId).textContent = offVal !== null && v === offVal ? 'Off' : `${v}${suffix}`;
      renderCurrentPreview();
    });
  };
  bindRange('#fxBright', '#lblFxBright', 'fxBright', '%');
  bindRange('#fxContrast', '#lblFxContrast', 'fxContrast', '%');
  bindRange('#fxSat', '#lblFxSat', 'fxSat', '%');
  bindRange('#fxHue', '#lblFxHue', 'fxHue', '°');
  bindRange('#fxPixel', '#lblFxPixel', 'fxPixel', 'px', 1);
  bindRange('#fxRound', '#lblFxRound', 'fxRound', '%');

  $('#fxGray').addEventListener('change', (e) => { state.fxGray = e.target.checked; renderCurrentPreview(); });
  $('#fxSepia').addEventListener('change', (e) => { state.fxSepia = e.target.checked; renderCurrentPreview(); });
  $('#fxInvert').addEventListener('change', (e) => { state.fxInvert = e.target.checked; renderCurrentPreview(); });
  $('#fxMotion').addEventListener('change', (e) => {
    state.fxMotion = e.target.value;
    state.currentFrame = 0;
    startPlayback();
  });
  $('#btnResetEffects').addEventListener('click', () => {
    state.fxBright = 100; state.fxContrast = 100; state.fxSat = 100; state.fxHue = 0;
    state.fxGray = false; state.fxSepia = false; state.fxInvert = false;
    state.fxPixel = 1; state.fxRound = 0; state.fxMotion = 'none';
    $('#fxBright').value = 100; $('#lblFxBright').textContent = '100%';
    $('#fxContrast').value = 100; $('#lblFxContrast').textContent = '100%';
    $('#fxSat').value = 100; $('#lblFxSat').textContent = '100%';
    $('#fxHue').value = 0; $('#lblFxHue').textContent = '0°';
    $('#fxGray').checked = false; $('#fxSepia').checked = false; $('#fxInvert').checked = false;
    $('#fxPixel').value = 1; $('#lblFxPixel').textContent = 'Off';
    $('#fxRound').value = 0; $('#lblFxRound').textContent = '0%';
    $('#fxMotion').value = 'none';
    renderCurrentPreview();
  });

  // Text
  $('#overlayText').addEventListener('input', (e) => { state.overlayText = e.target.value; renderCurrentPreview(); });
  $$('#textPosGroup .segmented-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      $$('#textPosGroup .segmented-btn').forEach((b) => b.classList.toggle('active', b === btn));
      state.textPos = btn.dataset.tpos;
      renderCurrentPreview();
    })
  );
  bindRange('#textSizeSlider', '#lblTextSize', 'textSize', 'px');
  $('#textFillColor').addEventListener('input', (e) => { state.textFill = e.target.value; renderCurrentPreview(); });
  $('#textStrokeColor').addEventListener('input', (e) => { state.textStroke = e.target.value; renderCurrentPreview(); });

  // Reset all edits
  $('#btnResetAll').addEventListener('click', () => {
    state.outWidth = state.srcWidth;
    state.outHeight = state.srcHeight;
    state.crop = 'none';
    state.rotate = 0;
    state.flipH = false;
    state.flipV = false;
    state.speed = 1;
    state.reverse = false;
    state.boomerang = false;
    state.maxColors = 256;
    state.frameDrop = 1;
    state.overlayText = '';
    $('#resizeW').value = state.srcWidth;
    $('#resizeH').value = state.srcHeight;
    $('#speedSlider').value = 1;
    $('#lblSpeed').textContent = '1.00×';
    $('#toggleReverse').checked = false;
    $('#toggleBoomerang').checked = false;
    $('#maxColorsSlider').value = 256;
    $('#lblMaxColors').textContent = '256';
    $('#frameDropSelect').value = '1';
    $('#overlayText').value = '';
    $$('#cropGroup .segmented-btn').forEach((b) => b.classList.toggle('active', b.dataset.crop === 'none'));
    $$('#rotateGroup .segmented-btn').forEach((b) => b.classList.toggle('active', b.dataset.rot === '0'));
    $('#btnResetEffects').click();
    showToast('Edits reset!', '↺');
  });

  // Exports
  $('#btnExportGif').addEventListener('click', exportGif);
  $('#btnExportWebp').addEventListener('click', exportWebp);
  $('#btnExportWebm').addEventListener('click', exportWebm);
  $('#btnExportPng').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = previewCanvas.toDataURL('image/png');
    a.download = `frame_${state.currentFrame + 1}.png`;
    a.click();
    showToast('Saved current frame as PNG!', '🖼️');
  });
  $('#btnLoadResultBack').addEventListener('click', () => {
    if (!state.lastBlob || !state.lastBlob.type.startsWith('image/')) return;
    const ext = state.lastBlob.type.includes('webp') ? 'webp' : 'gif';
    const file = new File([state.lastBlob], `edited.${ext}`, { type: state.lastBlob.type });
    handleFiles([file], false);
  });
}

wireEvents();
loadUrlSample('../caption/img/sample.gif', 'kirby.gif');
