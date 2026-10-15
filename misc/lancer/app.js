/**
 * Lancer TTRPG Hex Token Generator - Core Application
 * Full-featured tactical hexagonal token generator with:
 * - Stable non-transforming hex positioning
 * - Canvas edge extensions & Roll20 VTT snapping offsets
 * - Full-token retro pixelation & CRT filters (affecting entire token & border)
 * - True 3D angle-aware extrusion puck rim
 * - Functioning smooth metallic, chiseled & pillow 3D bevels
 * - Multi-color border styles with secondary color control
 * - Dedicated Pop-Out & Masking submenu (Cutoff plane, guide line, custom brush paint)
 */

class LancerTokenApp {
  constructor() {
    this.canvas = document.getElementById('tokenCanvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    // Master composition buffer for full-token post-processing
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    
    // Dedicated layer buffers to isolate shadows and guarantee 100% full transparency
    this.shadowCanvas = document.createElement('canvas');
    this.shadowCtx = this.shadowCanvas.getContext('2d', { willReadFrequently: true });

    this.tokenCanvas = document.createElement('canvas');
    this.tokenCtx = this.tokenCanvas.getContext('2d', { willReadFrequently: true });

    // Pixelation downsampling buffer
    this.pixelCanvas = document.createElement('canvas');
    this.pixelCtx = this.pixelCanvas.getContext('2d');

    // Custom painted mask buffer for freehand pop-out
    this.customMaskCanvas = document.createElement('canvas');
    this.customMaskCtx = this.customMaskCanvas.getContext('2d');

    // Master State
    this.state = {
      tokenSize: 500,
      isSquare: false,
      borderSize: '1',         // '0.5', '1', '2', '3', '4'
      borderHorizontal: false, // false = Pointy-topped (Vertical hex), true = Flat-topped
      borderSnapOffset: false, // flip orientation for Size 2
      showSubHexGrid: false,
      borderWidth: 10,
      borderColor: '#c21f25',
      borderColor2: '#ffffff',
      borderStyle: 'solid',    // 'solid', 'double', 'glow', 'chiseled'
      borderInFront: true,

      // Canvas Edge Extensions / Padding & Grid Alignment (Roll20 / VTT Snap)
      padTop: 0,
      padBottom: 0,
      padLeft: 0,
      padRight: 0,
      gridOffsetX: 0,
      gridOffsetY: 0,
      linkPaddings: false,
      
      // Background
      bgTransparent: false,
      bgColor: '#12161f',
      bgPattern: 'solid',      // 'solid', 'radial', 'hexgrid', 'carbon', 'circuit', 'hangar'
      cropBackground: true,
      
      // Image & Transform (null by default for clean blank frame)
      image: null,
      imageFilename: '',
      imageScale: 1.0,
      imageRotation: 0,
      imageOffsetX: 0,
      imageOffsetY: 0,
      flipH: false,
      flipV: false,
      cropImage: true,

      // Dedicated Pop-Out & Masking
      popoutBreach: false,
      popoutMode: 'cutoff',    // 'cutoff', 'brush', 'both'
      popoutCutoff: 35,        // percentage (0-100)
      popoutAngle: 0,          // degrees (-90 to +90)
      popoutFlip: false,
      popoutFeather: 0,
      popoutShowGuide: true,
      brushMode: 'reveal',     // 'reveal' (pop-out) | 'clip' (erase)
      brushSize: 30,

      // 3D & Shadows (Guaranteed not to shift token center)
      enableBevel: true,
      bevelDepth: 8,
      bevelAngle: 135,
      bevelStyle: 'smooth',    // 'smooth', 'chisel', 'pillow'
      enableDropShadow: true,
      shadowBlur: 18,
      shadowDistance: 12,
      shadowOffsetY: 12,
      shadowAngle: 90,
      
      // Full-Token Retro Shaders
      enablePixelate: false,
      pixelSize: 4,
      colorPalette: 'none',
      enableScanlines: false,
      chromaticAberration: 0,
      filmGrain: 0,
      vignette: 0,
      filterTint: 'none',
      brightness: 100,
      contrast: 100,
      saturation: 100,
      
      // Interactive Viewport
      exportMult: 1,
      is3DView: false,
      perspectivePitch: 45,
      perspectiveYaw: 0,
      viewZoom: 1.0,
      activeTab: 'tab-frame'
    };

    // Interaction Drag & Paint Tracking
    this.isDragging = false;
    this.isPainting = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartImgX = 0;
    this.dragStartImgY = 0;
    this.dragStartPitch = 45;
    this.dragStartYaw = 0;
    this.isShiftDrag = false;

    // Cache polygon loop, center, and radius
    this.currentPolygon = [];
    this.currentCenters = [];
    this.currentRadius = 100;
    this.hexCenterX = 250;
    this.hexCenterY = 250;
    this.totalCanvasW = 500;
    this.totalCanvasH = 500;

    this.init();
  }

  init() {
    this.bindDomEvents();
    this.bindCanvasInteractions();
    this.updateHUD();
    this.render();
  }

  /* --------------------------------------------------------------------------
     HEX GEOMETRY & FIXED CENTER CALCULATION
     -------------------------------------------------------------------------- */
  getHexPoints(cx, cy, R, horizontal) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const deg = horizontal ? (i * 60) : (i * 60 - 90);
      const rad = deg * Math.PI / 180;
      pts.push({
        x: +(cx + R * Math.cos(rad)).toFixed(3),
        y: +(cy + R * Math.sin(rad)).toFixed(3)
      });
    }
    return pts;
  }

  computeHexCenters(size, horizontal, snapOffset, R) {
    const D = R * Math.sqrt(3);
    const centers = [];

    if (size === '0.5' || size === '1') {
      centers.push({ x: 0, y: 0 });
    } else if (size === '2') {
      if (!horizontal) {
        if (!snapOffset) {
          centers.push({ x: 0, y: -R });
          centers.push({ x: -D / 2, y: R / 2 });
          centers.push({ x: D / 2, y: R / 2 });
        } else {
          centers.push({ x: 0, y: R });
          centers.push({ x: -D / 2, y: -R / 2 });
          centers.push({ x: D / 2, y: -R / 2 });
        }
      } else {
        if (!snapOffset) {
          centers.push({ x: -R, y: 0 });
          centers.push({ x: R / 2, y: -D / 2 });
          centers.push({ x: R / 2, y: D / 2 });
        } else {
          centers.push({ x: R, y: 0 });
          centers.push({ x: -R / 2, y: -D / 2 });
          centers.push({ x: -R / 2, y: D / 2 });
        }
      }
    } else if (size === '3') {
      centers.push({ x: 0, y: 0 });
      const angles = horizontal ? [30, 90, 150, 210, 270, 330] : [0, 60, 120, 180, 240, 300];
      for (const a of angles) {
        const rad = a * Math.PI / 180;
        centers.push({
          x: +(D * Math.cos(rad)).toFixed(3),
          y: +(D * Math.sin(rad)).toFixed(3)
        });
      }
    } else if (size === '4') {
      const radius = 2;
      for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
          let x, y;
          if (horizontal) {
            x = R * (1.5 * q);
            y = R * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
          } else {
            x = R * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
            y = R * (1.5 * r);
          }
          centers.push({ x: +x.toFixed(3), y: +y.toFixed(3) });
        }
      }
    }
    return centers;
  }

  getClusterPerimeter(centers, R, horizontal) {
    const edgeCounts = new Map();
    const edges = [];
    const k = (p) => `${p.x},${p.y}`;
    const ek = (p1, p2) => {
      const k1 = k(p1), k2 = k(p2);
      return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    };

    for (const c of centers) {
      const h = this.getHexPoints(c.x, c.y, R, horizontal);
      for (let i = 0; i < 6; i++) {
        const p1 = h[i];
        const p2 = h[(i + 1) % 6];
        const key = ek(p1, p2);
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
        edges.push({ p1, p2, key });
      }
    }

    const outerEdges = edges.filter(e => edgeCounts.get(e.key) === 1);
    if (!outerEdges.length) return [];

    const adj = new Map();
    for (const e of outerEdges) {
      const k1 = k(e.p1);
      if (!adj.has(k1)) adj.set(k1, []);
      adj.get(k1).push(e.p2);
    }

    const startPt = outerEdges[0].p1;
    const loop = [startPt];
    let curr = startPt;
    const visited = new Set();

    while (true) {
      const currK = k(curr);
      const neighbors = adj.get(currK) || [];
      let nxt = null;
      for (const cand of neighbors) {
        const edgeId = `${currK}->${k(cand)}`;
        if (!visited.has(edgeId)) {
          nxt = cand;
          visited.add(edgeId);
          break;
        }
      }
      if (!nxt || k(nxt) === k(startPt)) break;
      loop.push(nxt);
      curr = nxt;
    }

    // Ensure Clockwise Winding via Shoelace Area
    let area = 0;
    for (let i = 0; i < loop.length; i++) {
      const j = (i + 1) % loop.length;
      area += (loop[i].x * loop[j].y) - (loop[j].x * loop[i].y);
    }
    if (area < 0) {
      loop.reverse();
    }
    return loop;
  }

  /**
   * Updates geometry with STABLE, NON-TRANSFORMING center and radius.
   * Drop shadow and extrusion DO NOT alter the token radius or center!
   */
  updateGeometry() {
    const { tokenSize, borderSize, borderHorizontal, borderSnapOffset, padTop, padBottom, padLeft, padRight, gridOffsetX, gridOffsetY, isSquare } = this.state;
    
    // Total canvas dimension including asymmetric edge paddings for VTT snapping
    this.totalCanvasW = tokenSize + padLeft + padRight;
    this.totalCanvasH = tokenSize + padTop + padBottom;

    // Stable, predictable hex center
    this.hexCenterX = padLeft + tokenSize / 2 + gridOffsetX;
    this.hexCenterY = padTop + tokenSize / 2 + gridOffsetY;

    // Fixed base margin strictly based on standard border clearance (independent of shadow/extrusion!)
    const fixedMargin = 28;
    const availDim = tokenSize - fixedMargin * 2;

    if (isSquare) {
      const half = availDim / 2;
      const cx = this.hexCenterX;
      const cy = this.hexCenterY;
      this.currentRadius = half;
      this.currentCenters = [{ x: cx, y: cy }];
      this.currentPolygon = [
        { x: cx - half, y: cy - half },
        { x: cx + half, y: cy - half },
        { x: cx + half, y: cy + half },
        { x: cx - half, y: cy + half }
      ];
    } else {
      // Calculate raw polygon
      const rawR = 100;
      const rawCenters = this.computeHexCenters(borderSize, borderHorizontal, borderSnapOffset, rawR);
      const rawLoop = this.getClusterPerimeter(rawCenters, rawR, borderHorizontal);

      if (!rawLoop.length) return;

      // Calculate raw bounding box
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of rawLoop) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const rawW = maxX - minX;
      const rawH = maxY - minY;
      const rawCenterX = (minX + maxX) / 2;
      const rawCenterY = (minY + maxY) / 2;

      const scale = Math.min(availDim / rawW, availDim / rawH);

      this.currentRadius = rawR * scale;
      this.currentCenters = rawCenters.map(c => ({
        x: this.hexCenterX + (c.x - rawCenterX) * scale,
        y: this.hexCenterY + (c.y - rawCenterY) * scale
      }));

      this.currentPolygon = rawLoop.map(p => ({
        x: this.hexCenterX + (p.x - rawCenterX) * scale,
        y: this.hexCenterY + (p.y - rawCenterY) * scale
      }));
    }

    // Ensure custom mask canvas matches total canvas resolution
    if (this.customMaskCanvas.width !== this.totalCanvasW || this.customMaskCanvas.height !== this.totalCanvasH) {
      const temp = document.createElement('canvas');
      temp.width = this.customMaskCanvas.width;
      temp.height = this.customMaskCanvas.height;
      temp.getContext('2d').drawImage(this.customMaskCanvas, 0, 0);

      this.customMaskCanvas.width = this.totalCanvasW;
      this.customMaskCanvas.height = this.totalCanvasH;
      if (temp.width > 0 && temp.height > 0) {
        this.customMaskCtx.drawImage(temp, 0, 0, this.totalCanvasW, this.totalCanvasH);
      }
    }
  }

  createPolygonPath(ctx, polygon = this.currentPolygon) {
    if (!polygon.length) return;
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
  }

  /* --------------------------------------------------------------------------
     MASTER RENDERING PIPELINE WITH ISOLATED SHADOWS & 100% TRANSPARENT BACKGROUND
     -------------------------------------------------------------------------- */
  render(isExport = false) {
    this.updateGeometry();

    const { exportMult } = this.state;
    const finalW = Math.round(this.totalCanvasW * exportMult);
    const finalH = Math.round(this.totalCanvasH * exportMult);

    if (this.canvas.width !== finalW || this.canvas.height !== finalH) {
      this.canvas.width = finalW;
      this.canvas.height = finalH;
    }

    const w = this.totalCanvasW;
    const h = this.totalCanvasH;

    // Ensure layer buffers match dimensions
    if (this.offscreenCanvas.width !== w || this.offscreenCanvas.height !== h) {
      this.offscreenCanvas.width = w;
      this.offscreenCanvas.height = h;
    }
    if (this.shadowCanvas.width !== w || this.shadowCanvas.height !== h) {
      this.shadowCanvas.width = w;
      this.shadowCanvas.height = h;
    }
    if (this.tokenCanvas.width !== w || this.tokenCanvas.height !== h) {
      this.tokenCanvas.width = w;
      this.tokenCanvas.height = h;
    }

    const sCtx = this.shadowCtx;
    const tCtx = this.tokenCtx;
    const offCtx = this.offscreenCtx;

    sCtx.clearRect(0, 0, w, h);
    tCtx.clearRect(0, 0, w, h);
    offCtx.clearRect(0, 0, w, h);

    // -------------------------------------------------------------------------
    // LAYER 1: DROP SHADOW
    // Rendered onto shadowCanvas. Strictly fades to alpha 0 outside bounds.
    // -------------------------------------------------------------------------
    if (this.state.enableDropShadow) {
      sCtx.save();
      sCtx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      sCtx.shadowBlur = this.state.shadowBlur;
      const dist = this.state.shadowDistance ?? this.state.shadowOffsetY ?? 12;
      const angleRad = ((this.state.shadowAngle ?? 90) * Math.PI) / 180;
      sCtx.shadowOffsetX = Math.round(dist * Math.cos(angleRad));
      sCtx.shadowOffsetY = Math.round(dist * Math.sin(angleRad));
      
      this.createPolygonPath(sCtx);
      sCtx.fillStyle = '#000000';
      sCtx.fill();
      sCtx.restore();

      // Punch out interior so solid black doesn't show under transparent tokens
      sCtx.save();
      this.createPolygonPath(sCtx);
      sCtx.globalCompositeOperation = 'destination-out';
      sCtx.fill();
      sCtx.restore();
    }

    // -------------------------------------------------------------------------
    // LAYER 2: TOKEN BODY (Background, sub-grid, border, image, bevel)
    // Rendered onto tokenCanvas. Everything outside token/popout is alpha 0.
    // -------------------------------------------------------------------------
    tCtx.save();

    // 2a. Background Fill (solid / radial / hex grid / carbon fiber)
    // Strictly clipped to hex polygon so background NEVER extends past token
    if (!this.state.bgTransparent) {
      tCtx.save();
      this.createPolygonPath(tCtx);
      tCtx.clip();
      this.drawBackground(tCtx);
      tCtx.restore();
    }

    // 2b. Sub-Hex Grid divisions
    if (this.state.showSubHexGrid && this.currentCenters.length > 1) {
      this.drawSubHexGrid(tCtx);
    }

    // 2c. Border Stroke (drawn behind image if borderInFront is false)
    if (!this.state.borderInFront && this.state.borderWidth > 0) {
      this.drawBorderStroke(tCtx);
    }

    // 2d. Custom Image Layer (with Pop-Out breaching & masking)
    if (this.state.image) {
      this.drawImageLayer(tCtx);
    }

    // 2e. Hex Border Outline (Stroke drawn in front)
    if (this.state.borderInFront && this.state.borderWidth > 0) {
      this.drawBorderStroke(tCtx);
    }

    // 2f. 3D Bevel & Emboss (Smooth Metallic / Hard Chisel / Pillow)
    if (this.state.enableBevel && this.state.bevelDepth > 0) {
      this.drawBevelAndEmboss(tCtx);
    }

    tCtx.restore();

    // -------------------------------------------------------------------------
    // LAYER 3: FULL-TOKEN RETRO FILTER POST-PROCESSING
    // Applied to tokenCanvas ONLY. Guaranteed to preserve destination alpha.
    // Scanlines, vignette, film grain, tints, pixelation only affect the token!
    // -------------------------------------------------------------------------
    this.applyFullTokenRetroFilters(this.tokenCanvas, tCtx);

    // -------------------------------------------------------------------------
    // LAYER 4: MASTER COMPOSITION (Shadows underneath, token on top)
    // Outside the shadow and token/popout art, alpha is 100% strictly 0.
    // -------------------------------------------------------------------------
    if (this.state.enableDropShadow) {
      offCtx.drawImage(this.shadowCanvas, 0, 0);
    }
    offCtx.drawImage(this.tokenCanvas, 0, 0);

    // -------------------------------------------------------------------------
    // LAYER 5: DISPLAY CANVAS OUTPUT
    // -------------------------------------------------------------------------
    const ctx = this.ctx;
    ctx.clearRect(0, 0, finalW, finalH);
    ctx.save();
    ctx.scale(exportMult, exportMult);
    ctx.drawImage(this.offscreenCanvas, 0, 0);

    // Pop-Out Cutoff Guide Line Overlay (Only in interactive UI, never in export)
    if (!isExport && this.state.popoutBreach && this.state.popoutShowGuide && this.state.activeTab === 'tab-popout') {
      this.drawPopoutGuideOverlay(ctx);
    }

    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     EFFECTS & RENDERING SUB-ROUTINES
     -------------------------------------------------------------------------- */

  drawBackground(ctx) {
    const { bgColor, bgPattern } = this.state;
    const cx = this.hexCenterX;
    const cy = this.hexCenterY;
    const w = this.totalCanvasW;
    const h = this.totalCanvasH;

    if (bgPattern === 'solid') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
    } else if (bgPattern === 'radial') {
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, this.currentRadius * 1.5);
      grad.addColorStop(0, this.adjustColorBrightness(bgColor, 1.6));
      grad.addColorStop(0.7, bgColor);
      grad.addColorStop(1, this.adjustColorBrightness(bgColor, 0.4));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (bgPattern === 'hexgrid') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      const step = 26;
      for (let y = 0; y < h + step; y += step * 1.5) {
        for (let x = 0; x < w + step; x += step * Math.sqrt(3)) {
          const offsetX = (Math.round(y / (step * 1.5)) % 2) * (step * Math.sqrt(3) / 2);
          const pts = this.getHexPoints(x + offsetX, y, step * 0.55, false);
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let p = 1; p < 6; p++) ctx.lineTo(pts[p].x, pts[p].y);
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (bgPattern === 'carbon') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const sz = 8;
      for (let y = 0; y < h; y += sz * 2) {
        for (let x = 0; x < w; x += sz * 2) {
          ctx.fillRect(x, y, sz, sz);
          ctx.fillRect(x + sz, y + sz, sz, sz);
        }
      }
      ctx.restore();
    } else if (bgPattern === 'circuit') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1.5;
      for (let x = 40; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, x % 100 === 0 ? h : h * 0.7);
        ctx.lineTo(x + 20, h * 0.8);
        ctx.stroke();
      }
      ctx.restore();
    } else if (bgPattern === 'hangar') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.lineWidth = 2;
      for (let x = -w; x < w * 2; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawSubHexGrid(ctx) {
    const R = this.currentRadius;
    const horiz = this.state.borderHorizontal;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    for (const c of this.currentCenters) {
      const pts = this.getHexPoints(c.x, c.y, R, horiz);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Dedicated Pop-Out & Masking Image Drawing Layer
   */
  drawImageLayer(ctx) {
    const { imageScale, imageRotation, imageOffsetX, imageOffsetY, flipH, flipV, cropImage, popoutBreach, popoutMode } = this.state;
    const img = this.state.image;
    if (!img) return;

    if (!cropImage) {
      // Uncropped free-floating image
      ctx.save();
      ctx.translate(this.hexCenterX + imageOffsetX, this.hexCenterY + imageOffsetY);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.scale(flipH ? -imageScale : imageScale, flipV ? -imageScale : imageScale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      return;
    }

    if (!popoutBreach) {
      // Standard image strictly clipped to hex boundary
      ctx.save();
      this.createPolygonPath(ctx);
      ctx.clip();
      ctx.translate(this.hexCenterX + imageOffsetX, this.hexCenterY + imageOffsetY);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.scale(flipH ? -imageScale : imageScale, flipV ? -imageScale : imageScale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      return;
    }

    // Pop-Out Breaching Modes
    if (popoutMode === 'cutoff') {
      ctx.save();
      this.applyPopoutClipping(ctx);
      ctx.translate(this.hexCenterX + imageOffsetX, this.hexCenterY + imageOffsetY);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.scale(flipH ? -imageScale : imageScale, flipV ? -imageScale : imageScale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    } else if (popoutMode === 'brush') {
      // Hex interior + custom brush painted area
      ctx.save();
      ctx.save();
      this.createPolygonPath(ctx);
      ctx.clip();
      ctx.translate(this.hexCenterX + imageOffsetX, this.hexCenterY + imageOffsetY);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.scale(flipH ? -imageScale : imageScale, flipV ? -imageScale : imageScale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const brushImg = document.createElement('canvas');
      brushImg.width = this.totalCanvasW;
      brushImg.height = this.totalCanvasH;
      const bCtx = brushImg.getContext('2d');
      bCtx.save();
      bCtx.translate(this.hexCenterX + imageOffsetX, this.hexCenterY + imageOffsetY);
      bCtx.rotate((imageRotation * Math.PI) / 180);
      bCtx.scale(flipH ? -imageScale : imageScale, flipV ? -imageScale : imageScale);
      bCtx.drawImage(img, -img.width / 2, -img.height / 2);
      bCtx.restore();

      bCtx.globalCompositeOperation = 'destination-in';
      bCtx.drawImage(this.customMaskCanvas, 0, 0);

      ctx.drawImage(brushImg, 0, 0);
      ctx.restore();
    } else if (popoutMode === 'both') {
      // Cutoff plane + custom brush painted area
      ctx.save();
      ctx.save();
      this.applyPopoutClipping(ctx);
      ctx.translate(this.hexCenterX + imageOffsetX, this.hexCenterY + imageOffsetY);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.scale(flipH ? -imageScale : imageScale, flipV ? -imageScale : imageScale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const brushImg = document.createElement('canvas');
      brushImg.width = this.totalCanvasW;
      brushImg.height = this.totalCanvasH;
      const bCtx = brushImg.getContext('2d');
      bCtx.save();
      bCtx.translate(this.hexCenterX + imageOffsetX, this.hexCenterY + imageOffsetY);
      bCtx.rotate((imageRotation * Math.PI) / 180);
      bCtx.scale(flipH ? -imageScale : imageScale, flipV ? -imageScale : imageScale);
      bCtx.drawImage(img, -img.width / 2, -img.height / 2);
      bCtx.restore();

      bCtx.globalCompositeOperation = 'destination-in';
      bCtx.drawImage(this.customMaskCanvas, 0, 0);

      ctx.drawImage(brushImg, 0, 0);
      ctx.restore();
    }
  }

  /**
   * Constructs the pop-out breach clipping mask (combining linear cutoff plane and custom painted mask)
   */
  applyPopoutClipping(ctx) {
    const { popoutMode, popoutCutoff, popoutAngle, popoutFlip } = this.state;
    const w = this.totalCanvasW;
    const h = this.totalCanvasH;

    ctx.beginPath();
    // 1. Base hex path is always included
    this.createPolygonPath(ctx);

    // 2. Add linear cutoff plane breach if enabled
    if (popoutMode === 'cutoff' || popoutMode === 'both') {
      const cutoffY = (popoutCutoff / 100) * h;
      const angleRad = (popoutAngle * Math.PI) / 180;
      
      ctx.save();
      // Construct cutoff half-space polygon
      const ext = Math.max(w, h) * 1.5;
      const cx = this.hexCenterX;
      const cy = cutoffY;

      // Normal vector pointing in popout direction
      const dir = popoutFlip ? 1 : -1;

      // 4 corners of half-plane
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      const p1x = cx - cosA * ext;
      const p1y = cy - sinA * ext;
      const p2x = cx + cosA * ext;
      const p2y = cy + sinA * ext;
      const p3x = p2x + (-sinA * ext * dir);
      const p3y = p2y + (cosA * ext * dir);
      const p4x = p1x + (-sinA * ext * dir);
      const p4y = p1y + (cosA * ext * dir);

      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.lineTo(p4x, p4y);
      ctx.closePath();
    }

    ctx.clip();
  }

  drawPopoutGuideOverlay(ctx) {
    const { popoutCutoff, popoutAngle, popoutFlip } = this.state;
    const w = this.totalCanvasW;
    const h = this.totalCanvasH;
    const cutoffY = (popoutCutoff / 100) * h;
    const angleRad = (popoutAngle * Math.PI) / 180;
    const cx = this.hexCenterX;
    const cy = cutoffY;

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    const ext = Math.max(w, h) * 1.2;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const x1 = cx - cosA * ext;
    const y1 = cy - sinA * ext;
    const x2 = cx + cosA * ext;
    const y2 = cy + sinA * ext;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Directional indicator arrow showing breach side
    const dir = popoutFlip ? 1 : -1;
    const arrowX = cx + (-sinA * 26 * dir);
    const arrowY = cy + (cosA * 26 * dir);

    ctx.fillStyle = '#38bdf8';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(arrowX, arrowY);
    ctx.stroke();

    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('✂ BREACH PLANE', cx + 12, cy - 8);

    ctx.restore();
  }

  /**
   * Border stroke engine with support for secondary border color
   */
  drawBorderStroke(ctx) {
    const { borderWidth, borderColor, borderColor2, borderStyle } = this.state;
    const poly = this.currentPolygon;
    if (!poly.length || borderWidth <= 0) return;

    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;

    if (borderStyle === 'solid') {
      this.createPolygonPath(ctx);
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    } else if (borderStyle === 'double') {
      // Outer ring with primary color
      this.createPolygonPath(ctx);
      ctx.lineWidth = borderWidth * 0.5;
      ctx.strokeStyle = borderColor;
      ctx.stroke();

      // Inner concentric ring with secondary color
      ctx.save();
      ctx.translate(this.hexCenterX, this.hexCenterY);
      ctx.scale(0.92, 0.92);
      ctx.translate(-this.hexCenterX, -this.hexCenterY);
      this.createPolygonPath(ctx);
      ctx.lineWidth = borderWidth * 0.35;
      ctx.strokeStyle = borderColor2 || '#ffffff';
      ctx.stroke();
      ctx.restore();
    } else if (borderStyle === 'glow') {
      // Outer ambient laser bloom with primary color
      for (let g = 3; g >= 1; g--) {
        ctx.save();
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = g * 9;
        this.createPolygonPath(ctx);
        ctx.lineWidth = borderWidth * (0.6 + g * 0.25);
        ctx.strokeStyle = borderColor;
        ctx.stroke();
        ctx.restore();
      }
      // Core bright laser line with secondary color
      this.createPolygonPath(ctx);
      ctx.lineWidth = borderWidth * 0.55;
      ctx.strokeStyle = borderColor2 || '#ffffff';
      ctx.stroke();
    } else if (borderStyle === 'chiseled') {
      // Outer beveled frame
      this.createPolygonPath(ctx);
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = this.adjustColorBrightness(borderColor, 0.65);
      ctx.stroke();

      // Gleaming inset groove line with secondary color
      this.createPolygonPath(ctx);
      ctx.lineWidth = borderWidth * 0.35;
      ctx.strokeStyle = borderColor2 || '#ffffff';
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Functional 3D Bevel & Emboss engine:
   * Supports Smooth Metallic (curved specular highlight), Hard Chisel, and Pillow Emboss.
   */
  drawBevelAndEmboss(ctx) {
    const poly = this.currentPolygon;
    const depth = this.state.bevelDepth;
    const lightAngle = (this.state.bevelAngle * Math.PI) / 180;
    const lx = Math.cos(lightAngle);
    const ly = Math.sin(lightAngle);

    if (!poly.length || depth <= 0) return;

    ctx.save();

    if (this.state.bevelStyle === 'smooth') {
      // Smooth Metallic: continuous curved normal specular highlight & soft ambient roll-off
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) continue;

        // Inward normal for clockwise: (-dy/len, dx/len)
        const nx = -dy / len;
        const ny = dx / len;
        const dot = nx * lx + ny * ly;

        const grad = ctx.createLinearGradient(p1.x, p1.y, p1.x + nx * depth, p1.y + ny * depth);
        if (dot > 0.05) {
          const peak = Math.min(1.0, dot * 1.2);
          grad.addColorStop(0, `rgba(255, 255, 255, ${peak * 0.9})`);
          grad.addColorStop(0.4, `rgba(255, 255, 255, ${peak * 0.6})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          const shade = Math.min(0.85, Math.abs(dot) * 0.8);
          grad.addColorStop(0, `rgba(0, 0, 0, ${shade})`);
          grad.addColorStop(0.5, `rgba(0, 0, 0, ${shade * 0.5})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p2.x + nx * depth, p2.y + ny * depth);
        ctx.lineTo(p1.x + nx * depth, p1.y + ny * depth);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
    } else if (this.state.bevelStyle === 'pillow') {
      // Pillow Emboss: outer convex highlight + inner concave shadow
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) continue;
        const nx = -dy / len;
        const ny = dx / len;
        const dot = nx * lx + ny * ly;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p2.x + nx * depth, p2.y + ny * depth);
        ctx.lineTo(p1.x + nx * depth, p1.y + ny * depth);
        ctx.closePath();

        const alpha = Math.min(0.7, Math.abs(dot) * 0.7);
        ctx.fillStyle = dot > 0 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
        ctx.fill();
      }
    } else {
      // Chiseled Hard Facet
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) continue;
        const nx = -dy / len;
        const ny = dx / len;
        const dot = nx * lx + ny * ly;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p2.x + nx * depth, p2.y + ny * depth);
        ctx.lineTo(p1.x + nx * depth, p1.y + ny * depth);
        ctx.closePath();

        if (dot > 0.05) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, dot * 0.75)})`;
          ctx.fill();
        } else if (dot < -0.05) {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.85, Math.abs(dot) * 0.7)})`;
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     FULL-TOKEN RETRO FILTER PIPELINE
     Affects the entire token: border, background, and image composite!
     Strictly preserves destination alpha = 0 so background remains 100% transparent.
     -------------------------------------------------------------------------- */
  applyFullTokenRetroFilters(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;

    // 1. Color Grading & Tints
    if (this.state.brightness !== 100 || this.state.contrast !== 100 || this.state.saturation !== 100) {
      const temp = document.createElement('canvas');
      temp.width = w;
      temp.height = h;
      const tCtx = temp.getContext('2d');
      tCtx.filter = `brightness(${this.state.brightness}%) contrast(${this.state.contrast}%) saturate(${this.state.saturation}%)`;
      tCtx.drawImage(canvas, 0, 0);

      // Mask temp to guarantee transparent background pixels stay strictly 0
      tCtx.globalCompositeOperation = 'destination-in';
      tCtx.drawImage(canvas, 0, 0);

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(temp, 0, 0);
    }

    if (this.state.filterTint !== 'none') {
      this.applyColorTint(ctx, w, h, this.state.filterTint);
    }

    // 2. Retrograde Pixel Art Mosaic Filter
    if (this.state.enablePixelate && this.state.pixelSize > 1) {
      this.applyPixelateFilter(canvas, ctx);
    }

    // 3. Chromatic Aberration (RGB glitch split)
    if (this.state.chromaticAberration > 0) {
      this.applyChromaticAberration(canvas, ctx, this.state.chromaticAberration);
    }

    // 4. CRT Scanlines
    if (this.state.enableScanlines) {
      this.applyScanlines(ctx, w, h);
    }

    // 5. Film Grain / Noise
    if (this.state.filmGrain > 0) {
      this.applyFilmGrain(ctx, w, h, this.state.filmGrain);
    }

    // 6. Tactical Edge Vignette
    if (this.state.vignette > 0) {
      this.applyVignette(ctx, w, h, this.state.vignette);
    }
  }

  applyPixelateFilter(canvas, ctx) {
    const pxSize = this.state.pixelSize;
    const w = canvas.width;
    const h = canvas.height;
    const smallW = Math.max(16, Math.floor(w / pxSize));
    const smallH = Math.max(16, Math.floor(h / pxSize));

    this.pixelCanvas.width = smallW;
    this.pixelCanvas.height = smallH;
    this.pixelCtx.imageSmoothingEnabled = false;
    this.pixelCtx.clearRect(0, 0, smallW, smallH);
    this.pixelCtx.drawImage(canvas, 0, 0, smallW, smallH);

    if (this.state.colorPalette !== 'none') {
      this.quantizePalette(this.pixelCtx, smallW, smallH, this.state.colorPalette);
    }

    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.pixelCanvas, 0, 0, smallW, smallH, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
  }

  quantizePalette(ctx, w, h, paletteType) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      if (data[i + 3] < 16) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
        continue;
      }
      const r = data[i], g = data[i + 1], b = data[i + 2];

      if (paletteType === 'mech16') {
        data[i] = Math.round(r / 64) * 64;
        data[i + 1] = Math.round(g / 64) * 64;
        data[i + 2] = Math.round(b / 64) * 64;
      } else if (paletteType === 'cyber32') {
        data[i] = Math.round(r / 32) * 32;
        data[i + 1] = Math.round(g / 32) * 32;
        data[i + 2] = Math.round(b / 32) * 32;
      } else if (paletteType === 'cga') {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 60) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; }
        else if (lum < 130) { data[i] = 0; data[i + 1] = 170; data[i + 2] = 170; }
        else if (lum < 200) { data[i] = 170; data[i + 1] = 0; data[i + 2] = 170; }
        else { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; }
      } else if (paletteType === 'gameboy') {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 64) { data[i] = 15; data[i + 1] = 56; data[i + 2] = 15; }
        else if (lum < 128) { data[i] = 48; data[i + 1] = 98; data[i + 2] = 48; }
        else if (lum < 192) { data[i] = 139; data[i + 1] = 172; data[i + 2] = 15; }
        else { data[i] = 155; data[i + 1] = 188; data[i + 2] = 15; }
      } else if (paletteType === 'terminal') {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = Math.min(255, lum * 1.1);
        data[i + 1] = Math.min(255, lum * 0.7);
        data[i + 2] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  applyChromaticAberration(canvas, ctx, offset) {
    if (offset <= 0) return;
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const src = new Uint8ClampedArray(imgData.data);
    const dest = imgData.data;

    const offX = Math.round(offset);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (src[i + 3] === 0) {
          dest[i] = 0;
          dest[i + 1] = 0;
          dest[i + 2] = 0;
          dest[i + 3] = 0;
          continue;
        }

        const rX = Math.max(0, x - offX);
        const rIdx = (y * w + rX) * 4;
        dest[i] = src[rIdx];

        const bX = Math.min(w - 1, x + offX);
        const bIdx = (y * w + bX) * 4;
        dest[i + 2] = src[bIdx + 2];
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  applyColorTint(ctx, w, h, tint) {
    if (tint === 'none') return;
    const tintCanvas = document.createElement('canvas');
    tintCanvas.width = w;
    tintCanvas.height = h;
    const tCtx = tintCanvas.getContext('2d');

    if (tint === 'ha') {
      tCtx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    } else if (tint === 'ipsn') {
      tCtx.fillStyle = 'rgba(194, 31, 37, 0.35)';
    } else if (tint === 'ssc') {
      tCtx.fillStyle = 'rgba(6, 182, 212, 0.3)';
    } else if (tint === 'horus') {
      tCtx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    } else if (tint === 'stealth') {
      tCtx.fillStyle = '#888888';
    }
    tCtx.fillRect(0, 0, w, h);

    // Mask tint strictly to where token pixels exist
    tCtx.globalCompositeOperation = 'destination-in';
    tCtx.drawImage(ctx.canvas, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = tint === 'stealth' ? 'color' : 'overlay';
    ctx.drawImage(tintCanvas, 0, 0);
    ctx.restore();
  }

  applyScanlines(ctx, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }
    ctx.restore();
  }

  applyFilmGrain(ctx, w, h, intensity) {
    if (intensity <= 0) return;
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = 120;
    grainCanvas.height = 120;
    const gCtx = grainCanvas.getContext('2d');
    const gData = gCtx.createImageData(120, 120);
    const d = gData.data;
    const alpha = (intensity / 100) * 120;

    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = alpha;
    }
    gCtx.putImageData(gData, 0, 0);

    const fullGrain = document.createElement('canvas');
    fullGrain.width = w;
    fullGrain.height = h;
    const fCtx = fullGrain.getContext('2d');
    const pattern = fCtx.createPattern(grainCanvas, 'repeat');
    fCtx.fillStyle = pattern;
    fCtx.fillRect(0, 0, w, h);

    // Mask grain layer so it ONLY exists where pixels exist on token
    fCtx.globalCompositeOperation = 'destination-in';
    fCtx.drawImage(ctx.canvas, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(fullGrain, 0, 0);
    ctx.restore();
  }

  applyVignette(ctx, w, h, intensity) {
    if (intensity <= 0) return;
    const cx = this.hexCenterX;
    const cy = this.hexCenterY;
    const r = this.currentRadius;

    const vigCanvas = document.createElement('canvas');
    vigCanvas.width = w;
    vigCanvas.height = h;
    const vCtx = vigCanvas.getContext('2d');

    const grad = vCtx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.05);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${(intensity / 100) * 0.85})`);
    vCtx.fillStyle = grad;
    vCtx.fillRect(0, 0, w, h);

    // Mask to only where pixels exist on token
    vCtx.globalCompositeOperation = 'destination-in';
    vCtx.drawImage(ctx.canvas, 0, 0);

    ctx.save();
    ctx.drawImage(vigCanvas, 0, 0);
    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     INTERACTION & DRAG/ZOOM HANDLERS
     -------------------------------------------------------------------------- */
  bindCanvasInteractions() {
    const wrapper = document.getElementById('canvasPerspectiveWrapper');

    // Pan Image / 3D Tilt via Pointer Events
    wrapper.addEventListener('pointerdown', (e) => {
      // Check if in brush paint mode under Pop-Out tab
      if (this.state.activeTab === 'tab-popout' && (this.state.popoutMode === 'brush' || this.state.popoutMode === 'both') && !e.shiftKey) {
        this.isPainting = true;
        this.paintAtPoint(e);
        wrapper.classList.add('brushing');
        wrapper.setPointerCapture(e.pointerId);
        return;
      }

      this.isDragging = true;
      this.isShiftDrag = e.shiftKey || this.state.is3DView;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragStartImgX = this.state.imageOffsetX;
      this.dragStartImgY = this.state.imageOffsetY;
      this.dragStartPitch = this.state.perspectivePitch;
      this.dragStartYaw = this.state.perspectiveYaw;

      wrapper.classList.add('panning');
      wrapper.setPointerCapture(e.pointerId);
    });

    wrapper.addEventListener('pointermove', (e) => {
      if (this.isPainting) {
        this.paintAtPoint(e);
        return;
      }

      if (!this.isDragging) return;

      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;

      if (this.isShiftDrag) {
        this.state.perspectivePitch = Math.max(10, Math.min(80, this.dragStartPitch + dy * 0.35));
        this.state.perspectiveYaw = Math.max(-60, Math.min(60, this.dragStartYaw + dx * 0.35));
        this.update3DTransform();
      } else {
        this.state.imageOffsetX = this.dragStartImgX + dx / (this.state.viewZoom * (this.state.tokenSize / 500));
        this.state.imageOffsetY = this.dragStartImgY + dy / (this.state.viewZoom * (this.state.tokenSize / 500));
        this.render();
      }
    });

    const stopAction = (e) => {
      if (this.isPainting) {
        this.isPainting = false;
        wrapper.classList.remove('brushing');
        try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
        this.render();
      }
      if (this.isDragging) {
        this.isDragging = false;
        wrapper.classList.remove('panning');
        try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    wrapper.addEventListener('pointerup', stopAction);
    wrapper.addEventListener('pointercancel', stopAction);

    // Mouse Wheel Scales Image
    wrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.1, Math.min(4.0, this.state.imageScale + delta));
      this.state.imageScale = +newScale.toFixed(2);
      
      const slider = document.getElementById('imageScale');
      const num = document.getElementById('imageScaleNum');
      const lbl = document.getElementById('lblImageScale');
      if (slider) slider.value = this.state.imageScale;
      if (num) num.value = this.state.imageScale;
      if (lbl) lbl.textContent = `${this.state.imageScale.toFixed(2)}×`;

      this.render();
    }, { passive: false });

    // Drag and Drop Image File onto Viewport
    wrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      wrapper.style.borderColor = 'var(--accent-purple)';
    });

    wrapper.addEventListener('dragleave', () => {
      wrapper.style.borderColor = '';
    });

    wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      wrapper.style.borderColor = '';
      if (e.dataTransfer?.files?.length) {
        this.loadFile(e.dataTransfer.files[0]);
      }
    });

    // Global Paste Image (Ctrl+V)
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) this.loadFile(file);
          break;
        }
      }
    });
  }

  paintAtPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.totalCanvasW / rect.width;
    const scaleY = this.totalCanvasH / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const ctx = this.customMaskCtx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, this.state.brushSize / 2, 0, Math.PI * 2);

    if (this.state.brushMode === 'reveal') {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.fill();
    }
    ctx.restore();
    this.render();
  }

  update3DTransform() {
    const box = document.getElementById('canvasTransformBox');
    const grid = document.getElementById('tabletopGrid');

    if (this.state.is3DView) {
      box.style.transform = `scale(${this.state.viewZoom}) rotateX(${this.state.perspectivePitch}deg) rotateZ(${this.state.perspectiveYaw}deg)`;
      if (grid) grid.classList.add('active');
    } else {
      box.style.transform = `scale(${this.state.viewZoom}) rotateX(0deg) rotateZ(0deg)`;
      if (grid) grid.classList.remove('active');
    }
  }

  /* --------------------------------------------------------------------------
     DOM CONTROLS & EVENT BINDINGS
     -------------------------------------------------------------------------- */
  bindDomEvents() {
    // Tab switching
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        this.state.activeTab = tabId;
        const targetPane = document.getElementById(tabId);
        if (targetPane) targetPane.classList.add('active');

        // Update interaction hint based on tab
        const hint = document.getElementById('hudInteractionHint');
        if (hint) {
          if (tabId === 'tab-popout') {
            hint.textContent = 'POPOUT: ADJUST CUTOFF LINE OR PAINT ON CANVAS TO POP-OUT WEAPONS';
          } else {
            hint.textContent = 'DRAG: MOVE IMAGE • WHEEL: ZOOM • SHIFT+DRAG: 3D TILT';
          }
        }
        this.render();
      });
    });

    const bindToggle = (id, stateKey, onChange) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', (e) => {
        this.state[stateKey] = e.target.checked;
        if (onChange) onChange(e.target.checked);
        this.render();
      });
    };

    // Token Size
    const tokenSizeSlider = document.getElementById('tokenSize');
    const tokenSizeNum = document.getElementById('tokenSizeNum');
    const lblTokenSize = document.getElementById('lblTokenSize');
    const updateSize = (val) => {
      this.state.tokenSize = parseInt(val, 10);
      tokenSizeSlider.value = this.state.tokenSize;
      tokenSizeNum.value = this.state.tokenSize;
      lblTokenSize.textContent = `${this.state.tokenSize} px`;
      this.updateHUD();
      this.render();
    };
    tokenSizeSlider?.addEventListener('input', (e) => updateSize(e.target.value));
    tokenSizeNum?.addEventListener('change', (e) => updateSize(e.target.value));

    // Preset resolution pills
    document.querySelectorAll('[data-preset-res]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-preset-res]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateSize(btn.dataset.presetRes);
      });
    });

    // Border Size & Shape Options
    const toggleHexSpecificRows = (isSquare) => {
      ['rowBorderHorizontal', 'rowSnapOffset', 'rowSubHexGrid'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isSquare ? 'none' : '';
      });
    };

    bindToggle('isSquare', 'isSquare', (checked) => {
      toggleHexSpecificRows(checked);
      this.updateHUD();
    });

    document.getElementById('borderSize')?.addEventListener('change', (e) => {
      this.state.borderSize = e.target.value;
      this.updateHUD();
      this.render();
    });

    bindToggle('borderHorizontal', 'borderHorizontal', () => this.updateHUD());
    bindToggle('borderSnapOffset', 'borderSnapOffset');
    bindToggle('showSubHexGrid', 'showSubHexGrid');
    bindToggle('borderInFront', 'borderInFront');

    // Border Width & Colors
    const borderWidth = document.getElementById('borderWidth');
    const borderWidthNum = document.getElementById('borderWidthNum');
    const lblBorderWidth = document.getElementById('lblBorderWidth');
    const updateBorderW = (val) => {
      this.state.borderWidth = parseInt(val, 10);
      borderWidth.value = this.state.borderWidth;
      borderWidthNum.value = this.state.borderWidth;
      lblBorderWidth.textContent = `${this.state.borderWidth} px`;
      this.render();
    };
    borderWidth?.addEventListener('input', (e) => updateBorderW(e.target.value));
    borderWidthNum?.addEventListener('change', (e) => updateBorderW(e.target.value));

    // Primary Border Color
    const borderColor = document.getElementById('borderColor');
    const borderColorText = document.getElementById('borderColorText');
    const updateBorderCol = (val) => {
      this.state.borderColor = val;
      borderColor.value = val;
      borderColorText.value = val;
      this.render();
    };
    borderColor?.addEventListener('input', (e) => updateBorderCol(e.target.value));
    borderColorText?.addEventListener('change', (e) => updateBorderCol(e.target.value));

    // Secondary Border Color (for double, glow, chiseled)
    const borderColor2 = document.getElementById('borderColor2');
    const borderColor2Text = document.getElementById('borderColor2Text');
    const rowBorderColor2 = document.getElementById('rowBorderColor2');
    const updateBorderCol2 = (val) => {
      this.state.borderColor2 = val;
      borderColor2.value = val;
      borderColor2Text.value = val;
      this.render();
    };
    borderColor2?.addEventListener('input', (e) => updateBorderCol2(e.target.value));
    borderColor2Text?.addEventListener('change', (e) => updateBorderCol2(e.target.value));

    // Border Style selector (hazard & tech removed)
    document.getElementById('borderStyle')?.addEventListener('change', (e) => {
      this.state.borderStyle = e.target.value;
      if (rowBorderColor2) {
        rowBorderColor2.style.display = (e.target.value === 'solid') ? 'none' : 'flex';
      }
      this.render();
    });

    // Canvas Edge Extensions (Roll20 VTT Snapping)
    const bindPadInput = (id, key) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', (e) => {
        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
        this.state[key] = val;
        if (this.state.linkPaddings) {
          this.state.padTop = val;
          this.state.padBottom = val;
          this.state.padLeft = val;
          this.state.padRight = val;
          ['padTop', 'padBottom', 'padLeft', 'padRight'].forEach(pid => {
            const pel = document.getElementById(pid);
            if (pel) pel.value = val;
          });
        }
        this.updateHUD();
        this.render();
      });
    };
    bindPadInput('padTop', 'padTop');
    bindPadInput('padBottom', 'padBottom');
    bindPadInput('padLeft', 'padLeft');
    bindPadInput('padRight', 'padRight');

    document.getElementById('gridOffsetX')?.addEventListener('input', (e) => {
      this.state.gridOffsetX = parseInt(e.target.value, 10) || 0;
      this.render();
    });

    document.getElementById('gridOffsetY')?.addEventListener('input', (e) => {
      this.state.gridOffsetY = parseInt(e.target.value, 10) || 0;
      this.render();
    });

    bindToggle('linkPaddings', 'linkPaddings');

    document.getElementById('btnResetPadding')?.addEventListener('click', () => {
      this.state.padTop = 0;
      this.state.padBottom = 0;
      this.state.padLeft = 0;
      this.state.padRight = 0;
      this.state.gridOffsetX = 0;
      this.state.gridOffsetY = 0;
      ['padTop', 'padBottom', 'padLeft', 'padRight', 'gridOffsetX', 'gridOffsetY'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 0;
      });
      this.updateHUD();
      this.render();
    });

    // Background Controls
    const rowBgColor = document.getElementById('rowBgColor');
    bindToggle('bgTransparent', 'bgTransparent', (checked) => {
      if (rowBgColor) rowBgColor.style.display = checked ? 'none' : 'flex';
    });

    const bgColor = document.getElementById('bgColor');
    const bgColorText = document.getElementById('bgColorText');
    const updateBgCol = (val) => {
      this.state.bgColor = val;
      bgColor.value = val;
      bgColorText.value = val;
      this.render();
    };
    bgColor?.addEventListener('input', (e) => updateBgCol(e.target.value));
    bgColorText?.addEventListener('change', (e) => updateBgCol(e.target.value));

    document.getElementById('bgPattern')?.addEventListener('change', (e) => {
      this.state.bgPattern = e.target.value;
      this.render();
    });

    bindToggle('cropBackground', 'cropBackground');

    // Image File Upload
    const fileInput = document.getElementById('imageFileInput');
    const dropzone = document.getElementById('uploadDropzone');
    dropzone?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) this.loadFile(e.target.files[0]);
    });

    // Clear Image Button
    const btnClearImage = document.getElementById('btnClearImage');
    btnClearImage?.addEventListener('click', () => {
      this.state.image = null;
      this.state.imageFilename = '';
      if (fileInput) fileInput.value = '';
      btnClearImage.style.display = 'none';
      const info = document.getElementById('imageStatusInfo');
      if (info) info.textContent = 'No image loaded (blank frame default)';
      this.render();
    });

    // Image Transforms
    const imageScale = document.getElementById('imageScale');
    const imageScaleNum = document.getElementById('imageScaleNum');
    const lblImageScale = document.getElementById('lblImageScale');
    const updateScale = (val) => {
      this.state.imageScale = parseFloat(val);
      imageScale.value = this.state.imageScale;
      imageScaleNum.value = this.state.imageScale;
      lblImageScale.textContent = `${this.state.imageScale.toFixed(2)}×`;
      this.render();
    };
    imageScale?.addEventListener('input', (e) => updateScale(e.target.value));
    imageScaleNum?.addEventListener('change', (e) => updateScale(e.target.value));

    const imageRotation = document.getElementById('imageRotation');
    const lblImageRotation = document.getElementById('lblImageRotation');
    imageRotation?.addEventListener('input', (e) => {
      this.state.imageRotation = parseInt(e.target.value, 10);
      lblImageRotation.textContent = `${this.state.imageRotation}°`;
      this.render();
    });

    document.getElementById('btnRotateCCW')?.addEventListener('click', () => {
      this.state.imageRotation = (this.state.imageRotation - 90) % 360;
      imageRotation.value = this.state.imageRotation;
      lblImageRotation.textContent = `${this.state.imageRotation}°`;
      this.render();
    });

    document.getElementById('btnRotateCW')?.addEventListener('click', () => {
      this.state.imageRotation = (this.state.imageRotation + 90) % 360;
      imageRotation.value = this.state.imageRotation;
      lblImageRotation.textContent = `${this.state.imageRotation}°`;
      this.render();
    });

    document.getElementById('btnResetTransform')?.addEventListener('click', () => {
      this.state.imageOffsetX = 0;
      this.state.imageOffsetY = 0;
      this.state.imageScale = 1.0;
      this.state.imageRotation = 0;
      imageScale.value = 1.0;
      imageScaleNum.value = 1.0;
      lblImageScale.textContent = '1.00×';
      imageRotation.value = 0;
      lblImageRotation.textContent = '0°';
      this.render();
    });

    document.getElementById('btnFlipH')?.addEventListener('click', () => {
      this.state.flipH = !this.state.flipH;
      this.render();
    });

    document.getElementById('btnFlipV')?.addEventListener('click', () => {
      this.state.flipV = !this.state.flipV;
      this.render();
    });

    bindToggle('cropImage', 'cropImage');

    // Pop-Out & Masking Controls
    bindToggle('popoutBreach', 'popoutBreach');

    document.getElementById('popoutMode')?.addEventListener('change', (e) => {
      this.state.popoutMode = e.target.value;
      this.render();
    });

    const popoutCutoff = document.getElementById('popoutCutoff');
    const lblPopoutCutoff = document.getElementById('lblPopoutCutoff');
    popoutCutoff?.addEventListener('input', (e) => {
      this.state.popoutCutoff = parseInt(e.target.value, 10);
      lblPopoutCutoff.textContent = `${this.state.popoutCutoff}%`;
      this.render();
    });

    const popoutAngle = document.getElementById('popoutAngle');
    const lblPopoutAngle = document.getElementById('lblPopoutAngle');
    popoutAngle?.addEventListener('input', (e) => {
      this.state.popoutAngle = parseInt(e.target.value, 10);
      lblPopoutAngle.textContent = `${this.state.popoutAngle}°`;
      this.render();
    });

    bindToggle('popoutFlip', 'popoutFlip');

    const popoutFeather = document.getElementById('popoutFeather');
    const lblPopoutFeather = document.getElementById('lblPopoutFeather');
    popoutFeather?.addEventListener('input', (e) => {
      this.state.popoutFeather = parseInt(e.target.value, 10);
      lblPopoutFeather.textContent = `${this.state.popoutFeather} px`;
      this.render();
    });

    bindToggle('popoutShowGuide', 'popoutShowGuide', (checked) => {
      const lbl = document.getElementById('labelMaskGuide');
      if (lbl) lbl.textContent = checked ? '✂ Guide: ON' : '✂ Guide: OFF';
    });

    document.getElementById('btnToggleMaskGuide')?.addEventListener('click', () => {
      const chk = document.getElementById('popoutShowGuide');
      if (chk) {
        chk.checked = !chk.checked;
        chk.dispatchEvent(new Event('change'));
      }
    });

    // Pop-Out Brush Tools
    const btnBrushReveal = document.getElementById('btnBrushReveal');
    const btnBrushClip = document.getElementById('btnBrushClip');
    btnBrushReveal?.addEventListener('click', () => {
      this.state.brushMode = 'reveal';
      btnBrushReveal.classList.add('active');
      btnBrushClip.classList.remove('active');
    });
    btnBrushClip?.addEventListener('click', () => {
      this.state.brushMode = 'clip';
      btnBrushClip.classList.add('active');
      btnBrushReveal.classList.remove('active');
    });

    const brushSize = document.getElementById('brushSize');
    const lblBrushSize = document.getElementById('lblBrushSize');
    brushSize?.addEventListener('input', (e) => {
      this.state.brushSize = parseInt(e.target.value, 10);
      lblBrushSize.textContent = `${this.state.brushSize} px`;
    });

    document.getElementById('btnClearMask')?.addEventListener('click', () => {
      this.customMaskCtx.clearRect(0, 0, this.totalCanvasW, this.totalCanvasH);
      this.render();
    });

    document.getElementById('btnInvertMask')?.addEventListener('click', () => {
      const w = this.totalCanvasW;
      const h = this.totalCanvasH;
      const imgData = this.customMaskCtx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
        d[i + 3] = 255 - d[i + 3];
      }
      this.customMaskCtx.putImageData(imgData, 0, 0);
      this.render();
    });

    // 3D Bevel & Emboss Controls
    const panelBevelCtrls = document.getElementById('panelBevelCtrls');
    bindToggle('enableBevel', 'enableBevel', (checked) => {
      if (panelBevelCtrls) panelBevelCtrls.style.opacity = checked ? '1' : '0.4';
    });

    document.getElementById('bevelStyle')?.addEventListener('change', (e) => {
      this.state.bevelStyle = e.target.value;
      this.render();
    });

    const bevelDepth = document.getElementById('bevelDepth');
    const lblBevelDepth = document.getElementById('lblBevelDepth');
    bevelDepth?.addEventListener('input', (e) => {
      this.state.bevelDepth = parseInt(e.target.value, 10);
      lblBevelDepth.textContent = `${this.state.bevelDepth} px`;
      this.render();
    });

    const bevelAngle = document.getElementById('bevelAngle');
    const lblBevelAngle = document.getElementById('lblBevelAngle');
    bevelAngle?.addEventListener('input', (e) => {
      this.state.bevelAngle = parseInt(e.target.value, 10);
      lblBevelAngle.textContent = `${this.state.bevelAngle}°`;
      this.render();
    });

    // Shadows
    const panelShadowCtrls = document.getElementById('panelShadowCtrls');
    bindToggle('enableDropShadow', 'enableDropShadow', (checked) => {
      if (panelShadowCtrls) panelShadowCtrls.style.opacity = checked ? '1' : '0.4';
    });

    const shadowBlur = document.getElementById('shadowBlur');
    const lblShadowBlur = document.getElementById('lblShadowBlur');
    shadowBlur?.addEventListener('input', (e) => {
      this.state.shadowBlur = parseInt(e.target.value, 10);
      if (lblShadowBlur) lblShadowBlur.textContent = `${this.state.shadowBlur} px`;
      this.render();
    });

    const shadowDistance = document.getElementById('shadowDistance') || document.getElementById('shadowOffsetY');
    const lblShadowDistance = document.getElementById('lblShadowDistance') || document.getElementById('lblShadowOffsetY');
    shadowDistance?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.state.shadowDistance = val;
      this.state.shadowOffsetY = val;
      if (lblShadowDistance) lblShadowDistance.textContent = `${val} px`;
      this.render();
    });

    const shadowAngle = document.getElementById('shadowAngle');
    const lblShadowAngle = document.getElementById('lblShadowAngle');
    shadowAngle?.addEventListener('input', (e) => {
      this.state.shadowAngle = parseInt(e.target.value, 10);
      if (lblShadowAngle) lblShadowAngle.textContent = `${this.state.shadowAngle}°`;
      this.render();
    });

    // Retro Pixel Shaders
    const panelPixelCtrls = document.getElementById('panelPixelCtrls');
    bindToggle('enablePixelate', 'enablePixelate', (checked) => {
      if (panelPixelCtrls) panelPixelCtrls.style.opacity = checked ? '1' : '0.4';
    });

    const pixelSize = document.getElementById('pixelSize');
    const lblPixelSize = document.getElementById('lblPixelSize');
    pixelSize?.addEventListener('input', (e) => {
      this.state.pixelSize = parseInt(e.target.value, 10);
      lblPixelSize.textContent = `${this.state.pixelSize} px`;
      this.render();
    });

    document.getElementById('colorPalette')?.addEventListener('change', (e) => {
      this.state.colorPalette = e.target.value;
      this.render();
    });

    bindToggle('enableScanlines', 'enableScanlines');

    const chromaticAberration = document.getElementById('chromaticAberration');
    const lblGlitch = document.getElementById('lblGlitch');
    chromaticAberration?.addEventListener('input', (e) => {
      this.state.chromaticAberration = parseInt(e.target.value, 10);
      lblGlitch.textContent = `${this.state.chromaticAberration} px`;
      this.render();
    });

    const filmGrain = document.getElementById('filmGrain');
    const lblGrain = document.getElementById('lblGrain');
    filmGrain?.addEventListener('input', (e) => {
      this.state.filmGrain = parseInt(e.target.value, 10);
      lblGrain.textContent = `${this.state.filmGrain}%`;
      this.render();
    });

    const vignette = document.getElementById('vignette');
    const lblVignette = document.getElementById('lblVignette');
    vignette?.addEventListener('input', (e) => {
      this.state.vignette = parseInt(e.target.value, 10);
      lblVignette.textContent = `${this.state.vignette}%`;
      this.render();
    });

    document.getElementById('filterTint')?.addEventListener('change', (e) => {
      this.state.filterTint = e.target.value;
      this.render();
    });

    const bindFilterSlider = (id, lblId, key) => {
      const el = document.getElementById(id);
      const lbl = document.getElementById(lblId);
      el?.addEventListener('input', (e) => {
        this.state[key] = parseInt(e.target.value, 10);
        lbl.textContent = `${this.state[key]}%`;
        this.render();
      });
    };
    bindFilterSlider('brightness', 'lblBrightness', 'brightness');
    bindFilterSlider('contrast', 'lblContrast', 'contrast');
    bindFilterSlider('saturation', 'lblSaturation', 'saturation');

    // Viewport Zoom & 3D Perspective Buttons
    document.getElementById('btnZoomIn')?.addEventListener('click', () => {
      this.state.viewZoom = Math.min(2.5, this.state.viewZoom + 0.15);
      this.update3DTransform();
    });

    document.getElementById('btnZoomOut')?.addEventListener('click', () => {
      this.state.viewZoom = Math.max(0.4, this.state.viewZoom - 0.15);
      this.update3DTransform();
    });

    document.getElementById('btnResetZoom')?.addEventListener('click', () => {
      this.state.viewZoom = 1.0;
      this.state.perspectivePitch = 45;
      this.state.perspectiveYaw = 0;
      this.update3DTransform();
    });

    const btnToggle3D = document.getElementById('btnToggle3D');
    const label3D = document.getElementById('label3D');
    btnToggle3D?.addEventListener('click', () => {
      this.state.is3DView = !this.state.is3DView;
      btnToggle3D.classList.toggle('btn-primary', this.state.is3DView);
      label3D.textContent = this.state.is3DView ? '🎲 3D Tabletop: ON' : '🎲 3D Tabletop View';
      this.update3DTransform();
      this.render();
    });

    // Export Scale Multiplier (1x, 2x, 4x)
    document.querySelectorAll('[data-export-mult]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-export-mult]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.exportMult = parseInt(btn.dataset.exportMult, 10);
        this.render();
      });
    });

    // Action Buttons
    document.getElementById('btnDownloadPNG')?.addEventListener('click', () => this.downloadImage('image/png'));
    document.getElementById('btnTopDownload')?.addEventListener('click', () => this.downloadImage('image/png'));
    document.getElementById('btnDownloadWebP')?.addEventListener('click', () => this.downloadImage('image/webp'));
    document.getElementById('btnCopyClipboard')?.addEventListener('click', () => this.copyToClipboard());
    document.getElementById('btnQuickCopy')?.addEventListener('click', () => this.copyToClipboard());
    document.getElementById('btnRandomColors')?.addEventListener('click', () => this.randomizeColors());
    document.getElementById('btnResetAll')?.addEventListener('click', () => this.resetDefaults());
  }

  /* --------------------------------------------------------------------------
     FILE LOADING
     -------------------------------------------------------------------------- */
  loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.state.image = img;
        this.state.imageFilename = file.name;
        this.state.imageOffsetX = 0;
        this.state.imageOffsetY = 0;
        this.state.imageScale = 1.0;

        const clearBtn = document.getElementById('btnClearImage');
        if (clearBtn) clearBtn.style.display = 'inline-flex';

        const info = document.getElementById('imageStatusInfo');
        if (info) info.textContent = `Loaded: ${file.name} (${img.width}×${img.height}px)`;

        this.render();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  randomizeColors() {
    const colors = ['#c21f25', '#f59e0b', '#3b82f6', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#ffffff'];
    const styles = ['solid', 'double', 'glow', 'chiseled'];
    
    this.state.borderColor = colors[Math.floor(Math.random() * colors.length)];
    this.state.borderColor2 = colors[Math.floor(Math.random() * colors.length)];
    this.state.borderStyle = styles[Math.floor(Math.random() * styles.length)];

    const colInput = document.getElementById('borderColor');
    const colTxt = document.getElementById('borderColorText');
    const col2Input = document.getElementById('borderColor2');
    const col2Txt = document.getElementById('borderColor2Text');
    const styleSel = document.getElementById('borderStyle');

    if (colInput) colInput.value = this.state.borderColor;
    if (colTxt) colTxt.value = this.state.borderColor;
    if (col2Input) col2Input.value = this.state.borderColor2;
    if (col2Txt) col2Txt.value = this.state.borderColor2;
    if (styleSel) styleSel.value = this.state.borderStyle;

    const rowBorderColor2 = document.getElementById('rowBorderColor2');
    if (rowBorderColor2) {
      rowBorderColor2.style.display = (this.state.borderStyle === 'solid') ? 'none' : 'flex';
    }

    this.render();
  }

  resetDefaults() {
    this.state.tokenSize = 500;
    this.state.isSquare = false;
    this.state.borderSize = '1';
    this.state.borderHorizontal = false;
    this.state.borderSnapOffset = false;
    this.state.borderWidth = 10;
    this.state.borderColor = '#c21f25';
    this.state.borderColor2 = '#ffffff';
    this.state.borderStyle = 'solid';
    this.state.borderInFront = true;
    this.state.padTop = 0;
    this.state.padBottom = 0;
    this.state.padLeft = 0;
    this.state.padRight = 0;
    this.state.gridOffsetX = 0;
    this.state.gridOffsetY = 0;
    this.state.linkPaddings = false;
    this.state.bgTransparent = false;
    this.state.bgColor = '#12161f';
    this.state.bgPattern = 'solid';
    this.state.cropBackground = true;
    this.state.image = null;
    this.state.imageFilename = '';
    this.state.imageScale = 1.0;
    this.state.imageRotation = 0;
    this.state.imageOffsetX = 0;
    this.state.imageOffsetY = 0;
    this.state.cropImage = true;
    this.state.popoutBreach = false;
    this.state.popoutMode = 'cutoff';
    this.state.popoutCutoff = 35;
    this.state.popoutAngle = 0;
    this.state.popoutFlip = false;
    this.state.popoutFeather = 0;
    this.state.popoutShowGuide = true;
    this.state.enablePixelate = false;
    this.state.enableBevel = true;
    this.state.bevelStyle = 'smooth';
    this.state.bevelDepth = 8;
    this.state.bevelAngle = 135;
    this.state.enableDropShadow = true;
    this.state.shadowBlur = 18;
    this.state.shadowDistance = 12;
    this.state.shadowOffsetY = 12;
    this.state.shadowAngle = 90;
    this.state.enableScanlines = false;
    this.state.chromaticAberration = 0;
    this.state.filmGrain = 0;
    this.state.vignette = 0;

    const clearBtn = document.getElementById('btnClearImage');
    if (clearBtn) clearBtn.style.display = 'none';
    const info = document.getElementById('imageStatusInfo');
    if (info) info.textContent = 'No image loaded';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setChecked = (id, checked) => { const el = document.getElementById(id); if (el) el.checked = checked; };

    setVal('tokenSize', 500);
    setVal('tokenSizeNum', 500);
    setChecked('isSquare', false);
    ['rowBorderHorizontal', 'rowSnapOffset', 'rowSubHexGrid'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });
    setVal('borderSize', '1');
    setChecked('borderHorizontal', false);
    setChecked('borderSnapOffset', false);
    setChecked('showSubHexGrid', false);
    setVal('borderWidth', 10);
    setVal('borderWidthNum', 10);
    setVal('borderColor', '#c21f25');
    setVal('borderColorText', '#c21f25');
    setVal('borderColor2', '#ffffff');
    setVal('borderColor2Text', '#ffffff');
    setVal('borderStyle', 'solid');
    setChecked('borderInFront', true);
    ['padTop', 'padBottom', 'padLeft', 'padRight', 'gridOffsetX', 'gridOffsetY'].forEach(id => setVal(id, 0));
    setChecked('linkPaddings', false);
    setChecked('bgTransparent', false);
    setVal('bgColor', '#12161f');
    setVal('bgColorText', '#12161f');
    setVal('bgPattern', 'solid');
    setChecked('cropBackground', true);
    setVal('imageScale', 1.0);
    setVal('imageScaleNum', 1.0);
    setVal('imageRotation', 0);
    setChecked('cropImage', true);
    setChecked('popoutBreach', false);
    setVal('popoutMode', 'cutoff');
    setVal('popoutCutoff', 35);
    setVal('popoutAngle', 0);
    setChecked('popoutFlip', false);
    setChecked('popoutShowGuide', true);
    setChecked('enableBevel', true);
    setVal('bevelStyle', 'smooth');
    setVal('bevelDepth', 8);
    setVal('bevelAngle', 135);
    setChecked('enableDropShadow', true);
    setVal('shadowBlur', 18);
    setVal('shadowDistance', 12);
    setVal('shadowOffsetY', 12);
    setVal('shadowAngle', 90);
    const lblShadowBlur = document.getElementById('lblShadowBlur');
    if (lblShadowBlur) lblShadowBlur.textContent = '18 px';
    const lblShadowDistance = document.getElementById('lblShadowDistance') || document.getElementById('lblShadowOffsetY');
    if (lblShadowDistance) lblShadowDistance.textContent = '12 px';
    const lblShadowAngle = document.getElementById('lblShadowAngle');
    if (lblShadowAngle) lblShadowAngle.textContent = '90°';
    setChecked('enablePixelate', false);
    setChecked('enableScanlines', false);
    setVal('vignette', 0);
    const lblVignette = document.getElementById('lblVignette');
    if (lblVignette) lblVignette.textContent = '0%';

    const rowBorderColor2 = document.getElementById('rowBorderColor2');
    if (rowBorderColor2) rowBorderColor2.style.display = 'none';

    this.updateHUD();
    this.render();
  }

  updateHUD() {
    const dimEl = document.getElementById('hudDimensions');
    const sizeEl = document.getElementById('hudSizeBadge');
    if (dimEl) dimEl.textContent = `${this.totalCanvasW} × ${this.totalCanvasH} PX`;
    if (sizeEl) {
      if (this.state.isSquare) {
        sizeEl.textContent = `SQUARE (${this.state.borderSize === '1' ? '1×1' : `SIZE ${this.state.borderSize}`})`;
      } else {
        const orient = this.state.borderHorizontal ? 'HORIZONTAL' : 'VERTICAL';
        sizeEl.textContent = `SIZE ${this.state.borderSize} (${orient})`;
      }
    }
  }

  /* --------------------------------------------------------------------------
     EXPORT & CLIPBOARD UTILITIES
     -------------------------------------------------------------------------- */
  downloadImage(mimeType = 'image/png') {
    this.render(true);
    const ext = mimeType === 'image/webp' ? 'webp' : 'png';
    const namePart = this.state.imageFilename ? this.state.imageFilename.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '_') : 'token';
    const filename = `lancer_${namePart}_size${this.state.borderSize}.${ext}`;
    
    this.canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.render(false);
    }, mimeType, 0.95);
  }

  copyToClipboard() {
    this.render(true);
    this.canvas.toBlob((blob) => {
      if (!blob) return;
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          this.showToast('Token copied to clipboard! Ready to paste into Discord or VTT.');
          this.render(false);
        }).catch(() => {
          this.downloadImage('image/png');
        });
      } catch (_) {
        this.downloadImage('image/png');
      }
    }, 'image/png');
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'hud-pill highlight';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '12px';
    toast.style.padding = '8px 16px';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  adjustColorBrightness(hex, factor) {
    const c = hex.replace('#', '');
    if (c.length !== 6) return hex;
    const r = Math.min(255, Math.floor(parseInt(c.substr(0, 2), 16) * factor));
    const g = Math.min(255, Math.floor(parseInt(c.substr(2, 2), 16) * factor));
    const b = Math.min(255, Math.floor(parseInt(c.substr(4, 2), 16) * factor));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.lancerApp = new LancerTokenApp();
});
