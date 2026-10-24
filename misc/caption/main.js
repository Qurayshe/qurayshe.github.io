/**
 * Meme Caption Tool — Client-Side Compositing & Export Studio
 * Supports Images, Animated GIFs (omggif + gifenc), and Videos (MediaRecorder + Web Audio).
 * Styled in the Blorbo Doodle theme for qurayshe.github.io.
 */

/**
 * Resilient lazy loader for gifenc (GIFEncoder, quantize, applyPalette).
 * Tries local vendor path, sibling path, and CDN as fallback.
 */
let gifencCache = null;
async function getGifEncoder() {
  if (gifencCache) return gifencCache;
  const sources = [
    './vendor/gifenc.esm.js',
    './gifenc.js',
    'https://unpkg.com/gifenc@1.0.3/dist/gifenc.esm.js',
    'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js'
  ];
  for (const src of sources) {
    try {
      const mod = await import(src);
      if (mod && (mod.GIFEncoder || mod.default)) {
        gifencCache = {
          GIFEncoder: mod.GIFEncoder || mod.default,
          quantize: mod.quantize,
          applyPalette: mod.applyPalette
        };
        return gifencCache;
      }
    } catch (e) {
      // try next source
    }
  }
  throw new Error('Could not load GIFEncoder from any source');
}

/**
 * Ensures omggif reader is available before decoding GIFs.
 */
async function ensureOmggif() {
  if (window.omggif && window.omggif.GifReader) return window.omggif;
  const sources = [
    './vendor/omggif.js',
    './omggif.js',
    'https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js'
  ];
  for (const src of sources) {
    if (window.omggif && window.omggif.GifReader) break;
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => {
        if (typeof window.omggif === 'undefined' && typeof window.GifReader !== 'undefined') {
          window.omggif = { GifReader: window.GifReader, GifWriter: window.GifWriter };
        }
        resolve();
      };
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  if (!window.omggif || !window.omggif.GifReader) {
    throw new Error('omggif library could not be loaded');
  }
  return window.omggif;
}

/* ==========================================================================
   State & Defaults
   ========================================================================== */
const state = {
  mediaType: 'image', // 'image' | 'gif' | 'video'
  mediaName: 'sample.png',
  imageObj: null,
  gifData: null,      // { frames: HTMLCanvasElement[], delays: number[], duration: number }
  videoEl: null,
  audioCtx: null,
  audioSourceNode: null,
  audioDestNode: null,
  isAudioMuted: false,

  // Playback
  currentFrame: 0,
  isPlaying: true,
  gifTimer: null,
  rafId: null,

  // Caption settings
  captionTop: 'plink',
  captionBottom: '',
  position: 'top',    // 'top' | 'bottom' | 'both'
  alignment: 'center',// 'left' | 'center' | 'right'
  textCase: 'none',   // 'none' | 'upper' | 'lower'
  fontFamily: "'Oswald', Futura, sans-serif",
  autoSize: true,
  fontSize: 32,
  bgColor: '#ffffff',
  textColor: '#000000',
  padding: 28,
  divider: 'none',    // 'none' | 'hairline' | 'doodle'
  exportScale: 1,

  isExporting: false,
};

/* DOM Elements */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const canvas = $('#captionCanvas');
const ctx = canvas.getContext('2d');

const mediaTypePill = $('#mediaTypePill');
const mediaIcon = $('#mediaIcon');
const mediaTypeLabel = $('#mediaTypeLabel');
const mediaDimLabel = $('#mediaDimLabel');

const playbackCard = $('#playbackCard');
const btnPlayPause = $('#btnPlayPause');
const playIcon = $('#playIcon');
const playLabel = $('#playLabel');
const btnPrevFrame = $('#btnPrevFrame');
const btnNextFrame = $('#btnNextFrame');
const btnMuteToggle = $('#btnMuteToggle');
const muteIcon = $('#muteIcon');
const playbackReadout = $('#playbackReadout');
const timelineScrubber = $('#timelineScrubber');

const btnDownloadMain = $('#btnDownloadMain');
const btnCopyClipboard = $('#btnCopyClipboard');
const btnExportAlt1 = $('#btnExportAlt1');
const btnExportAlt2 = $('#btnExportAlt2');
const btnExportGifVideo = $('#btnExportGifVideo');
const btnExportVideoGif = $('#btnExportVideoGif');

const exportStatusBox = $('#exportStatusBox');
const progressStatusText = $('#progressStatusText');
const progressPercentText = $('#progressPercentText');
const progressFill = $('#progressFill');

const dropzoneBox = $('#dropzoneBox');
const fileInput = $('#fileInput');

const captionTextInput = $('#captionTextInput');
const bottomTextGroup = $('#bottomTextGroup');
const captionBottomInput = $('#captionBottomInput');
const btnResetText = $('#btnResetText');

const fontFamilySelect = $('#fontFamilySelect');
const autoSizeToggle = $('#autoSizeToggle');
const manualFontRow = $('#manualFontRow');
const fontSizeSlider = $('#fontSizeSlider');
const lblFontSize = $('#lblFontSize');

const bgColorPicker = $('#bgColorPicker');
const textColorPicker = $('#textColorPicker');
const paddingSlider = $('#paddingSlider');
const lblPadding = $('#lblPadding');
const dividerSelect = $('#dividerSelect');

const toastBox = $('#toastBox');
const toastIcon = $('#toastIcon');
const toastMsg = $('#toastMsg');

let toastTimer = null;

/* ==========================================================================
   Toast Notifications
   ========================================================================== */
function showToast(message, icon = '✨', durationMs = 2600) {
  if (toastTimer) clearTimeout(toastTimer);
  toastIcon.textContent = icon;
  toastMsg.textContent = message;
  toastBox.classList.add('show');
  toastTimer = setTimeout(() => {
    toastBox.classList.remove('show');
  }, durationMs);
}

/* ==========================================================================
   Text Formatting & Wrapping Engine
   ========================================================================== */
function formatText(str, textCase) {
  if (!str) return '';
  if (textCase === 'upper') return str.toUpperCase();
  if (textCase === 'lower') return str.toLowerCase();
  return str;
}

/**
 * Calculates optimal font size for a given media width & text string.
 * Mimics classic Discord/esmBot meme styling: punchy, bold, nicely fitted.
 */
function calculateOptimalFontSize(mediaWidth, text) {
  if (!text) return 32;
  const len = text.length;
  // Base size is ~11% of media width for short words (like "plink")
  let target = Math.round(mediaWidth * 0.11);
  if (len > 30) target = Math.round(mediaWidth * 0.08);
  if (len > 60) target = Math.round(mediaWidth * 0.06);
  if (len > 120) target = Math.round(mediaWidth * 0.045);
  return Math.max(16, Math.min(target, 120));
}

/**
 * Wraps text into lines that do not exceed maxWidth.
 */
function wrapText(context, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const testWidth = context.measureText(testLine).width;
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Measures wrapped lines and required caption box height.
 */
function measureCaptionBox(text, font, fontSize, boxWidth, paddingY) {
  if (!text || text.trim() === '') {
    return { lines: [], boxHeight: 0, lineHeight: 0 };
  }

  // Create temporary measuring canvas
  const mCanvas = document.createElement('canvas');
  const mCtx = mCanvas.getContext('2d');
  mCtx.font = `bold ${fontSize}px ${font}`;

  const maxTextWidth = Math.max(40, boxWidth - 36);
  const lines = wrapText(mCtx, text, maxTextWidth);
  const lineHeight = Math.round(fontSize * 1.22);
  const totalTextHeight = lines.length * lineHeight;
  const boxHeight = totalTextHeight + paddingY * 2;

  return { lines, boxHeight, lineHeight };
}

/* ==========================================================================
   Compositing & Canvas Rendering
   ========================================================================== */

/**
 * Renders the captioned meme onto any destination canvas.
 * Handles Top, Bottom, or Both caption bars.
 */
function renderMeme(destCanvas, sourceMedia, opts = {}) {
  const scale = opts.scale || 1;
  const dCtx = destCanvas.getContext('2d');

  const sw = (sourceMedia.naturalWidth || sourceMedia.videoWidth || sourceMedia.width) || 300;
  const sh = (sourceMedia.naturalHeight || sourceMedia.videoHeight || sourceMedia.height) || 300;

  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);

  const topTextRaw = formatText(state.captionTop, state.textCase);
  const bottomTextRaw = (state.position === 'both' ? formatText(state.captionBottom, state.textCase) : '');

  // Determine font size
  let currentFontSize = state.fontSize;
  if (state.autoSize) {
    currentFontSize = calculateOptimalFontSize(w, topTextRaw || bottomTextRaw || 'plink');
  }
  currentFontSize = Math.max(12, Math.round(currentFontSize * scale));

  const padY = Math.max(8, Math.round(state.padding * scale));

  // Measure top box
  const hasTop = state.position === 'top' || state.position === 'both';
  const hasBottom = state.position === 'bottom' || state.position === 'both';

  const topMeasure = hasTop
    ? measureCaptionBox(topTextRaw, state.fontFamily, currentFontSize, w, padY)
    : { lines: [], boxHeight: 0, lineHeight: 0 };

  const bottomMeasure = hasBottom
    ? measureCaptionBox(bottomTextRaw, state.fontFamily, currentFontSize, w, padY)
    : { lines: [], boxHeight: 0, lineHeight: 0 };

  const topH = topMeasure.boxHeight;
  const botH = bottomMeasure.boxHeight;
  const totalH = topH + h + botH;

  // Set destination dimensions
  if (destCanvas.width !== w || destCanvas.height !== totalH) {
    destCanvas.width = w;
    destCanvas.height = totalH;
  }

  dCtx.imageSmoothingEnabled = true;
  dCtx.imageSmoothingQuality = 'high';

  // 1. Draw Top Caption Box
  if (topH > 0) {
    dCtx.fillStyle = state.bgColor;
    dCtx.fillRect(0, 0, w, topH);

    drawCaptionText(
      dCtx,
      topMeasure.lines,
      0,
      topH,
      w,
      currentFontSize,
      topMeasure.lineHeight,
      padY
    );

    // Optional Divider below top box
    drawDivider(dCtx, 0, topH, w);
  }

  // 2. Draw Source Media
  const mediaY = topH;
  dCtx.drawImage(sourceMedia, 0, mediaY, w, h);

  // 3. Draw Bottom Caption Box
  if (botH > 0) {
    const botY = topH + h;
    dCtx.fillStyle = state.bgColor;
    dCtx.fillRect(0, botY, w, botH);

    // Optional Divider above bottom box
    drawDivider(dCtx, 0, botY, w);

    drawCaptionText(
      dCtx,
      bottomMeasure.lines,
      botY,
      botH,
      w,
      currentFontSize,
      bottomMeasure.lineHeight,
      padY
    );
  }
}

/**
 * Draws text lines nicely centered / aligned in a given box.
 */
function drawCaptionText(dCtx, lines, boxY, boxH, boxW, fontSize, lineHeight, padY) {
  if (!lines || lines.length === 0) return;

  dCtx.fillStyle = state.textColor;
  dCtx.font = `bold ${fontSize}px ${state.fontFamily}`;
  dCtx.textAlign = state.alignment;
  dCtx.textBaseline = 'middle';

  // Horizontal X coordinate
  let textX = boxW / 2;
  if (state.alignment === 'left') textX = 20;
  if (state.alignment === 'right') textX = boxW - 20;

  // Total text block height
  const totalH = lines.length * lineHeight;
  // Center vertically inside the box
  const startY = boxY + (boxH - totalH) / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight;
    dCtx.fillText(lines[i], textX, y);
  }
}

/**
 * Draws optional divider line between caption and media.
 */
function drawDivider(dCtx, x, y, width) {
  if (state.divider === 'none') return;

  dCtx.save();
  if (state.divider === 'hairline') {
    dCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    dCtx.lineWidth = 1;
    dCtx.beginPath();
    dCtx.moveTo(x, y);
    dCtx.lineTo(x + width, y);
    dCtx.stroke();
  } else if (state.divider === 'doodle') {
    dCtx.strokeStyle = '#111111';
    dCtx.lineWidth = 2.5;
    dCtx.beginPath();
    dCtx.moveTo(x, y);
    // Slight wavy wobble
    const step = 20;
    for (let curX = x + step; curX <= x + width; curX += step) {
      const wiggle = (Math.random() - 0.5) * 2;
      dCtx.lineTo(curX, y + wiggle);
    }
    dCtx.stroke();
  }
  dCtx.restore();
}

/**
 * Updates the live preview canvas based on current state.
 */
function updatePreview() {
  if (state.mediaType === 'image') {
    if (state.imageObj && state.imageObj.complete) {
      renderMeme(canvas, state.imageObj);
      updateMediaInfo(state.imageObj.naturalWidth, state.imageObj.naturalHeight);
    }
  } else if (state.mediaType === 'gif') {
    if (state.gifData && state.gifData.frames.length > 0) {
      const activeFrame = state.gifData.frames[state.currentFrame];
      renderMeme(canvas, activeFrame);
      updateMediaInfo(activeFrame.width, activeFrame.height);
      updatePlaybackUI();
    }
  } else if (state.mediaType === 'video') {
    if (state.videoEl && state.videoEl.readyState >= 2) {
      renderMeme(canvas, state.videoEl);
      updateMediaInfo(state.videoEl.videoWidth, state.videoEl.videoHeight);
      updatePlaybackUI();
    }
  }
}

function updateMediaInfo(w, h) {
  if (!w || !h) return;
  mediaDimLabel.textContent = `${w} × ${h} px`;
}

/* ==========================================================================
   Media Loaders: Image, GIF, Video
   ========================================================================== */

/**
 * Loads a static image from Blob or URL.
 */
function loadImage(src, name = 'image.png') {
  stopPlayback();
  state.mediaType = 'image';
  state.mediaName = name;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.imageObj = img;
    state.gifData = null;
    state.videoEl = null;

    mediaIcon.textContent = '🖼️';
    mediaTypeLabel.textContent = 'Image';
    playbackCard.hidden = true;
    btnExportGifVideo.hidden = true;
    btnExportVideoGif.hidden = true;
    btnExportAlt1.hidden = false;
    btnExportAlt2.hidden = false;
    btnDownloadMain.querySelector('span').textContent = '💾 Download Image';
    btnCopyClipboard.style.display = 'inline-flex';

    updatePreview();
    showToast(`Loaded ${name}`, '🖼️');
  };
  img.src = src;
}

/**
 * Decodes an animated GIF into frames using omggif.
 */
function decodeGif(arrayBuffer) {
  if (!window.omggif || !window.omggif.GifReader) {
    throw new Error('omggif library not loaded');
  }

  const reader = new window.omggif.GifReader(new Uint8Array(arrayBuffer));
  const w = reader.width;
  const h = reader.height;
  if (!w || !h) throw new Error('Invalid GIF dimensions');

  const total = reader.numFrames();
  const buf = new Uint8Array(w * h * 4);
  const full = document.createElement('canvas');
  full.width = w;
  full.height = h;
  const fullCtx = full.getContext('2d');

  const frames = [];
  const delays = [];
  let lastInfo = null;

  for (let i = 0; i < total; i++) {
    // Disposal code 2 = restore to background
    if (lastInfo && lastInfo.disposal === 2) {
      for (let row = lastInfo.y; row < lastInfo.y + lastInfo.height; row++) {
        buf.fill(0, (row * w + lastInfo.x) * 4, (row * w + lastInfo.x + lastInfo.width) * 4);
      }
    }
    reader.decodeAndBlitFrameRGBA(i, buf);
    lastInfo = reader.frameInfo(i);

    fullCtx.putImageData(new ImageData(new Uint8ClampedArray(buf), w, h), 0, 0);

    const fCanvas = document.createElement('canvas');
    fCanvas.width = w;
    fCanvas.height = h;
    fCanvas.getContext('2d').drawImage(full, 0, 0);

    frames.push(fCanvas);
    // Delay in ms (delay from omggif is hundredths of a second)
    const delayMs = Math.max(20, (lastInfo.delay > 1 ? lastInfo.delay : 10) * 10);
    delays.push(delayMs);
  }

  const duration = delays.reduce((a, b) => a + b, 0);
  return { frames, delays, duration };
}

/**
 * Loads an animated GIF from Blob or ArrayBuffer.
 */
async function loadGif(fileOrBuffer, name = 'animated.gif') {
  stopPlayback();
  state.mediaType = 'gif';
  state.mediaName = name;

  try {
    await ensureOmggif();
    let buffer;
    if (fileOrBuffer instanceof ArrayBuffer) {
      buffer = fileOrBuffer;
    } else if (fileOrBuffer instanceof Blob) {
      buffer = await fileOrBuffer.arrayBuffer();
    } else {
      const resp = await fetch(fileOrBuffer);
      buffer = await resp.arrayBuffer();
    }

    const decoded = decodeGif(buffer);
    state.gifData = decoded;
    state.currentFrame = 0;
    state.isPlaying = true;
    state.imageObj = null;
    state.videoEl = null;

    mediaIcon.textContent = '👾';
    mediaTypeLabel.textContent = `GIF (${decoded.frames.length} frames)`;
    playbackCard.hidden = false;
    btnMuteToggle.hidden = true;
    btnExportGifVideo.hidden = false;
    btnExportVideoGif.hidden = true;
    btnExportAlt1.hidden = true;
    btnExportAlt2.hidden = true;
    btnDownloadMain.querySelector('span').textContent = '💾 Download GIF';
    btnCopyClipboard.style.display = 'none';

    timelineScrubber.max = decoded.frames.length - 1;
    timelineScrubber.value = 0;

    startGifPlayback();
    showToast(`Loaded GIF: ${decoded.frames.length} frames!`, '👾');
  } catch (err) {
    console.error('GIF decoding error:', err);
    showToast('Failed to decode animated GIF', '⚠️');
  }
}

/**
 * Loads a video from File, Blob, or URL.
 */
function loadVideo(src, name = 'video.mp4') {
  stopPlayback();
  state.mediaType = 'video';
  state.mediaName = name;

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.playsInline = true;
  video.preload = 'auto';
  video.loop = true;
  video.muted = false;

  video.onloadedmetadata = () => {
    state.videoEl = video;
    state.imageObj = null;
    state.gifData = null;
    state.isPlaying = true;

    mediaIcon.textContent = '🎬';
    const durSec = Math.round(video.duration || 0);
    mediaTypeLabel.textContent = `Video (${durSec}s)`;
    playbackCard.hidden = false;
    btnMuteToggle.hidden = false;
    btnExportGifVideo.hidden = true;
    btnExportVideoGif.hidden = false;
    btnExportAlt1.hidden = true;
    btnExportAlt2.hidden = true;
    btnDownloadMain.querySelector('span').textContent = '💾 Download Video';
    btnCopyClipboard.style.display = 'none';

    timelineScrubber.max = 1000;
    timelineScrubber.value = 0;

    video.play().catch(() => {
      // Autoplay blocked: mute and play
      video.muted = true;
      state.isAudioMuted = true;
      muteIcon.textContent = '🔇';
      video.play().catch((e) => console.log('Video play error:', e));
    });

    startVideoPlayback();
    showToast(`Loaded video: ${name}`, '🎬');
  };

  if (typeof src === 'string') {
    video.src = src;
  } else {
    video.src = URL.createObjectURL(src);
  }
}

/* ==========================================================================
   Playback Controls Loop
   ========================================================================== */
function stopPlayback() {
  if (state.gifTimer) {
    clearTimeout(state.gifTimer);
    state.gifTimer = null;
  }
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
  if (state.videoEl) {
    state.videoEl.pause();
  }
}

function startGifPlayback() {
  if (!state.gifData || state.gifData.frames.length < 2) return;
  stopPlayback();

  const tick = () => {
    if (!state.isPlaying) return;
    const delay = state.gifData.delays[state.currentFrame] || 80;
    updatePreview();
    state.currentFrame = (state.currentFrame + 1) % state.gifData.frames.length;
    state.gifTimer = setTimeout(tick, delay);
  };
  tick();
}

function startVideoPlayback() {
  if (!state.videoEl) return;
  stopPlayback();

  const tick = () => {
    if (state.mediaType === 'video' && state.videoEl && !state.videoEl.paused) {
      updatePreview();
    }
    state.rafId = requestAnimationFrame(tick);
  };
  state.rafId = requestAnimationFrame(tick);
}

function updatePlaybackUI() {
  if (state.mediaType === 'gif' && state.gifData) {
    playbackReadout.textContent = `Frame ${state.currentFrame + 1} / ${state.gifData.frames.length}`;
    timelineScrubber.value = state.currentFrame;
  } else if (state.mediaType === 'video' && state.videoEl) {
    const cur = formatTime(state.videoEl.currentTime || 0);
    const dur = formatTime(state.videoEl.duration || 0);
    playbackReadout.textContent = `${cur} / ${dur}`;
    if (state.videoEl.duration > 0) {
      timelineScrubber.value = Math.round((state.videoEl.currentTime / state.videoEl.duration) * 1000);
    }
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ==========================================================================
   Export Engine: Image, GIF, Video
   ========================================================================== */

function setExportStatus(visible, percent = 0, statusText = '') {
  exportStatusBox.hidden = !visible;
  if (visible) {
    progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    progressPercentText.textContent = `${Math.round(percent)}%`;
    progressStatusText.textContent = statusText;
    btnDownloadMain.disabled = true;
  } else {
    btnDownloadMain.disabled = false;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * 1. Export Image (PNG, JPG, WebP)
 */
function exportImage(format = 'image/png', ext = 'png') {
  if (!state.imageObj) return;
  const outCanvas = document.createElement('canvas');
  renderMeme(outCanvas, state.imageObj, { scale: state.exportScale });

  outCanvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, `caption-meme.${ext}`);
      showToast(`Saved .${ext} meme!`, '💾');
    }
  }, format, 0.92);
}

/**
 * Copy captioned image to clipboard.
 */
async function copyImageToClipboard() {
  if (!state.imageObj) return;
  try {
    const outCanvas = document.createElement('canvas');
    renderMeme(outCanvas, state.imageObj, { scale: state.exportScale });

    outCanvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Blob creation failed');
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('Copied meme to clipboard! 📋✨', '📋');
    }, 'image/png');
  } catch (err) {
    console.warn('Clipboard write error:', err);
    showToast('Clipboard access denied or unsupported', '⚠️');
  }
}

/**
 * 2. Export Animated GIF (gifenc)
 */
async function exportGif() {
  if (!state.gifData || state.gifData.frames.length === 0) return;
  if (state.isExporting) return;
  state.isExporting = true;

  setExportStatus(true, 5, 'Initializing GIF encoder…');

  const { GIFEncoder, quantize, applyPalette } = await getGifEncoder();

  const { frames, delays } = state.gifData;
  const totalFrames = frames.length;
  const scale = state.exportScale;

  const gif = GIFEncoder();
  const fCanvas = document.createElement('canvas');

  let i = 0;
  const batchSize = 1;

  const encodeNext = () => {
    const start = performance.now();
    while (i < totalFrames && performance.now() - start < 45) {
      renderMeme(fCanvas, frames[i], { scale });
      const fCtx = fCanvas.getContext('2d');
      const { data } = fCtx.getImageData(0, 0, fCanvas.width, fCanvas.height);

      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);

      gif.writeFrame(index, fCanvas.width, fCanvas.height, {
        palette,
        delay: delays[i],
        repeat: 0
      });

      i++;
    }

    const pct = Math.round((i / totalFrames) * 90);
    setExportStatus(true, pct, `Baking GIF frames… ${i}/${totalFrames}`);

    if (i < totalFrames) {
      setTimeout(encodeNext, 4);
    } else {
      gif.finish();
      const blob = new Blob([gif.bytesView()], { type: 'image/gif' });
      downloadBlob(blob, `caption-meme-${fCanvas.width}x${fCanvas.height}.gif`);
      setExportStatus(true, 100, 'Done! 👾');
      setTimeout(() => setExportStatus(false), 1500);
      showToast('Saved animated GIF! 👾✨', '💾');
      state.isExporting = false;
    }
  };

  setTimeout(encodeNext, 10);
}

/**
 * 3. Export Video via MediaRecorder (with Audio!)
 */
function pickVideoMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
}

async function exportVideo() {
  if (!state.videoEl) return;
  if (state.isExporting) return;

  const mime = pickVideoMime();
  if (!mime) {
    showToast('MediaRecorder not supported on this browser', '⚠️');
    return;
  }

  state.isExporting = true;
  stopPlayback();

  setExportStatus(true, 5, 'Preparing video recording…');

  const video = state.videoEl;
  const scale = state.exportScale;
  const recCanvas = document.createElement('canvas');
  renderMeme(recCanvas, video, { scale });

  // Web Audio Setup for capturing audio track
  let audioStream = null;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!state.audioCtx) {
      state.audioCtx = new AudioCtx();
      state.audioSourceNode = state.audioCtx.createMediaElementSource(video);
      state.audioDestNode = state.audioCtx.createMediaStreamDestination();
      state.audioSourceNode.connect(state.audioDestNode);
      state.audioSourceNode.connect(state.audioCtx.destination);
    }
    audioStream = state.audioDestNode.stream;
  } catch (e) {
    console.warn('Audio setup error:', e);
  }

  const canvasStream = recCanvas.captureStream(30);
  const tracks = [...canvasStream.getVideoTracks()];
  if (audioStream && audioStream.getAudioTracks().length > 0) {
    tracks.push(...audioStream.getAudioTracks());
  }
  const combinedStream = new MediaStream(tracks);

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: mime,
    videoBitsPerSecond: 5000000
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const ext = mime.includes('mp4') ? 'mp4' : 'webm';

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mime });
    downloadBlob(blob, `caption-meme.${ext}`);
    setExportStatus(true, 100, `Saved .${ext}! 🎬`);
    setTimeout(() => setExportStatus(false), 1500);
    showToast(`Saved video as .${ext}! 🎬✨`, '💾');
    state.isExporting = false;
    video.currentTime = 0;
    startVideoPlayback();
  };

  // Start recording
  recorder.start();
  video.currentTime = 0;
  await video.play();

  const totalDur = video.duration || 5;

  const recTick = () => {
    if (!state.isExporting) return;
    renderMeme(recCanvas, video, { scale });

    const pct = Math.min(95, Math.round((video.currentTime / totalDur) * 95));
    setExportStatus(true, pct, `Recording video… ${formatTime(video.currentTime)} / ${formatTime(totalDur)}`);

    if (video.currentTime >= totalDur - 0.05 || video.ended) {
      video.pause();
      recorder.stop();
    } else {
      requestAnimationFrame(recTick);
    }
  };

  requestAnimationFrame(recTick);
}

/**
 * 4. Export Video as Animated GIF
 */
async function exportVideoToGif() {
  if (!state.videoEl || state.isExporting) return;
  state.isExporting = true;
  stopPlayback();

  setExportStatus(true, 5, 'Sampling video frames for GIF…');

  const { GIFEncoder, quantize, applyPalette } = await getGifEncoder();

  const video = state.videoEl;
  const scale = state.exportScale * 0.75; // slightly lower scale for GIF
  const dur = Math.min(video.duration || 4, 6); // Max 6 seconds for GIF
  const fps = 12;
  const totalFrames = Math.round(dur * fps);

  const gif = GIFEncoder();
  const fCanvas = document.createElement('canvas');

  let curFrame = 0;
  const seekStep = dur / totalFrames;

  const processFrame = () => {
    video.currentTime = curFrame * seekStep;
  };

  video.onseeked = () => {
    if (!state.isExporting) return;
    renderMeme(fCanvas, video, { scale });

    const fCtx = fCanvas.getContext('2d');
    const { data } = fCtx.getImageData(0, 0, fCanvas.width, fCanvas.height);
    const palette = quantize(data, 128);
    const index = applyPalette(data, palette);

    gif.writeFrame(index, fCanvas.width, fCanvas.height, {
      palette,
      delay: Math.round(1000 / fps),
      repeat: 0
    });

    curFrame++;
    const pct = Math.round((curFrame / totalFrames) * 95);
    setExportStatus(true, pct, `Baking GIF frame ${curFrame}/${totalFrames}…`);

    if (curFrame < totalFrames) {
      processFrame();
    } else {
      gif.finish();
      const blob = new Blob([gif.bytesView()], { type: 'image/gif' });
      downloadBlob(blob, `caption-meme.gif`);
      setExportStatus(true, 100, 'Done! 🎞️');
      setTimeout(() => setExportStatus(false), 1500);
      showToast('Exported video as GIF! 🎞️✨', '💾');
      state.isExporting = false;
      video.onseeked = null;
      video.currentTime = 0;
      startVideoPlayback();
    }
  };

  processFrame();
}

/**
 * 5. Export GIF as MP4 / WebM Video
 */
function exportGifToVideo() {
  if (!state.gifData || state.isExporting) return;
  const mime = pickVideoMime();
  if (!mime) {
    showToast('MediaRecorder not supported for video export', '⚠️');
    return;
  }

  state.isExporting = true;
  stopPlayback();

  const { frames, delays } = state.gifData;
  const totalFrames = frames.length;
  const scale = state.exportScale;

  const recCanvas = document.createElement('canvas');
  renderMeme(recCanvas, frames[0], { scale });

  const stream = recCanvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4000000 });
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const ext = mime.includes('mp4') ? 'mp4' : 'webm';

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mime });
    downloadBlob(blob, `caption-gif-video.${ext}`);
    setExportStatus(true, 100, `Saved .${ext}! 🎬`);
    setTimeout(() => setExportStatus(false), 1500);
    showToast(`Converted GIF to .${ext}! 🎬✨`, '💾');
    state.isExporting = false;
    startGifPlayback();
  };

  recorder.start();

  let fIdx = 0;
  // Repeat loop 2 times for a comfortable video duration
  const totalLoops = 2;
  let loopCount = 0;

  const stepGif = () => {
    renderMeme(recCanvas, frames[fIdx], { scale });
    const progress = Math.round(((loopCount * totalFrames + fIdx) / (totalLoops * totalFrames)) * 95);
    setExportStatus(true, progress, `Converting GIF to video… ${progress}%`);

    const delay = delays[fIdx] || 80;
    fIdx++;
    if (fIdx >= totalFrames) {
      fIdx = 0;
      loopCount++;
    }

    if (loopCount < totalLoops) {
      setTimeout(stepGif, delay);
    } else {
      setTimeout(() => recorder.stop(), 200);
    }
  };

  stepGif();
}

/* ==========================================================================
   Synthetic Sample Video Generator
   Creates a cute 3-second animated video with sound in the browser!
   ========================================================================== */
async function generateSampleVideo() {
  stopPlayback();
  setExportStatus(true, 10, 'Synthesizing demo video…');

  const mime = pickVideoMime() || 'video/webm';
  const vCanvas = document.createElement('canvas');
  vCanvas.width = 360;
  vCanvas.height = 360;
  const vCtx = vCanvas.getContext('2d');

  // Web Audio Synth
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const actx = new AudioCtx();
  const dest = actx.createMediaStreamDestination();

  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, actx.currentTime);
  gain.gain.setValueAtTime(0.08, actx.currentTime);
  osc.connect(gain);
  gain.connect(dest);
  osc.start();

  const canvasStream = vCanvas.captureStream(30);
  const combined = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks()
  ]);

  const rec = new MediaRecorder(combined, { mimeType: mime });
  const chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);

  rec.onstop = () => {
    osc.stop();
    actx.close();
    setExportStatus(false);
    const blob = new Blob(chunks, { type: mime });
    loadVideo(blob, 'bouncy-cat.mp4');
  };

  rec.start();

  const startTime = performance.now();
  const durationMs = 3000;

  const anim = () => {
    const elapsed = performance.now() - startTime;
    const t = elapsed / 1000;

    // Draw cute bouncy cat face
    vCtx.fillStyle = '#ffeedd';
    vCtx.fillRect(0, 0, 360, 360);

    // Bouncing ball physics
    const bounceY = Math.abs(Math.sin(t * 3.5)) * 120;
    const catY = 240 - bounceY;

    // Pitch shift with bounce
    osc.frequency.setValueAtTime(260 + (240 - catY), actx.currentTime);

    // Cute ears
    vCtx.fillStyle = '#ff70a6';
    vCtx.beginPath();
    vCtx.moveTo(130, catY - 50);
    vCtx.lineTo(150, catY - 100);
    vCtx.lineTo(170, catY - 50);
    vCtx.fill();

    vCtx.beginPath();
    vCtx.moveTo(190, catY - 50);
    vCtx.lineTo(210, catY - 100);
    vCtx.lineTo(230, catY - 50);
    vCtx.fill();

    // Cat head
    vCtx.fillStyle = '#ffffff';
    vCtx.strokeStyle = '#111111';
    vCtx.lineWidth = 4;
    vCtx.beginPath();
    vCtx.arc(180, catY, 60, 0, Math.PI * 2);
    vCtx.fill();
    vCtx.stroke();

    // Eyes
    vCtx.fillStyle = '#111111';
    vCtx.beginPath();
    vCtx.arc(160, catY - 10, 8, 0, Math.PI * 2);
    vCtx.arc(200, catY - 10, 8, 0, Math.PI * 2);
    vCtx.fill();

    // Pink nose
    vCtx.fillStyle = '#ff70a6';
    vCtx.beginPath();
    vCtx.arc(180, catY + 6, 6, 0, Math.PI * 2);
    vCtx.fill();

    // Floor shadow
    vCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    vCtx.beginPath();
    const shadowScale = 1 - bounceY / 150;
    vCtx.ellipse(180, 310, 60 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
    vCtx.fill();

    setExportStatus(true, Math.round((elapsed / durationMs) * 100), 'Rendering bouncy video…');

    if (elapsed < durationMs) {
      requestAnimationFrame(anim);
    } else {
      rec.stop();
    }
  };

  requestAnimationFrame(anim);
}

/* ==========================================================================
   Event Listeners & User Interactions
   ========================================================================== */

function bindEvents() {
  // 1. Caption text input
  captionTextInput.addEventListener('input', () => {
    state.captionTop = captionTextInput.value;
    updatePreview();
  });

  captionBottomInput.addEventListener('input', () => {
    state.captionBottom = captionBottomInput.value;
    updatePreview();
  });

  btnResetText.addEventListener('click', () => {
    captionTextInput.value = 'plink';
    state.captionTop = 'plink';
    captionBottomInput.value = '';
    state.captionBottom = '';
    updatePreview();
    showToast('Reset text to "plink" 🐱', '↺');
  });

  // 2. Position segmented control
  $$('#posGroup .segmented-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#posGroup .segmented-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.position = btn.dataset.pos;
      bottomTextGroup.hidden = state.position !== 'both';
      updatePreview();
    });
  });

  // 3. Alignment segmented control
  $$('#alignGroup .segmented-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#alignGroup .segmented-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.alignment = btn.dataset.align;
      updatePreview();
    });
  });

  // 4. Text case segmented control
  $$('#caseGroup .segmented-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#caseGroup .segmented-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.textCase = btn.dataset.case;
      updatePreview();
    });
  });

  // 5. Typography controls
  fontFamilySelect.addEventListener('change', () => {
    state.fontFamily = fontFamilySelect.value;
    updatePreview();
  });

  autoSizeToggle.addEventListener('change', () => {
    state.autoSize = autoSizeToggle.checked;
    manualFontRow.style.opacity = state.autoSize ? '0.55' : '1';
    manualFontRow.style.pointerEvents = state.autoSize ? 'none' : 'auto';
    updatePreview();
  });

  fontSizeSlider.addEventListener('input', () => {
    state.fontSize = parseInt(fontSizeSlider.value, 10);
    lblFontSize.textContent = `${state.fontSize}px`;
    if (!state.autoSize) updatePreview();
  });

  // 6. Box styling: colors & padding
  bgColorPicker.addEventListener('input', () => {
    state.bgColor = bgColorPicker.value;
    updatePreview();
  });

  $$('#bgSwatches .color-swatch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.bgColor = btn.dataset.color;
      bgColorPicker.value = btn.dataset.color;
      updatePreview();
    });
  });

  textColorPicker.addEventListener('input', () => {
    state.textColor = textColorPicker.value;
    updatePreview();
  });

  $$('#textSwatches .color-swatch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.textColor = btn.dataset.color;
      textColorPicker.value = btn.dataset.color;
      updatePreview();
    });
  });

  paddingSlider.addEventListener('input', () => {
    state.padding = parseInt(paddingSlider.value, 10);
    lblPadding.textContent = `${state.padding}px`;
    updatePreview();
  });

  dividerSelect.addEventListener('change', () => {
    state.divider = dividerSelect.value;
    updatePreview();
  });

  // 7. Output scale
  $$('#scaleGroup .segmented-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#scaleGroup .segmented-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.exportScale = parseFloat(btn.dataset.scale);
    });
  });

  // 8. File Upload & Drag & Drop
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    fileInput.value = '';
  });

  dropzoneBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzoneBox.classList.add('drag-over');
  });

  dropzoneBox.addEventListener('dragleave', () => {
    dropzoneBox.classList.remove('drag-over');
  });

  dropzoneBox.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneBox.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  });

  // 9. Playback buttons (Play/Pause, Prev/Next, Mute, Scrubber)
  btnPlayPause.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    playIcon.textContent = state.isPlaying ? '⏸' : '▶';
    playLabel.textContent = state.isPlaying ? 'Pause' : 'Play';

    if (state.mediaType === 'gif') {
      if (state.isPlaying) startGifPlayback();
      else stopPlayback();
    } else if (state.mediaType === 'video' && state.videoEl) {
      if (state.isPlaying) state.videoEl.play();
      else state.videoEl.pause();
    }
  });

  btnPrevFrame.addEventListener('click', () => {
    if (state.mediaType === 'gif' && state.gifData) {
      state.isPlaying = false;
      playIcon.textContent = '▶';
      playLabel.textContent = 'Play';
      stopPlayback();
      const len = state.gifData.frames.length;
      state.currentFrame = (state.currentFrame - 1 + len) % len;
      updatePreview();
    } else if (state.mediaType === 'video' && state.videoEl) {
      state.videoEl.currentTime = Math.max(0, state.videoEl.currentTime - 0.1);
      updatePreview();
    }
  });

  btnNextFrame.addEventListener('click', () => {
    if (state.mediaType === 'gif' && state.gifData) {
      state.isPlaying = false;
      playIcon.textContent = '▶';
      playLabel.textContent = 'Play';
      stopPlayback();
      const len = state.gifData.frames.length;
      state.currentFrame = (state.currentFrame + 1) % len;
      updatePreview();
    } else if (state.mediaType === 'video' && state.videoEl) {
      state.videoEl.currentTime = Math.min(state.videoEl.duration || 0, state.videoEl.currentTime + 0.1);
      updatePreview();
    }
  });

  timelineScrubber.addEventListener('input', () => {
    if (state.mediaType === 'gif' && state.gifData) {
      state.currentFrame = parseInt(timelineScrubber.value, 10);
      updatePreview();
    } else if (state.mediaType === 'video' && state.videoEl && state.videoEl.duration) {
      const targetSec = (parseInt(timelineScrubber.value, 10) / 1000) * state.videoEl.duration;
      state.videoEl.currentTime = targetSec;
      updatePreview();
    }
  });

  btnMuteToggle.addEventListener('click', () => {
    if (state.videoEl) {
      state.videoEl.muted = !state.videoEl.muted;
      state.isAudioMuted = state.videoEl.muted;
      muteIcon.textContent = state.isAudioMuted ? '🔇' : '🔊';
      showToast(state.isAudioMuted ? 'Muted' : 'Unmuted', '🔊');
    }
  });

  // 10. Sample Buttons
  $('#samplePlink').addEventListener('click', () => {
    captionTextInput.value = 'plink';
    state.captionTop = 'plink';
    loadImage('./img/sample.png', 'plink.png');
  });

  $('#sampleKirby').addEventListener('click', () => {
    captionTextInput.value = 'wobble';
    state.captionTop = 'wobble';
    loadGif('./img/sample.gif', 'kirby.gif');
  });

  $('#sampleVideo').addEventListener('click', () => {
    captionTextInput.value = 'he bounce';
    state.captionTop = 'he bounce';
    generateSampleVideo();
  });

  // 11. Export Actions
  btnDownloadMain.addEventListener('click', () => {
    if (state.mediaType === 'image') exportImage('image/png', 'png');
    else if (state.mediaType === 'gif') exportGif();
    else if (state.mediaType === 'video') exportVideo();
  });

  btnCopyClipboard.addEventListener('click', copyImageToClipboard);

  btnExportAlt1.addEventListener('click', () => exportImage('image/jpeg', 'jpg'));
  btnExportAlt2.addEventListener('click', () => exportImage('image/webp', 'webp'));
  btnExportGifVideo.addEventListener('click', exportGifToVideo);
  btnExportVideoGif.addEventListener('click', exportVideoToGif);
}

/**
 * Dispatches file to appropriate loader based on type.
 */
function handleFile(file) {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime === 'image/gif' || name.endsWith('.gif')) {
    loadGif(file, file.name);
  } else if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mov')) {
    loadVideo(file, file.name);
  } else if (mime.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    loadImage(url, file.name);
  } else {
    showToast('Unsupported file type — try an image, GIF, or video!', '⚠️');
  }
}

/* ==========================================================================
   Initialization
   ========================================================================== */
async function init() {
  bindEvents();

  // Wait for Google Fonts to be ready so initial canvas text measurements are accurate
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check:', e);
    }
  }

  // Load the initial Plink sample cat
  loadImage('./img/sample.png', 'plink.png');
}

init();

