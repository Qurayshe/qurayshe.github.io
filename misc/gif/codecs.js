/**
 * Shared Client-Side Media Codecs for /misc/gif & /misc/sticker
 * - Animated GIF decoding (omggif) with full disposal method handling
 * - Animated GIF encoding (gifenc) with palette size & transparency support
 * - Animated WebP & APNG decoding (native ImageDecoder API)
 * - Video frame extraction (<video> + <canvas>)
 * - Spec-compliant Animated WebP muxing (RIFF VP8X + ANIM + ANMF) using native canvas WebP frames
 * - Auto-fit binary search for WhatsApp / target file size limits
 */

let gifencCache = null;

export async function getGifEncoder() {
  if (gifencCache) return gifencCache;
  const sources = [
    '../caption/vendor/gifenc.esm.js',
    '../caption/gifenc.js',
    'https://unpkg.com/gifenc@1.0.3/dist/gifenc.esm.js',
    'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js',
  ];
  for (const src of sources) {
    try {
      const mod = await import(src);
      if (mod && (mod.GIFEncoder || mod.default)) {
        gifencCache = {
          GIFEncoder: mod.GIFEncoder || mod.default,
          quantize: mod.quantize,
          applyPalette: mod.applyPalette,
        };
        return gifencCache;
      }
    } catch {
      // try next source
    }
  }
  throw new Error('Could not load GIFEncoder (gifenc) from any source.');
}

export async function ensureOmggif() {
  if (window.omggif && window.omggif.GifReader) return window.omggif;
  if (typeof window.GifReader !== 'undefined') {
    window.omggif = { GifReader: window.GifReader, GifWriter: window.GifWriter };
    return window.omggif;
  }
  const sources = [
    '../caption/vendor/omggif.js',
    '../caption/omggif.js',
    'https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js',
  ];
  for (const src of sources) {
    if (window.omggif && window.omggif.GifReader) break;
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => {
        if (!window.omggif && typeof window.GifReader !== 'undefined') {
          window.omggif = { GifReader: window.GifReader, GifWriter: window.GifWriter };
        }
        resolve();
      };
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  if (!window.omggif || !window.omggif.GifReader) {
    throw new Error('Could not load omggif decoder.');
  }
  return window.omggif;
}

/**
 * Decode an animated GIF ArrayBuffer into composited full-frame canvases.
 * Properly handles GIF disposal methods 0, 1, 2, and 3.
 */
export async function decodeGifBuffer(arrayBuffer) {
  const omggif = await ensureOmggif();
  const bytes = new Uint8Array(arrayBuffer);
  const reader = new omggif.GifReader(bytes);
  const width = reader.width;
  const height = reader.height;
  const numFrames = reader.numFrames();

  const compCanvas = document.createElement('canvas');
  compCanvas.width = width;
  compCanvas.height = height;
  const compCtx = compCanvas.getContext('2d', { willReadFrequently: true });

  const patchCanvas = document.createElement('canvas');
  patchCanvas.width = width;
  patchCanvas.height = height;
  const patchCtx = patchCanvas.getContext('2d');

  const frames = [];
  let prevBackup = null;

  for (let i = 0; i < numFrames; i++) {
    const info = reader.frameInfo(i);
    if (info.disposal === 3) {
      prevBackup = compCtx.getImageData(0, 0, width, height);
    }

    const rgba = new Uint8ClampedArray(width * height * 4);
    reader.decodeAndBlitFrameRGBA(i, rgba);
    patchCtx.clearRect(0, 0, width, height);
    patchCtx.putImageData(new ImageData(rgba, width, height), 0, 0);

    // Draw only the frame's sub-rect onto the composite canvas
    compCtx.drawImage(
      patchCanvas,
      info.x,
      info.y,
      info.width,
      info.height,
      info.x,
      info.y,
      info.width,
      info.height
    );

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = width;
    frameCanvas.height = height;
    frameCanvas.getContext('2d').drawImage(compCanvas, 0, 0);

    const delayMs = Math.max(20, (info.delay || 10) * 10);
    frames.push({ canvas: frameCanvas, delay: delayMs });

    if (info.disposal === 2) {
      compCtx.clearRect(info.x, info.y, info.width, info.height);
    } else if (info.disposal === 3 && prevBackup) {
      compCtx.putImageData(prevBackup, 0, 0);
      prevBackup = null;
    }
  }

  return { width, height, frames };
}

/**
 * Decode animated WebP / APNG / AVIF via native ImageDecoder when available.
 */
async function decodeWithImageDecoder(arrayBuffer, mimeType) {
  if (typeof window.ImageDecoder === 'undefined') return null;
  try {
    const supported = await window.ImageDecoder.isTypeSupported(mimeType);
    if (!supported) return null;

    const decoder = new window.ImageDecoder({ data: arrayBuffer, type: mimeType });
    await decoder.completed;
    const track = decoder.tracks.selectedTrack;
    const count = track ? track.frameCount : 1;
    if (count <= 1) {
      decoder.close();
      return null;
    }

    const frames = [];
    let width = 0;
    let height = 0;

    for (let i = 0; i < count; i++) {
      const res = await decoder.decode({ frameIndex: i });
      const vf = res.image;
      width = vf.displayWidth || vf.codedWidth;
      height = vf.displayHeight || vf.codedHeight;

      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      c.getContext('2d').drawImage(vf, 0, 0, width, height);

      const delayMs = Math.max(20, Math.round((vf.duration || 100000) / 1000));
      vf.close();
      frames.push({ canvas: c, delay: delayMs });
    }

    decoder.close();
    return { width, height, frames };
  } catch {
    return null;
  }
}

/**
 * Load a static image Blob/URL onto a single-frame canvas.
 */
export function loadImageToCanvas(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width || 256;
      const h = img.naturalHeight || img.height || 256;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve({ width: w, height: h, canvas: c });
    };
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = src;
  });
}

/**
 * Decode an image File/Blob (static or animated GIF/WebP/APNG) into frames.
 */
export async function decodeImageFile(file) {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (mime === 'image/gif' || name.endsWith('.gif')) {
    const buf = await file.arrayBuffer();
    return decodeGifBuffer(buf);
  }

  if (mime === 'image/webp' || mime === 'image/png' || name.endsWith('.webp') || name.endsWith('.apng')) {
    const buf = await file.arrayBuffer();
    const tryMime = mime || (name.endsWith('.webp') ? 'image/webp' : 'image/png');
    const animated = await decodeWithImageDecoder(buf, tryMime);
    if (animated && animated.frames.length > 1) return animated;
  }

  const url = URL.createObjectURL(file);
  try {
    const { width, height, canvas } = await loadImageToCanvas(url);
    return { width, height, frames: [{ canvas, delay: 100 }] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Extract frames from a <video> element over a time range.
 */
export async function extractVideoFrames(videoEl, {
  startSec = 0,
  endSec = null,
  fps = 12,
  maxWidth = 512,
  maxFrames = 120,
  onProgress = null,
} = {}) {
  const duration = isFinite(videoEl.duration) ? videoEl.duration : 3;
  const start = Math.max(0, Math.min(startSec, duration));
  const end = endSec !== null ? Math.max(start + 0.1, Math.min(endSec, duration)) : duration;
  const span = Math.max(0.1, end - start);

  const step = 1 / Math.max(1, fps);
  const count = Math.min(maxFrames, Math.max(1, Math.floor(span * fps)));
  const delayMs = Math.max(20, Math.round(1000 / Math.max(1, fps)));

  const srcW = videoEl.videoWidth || 480;
  const srcH = videoEl.videoHeight || 480;
  const scale = srcW > maxWidth ? maxWidth / srcW : 1;
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const wasPaused = videoEl.paused;
  videoEl.pause();

  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = Math.min(duration - 0.001, start + i * step);
    await new Promise((resolve) => {
      const onSeeked = () => {
        videoEl.removeEventListener('seeked', onSeeked);
        resolve();
      };
      videoEl.addEventListener('seeked', onSeeked);
      videoEl.currentTime = t;
    });

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    c.getContext('2d').drawImage(videoEl, 0, 0, width, height);
    frames.push({ canvas: c, delay: delayMs });

    if (onProgress) onProgress((i + 1) / count);
    if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  if (!wasPaused) {
    videoEl.play().catch(() => {});
  }
  return { width, height, frames };
}

/**
 * Apply subtle spatial lossy smoothing (reduces high-frequency noise so LZW compresses 25-50% smaller).
 */
function applyLossySmooth(rgba, width, height, level) {
  if (level <= 0) return rgba;
  const out = new Uint8ClampedArray(rgba);
  // Threshold scales from 0..200 -> max channel diff 0..42
  const thresh = Math.round((level / 200) * 42);
  if (thresh <= 0) return out;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 1; x < width; x++) {
      const i = row + x * 4;
      const p = i - 4;
      if (out[i + 3] < 128 || out[p + 3] < 128) continue;
      if (
        Math.abs(out[i] - out[p]) <= thresh &&
        Math.abs(out[i + 1] - out[p + 1]) <= thresh &&
        Math.abs(out[i + 2] - out[p + 2]) <= thresh
      ) {
        out[i] = out[p];
        out[i + 1] = out[p + 1];
        out[i + 2] = out[p + 2];
      }
    }
  }
  return out;
}

/**
 * Floyd-Steinberg error-diffusion dithering into a palette.
 */
function applyPaletteDithered(rgba, width, height, palette, transparentIndex = -1) {
  const buf = new Float32Array(rgba.length);
  for (let i = 0; i < rgba.length; i++) buf[i] = rgba[i];
  const out = new Uint8Array(width * height);
  const palLen = palette.length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const o = idx * 4;
      if (transparentIndex >= 0 && buf[o + 3] < 128) {
        out[idx] = transparentIndex;
        continue;
      }
      const r = Math.max(0, Math.min(255, buf[o]));
      const g = Math.max(0, Math.min(255, buf[o + 1]));
      const b = Math.max(0, Math.min(255, buf[o + 2]));

      let best = 0;
      let bestDist = Infinity;
      for (let p = 0; p < palLen; p++) {
        if (p === transparentIndex) continue;
        const c = palette[p];
        const dr = r - c[0];
        const dg = g - c[1];
        const db = b - c[2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) {
          bestDist = d;
          best = p;
          if (d === 0) break;
        }
      }
      out[idx] = best;
      const chosen = palette[best];
      const er = r - chosen[0];
      const eg = g - chosen[1];
      const eb = b - chosen[2];

      const spread = (nx, ny, w) => {
        if (nx < 0 || nx >= width || ny >= height) return;
        const no = (ny * width + nx) * 4;
        if (transparentIndex >= 0 && buf[no + 3] < 128) return;
        buf[no] += er * w;
        buf[no + 1] += eg * w;
        buf[no + 2] += eb * w;
      };
      spread(x + 1, y, 7 / 16);
      spread(x - 1, y + 1, 3 / 16);
      spread(x, y + 1, 5 / 16);
      spread(x + 1, y + 1, 1 / 16);
    }
  }
  return out;
}

/**
 * Remove consecutive duplicate (or near-duplicate within fuzz) frames, summing delays.
 */
export function deduplicateFrames(frameDatas, fuzz = 8) {
  if (frameDatas.length <= 1) return frameDatas;
  const out = [{ ...frameDatas[0] }];
  const tol = Math.max(0, fuzz);

  for (let i = 1; i < frameDatas.length; i++) {
    const prev = out[out.length - 1].data;
    const cur = frameDatas[i].data;
    let diffCount = 0;
    const totalPixels = cur.length / 4;
    const maxDiffPixels = Math.floor(totalPixels * 0.004); // <0.4% pixels changed -> duplicate

    for (let p = 0; p < cur.length; p += 4) {
      if (
        Math.abs(cur[p] - prev[p]) > tol ||
        Math.abs(cur[p + 1] - prev[p + 1]) > tol ||
        Math.abs(cur[p + 2] - prev[p + 2]) > tol ||
        Math.abs(cur[p + 3] - prev[p + 3]) > 32
      ) {
        diffCount++;
        if (diffCount > maxDiffPixels) break;
      }
    }

    if (diffCount <= maxDiffPixels) {
      out[out.length - 1].delay += frameDatas[i].delay;
    } else {
      out.push({ ...frameDatas[i] });
    }
  }
  return out;
}

/**
 * Encode rendered frames ({ imageData, delay } or { canvas, delay }) into an animated GIF Blob
 * with ezgif-style optimization options (lossy smoothing, dithering, global palette,
 * duplicate removal, delta transparency optimization, coalesce).
 */
export async function encodeGifFrames(frames, {
  width,
  height,
  maxColors = 256,
  repeat = 0,
  lossyLevel = 0,
  dither = false,
  globalPalette = false,
  removeDuplicates = false,
  optimizeTransparency = false,
  coalesce = false,
  fuzz = 10,
  onProgress = null,
} = {}) {
  const { GIFEncoder, quantize, applyPalette } = await getGifEncoder();
  const gif = GIFEncoder();

  // Extract raw RGBA buffers
  let working = frames.map((f) => {
    const raw = f.imageData
      ? new Uint8ClampedArray(f.imageData.data)
      : new Uint8ClampedArray(
          f.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height).data
        );
    return { data: raw, delay: Math.max(20, Math.round(f.delay || 100)) };
  });

  if (removeDuplicates && working.length > 1) {
    working = deduplicateFrames(working, Math.max(4, fuzz));
  }

  // Detect if source frames already contain transparent pixels
  let sourceHasAlpha = false;
  for (const w of working) {
    for (let p = 3; p < w.data.length; p += 4) {
      if (w.data[p] < 128) {
        sourceHasAlpha = true;
        break;
      }
    }
    if (sourceHasAlpha) break;
  }

  // Delta transparency optimization only works cleanly when source frames don't have moving cutouts
  const useDeltaTrans = optimizeTransparency && !coalesce && !sourceHasAlpha && working.length > 1;
  const needsAlphaSlot = sourceHasAlpha || useDeltaTrans;
  const colorCount = Math.max(2, Math.min(256, maxColors));

  // Optional shared global color table across all frames
  let sharedPalette = null;
  let sharedTransIdx = -1;
  if (globalPalette && working.length > 1) {
    const sampleStride = Math.max(1, Math.floor((working.length * width * height) / 48000));
    const samples = [];
    for (let f = 0; f < working.length; f++) {
      const d = working[f].data;
      for (let p = 0; p < d.length; p += 4 * sampleStride) {
        samples.push(d[p], d[p + 1], d[p + 2], d[p + 3]);
      }
    }
    const sampleBuf = new Uint8ClampedArray(samples);
    const fmt = needsAlphaSlot ? 'rgba4444' : 'rgb565';
    sharedPalette = quantize(sampleBuf, Math.max(2, needsAlphaSlot ? colorCount - 1 : colorCount), {
      format: fmt,
      oneBitAlpha: needsAlphaSlot,
    });
    if (needsAlphaSlot) {
      sharedTransIdx = sharedPalette.findIndex((c) => c.length >= 4 && c[3] === 0);
      if (sharedTransIdx === -1) {
        if (sharedPalette.length < 256) {
          sharedTransIdx = sharedPalette.length;
          sharedPalette.push([0, 0, 0, 0]);
        } else {
          sharedTransIdx = sharedPalette.length - 1;
          sharedPalette[sharedTransIdx] = [0, 0, 0, 0];
        }
      }
    }
  }

  let prevData = null;

  for (let i = 0; i < working.length; i++) {
    let data = working[i].data;
    if (lossyLevel > 0 && !coalesce) {
      data = applyLossySmooth(data, width, height, lossyLevel);
    }

    // Apply delta-frame transparency (unchanged pixels -> alpha 0, keep previous frame with dispose=1)
    let frameData = data;
    let frameIsDelta = false;
    if (useDeltaTrans && prevData) {
      frameIsDelta = true;
      const delta = new Uint8ClampedArray(data);
      const tol = Math.max(2, Math.round(fuzz + lossyLevel * 0.12));
      for (let p = 0; p < delta.length; p += 4) {
        if (
          Math.abs(delta[p] - prevData[p]) <= tol &&
          Math.abs(delta[p + 1] - prevData[p + 1]) <= tol &&
          Math.abs(delta[p + 2] - prevData[p + 2]) <= tol
        ) {
          delta[p + 3] = 0;
        }
      }
      frameData = delta;
    }

    const frameHasAlpha = sourceHasAlpha || frameIsDelta;
    const format = frameHasAlpha ? 'rgba4444' : 'rgb565';

    let palette = sharedPalette;
    let transparentIndex = sharedTransIdx;

    if (!palette) {
      palette = quantize(frameData, colorCount, {
        format,
        oneBitAlpha: frameHasAlpha,
      });
      if (frameHasAlpha) {
        transparentIndex = palette.findIndex((c) => c.length >= 4 && c[3] === 0);
        if (transparentIndex === -1) {
          if (palette.length < 256) {
            transparentIndex = palette.length;
            palette.push([0, 0, 0, 0]);
          } else {
            transparentIndex = 0;
          }
        }
      } else {
        transparentIndex = -1;
      }
    }

    const index = dither
      ? applyPaletteDithered(frameData, width, height, palette, frameHasAlpha ? transparentIndex : -1)
      : applyPalette(frameData, palette, format);

    // If delta transparency was applied, force transparent pixels to transparentIndex
    if (frameIsDelta && transparentIndex >= 0) {
      for (let p = 0, px = 0; p < frameData.length; p += 4, px++) {
        if (frameData[p + 3] === 0) index[px] = transparentIndex;
      }
    }

    gif.writeFrame(index, width, height, {
      palette: globalPalette && i > 0 ? undefined : palette,
      delay: working[i].delay,
      repeat: i === 0 ? repeat : undefined,
      transparent: frameHasAlpha,
      transparentIndex: frameHasAlpha ? Math.max(0, transparentIndex) : 0,
      dispose: coalesce ? 2 : sourceHasAlpha ? 2 : 1,
    });

    prevData = data;
    if (onProgress) onProgress((i + 1) / working.length);
    if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

/* ==========================================================================
   WebP Encoding & Animated WebP RIFF Muxer (VP8X + ANIM + ANMF)
   ========================================================================== */

export function canvasToWebPBlob(canvas, quality = 0.85) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas WebP export failed.'));
          return;
        }
        if (blob.type !== 'image/webp') {
          reject(new Error('This browser does not support native canvas WebP encoding.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      Math.max(0.01, Math.min(1, quality))
    );
  });
}

function readFourCC(bytes, offset) {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3]
  );
}

function writeFourCC(bytes, offset, str) {
  bytes[offset] = str.charCodeAt(0);
  bytes[offset + 1] = str.charCodeAt(1);
  bytes[offset + 2] = str.charCodeAt(2);
  bytes[offset + 3] = str.charCodeAt(3);
}

function writeU32LE(bytes, offset, val) {
  bytes[offset] = val & 0xff;
  bytes[offset + 1] = (val >>> 8) & 0xff;
  bytes[offset + 2] = (val >>> 16) & 0xff;
  bytes[offset + 3] = (val >>> 24) & 0xff;
}

function writeU24LE(bytes, offset, val) {
  bytes[offset] = val & 0xff;
  bytes[offset + 1] = (val >>> 8) & 0xff;
  bytes[offset + 2] = (val >>> 16) & 0xff;
}

function writeU16LE(bytes, offset, val) {
  bytes[offset] = val & 0xff;
  bytes[offset + 1] = (val >>> 8) & 0xff;
}

/**
 * Extract raw ALPH + VP8/VP8L chunks from a single-frame WebP RIFF buffer.
 * Returns { payload: Uint8Array, hasAlpha: boolean }.
 */
export function extractWebPFrameChunks(webpBytes) {
  if (
    webpBytes.length < 12 ||
    readFourCC(webpBytes, 0) !== 'RIFF' ||
    readFourCC(webpBytes, 8) !== 'WEBP'
  ) {
    throw new Error('Invalid WebP frame buffer.');
  }

  const kept = [];
  let hasAlpha = false;
  let offset = 12;

  while (offset + 8 <= webpBytes.length) {
    const fourcc = readFourCC(webpBytes, offset);
    const chunkSize =
      (webpBytes[offset + 4] |
        (webpBytes[offset + 5] << 8) |
        (webpBytes[offset + 6] << 16) |
        (webpBytes[offset + 7] << 24)) >>>
      0;
    const paddedSize = chunkSize + (chunkSize & 1);
    const totalLen = 8 + paddedSize;

    if (offset + 8 + chunkSize > webpBytes.length) break;

    if (fourcc === 'ALPH' || fourcc === 'VP8 ' || fourcc === 'VP8L') {
      if (fourcc === 'ALPH') hasAlpha = true;
      if (fourcc === 'VP8L') {
        // VP8L bit 4 of byte 4 of payload (offset + 8 + 4) indicates alpha
        if (offset + 12 < webpBytes.length && (webpBytes[offset + 12] & 0x10)) {
          hasAlpha = true;
        }
      }
      // Copy chunk including even-byte padding
      const slice = new Uint8Array(totalLen);
      const copyEnd = Math.min(webpBytes.length, offset + totalLen);
      slice.set(webpBytes.subarray(offset, copyEnd));
      kept.push(slice);
    }

    offset += totalLen;
  }

  if (!kept.length) {
    throw new Error('No VP8/VP8L image chunk found in WebP frame.');
  }

  let total = 0;
  for (const k of kept) total += k.length;
  const payload = new Uint8Array(total);
  let pos = 0;
  for (const k of kept) {
    payload.set(k, pos);
    pos += k.length;
  }
  return { payload, hasAlpha };
}

/**
 * Mux pre-extracted frame chunks [{ payload, durationMs, hasAlpha }] into a
 * spec-compliant Animated WebP Uint8Array (RIFF WEBP + VP8X + ANIM + ANMF...).
 */
export function muxWebPChunks(frameEntries, width, height, loopCount = 0) {
  const anyAlpha = frameEntries.some((f) => f.hasAlpha);

  // VP8X chunk: 8 header + 10 payload = 18 bytes
  const vp8x = new Uint8Array(18);
  writeFourCC(vp8x, 0, 'VP8X');
  writeU32LE(vp8x, 4, 10);
  vp8x[8] = 0x02 | (anyAlpha ? 0x10 : 0x00); // Animation (bit 1) + Alpha (bit 4)
  writeU24LE(vp8x, 12, Math.max(0, width - 1));
  writeU24LE(vp8x, 15, Math.max(0, height - 1));

  // ANIM chunk: 8 header + 6 payload = 14 bytes
  const anim = new Uint8Array(14);
  writeFourCC(anim, 0, 'ANIM');
  writeU32LE(anim, 4, 6);
  // BGRA background = 0,0,0,0 (transparent)
  writeU16LE(anim, 12, loopCount & 0xffff);

  // ANMF chunks
  const anmfChunks = [];
  let anmfTotalBytes = 0;

  for (const entry of frameEntries) {
    const payloadSize = 16 + entry.payload.length;
    const paddedSize = payloadSize + (payloadSize & 1);
    const chunk = new Uint8Array(8 + paddedSize);

    writeFourCC(chunk, 0, 'ANMF');
    writeU32LE(chunk, 4, payloadSize);
    // Frame X/2 = 0, Frame Y/2 = 0
    writeU24LE(chunk, 14, Math.max(0, width - 1));
    writeU24LE(chunk, 17, Math.max(0, height - 1));
    writeU24LE(chunk, 20, Math.max(10, Math.round(entry.durationMs || 100)));
    // Byte 23: bit 1 = do not blend (1), bit 0 = dispose to background (1) -> 0x03
    chunk[23] = 0x03;
    chunk.set(entry.payload, 24);

    anmfChunks.push(chunk);
    anmfTotalBytes += chunk.length;
  }

  const riffPayloadSize = 4 + vp8x.length + anim.length + anmfTotalBytes;
  const out = new Uint8Array(8 + riffPayloadSize);

  writeFourCC(out, 0, 'RIFF');
  writeU32LE(out, 4, riffPayloadSize);
  writeFourCC(out, 8, 'WEBP');

  let pos = 12;
  out.set(vp8x, pos);
  pos += vp8x.length;
  out.set(anim, pos);
  pos += anim.length;
  for (const c of anmfChunks) {
    out.set(c, pos);
    pos += c.length;
  }

  return out;
}

/**
 * Encode an array of { canvas, delay } frames into an Animated WebP Blob.
 */
export async function encodeAnimatedWebP(frames, {
  width,
  height,
  quality = 0.8,
  loopCount = 0,
  onProgress = null,
} = {}) {
  if (frames.length === 1) {
    const blob = await canvasToWebPBlob(frames[0].canvas, quality);
    if (onProgress) onProgress(1);
    return blob;
  }

  const entries = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const blob = await canvasToWebPBlob(f.canvas, quality);
    const buf = new Uint8Array(await blob.arrayBuffer());
    const { payload, hasAlpha } = extractWebPFrameChunks(buf);
    entries.push({
      payload,
      hasAlpha,
      durationMs: Math.max(20, Math.round(f.delay || 100)),
    });
    if (onProgress) onProgress((i + 1) / frames.length);
    if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  const muxed = muxWebPChunks(entries, width, height, loopCount);
  return new Blob([muxed], { type: 'image/webp' });
}

/**
 * Encode WebP (static or animated) and automatically lower quality (and optionally
 * subsample frames for animated WebP) to stay within maxBytes (e.g. 100 KB / 500 KB).
 */
export async function encodeWebPWithSizeLimit(frames, {
  width,
  height,
  initialQuality = 0.85,
  maxBytes = 500 * 1024,
  autoFit = true,
  loopCount = 0,
  onProgress = null,
} = {}) {
  const isAnimated = frames.length > 1;
  let blob = await encodeAnimatedWebP(frames, {
    width,
    height,
    quality: initialQuality,
    loopCount,
    onProgress: (p) => onProgress && onProgress(p * 0.5),
  });

  if (!autoFit || blob.size <= maxBytes) {
    if (onProgress) onProgress(1);
    return { blob, qualityUsed: initialQuality, framesUsed: frames.length, fitted: blob.size <= maxBytes };
  }

  // Binary search quality between 0.08 and initialQuality
  let lo = 0.08;
  let hi = initialQuality;
  let bestBlob = blob;
  let bestQ = initialQuality;
  let bestFits = false;

  for (let iter = 0; iter < 5; iter++) {
    const mid = (lo + hi) / 2;
    const candidate = await encodeAnimatedWebP(frames, {
      width,
      height,
      quality: mid,
      loopCount,
    });
    if (onProgress) onProgress(0.5 + ((iter + 1) / 6) * 0.4);

    if (candidate.size <= maxBytes) {
      bestBlob = candidate;
      bestQ = mid;
      bestFits = true;
      lo = mid; // try higher quality
    } else {
      if (!bestFits && candidate.size < bestBlob.size) {
        bestBlob = candidate;
        bestQ = mid;
      }
      hi = mid;
    }
  }

  // If animated still exceeds maxBytes, progressively drop frames (preserving total duration)
  let workingFrames = frames;
  while (isAnimated && !bestFits && workingFrames.length > 4) {
    const reduced = [];
    for (let i = 0; i < workingFrames.length; i += 2) {
      const f = workingFrames[i];
      const next = workingFrames[i + 1];
      reduced.push({
        canvas: f.canvas,
        delay: f.delay + (next ? next.delay : 0),
      });
    }
    workingFrames = reduced;
    const candidate = await encodeAnimatedWebP(workingFrames, {
      width,
      height,
      quality: Math.max(0.25, bestQ),
      loopCount,
    });
    if (candidate.size <= maxBytes) {
      bestBlob = candidate;
      bestFits = true;
      break;
    } else if (candidate.size < bestBlob.size) {
      bestBlob = candidate;
    }
  }

  if (onProgress) onProgress(1);
  return {
    blob: bestBlob,
    qualityUsed: Math.round(bestQ * 100) / 100,
    framesUsed: workingFrames.length,
    fitted: bestBlob.size <= maxBytes,
  };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
