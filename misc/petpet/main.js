/**
 * Petpet Generator - Interactive Live Preview & Animated GIF Maker
 * Supports custom image upload, drag adjustment, squish/speed controls,
 * and custom hand sprite replacement with dedicated hand-squish physics!
 */

"use strict";

const MAX_FRAME = 4;
const OUT_SIZE = 112;
const CACHE_SIZE = 256;

const DEFAULTS = Object.freeze({
  squish: 1.25,
  scale: 0.85,
  delay: 60, // ~16 FPS
  spriteX: 14,
  spriteY: 20,
  spriteWidth: 112,
  spriteHeight: 112,
  currentFrame: 0,
  flip: false,
  // Hand physics and customization
  handSquish: 1.0,  // Hand squish / downward impact multiplier (0.2 - 3.0)
  handScale: 1.0,   // Hand scale multiplier (0.4 - 2.0)
  handFlip: false,  // Hand horizontal mirror
  handOffsetX: 0,
  handOffsetY: 0,
  handBehind: false, // Layer switch: false = hand on top, true = hand on bottom
});

const CANVAS_OPTIONS = Object.freeze({
  antialias: false,
  powerPreference: "low-power",
});

// Global state
const g = { ...DEFAULTS };

(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selectors) => document.querySelectorAll(selectors);
  const clamp = (num, min, max) => (num < min ? min : num > max ? max : num);
  const truncateStr = (str, len) =>
    str.length <= len ? str : `${str.slice(0, ~~(len / 2))}⋯${str.slice(-~~(len / 2))}`;

  /**
   * Loads and caches an image to improve performance & normalize dimensions
   */
  const ImageLoader = (onLoad, onError) => {
    const cacheCanvas = document.createElement("canvas");
    const cacheCtx = cacheCanvas.getContext("2d");
    cacheCanvas.width = cacheCanvas.height = CACHE_SIZE;

    let dataURLCache = "";
    const image = new Image();
    image.crossOrigin = "Anonymous";

    image.onload = () => {
      const aspect = image.naturalHeight / (image.naturalWidth || 1);
      cacheCanvas.height = Math.max(1, Math.round(CACHE_SIZE * aspect));
      cacheCanvas.width = CACHE_SIZE;
      cacheCtx.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height);
      cacheCtx.drawImage(image, 0, 0, cacheCanvas.width, cacheCanvas.height);
      try {
        dataURLCache = cacheCanvas.toDataURL("image/png");
        onLoad(dataURLCache, image);
      } catch (e) {
        onLoad(image.src, image);
      }
    };

    image.onerror = (e) => onError(e, dataURLCache);

    return {
      loadImage: (src) => {
        if (image.src && image.src.startsWith("blob:")) {
          URL.revokeObjectURL(image.src);
        }
        image.src = src;
      },
      getImage: () => image,
    };
  };

  /**
   * Built-in cute presets for target images and hand sprites
   */
  const PRESETS = {
    hands: {
      default: {
        name: "Default Hand",
        type: "sprite",
        src: "./img/sprite.png",
        desc: "Classic pet-pet human hand (5-frame sprite)",
      },
      catPaw: {
        name: "Kitty Paw 🐾",
        type: "single",
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" width="112" height="112">
            <defs>
              <linearGradient id="pawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fffdf8"/>
                <stop offset="100%" stop-color="#f5e1cb"/>
              </linearGradient>
            </defs>
            <!-- Fluffy cat arm & rounded paw -->
            <path d="M 0 10 C 22 15 40 25 56 38 C 68 47 78 52 88 47 C 96 42 96 32 86 26 C 74 18 54 11 26 2 Z" fill="url(#pawGrad)" stroke="#cbb294" stroke-width="2.5" stroke-linejoin="round"/>
            <!-- Paw print group: flipped vertically & skewed to fit snugly inside paw/arm -->
            <g transform="translate(64, 35) rotate(-22) skewX(-10)">
              <!-- Main palm pad (wrist/upper side of paw) -->
              <ellipse cx="0" cy="-4" rx="12" ry="8.5" fill="#ff94b8" />
              <ellipse cx="-2" cy="-6" rx="3.5" ry="2" fill="#ffffff" opacity="0.65" />
              <!-- 4 Toe beans (curving along bottom/pet-facing side, inside paw contour) -->
              <circle cx="-12" cy="7.5" r="4.2" fill="#ffaac6" />
              <circle cx="-4" cy="10.5" r="4.6" fill="#ffaac6" />
              <circle cx="5.5" cy="9.5" r="4.6" fill="#ffaac6" />
              <circle cx="13" cy="5.5" r="4.2" fill="#ffaac6" />
            </g>
          </svg>
        `),
        desc: "Cute fluffy kitten paw with pink beans",
      },
      wand: {
        name: "Magic Wand ✨",
        type: "single",
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" width="112" height="112">
            <!-- Wand handle -->
            <line x1="10" y1="15" x2="65" y2="48" stroke="#8b4513" stroke-width="5" stroke-linecap="round"/>
            <line x1="12" y1="16" x2="63" y2="47" stroke="#d2b48c" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Star tip -->
            <polygon points="68,36 72,44 80,45 74,51 76,59 68,54 60,59 62,51 56,45 64,44" fill="#ffd700" stroke="#b8860b" stroke-width="1.8"/>
            <circle cx="68" cy="48" r="3" fill="#ffffff"/>
            <!-- Sparkles -->
            <polygon points="86,30 88,34 92,35 89,38 90,42 86,39 82,42 83,38 80,35 84,34" fill="#ffec8b"/>
          </svg>
        `),
        desc: "Magical sparkling star wand",
      },
    },
    targets: {
      default: {
        name: "Egg Guy 🥚",
        src: "./img/sample.png",
      },
      cat: {
        name: "Kitty 🐱",
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="55" r="36" fill="#fed86e" stroke="#572e23" stroke-width="3.5"/>
            <!-- Ears -->
            <polygon points="22,34 16,10 40,24" fill="#fed86e" stroke="#572e23" stroke-width="3" stroke-linejoin="round"/>
            <polygon points="25,30 20,16 36,24" fill="#ff99bb"/>
            <polygon points="78,34 84,10 60,24" fill="#fed86e" stroke="#572e23" stroke-width="3" stroke-linejoin="round"/>
            <polygon points="75,30 80,16 64,24" fill="#ff99bb"/>
            <!-- Eyes -->
            <ellipse cx="38" cy="52" rx="4.5" ry="6" fill="#572e23"/>
            <circle cx="39.5" cy="50" r="1.8" fill="#fff"/>
            <ellipse cx="62" cy="52" rx="4.5" ry="6" fill="#572e23"/>
            <circle cx="63.5" cy="50" r="1.8" fill="#fff"/>
            <!-- Nose & mouth -->
            <polygon points="50,59 47,56 53,56" fill="#ff99bb"/>
            <path d="M 46 62 Q 50 65 50 61 Q 50 65 54 62" fill="none" stroke="#572e23" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Blush -->
            <circle cx="30" cy="59" r="4" fill="#ff99bb" opacity="0.6"/>
            <circle cx="70" cy="59" r="4" fill="#ff99bb" opacity="0.6"/>
          </svg>
        `),
      },
      blorbo: {
        name: "Blorbo 🎨",
        src: "data:image/svg+xml;utf8," + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <ellipse cx="50" cy="55" rx="38" ry="32" fill="#fee7a5" stroke="#111" stroke-width="3.5"/>
            <ellipse cx="36" cy="50" rx="3.5" ry="5.5" fill="#111"/>
            <ellipse cx="64" cy="50" rx="3.5" ry="5.5" fill="#111"/>
            <path d="M 45 61 Q 50 67 55 61" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/>
            <circle cx="28" cy="56" r="4.5" fill="#ff70a6" opacity="0.7"/>
            <circle cx="72" cy="56" r="4.5" fill="#ff70a6" opacity="0.7"/>
          </svg>
        `),
      },
    },
  };

  let loop = null;

  /**
   * Main PetPet Animation Controller
   */
  const PetPetAnimation = (canvas, handImg, spriteImg) => {
    let allowAdjust = false;
    const ctx = canvas.getContext("2d", CANVAS_OPTIONS);
    ctx.imageSmoothingEnabled = false;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#ff3b30";

    const refreshSprite = () => {
      if (spriteImg.naturalWidth && spriteImg.naturalHeight) {
        g.spriteHeight = g.spriteWidth * (spriteImg.naturalHeight / spriteImg.naturalWidth);
      }
    };

    spriteImg.addEventListener("load", refreshSprite);

    // Frame offsets matching classic petpet geometry
    const frameOffsets = [
      { x: 0,   y: 0,  w: 0,  h: 0 },
      { x: -4,  y: 12, w: 4,  h: -12 },
      { x: -12, y: 18, w: 12, h: -18 },
      { x: -8,  y: 12, w: 4,  h: -12 },
      { x: -4,  y: 0,  w: 0,  h: 0 },
    ];

    const getSpriteFrame = (frame) => {
      const offset = frameOffsets[frame] || frameOffsets[0];
      return {
        dx: Math.round(g.spriteX + offset.x * (g.squish * 0.4)),
        dy: Math.round(g.spriteY + offset.y * (g.squish * 0.9)),
        dw: Math.round((g.spriteWidth + offset.w * g.squish) * g.scale),
        dh: Math.round((g.spriteHeight + offset.h * g.squish) * g.scale),
      };
    };

    /**
     * Draws the hand on top of the pet
     */
    const drawHand = (frame, _ctx, _adjust, cf) => {
      if (!handImg.complete || !handImg.naturalWidth) return;

      const offset = frameOffsets[frame] || frameOffsets[0];
      const isSpriteSheet = handImg.naturalWidth / handImg.naturalHeight >= 4.0;

      // Vertical dip of the hand based on the petting stroke & handSquish
      const dipBase = offset.y * (g.squish * 0.9);
      const handDip = Math.max(0, Math.round(dipBase * 0.75 * g.handSquish - 0.5));
      const handY = handDip + g.handOffsetY;
      const handX = g.handOffsetX;

      // Squish factor for the hand itself during peak stroke (frame 2)
      const handPeakRatio = (offset.y / 18);
      const handSquishFactor = handPeakRatio * (g.handSquish - 1.0);

      _ctx.save();
      if (_adjust) _ctx.globalAlpha = 0.75;

      if (isSpriteSheet) {
        // 5-frame sprite sheet
        const frameW = handImg.naturalWidth / 5;
        const frameH = handImg.naturalHeight;
        const sx = frame * frameW;

        // Apply hand scale & deformation
        const drawW = Math.round(OUT_SIZE * g.handScale * (1 + handSquishFactor * 0.12));
        const drawH = Math.round(OUT_SIZE * g.handScale * (1 - handSquishFactor * 0.18));

        _ctx.translate(handX, handY);
        if (g.handFlip) {
          _ctx.translate(drawW, 0);
          _ctx.scale(-1, 1);
        }

        _ctx.drawImage(handImg, sx, 0, frameW, frameH, 0, 0, drawW, drawH);
      } else {
        // Single image hand: animate position, tilt, and elastic squash & stretch
        const baseW = OUT_SIZE * g.handScale;
        const baseH = OUT_SIZE * g.handScale;

        // Tilt angles across frames (wobble on stroke)
        const tilts = [ -2, 3, 0, -2, -3 ];
        const tiltDeg = tilts[frame] * (g.handFlip ? -1 : 1);

        // Vertical squash and horizontal expansion on press
        const drawW = Math.round(baseW * (1 + handSquishFactor * 0.16 + (offset.y / 18) * 0.08));
        const drawH = Math.round(baseH * (1 - handSquishFactor * 0.22 - (offset.y / 18) * 0.12));

        _ctx.translate(handX + drawW / 2, handY + drawH / 2);
        _ctx.rotate((tiltDeg * Math.PI) / 180);
        if (g.handFlip) {
          _ctx.scale(-1, 1);
        }

        _ctx.drawImage(
          handImg,
          0,
          0,
          handImg.naturalWidth,
          handImg.naturalHeight,
          -drawW / 2,
          -drawH / 2,
          drawW,
          drawH
        );
      }

      _ctx.restore();
    };

    /**
     * Renders a single frame
     */
    const renderFrame = (_frame, _ctx, _adjust) => {
      const cf = getSpriteFrame(_frame);

      if (_ctx.globalAlpha !== 1) _ctx.globalAlpha = 1;
      _ctx.clearRect(0, 0, OUT_SIZE, OUT_SIZE);

      const drawTargetSprite = () => {
        _ctx.save();
        _ctx.translate(cf.dx, cf.dy);

        let targetW = cf.dw;
        if (g.flip) {
          _ctx.scale(-1, 1);
          targetW = -cf.dw;
        }

        if (spriteImg.complete && spriteImg.naturalWidth) {
          _ctx.drawImage(spriteImg, 0, 0, targetW, cf.dh);
        }

        // Draw bounding box if in adjust mode
        if (_adjust) {
          _ctx.setLineDash([3, 2]);
          _ctx.strokeStyle = "#ff3b30";
          _ctx.strokeRect(0, 0, targetW, cf.dh);
          _ctx.setLineDash([]);
        }
        _ctx.restore();
      };

      if (g.handBehind) {
        // Hand rendered first (underneath target)
        drawHand(_frame, _ctx, _adjust, cf);
        drawTargetSprite();
      } else {
        // Target rendered first, hand on top (default)
        drawTargetSprite();
        drawHand(_frame, _ctx, _adjust, cf);
      }
    };

    const tick = () => {
      window.requestAnimationFrame(() => {
        renderFrame(g.currentFrame, ctx, allowAdjust);
        updateFrameIndicator();
      });
    };

    const play = () => {
      if (!loop) {
        loop = window.requestInterval(() => {
          renderFrame(g.currentFrame, ctx, allowAdjust);
          updateFrameIndicator();
          g.currentFrame = (g.currentFrame + 1) % 5;
        }, g.delay);
      }
    };

    const stop = () => {
      if (loop) {
        window.clearRequestInterval(loop);
        loop = null;
      }
      tick();
    };

    const seek = (amount) => {
      stop();
      const newFrame = (g.currentFrame + amount + 5) % 5;
      g.currentFrame = newFrame;
      tick();
    };

    const updateFrameIndicator = () => {
      const el = $("#frameIndicator");
      if (el) el.innerText = `${g.currentFrame + 1}/5`;
    };

    // ADJUST MODE DRAGGING & INTERACTIONS
    let offsetX = 0;
    let offsetY = 0;
    let offsetScale = 1;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    const inSpriteBounds = (posX, posY) => {
      const cf = getSpriteFrame(g.currentFrame);
      return posX >= cf.dx && posX <= cf.dx + cf.dw && posY >= cf.dy && posY <= cf.dy + cf.dh;
    };

    const updateRelativeOffset = () => {
      if (!allowAdjust) return;
      const bounds = canvas.getBoundingClientRect();
      offsetX = bounds.left;
      offsetY = bounds.top;
      offsetScale = OUT_SIZE / (bounds.width || 1);
    };

    const toggleAdjust = (force) => {
      allowAdjust = force !== undefined ? force : !allowAdjust;
      if (allowAdjust) {
        g.currentFrame = 0;
        stop();
      }
      updateRelativeOffset();
      tick();
    };

    window.addEventListener("scroll", updateRelativeOffset, { passive: true });
    window.addEventListener("resize", updateRelativeOffset, { passive: true });

    canvas.addEventListener("pointerdown", (e) => {
      if (!allowAdjust) return;
      e.preventDefault();
      updateRelativeOffset();

      startX = Math.round((e.clientX - offsetX) * offsetScale);
      startY = Math.round((e.clientY - offsetY) * offsetScale);

      dragging = inSpriteBounds(startX, startY) || true; // allow dragging anywhere inside canvas in adjust mode
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      e.preventDefault();

      const mouseX = Math.round((e.clientX - offsetX) * offsetScale);
      const mouseY = Math.round((e.clientY - offsetY) * offsetScale);

      g.spriteX += mouseX - startX;
      g.spriteY += mouseY - startY;

      startX = mouseX;
      startY = mouseY;

      tick();
    });

    const stopDrag = (e) => {
      if (dragging) {
        dragging = false;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    };

    canvas.addEventListener("pointerup", stopDrag);
    canvas.addEventListener("pointercancel", stopDrag);

    // Keyboard arrow adjustment
    document.addEventListener("keydown", (e) => {
      if (!allowAdjust) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const step = e.shiftKey ? 5 : 1;
        if (e.key === "ArrowLeft") g.spriteX -= step;
        if (e.key === "ArrowRight") g.spriteX += step;
        if (e.key === "ArrowUp") g.spriteY -= step;
        if (e.key === "ArrowDown") g.spriteY += step;
        e.preventDefault();
        tick();
      }
    });

    return {
      tick,
      play,
      stop,
      seek,
      renderFrame,
      toggleAdjust,
      refreshSprite,
    };
  };

  /**
   * GIF Renderer with Chroma Transparency & Progress Tracking
   */
  const GifRenderer = (animation, onStart, onProgress, onFinish) => {
    const renderCanvas = document.createElement("canvas");
    const renderCtx = renderCanvas.getContext("2d", CANVAS_OPTIONS);
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d", CANVAS_OPTIONS);
    renderCanvas.width = renderCanvas.height = tempCanvas.width = tempCanvas.height = OUT_SIZE;

    // Prepare worker URL (supporting inline blob for seamless file:// and http:// execution)
    let workerScriptUrl = "gif.worker.js";
    try {
      const inlineWorkerCode = document.getElementById("gif-worker-code");
      if (inlineWorkerCode && inlineWorkerCode.textContent.trim().length > 100) {
        const blob = new Blob([inlineWorkerCode.textContent], { type: "application/javascript" });
        workerScriptUrl = URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn("Using default worker path", e);
    }

    const optimizeFrameColors = (data) => {
      for (let i = 0; i < data.length; i += 4) {
        // Clamp natural greens so they don't get chroma-keyed
        data[i + 1] = data[i + 1] > 250 ? 250 : data[i + 1];

        // Replace semi-transparent / transparent pixels with pure key green
        if (data[i + 3] < 128) {
          data[i + 0] = 0;
          data[i + 1] = 255;
          data[i + 2] = 0;
        }
        data[i + 3] = 255;
      }
    };

    return {
      render() {
        if (typeof GIF === "undefined") {
          alert("GIF encoding library not yet loaded. Please wait a moment.");
          return;
        }

        const gif = new GIF({
          workers: 2,
          workerScript: workerScriptUrl,
          width: OUT_SIZE,
          height: OUT_SIZE,
          transparent: 0x00ff00,
        });

        const frameDelay = clamp(g.delay, 20, 1000);

        for (let i = 0; i <= MAX_FRAME; i++) {
          tempCtx.clearRect(0, 0, OUT_SIZE, OUT_SIZE);
          animation.renderFrame(i, tempCtx, false);

          const imgData = tempCtx.getImageData(0, 0, OUT_SIZE, OUT_SIZE);
          optimizeFrameColors(imgData.data);
          renderCtx.putImageData(imgData, 0, 0);

          gif.addFrame(renderCtx, { copy: true, delay: frameDelay });
        }

        gif.on("start", () => onStart(performance.now()));
        gif.on("progress", (p) => onProgress(p));
        gif.on("finished", (blob) => onFinish(blob, performance.now()));
        gif.render();
      },
    };
  };

  /* --------------------------------------------------------------------------
     DOM Initialization and Event Wiring
     -------------------------------------------------------------------------- */
  window.addEventListener("DOMContentLoaded", () => {
    const $canvas = $("#canvas");
    const $targetPreview = $("#uploadPreview");
    const $handThumb = $("#handThumb");
    const $handName = $("#handName");
    const $handDesc = $("#handDesc");
    const $handSquishVal = $("#handSquishVal");

    const $handImg = new Image();
    $handImg.crossOrigin = "Anonymous";

    const animation = PetPetAnimation($canvas, $handImg, $targetPreview);

    const imageLoader = ImageLoader(
      (data) => {
        $targetPreview.src = data;
        $("#uploadError").innerText = "";
        $targetPreview.classList.remove("error");
        animation.refreshSprite();
        animation.tick();
      },
      (e) => {
        console.error("Failed to load target image", e);
        $targetPreview.classList.add("error");
        $("#uploadError").innerText = "Could not load image! Try uploading a file directly.";
      }
    );

    const handLoader = ImageLoader(
      (data, img) => {
        $handImg.src = data;
        $handThumb.src = data;
        animation.tick();
      },
      (e) => {
        console.error("Failed to load hand image", e);
      }
    );

    // Initial Defaults
    $handImg.src = PRESETS.hands.default.src;
    $handThumb.src = PRESETS.hands.default.src;
    $handName.innerText = PRESETS.hands.default.name;
    $handDesc.innerText = PRESETS.hands.default.desc;

    imageLoader.loadImage(PRESETS.targets.default.src);

    // Playback Controls
    const $playBtn = $("#play");
    const setPlayState = (stop = false) => {
      if (stop || !$playBtn.classList.contains("paused")) {
        animation.stop();
        $playBtn.classList.add("paused");
        $playBtn.setAttribute("title", "Play animation");
      } else {
        animation.play();
        $playBtn.classList.remove("paused");
        $playBtn.setAttribute("title", "Pause animation");
      }
    };

    $playBtn.addEventListener("click", () => setPlayState());

    $("#prev").addEventListener("click", () => {
      setPlayState(true);
      animation.seek(-1);
    });

    $("#next").addEventListener("click", () => {
      setPlayState(true);
      animation.seek(1);
    });

    // Target Controls
    $("#squish").addEventListener("input", (e) => {
      g.squish = parseFloat((clamp(parseInt(e.target.value), 50, 300) / 100).toFixed(3));
      animation.tick();
    });

    $("#scale").addEventListener("input", (e) => {
      g.scale = parseFloat((clamp(parseInt(e.target.value), 15, 200) / 100).toFixed(3));
      animation.tick();
    });

    const updateFps = (val) => {
      const fps = clamp(parseInt(val) || 16, 2, 60);
      $("#fps").value = fps;
      $("#fpsVal").value = fps;
      const newDelay = Math.round(1000 / fps);
      if (newDelay !== g.delay) {
        g.delay = newDelay;
        if (loop) {
          animation.stop();
          animation.play();
        }
      }
    };

    $("#fps").addEventListener("input", (e) => updateFps(e.target.value));
    $("#fpsVal").addEventListener("change", (e) => updateFps(e.target.value));

    $("#toggleFlip").addEventListener("change", (e) => {
      g.flip = e.target.checked;
      animation.tick();
    });

    $("#toggleAdjust").addEventListener("change", (e) => {
      $canvas.classList.toggle("adjust-mode", e.target.checked);
      if (e.target.checked) {
        setPlayState(true);
      }
      animation.toggleAdjust(e.target.checked);
    });

    // HAND CUSTOMIZATION CONTROLS (EXTRA FEATURE)
    $("#handSquish").addEventListener("input", (e) => {
      const val = clamp(parseInt(e.target.value), 20, 300);
      g.handSquish = parseFloat((val / 100).toFixed(2));
      if ($handSquishVal) $handSquishVal.innerText = `${val}%`;
      animation.tick();
    });

    $("#handScale").addEventListener("input", (e) => {
      g.handScale = parseFloat((clamp(parseInt(e.target.value), 30, 200) / 100).toFixed(2));
      animation.tick();
    });

    $("#handFlip").addEventListener("change", (e) => {
      g.handFlip = e.target.checked;
      animation.tick();
    });

    // Layer switch (Hand on bottom / behind target)
    const $toggleHandBehind = $("#toggleHandBehind");
    if ($toggleHandBehind) {
      $toggleHandBehind.addEventListener("change", (e) => {
        g.handBehind = e.target.checked;
        animation.tick();
      });
    }

    // Hand Presets Selection
    $$(".hand-preset-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".hand-preset-chip").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const key = btn.dataset.hand;
        if (PRESETS.hands[key]) {
          const item = PRESETS.hands[key];
          $handName.innerText = item.name;
          $handDesc.innerText = item.desc;
          handLoader.loadImage(item.src);
        }
      });
    });

    // Custom Hand File Upload
    const $handFile = $("#uploadHandFile");
    const $handDropArea = $("#handDropArea");
    const $handFileName = $("#handFileName");

    const handleHandFile = (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      $handFileName.innerText = truncateStr(file.name, 18);
      $handName.innerText = "Custom Hand";
      $handDesc.innerText = file.name;
      $$(".hand-preset-chip").forEach((b) => b.classList.remove("active"));
      handLoader.loadImage(URL.createObjectURL(file));
    };

    $handFile.addEventListener("change", () => {
      if ($handFile.files[0]) handleHandFile($handFile.files[0]);
    });

    ["dragenter", "dragover"].forEach((ev) => {
      $handDropArea.addEventListener(ev, (e) => {
        e.preventDefault();
        $handDropArea.classList.add("highlight");
      });
    });

    ["dragleave", "drop"].forEach((ev) => {
      $handDropArea.addEventListener(ev, (e) => {
        e.preventDefault();
        $handDropArea.classList.remove("highlight");
      });
    });

    $handDropArea.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleHandFile(file);
    });

    $("#btnResetHand").addEventListener("click", () => {
      g.handSquish = DEFAULTS.handSquish;
      g.handScale = DEFAULTS.handScale;
      g.handFlip = DEFAULTS.handFlip;
      g.handOffsetX = DEFAULTS.handOffsetX;
      g.handOffsetY = DEFAULTS.handOffsetY;

      $("#handSquish").value = 100;
      if ($handSquishVal) $handSquishVal.innerText = "100%";
      $("#handScale").value = 100;
      $("#handFlip").checked = false;
      g.handBehind = DEFAULTS.handBehind;
      const $toggleHandBehind = $("#toggleHandBehind");
      if ($toggleHandBehind) $toggleHandBehind.checked = false;

      $$(".hand-preset-chip").forEach((b) => b.classList.remove("active"));
      const defaultChip = document.querySelector('[data-hand="default"]');
      if (defaultChip) defaultChip.classList.add("active");

      $handName.innerText = PRESETS.hands.default.name;
      $handDesc.innerText = PRESETS.hands.default.desc;
      $handFileName.innerText = "or drop custom hand";
      handLoader.loadImage(PRESETS.hands.default.src);
      animation.tick();
    });

    // TARGET IMAGE UPLOAD & CHIPS
    const $dropArea = $("#dropArea");
    const $uploadFile = $("#uploadFile");
    const $uploadFileName = $("#uploadFileName");

    const handleTargetFile = (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      $("#uploadError").innerText = "";
      $uploadFileName.innerText = truncateStr(file.name, 18);
      imageLoader.loadImage(URL.createObjectURL(file));
    };

    $uploadFile.addEventListener("change", () => {
      if ($uploadFile.files[0]) handleTargetFile($uploadFile.files[0]);
    });

    ["dragenter", "dragover"].forEach((ev) => {
      $dropArea.addEventListener(ev, (e) => {
        e.preventDefault();
        $dropArea.classList.add("highlight");
      });
    });

    ["dragleave", "drop"].forEach((ev) => {
      $dropArea.addEventListener(ev, (e) => {
        e.preventDefault();
        $dropArea.classList.remove("highlight");
      });
    });

    $dropArea.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleTargetFile(file);
    });

    // Clipboard Paste Image support (Ctrl+V)
    document.addEventListener("paste", (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleTargetFile(file);
            break;
          }
        }
      }
    });

    // URL Upload
    $("#uploadUrlBtn").addEventListener("click", () => {
      const url = $("#uploadUrl").value.trim();
      if (!url) return;
      $("#uploadError").innerText = "";
      imageLoader.loadImage(url);
    });

    // Avatar Presets
    $$(".target-preset-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        $$(".target-preset-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const key = chip.dataset.target;
        if (PRESETS.targets[key]) {
          imageLoader.loadImage(PRESETS.targets[key].src);
          $uploadFileName.innerText = PRESETS.targets[key].name;
        }
      });
    });

    // Reset All Controls
    const resetAll = () => {
      Object.assign(g, DEFAULTS);
      animation.refreshSprite();

      $("#squish").value = Math.round(DEFAULTS.squish * 100);
      $("#scale").value = Math.round(DEFAULTS.scale * 100);
      $("#fps").value = $("#fpsVal").value = Math.round(1000 / DEFAULTS.delay);
      $("#toggleFlip").checked = false;
      $("#toggleAdjust").checked = false;
      $canvas.classList.remove("adjust-mode");

      $("#handSquish").value = 100;
      if ($handSquishVal) $handSquishVal.innerText = "100%";
      $("#handScale").value = 100;
      $("#handFlip").checked = false;
      const $toggleHandBehind = $("#toggleHandBehind");
      if ($toggleHandBehind) $toggleHandBehind.checked = false;

      animation.toggleAdjust(false);
      setPlayState(false);
      animation.tick();
    };

    $("#reset").addEventListener("click", resetAll);

    // GIF EXPORT & DOWNLOAD
    let exportStartTime = 0;
    let lastExportBlob = null;
    const $resultImg = $("#result");
    const $infoLabel = $("#info");
    const $exportBtn = $("#export");
    const $btnDownload = $("#btnDownload");
    const $btnCopy = $("#btnCopy");

    const gifRenderer = GifRenderer(
      animation,
      (startTime) => {
        exportStartTime = startTime;
        $exportBtn.disabled = true;
        $exportBtn.innerText = "Encoding 0%...";
        $infoLabel.innerText = "Generating GIF frames...";
      },
      (p) => {
        const pct = `${Math.round(p * 100)}%`;
        $exportBtn.innerText = `Encoding ${pct}`;
        $infoLabel.innerText = `Processing: ${pct}`;
      },
      (blob, endTime) => {
        lastExportBlob = blob;
        const timeSec = ((endTime - exportStartTime) / 1000).toFixed(2);
        const sizeKb = (blob.size / 1024).toFixed(1);

        $exportBtn.disabled = false;
        $exportBtn.innerText = "export";
        $infoLabel.innerText = `Ready! ${timeSec}s • ${sizeKb} KB`;

        const blobUrl = URL.createObjectURL(blob);
        $resultImg.src = blobUrl;
        $resultImg.style.display = "block";

        if ($btnDownload) $btnDownload.style.display = "inline-flex";
        if ($btnCopy) $btnCopy.style.display = "inline-flex";
      }
    );

    $exportBtn.addEventListener("click", () => gifRenderer.render());

    if ($btnDownload) {
      $btnDownload.addEventListener("click", () => {
        if (!lastExportBlob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(lastExportBlob);
        a.download = "petpet.gif";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }

    if ($btnCopy) {
      $btnCopy.addEventListener("click", async () => {
        if (!lastExportBlob) return;
        try {
          // Attempt clipboard write for gif / png
          await navigator.clipboard.write([
            new ClipboardItem({ [lastExportBlob.type]: lastExportBlob }),
          ]);
          $infoLabel.innerText = "Copied GIF to clipboard! ✨";
        } catch (err) {
          $infoLabel.innerText = "Clipboard image copy not supported in this browser. Use Download instead!";
        }
      });
    }

    // Title badge spring wobble click
    const $titleBadge = $("#titleBadge");
    if ($titleBadge) {
      $titleBadge.addEventListener("click", () => {
        $titleBadge.classList.remove("is-wobbling");
        void $titleBadge.offsetWidth;
        $titleBadge.classList.add("is-wobbling");
      });
    }

    // THEME TOGGLE: Blorbo Doodle vs Modern Cyber Dark
    const $themeBtn = $("#themeToggle");
    const $themeToggleText = $("#themeToggleText");
    const $themeToggleIcon = $("#themeToggleIcon");

    if ($themeBtn) {
      const getStoredTheme = () => {
        return localStorage.getItem("petpet_theme_mode") || "blorbo";
      };

      const setTheme = (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        if (theme === "modern") {
          if ($themeToggleText) $themeToggleText.innerText = "Blorbo Theme";
          if ($themeToggleIcon) $themeToggleIcon.innerText = "🎨";
        } else {
          if ($themeToggleText) $themeToggleText.innerText = "Cyber Dark";
          if ($themeToggleIcon) $themeToggleIcon.innerText = "⚡";
        }
        localStorage.setItem("petpet_theme_mode", theme);
      };

      setTheme(getStoredTheme());

      $themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        setTheme(current === "modern" ? "blorbo" : "modern");
      });
    }

    // Start playback once loaded
    window.addEventListener("load", () => {
      animation.play();
    });

    // Expose for user debugging & fun
    window.petpet = {
      g,
      DEFAULTS,
      animation,
      gifRenderer,
      PRESETS,
    };
  });
})();

