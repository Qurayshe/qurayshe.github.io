/**
 * Independent 3D Floating Computer Scene (Retro PC Workstation & Windows XP CRT)
 * Faithful recreation of the original retro PC scene from hero-scene.js:
 *  - Full authentic Windows XP Luna & IE6 site theming (qurayshe.xd)
 *  - Working window controls (minimize, maximize, restore, close, drag, double-click maximize)
 *  - Full CRT filter (scanlines, phosphor aperture mask, vignette, tube glare, cathode beam roll)
 *  - Authentic retro pixellization via pixelRatioScale (0.52) & chromatic aberration post-processing
 *  - Floating in page space with no desk, no container background, and clean unshadowed lighting
 */

export class ComputerScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this.clock = new THREE.Clock();
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // PC Group & CRT Screen
    this.pcGroup = null;
    this.screenMesh = null;
    this.screenCanvas = null;
    this.screenCtx = null;
    this.screenTexture = null;
    this.screenPointer = { x: -1, y: -1, active: false };
    this.retroButtonsList = [];
    this.retroButtonImages = {};
    this.renderedButtons = [];
    this.renderedNavLinks = [];
    this.websiteScrollY = 0;
    this.blissImg = null;
    this.pixelRatioScale = 0.52;
    this.startMenuOpen = false;
    this.activePopup = null;
    this.audioCtx = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Window Management & State
    this.winState = 'normal'; // 'normal', 'maximized', 'minimized'
    this.winRect = { x: 75, y: 35, w: 874, h: 660 };
    this.winNormalRect = { x: 75, y: 35, w: 874, h: 660 };
    this.winIsDragging = false;
    this.winDragOffset = { x: 0, y: 0 };
    this.lastTitleClick = 0;

    this.onResize = this.onResize.bind(this);

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 550;
    const height = this.container.clientHeight || 580;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0.6, 15.5);

    // 2. Renderer with retro pixelization effect & alpha transparency
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr * this.pixelRatioScale);
    this.renderer.setClearColor(0x000000, 0); // 100% transparent
    this.renderer.shadowMap.enabled = false; // No shadows
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.domElement.style.imageRendering = 'pixelated';

    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.appendChild(this.renderer.domElement);

    // 2b. Chromatic Aberration Post-Processing Setup
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.chromaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uAmount: { value: 0.0035 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uAmount;
        varying vec2 vUv;
        void main() {
          vec2 dir = vUv - vec2(0.5);
          float dist = length(dir);
          vec2 offset = dir * (dist * uAmount * 2.2);
          float r = texture2D(tDiffuse, vUv + offset).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv - offset).b;
          float a = texture2D(tDiffuse, vUv).a;
          gl_FragColor = vec4(r, g, b, a);
        }
      `,
      depthTest: false,
      depthWrite: false
    });
    const postGeo = new THREE.PlaneGeometry(2, 2);
    this.postQuad = new THREE.Mesh(postGeo, this.chromaMaterial);
    this.postScene.add(this.postQuad);

    const rw = Math.round(width * dpr * this.pixelRatioScale);
    const rh = Math.round(height * dpr * this.pixelRatioScale);
    this.renderTarget = new THREE.WebGLRenderTarget(rw, rh, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat
    });

    // 3. Clean neutral illumination (No dark moody lighting, no shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
    dirLight.position.set(5, 12, 10);
    this.scene.add(dirLight);

    // 4. Build Retro PC Workstation Meshes (Floating, no desk)
    this.pcGroup = new THREE.Group();
    this.scene.add(this.pcGroup);

    this.buildRetroPCScene();

    // 5. Events & Render Loop
    this.bindEvents();
    this.animate();
  }

  buildRetroPCScene() {
    // 1. Offscreen 1024x768 High-Res CRT Screen Canvas & Texture
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 1024;
    this.screenCanvas.height = 768;
    this.screenCtx = this.screenCanvas.getContext('2d');
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;

    // Curated Retro 88x31 Badges from assets/oldschoolbuttons
    this.retroButtonsList = [
      { file: 'xp.gif', title: 'Windows XP Forever' },
      { file: 'opengl.gif', title: 'OpenGL Accelerated' },
      { file: 'blender.gif', title: 'Blender 3D Suite' },
      { file: 'imissxp.gif', title: 'I Miss Windows XP' },
      { file: 'got_html.gif', title: 'Got HTML?' },
      { file: 'gnu-linux.gif', title: 'GNU / Linux Powered' },
      { file: 'notepadpp.gif', title: 'Notepad++ Hand-Coded' },
      { file: 'steam.gif', title: 'Powered by Steam' },
      { file: 'winzip8a.gif', title: 'WinZip 8.0 Archive' },
      { file: 'windowsme.png', title: 'Windows Millennium' },
      { file: 'ieexpecter.gif', title: 'Best in IE 6.0' },
      { file: 'linux_mint.gif', title: 'Linux Mint Desktop' },
      { file: 'miku.gif', title: 'Hatsune Miku' },
      { file: 'hl.gif', title: 'Half-Life Lambda' },
      { file: 'djluigi.png', title: 'DJ Luigi Beats' },
      { file: 'gmail.gif', title: 'Google Mail 2004' },
      { file: 'gplv3.gif', title: 'GPL v3 Free Software' },
      { file: 'doomrl.gif', title: 'Doom Roguelike' },
      { file: 'internet-roadkill.gif', title: 'Internet Roadkill' },
      { file: 'noframes2.gif', title: 'No HTML Frames' },
      { file: 'nokia64.gif', title: 'Nokia 3310 Mobile' },
      { file: 'halflifethree.png', title: 'Half-Life 3 Confirmed' },
      { file: 'korbywo.gif', title: 'Kirby Dream Land' },
      { file: 'wizardb.gif', title: 'Master Web Wizard' },
      { file: 'clubnintendoarchives.gif', title: 'Club Nintendo Archives' },
      { file: 'giantrat.png', title: 'The Giant Rat' },
      { file: 'ilikecomputer.png', title: 'I Like Computer' },
      { file: 'crescendo.gif', title: 'MIDI Crescendo' }
    ];

    this.retroButtonImages = {};
    this.retroButtonsList.forEach((btn) => {
      const img = new Image();
      img.src = `assets/oldschoolbuttons/${btn.file}`;
      this.retroButtonImages[btn.file] = img;
      img.onload = () => {
        if (this.screenTexture) this.screenTexture.needsUpdate = true;
      };
    });

    // Load Super-Compressed JPEG Bliss Wallpaper
    this.loadBlissWallpaper();

    // Materials
    const casingMat = new THREE.MeshStandardMaterial({ color: 0xd6d0be, roughness: 0.58, metalness: 0.08 });
    const casingDarkMat = new THREE.MeshStandardMaterial({ color: 0xb5ae9c, roughness: 0.68, metalness: 0.08 });
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0xe0dac9, roughness: 0.52, metalness: 0.06 });
    const bezelInnerMat = new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.35 });
    const screenMat = new THREE.MeshBasicMaterial({ map: this.screenTexture });
    const keycapMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.45, metalness: 0.05 });
    const darkKeyMat = new THREE.MeshStandardMaterial({ color: 0xbaa492, roughness: 0.55, metalness: 0.08 });
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x130f1c, roughness: 0.88, metalness: 0.1 });

    // 2. Monitor Assembly
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(0, 0.4, 0);

    // CRT Housing Main Body
    const caseGeo = new THREE.BoxGeometry(11.2, 8.6, 6.5);
    const caseMesh = new THREE.Mesh(caseGeo, casingMat);
    caseMesh.position.set(0, 1.2, -1.0);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    monitorGroup.add(caseMesh);

    // CRT Rear Taper Tube
    const backGeo = new THREE.BoxGeometry(8.5, 6.8, 4.0);
    const backMesh = new THREE.Mesh(backGeo, casingDarkMat);
    backMesh.position.set(0, 1.2, -5.0);
    backMesh.castShadow = true;
    monitorGroup.add(backMesh);

    // Front Outer Bezel Frame
    const frontBezelGeo = new THREE.BoxGeometry(11.4, 8.8, 0.8);
    const frontBezelMesh = new THREE.Mesh(frontBezelGeo, bezelMat);
    frontBezelMesh.position.set(0, 1.2, 2.4);
    frontBezelMesh.castShadow = true;
    frontBezelMesh.receiveShadow = true;
    monitorGroup.add(frontBezelMesh);

    // Inner Recessed Dark Screen Border
    const innerBorderGeo = new THREE.BoxGeometry(9.6, 7.35, 0.4);
    const innerBorderMesh = new THREE.Mesh(innerBorderGeo, bezelInnerMat);
    innerBorderMesh.position.set(0, 1.2, 2.7);
    innerBorderMesh.receiveShadow = true;
    monitorGroup.add(innerBorderMesh);

    // CRT Screen Glass Quad with Physical Convex Curvature (Interactive Raycast Surface)
    const screenGeo = new THREE.PlaneGeometry(9.2, 6.9, 24, 24);
    const pos = screenGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const nx = px / 4.6;
      const ny = py / 3.45;
      const distSq = nx * nx + ny * ny;
      const zBulge = Math.max(0, 0.16 * (1 - distSq * 0.7));
      pos.setZ(i, zBulge);
    }
    screenGeo.computeVertexNormals();

    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.screenMesh.position.set(0, 1.2, 2.92);
    this.screenMesh.receiveShadow = true;
    this.screenMesh.name = 'crt-screen';
    monitorGroup.add(this.screenMesh);

    // Power Button & Green LED (Centered cleanly on bottom chin bezel, well below display)
    const btnGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.2, 16);
    btnGeo.rotateX(Math.PI / 2);
    const pwrBtn = new THREE.Mesh(btnGeo, darkKeyMat);
    pwrBtn.position.set(4.0, -2.75, 2.92);
    monitorGroup.add(pwrBtn);

    const ledGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
    ledGeo.rotateX(Math.PI / 2);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const pwrLed = new THREE.Mesh(ledGeo, ledMat);
    pwrLed.position.set(4.55, -2.75, 2.92);
    monitorGroup.add(pwrLed);

    // Monitor Brand Badge with crisp embossed "qurayshe" label
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 512;
    badgeCanvas.height = 128;
    const bCtx = badgeCanvas.getContext('2d');
    const bGrad = bCtx.createLinearGradient(0, 0, 0, 128);
    bGrad.addColorStop(0, '#151020');
    bGrad.addColorStop(0.5, '#2c223a');
    bGrad.addColorStop(1, '#0e0b16');
    bCtx.fillStyle = bGrad;
    bCtx.fillRect(0, 0, 512, 128);

    bCtx.strokeStyle = '#524368';
    bCtx.lineWidth = 6;
    bCtx.strokeRect(6, 6, 500, 116);

    bCtx.font = 'bold italic 66px "Segoe UI", Tahoma, sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    bCtx.fillText('qurayshe', 258, 67); // Soft drop shadow
    bCtx.fillStyle = '#f1f5f9';
    bCtx.fillText('qurayshe', 256, 64);

    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    badgeTexture.minFilter = THREE.LinearFilter;
    badgeTexture.magFilter = THREE.LinearFilter;

    const badgeGeo = new THREE.BoxGeometry(1.6, 0.38, 0.12);
    const badgeMat = new THREE.MeshStandardMaterial({
      map: badgeTexture,
      roughness: 0.35,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, -2.75, 2.88);
    monitorGroup.add(badge);

    // Monitor Stand Neck & Base
    const neckGeo = new THREE.CylinderGeometry(0.9, 1.15, 1.4, 16);
    const neck = new THREE.Mesh(neckGeo, casingDarkMat);
    neck.position.set(0, -3.2, 0.2);
    monitorGroup.add(neck);

    const baseGeo = new THREE.CylinderGeometry(3.4, 3.8, 0.45, 24);
    const basePlate = new THREE.Mesh(baseGeo, bezelMat);
    basePlate.position.set(0, -3.9, 0.2);
    monitorGroup.add(basePlate);

    this.pcGroup.add(monitorGroup);

    // 3. Realistic 104-Key ANSI Keyboard (Shifted left to x = -2.6 so mouse is clearly visible)
    const kbGroup = new THREE.Group();
    kbGroup.position.set(-2.6, -3.8, 6.4);
    kbGroup.rotation.x = -0.12;

    const kbBaseGeo = new THREE.BoxGeometry(14.8, 0.55, 4.6);
    const kbBase = new THREE.Mesh(kbBaseGeo, bezelMat);
    kbBase.castShadow = true;
    kbBase.receiveShadow = true;
    kbGroup.add(kbBase);

    const kbWellGeo = new THREE.BoxGeometry(14.3, 0.15, 4.1);
    const kbWell = new THREE.Mesh(kbWellGeo, casingDarkMat);
    kbWell.position.set(0, 0.25, 0);
    kbWell.receiveShadow = true;
    kbGroup.add(kbWell);

    const keyH = 0.22;
    const addKey = (x, z, w, d, mat = keycapMat) => {
      const g = new THREE.BoxGeometry(w, keyH, d);
      const m = new THREE.Mesh(g, mat);
      m.position.set(x, 0.38, z);
      m.castShadow = true;
      m.receiveShadow = true;
      kbGroup.add(m);
      return m;
    };

    // Row positions (Z coordinates from top to bottom)
    const zFRow   = -1.65;
    const zNumRow = -1.05;
    const zTabRow = -0.48;
    const zCapRow =  0.08;
    const zSftRow =  0.64;
    const zModRow =  1.20;

    // --- SECTION 1: ALPHANUMERIC CLUSTER (Left: x from ~ -6.5 to -0.6) ---
    // Function Row (Esc + F1-F12)
    addKey(-6.4, zFRow, 0.46, 0.42, darkKeyMat); // Esc
    // F1-F4
    [-5.6, -5.05, -4.5, -3.95].forEach((kx) => addKey(kx, zFRow, 0.46, 0.42, darkKeyMat));
    // F5-F8
    [-3.25, -2.7, -2.15, -1.6].forEach((kx) => addKey(kx, zFRow, 0.46, 0.42, darkKeyMat));
    // F9-F12
    [-0.9, -0.35, 0.2, 0.75].forEach((kx) => addKey(kx, zFRow, 0.46, 0.42, darkKeyMat));

    // Number Row (~, 1..0, -, =, Backspace)
    let nx = -6.4;
    const stdW = 0.46;
    const stdD = 0.46;
    for (let i = 0; i < 13; i++) {
      addKey(nx, zNumRow, stdW, stdD);
      nx += 0.52;
    }
    addKey(nx + 0.22, zNumRow, 0.95, stdD, darkKeyMat); // Backspace

    // Tab Row (Tab, Q..P, [, ], \)
    addKey(-6.28, zTabRow, 0.70, stdD, darkKeyMat); // Tab
    let tx = -5.58;
    for (let i = 0; i < 12; i++) {
      addKey(tx, zTabRow, stdW, stdD);
      tx += 0.52;
    }
    addKey(tx + 0.12, zTabRow, 0.75, stdD, darkKeyMat); // Backslash

    // Caps Row (CapsLock, A..L, ;, ', Enter)
    addKey(-6.23, zCapRow, 0.80, stdD, darkKeyMat); // CapsLock
    let ax = -5.46;
    for (let i = 0; i < 11; i++) {
      addKey(ax, zCapRow, stdW, stdD);
      ax += 0.52;
    }
    addKey(ax + 0.28, zCapRow, 1.08, stdD, darkKeyMat); // Enter

    // Shift Row (LShift, Z..M, ,, ., /, RShift)
    addKey(-6.13, zSftRow, 1.00, stdD, darkKeyMat); // LShift
    let sx = -5.24;
    for (let i = 0; i < 10; i++) {
      addKey(sx, zSftRow, stdW, stdD);
      sx += 0.52;
    }
    addKey(sx + 0.38, zSftRow, 1.30, stdD, darkKeyMat); // RShift

    // Bottom Row (Ctrl, Win, Alt, Space, Alt, Win, Menu, Ctrl)
    addKey(-6.32, zModRow, 0.62, stdD, darkKeyMat); // LCtrl
    addKey(-5.62, zModRow, 0.55, stdD, darkKeyMat); // LWin
    addKey(-4.95, zModRow, 0.60, stdD, darkKeyMat); // LAlt
    addKey(-2.70, zModRow, 3.40, stdD, keycapMat);  // Spacebar
    addKey(-0.45, zModRow, 0.60, stdD, darkKeyMat); // RAlt
    addKey( 0.22, zModRow, 0.55, stdD, darkKeyMat); // RWin
    addKey( 0.85, zModRow, 0.62, stdD, darkKeyMat); // RCtrl

    // --- SECTION 2: NAVIGATION & ARROW CLUSTER (Middle: x from 1.6 to 2.8) ---
    // Top Row: PrtSc, ScrLk, Pause
    addKey(1.65, zFRow, stdW, 0.42, darkKeyMat);
    addKey(2.20, zFRow, stdW, 0.42, darkKeyMat);
    addKey(2.75, zFRow, stdW, 0.42, darkKeyMat);

    // 3x2 Navigation Cluster: Ins, Home, PgUp / Del, End, PgDn
    addKey(1.65, zNumRow, stdW, stdD, darkKeyMat);
    addKey(2.20, zNumRow, stdW, stdD, darkKeyMat);
    addKey(2.75, zNumRow, stdW, stdD, darkKeyMat);

    addKey(1.65, zTabRow, stdW, stdD, darkKeyMat);
    addKey(2.20, zTabRow, stdW, stdD, darkKeyMat);
    addKey(2.75, zTabRow, stdW, stdD, darkKeyMat);

    // Arrow Keys (T-Inverted layout)
    addKey(2.20, zSftRow, stdW, stdD, darkKeyMat); // Up
    addKey(1.65, zModRow, stdW, stdD, darkKeyMat); // Left
    addKey(2.20, zModRow, stdW, stdD, darkKeyMat); // Down
    addKey(2.75, zModRow, stdW, stdD, darkKeyMat); // Right

    // --- SECTION 3: NUMERIC KEYPAD CLUSTER (Right: x from 3.7 to 5.8) ---
    // Numpad Row 1: NumLock, /, *, -
    addKey(3.70, zNumRow, stdW, stdD, darkKeyMat);
    addKey(4.25, zNumRow, stdW, stdD, darkKeyMat);
    addKey(4.80, zNumRow, stdW, stdD, darkKeyMat);
    addKey(5.35, zNumRow, stdW, stdD, darkKeyMat);

    // Numpad Row 2: 7, 8, 9, + (tall)
    addKey(3.70, zTabRow, stdW, stdD);
    addKey(4.25, zTabRow, stdW, stdD);
    addKey(4.80, zTabRow, stdW, stdD);
    addKey(5.35, (zTabRow + zCapRow) / 2, stdW, 1.02, darkKeyMat); // Numpad +

    // Numpad Row 3: 4, 5, 6
    addKey(3.70, zCapRow, stdW, stdD);
    addKey(4.25, zCapRow, stdW, stdD);
    addKey(4.80, zCapRow, stdW, stdD);

    // Numpad Row 4: 1, 2, 3, Enter (tall)
    addKey(3.70, zSftRow, stdW, stdD);
    addKey(4.25, zSftRow, stdW, stdD);
    addKey(4.80, zSftRow, stdW, stdD);
    addKey(5.35, (zSftRow + zModRow) / 2, stdW, 1.02, darkKeyMat); // Numpad Enter

    // Numpad Row 5: 0 (wide), .
    addKey(3.97, zModRow, 1.02, stdD); // Numpad 0
    addKey(4.80, zModRow, stdW, stdD); // Numpad .

    this.pcGroup.add(kbGroup);

    // 4. Retro Mouse (Shifted to x = 5.8 to remain fully in view alongside the keyboard)
    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(5.8, -3.8, 6.4);
    mouseGroup.rotation.y = -0.05;

    const mouseGeo = new THREE.BoxGeometry(1.6, 0.6, 2.5);
    const mouseMesh = new THREE.Mesh(mouseGeo, bezelMat);
    mouseMesh.castShadow = true;
    mouseMesh.receiveShadow = true;
    mouseGroup.add(mouseMesh);

    // Mouse button split & wheel flipped towards -Z (pointing at monitor/computer)
    const splitGeo = new THREE.BoxGeometry(0.04, 0.1, 1.1);
    const splitMesh = new THREE.Mesh(splitGeo, casingDarkMat);
    splitMesh.position.set(0, 0.3, -0.6);
    mouseGroup.add(splitMesh);

    const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMesh = new THREE.Mesh(wheelGeo, bezelInnerMat);
    wheelMesh.position.set(0, 0.32, -0.4);
    mouseGroup.add(wheelMesh);

    this.pcGroup.add(mouseGroup);

    this.pcGroup.add(mouseGroup);

    // Initial Screen Draw
    this.renderRetroScreen();
  }

  drawRoundRect(ctx, x, y, w, h, r) {
    let rTopLeft = 0, rTopRight = 0, rBottomRight = 0, rBottomLeft = 0;
    if (typeof r === 'number') {
      rTopLeft = rTopRight = rBottomRight = rBottomLeft = r;
    } else if (Array.isArray(r)) {
      rTopLeft = r[0] || 0;
      rTopRight = r[1] || 0;
      rBottomRight = r[2] || 0;
      rBottomLeft = r[3] || 0;
    }
    ctx.beginPath();
    ctx.moveTo(x + rTopLeft, y);
    ctx.lineTo(x + w - rTopRight, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rTopRight);
    ctx.lineTo(x + w, y + h - rBottomRight);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rBottomRight, y + h);
    ctx.lineTo(x + rBottomLeft, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rBottomLeft);
    ctx.lineTo(x, y + rTopLeft);
    ctx.quadraticCurveTo(x, y, x + rTopLeft, y);
    ctx.closePath();
  }


  loadBlissWallpaper() {
    this.blissImg = null;
    const raw = new Image();
    raw.src = 'assets/img/ogbliss.webp';
    raw.onload = () => {
      try {
        // Downscale to 320x240 and compress to 0.05 JPEG quality for heavy 8x8 DCT compression artifacts
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 320;
        offCanvas.height = 240;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(raw, 0, 0, 320, 240);

        const lowJpgUrl = offCanvas.toDataURL('image/jpeg', 0.05);
        const compImg = new Image();
        compImg.onload = () => {
          this.blissImg = compImg;
          this.renderRetroScreen();
          if (this.screenTexture) this.screenTexture.needsUpdate = true;
        };
        compImg.src = lowJpgUrl;
      } catch (e) {
        this.blissImg = raw;
        this.renderRetroScreen();
        if (this.screenTexture) this.screenTexture.needsUpdate = true;
      }
    };
  }


  /* --------------------------------------------------------------------------
     RETRO SCREEN CANVAS RENDERER: AUTHENTIC WINDOWS XP LUNA & IE (qurayshe.xd)
     -------------------------------------------------------------------------- */
  renderRetroScreen() {
    const ctx = this.screenCtx;
    if (!ctx) return;
    const W = 1024;
    const H = 768;

    // 1. Classic Windows XP Bliss (Super Super Compressed JPEG)
    if (this.blissImg && this.blissImg.complete && this.blissImg.naturalWidth > 0) {
      ctx.save();
      // Render without smoothing so authentic 8x8 DCT quantization blocks are sharp and visible
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.blissImg, 0, 0, W, H);
      ctx.restore();
    } else {
      // Clean sky/green hill fallback while image finishes loading
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 520);
      skyGrad.addColorStop(0, '#1664d8');
      skyGrad.addColorStop(0.35, '#3a8cf0');
      skyGrad.addColorStop(0.8, '#7cbaf8');
      skyGrad.addColorStop(1, '#a2d2fa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      const hillGrad = ctx.createLinearGradient(0, 440, 0, 730);
      hillGrad.addColorStop(0, '#78cb28');
      hillGrad.addColorStop(0.4, '#48aa1c');
      hillGrad.addColorStop(1, '#1e6812');
      ctx.fillStyle = hillGrad;
      ctx.beginPath();
      ctx.moveTo(0, 500);
      ctx.quadraticCurveTo(510, 415, W, 480);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.fill();
    }

    // 2. Desktop Icons (Left side - Image 3)
    const desktopIcons = [
      { sym: '🌐', name: 'Internet Explorer', id: 'ie' },
      { sym: '💻', name: 'My Computer', id: 'computer' },
      { sym: '📁', name: 'My Documents', id: 'docs' },
      { sym: '🗑️', name: 'Recycle Bin', id: 'recycle' }
    ];

    desktopIcons.forEach((di, idx) => {
      const dix = 44;
      const diy = 26 + idx * 82;
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(di.sym, dix, diy + 25);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillText(di.name, dix + 1, diy + 45);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(di.name, dix, diy + 44);
    });

    // 3. Authentic Windows XP Luna Taskbar (y = 730 to 768)
    const tbY = 730;
    const tbH = 38;

    const tbGrad = ctx.createLinearGradient(0, tbY, 0, H);
    tbGrad.addColorStop(0, '#1f5fcb');
    tbGrad.addColorStop(0.18, '#2b72e5');
    tbGrad.addColorStop(1, '#1b52b3');
    ctx.fillStyle = tbGrad;
    ctx.fillRect(0, tbY, W, tbH);

    ctx.fillStyle = '#3882f2';
    ctx.fillRect(0, tbY, W, 1);

    // Green Curved Start Button (Classic Windows XP Luna)
    const startGrad = ctx.createLinearGradient(0, tbY, 0, H);
    startGrad.addColorStop(0, '#388e3c');
    startGrad.addColorStop(0.2, '#66bb6a');
    startGrad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = startGrad;
    ctx.beginPath();
    ctx.moveTo(0, tbY);
    ctx.lineTo(108, tbY);
    ctx.quadraticCurveTo(120, 749, 108, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Start Button Bevel Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, tbY + 1);
    ctx.lineTo(107, tbY + 1);
    ctx.quadraticCurveTo(119, 749, 107, H - 1);
    ctx.stroke();

    // Windows Flag 4 colors
    ctx.fillStyle = '#ef4444'; ctx.fillRect(16, 742, 6, 6);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(24, 742, 6, 6);
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(16, 750, 6, 6);
    ctx.fillStyle = '#eab308'; ctx.fillRect(24, 750, 6, 6);

    ctx.font = 'bold italic 18px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText('start', 36, 755);
    ctx.shadowBlur = 0;

    // Quick Launch Icons
    ctx.font = '14px sans-serif';
    ctx.fillText('🖥️ 🌐', 125, 754);

    // Running Window Tab in Taskbar
    const tabX = 168;
    const tabY = 734;
    const tabW = 230;
    const tabH = 30;

    if (this.winState !== 'minimized') {
      // Active Tab (Inset darker Luna blue)
      ctx.fillStyle = '#1446a8';
      ctx.fillRect(tabX, tabY, tabW, tabH);
      ctx.strokeStyle = '#0e358b';
      ctx.strokeRect(tabX, tabY, tabW, tabH);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(tabX + 1, tabY + 1, tabW - 2, 2);
    } else {
      // Inactive / Minimized Tab (Raised lighter blue)
      ctx.fillStyle = '#2365d9';
      ctx.fillRect(tabX, tabY, tabW, tabH);
      ctx.strokeStyle = '#4b8cfc';
      ctx.strokeRect(tabX, tabY, tabW, tabH);
    }

    ctx.font = '14px sans-serif';
    ctx.fillText('🌐', tabX + 8, tabY + 20);
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('qurayshe.xd - Microsoft...', tabX + 28, tabY + 19);

    // System Tray (Right - Image 3)
    const trayGrad = ctx.createLinearGradient(0, tbY, 0, H);
    trayGrad.addColorStop(0, '#0e358b');
    trayGrad.addColorStop(1, '#1444ab');
    ctx.fillStyle = trayGrad;
    ctx.fillRect(880, tbY, 144, tbH);
    ctx.strokeStyle = '#092566';
    ctx.strokeRect(880, tbY, 144, tbH);

    ctx.font = '12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('🔊 🛡️ 15:34', 1012, 754);

    // 4. The Internet Explorer Window (labeled "qurayshe.xd")
    if (this.winState !== 'minimized') {
      const isMax = (this.winState === 'maximized');
      const wx = isMax ? 0 : this.winRect.x;
      const wy = isMax ? 0 : this.winRect.y;
      const ww = isMax ? W : this.winRect.w;
      const wh = isMax ? 730 : this.winRect.h;

      // Soft window drop shadow (only when floating)
      if (!isMax) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#0050e6';
        this.drawRoundRect(ctx, wx, wy, ww, wh, [6, 6, 0, 0]);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      this.drawRoundRect(ctx, wx, wy, ww, wh, isMax ? 0 : [6, 6, 0, 0]);
      ctx.clip();

      // Outer 3px Luna Blue Window Frame Border
      ctx.fillStyle = '#0050e6';
      ctx.fillRect(wx, wy, ww, wh);

      // 4a. Titlebar (Luna Blue with Windows XP control buttons - Image 4)
      const titleH = 30;
      const tbWGrad = ctx.createLinearGradient(0, wy, 0, wy + titleH);
      tbWGrad.addColorStop(0, '#0058ec');
      tbWGrad.addColorStop(0.35, '#3b88ff');
      tbWGrad.addColorStop(1, '#0047c8');
      ctx.fillStyle = tbWGrad;
      ctx.fillRect(wx + 2, wy + 2, ww - 4, titleH);

      // Top edge highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(wx + 2, wy + 2, ww - 4, 1);

      // Title Icon & Label
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🌐', wx + 8, wy + 21);

      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 2;
      ctx.fillText('qurayshe.xd - Microsoft Internet Explorer', wx + 28, wy + 20);
      ctx.shadowBlur = 0;

      // Top-Right Control Buttons (Image 4: Minimize, Maximize/Restore, Close)
      const btnY = wy + 5;
      const btnH = 21;
      const btnW = 21;
      const bxMin = wx + ww - 75;
      const bxMax = wx + ww - 51;
      const bxClose = wx + ww - 27;

      // 1. MINIMIZE BUTTON (_)
      const minGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
      minGrad.addColorStop(0, '#3878f0');
      minGrad.addColorStop(1, '#1b52c8');
      ctx.fillStyle = minGrad;
      this.drawRoundRect(ctx, bxMin, btnY, btnW, btnH, 3);
      ctx.fill();
      ctx.strokeStyle = '#7cb3fc';
      this.drawRoundRect(ctx, bxMin, btnY, btnW, btnH, 3);
      ctx.stroke();

      // White underline icon
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bxMin + 5, btnY + 14, 11, 2.5);

      // 2. MAXIMIZE / RESTORE BUTTON (Image 4)
      const maxGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
      maxGrad.addColorStop(0, '#3878f0');
      maxGrad.addColorStop(1, '#1b52c8');
      ctx.fillStyle = maxGrad;
      this.drawRoundRect(ctx, bxMax, btnY, btnW, btnH, 3);
      ctx.fill();
      ctx.strokeStyle = '#7cb3fc';
      this.drawRoundRect(ctx, bxMax, btnY, btnW, btnH, 3);
      ctx.stroke();

      if (!isMax) {
        // Normal Maximize Square Icon (Image 4)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(bxMax + 4.5, btnY + 4.5, 12, 11);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bxMax + 4.5, btnY + 4.5, 12, 2.8);
      } else {
        // Restore Overlapping Windows Icon (Image 4)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(bxMax + 7.5, btnY + 4.5, 8.5, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bxMax + 7.5, btnY + 4.5, 8.5, 2.2);
        ctx.strokeRect(bxMax + 4.5, btnY + 7.5, 8.5, 8);
        ctx.fillRect(bxMax + 4.5, btnY + 7.5, 8.5, 2.2);
      }

      // 3. CLOSE BUTTON (✕ - Crisp thick white X on red button, Image 4)
      const closeGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
      closeGrad.addColorStop(0, '#e84538');
      closeGrad.addColorStop(1, '#c5281b');
      ctx.fillStyle = closeGrad;
      this.drawRoundRect(ctx, bxClose, btnY, btnW + 1, btnH, 3);
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      this.drawRoundRect(ctx, bxClose, btnY, btnW + 1, btnH, 3);
      ctx.stroke();

      // Thick crisp white diagonal lines for X
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(bxClose + 6, btnY + 5.5); ctx.lineTo(bxClose + 16, btnY + 15.5);
      ctx.moveTo(bxClose + 16, btnY + 5.5); ctx.lineTo(bxClose + 6, btnY + 15.5);
      ctx.stroke();

      // 4b. Menu Bar (y = wy + 32, h = 24)
      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(wx + 2, wy + 32, ww - 4, 24);
      ctx.font = '11px Tahoma, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText('File    Edit    View    Favorites    Tools    Help', wx + 12, wy + 48);

      // 4c. Navigation Toolbar (Image 3 - Back, Forward, Stop, Refresh, Home, Search, Favorites)
      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(wx + 2, wy + 56, ww - 4, 34);
      ctx.strokeStyle = '#d0cdc0';
      ctx.beginPath();
      ctx.moveTo(wx + 2, wy + 56); ctx.lineTo(wx + ww - 2, wy + 56);
      ctx.stroke();

      // Big Circular Green Back Button (Image 3)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(wx + 20, wy + 73, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('←', wx + 20, wy + 77);

      ctx.font = '11px Tahoma, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'left';
      ctx.fillText('Back', wx + 36, wy + 77);
      ctx.fillText('→', wx + 70, wy + 77);
      ctx.fillText('✕ Stop    ↻ Refresh    ⌂ Home    |    ⚲ Search    ★ Favorites    |    ⎙ Print', wx + 92, wy + 77);

      // Windows animated flag logo in top right of toolbar (Image 3)
      ctx.fillStyle = '#ef4444'; ctx.fillRect(wx + ww - 28, wy + 62, 5, 5);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(wx + ww - 21, wy + 62, 5, 5);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(wx + ww - 28, wy + 69, 5, 5);
      ctx.fillStyle = '#eab308'; ctx.fillRect(wx + ww - 21, wy + 69, 5, 5);

      // 4d. Address Bar Row (Image 3)
      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(wx + 2, wy + 90, ww - 4, 28);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Tahoma, sans-serif';
      ctx.fillText('Address', wx + 12, wy + 108);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(wx + 64, wy + 94, ww - 130, 20);
      ctx.strokeStyle = '#7f9db9';
      ctx.strokeRect(wx + 64, wy + 94, ww - 130, 20);

      ctx.fillStyle = '#0f172a';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('http://qurayshe.xd', wx + 72, wy + 108);

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(wx + ww - 60, wy + 94, 52, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Go', wx + ww - 34, wy + 108);

      // 4e. Vintage HTML Web Client Area (qurayshe.xd)
      const cx = wx + 2;
      const cy = wy + 118;
      const cw = ww - 4;
      const ch = wh - 144; // Leaves 26px for status bar

      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cw, ch);
      ctx.clip();

      // Web Page Background: Crisp vintage paper white with subtle grid
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, cy, cw, ch);

      // Light background grid
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
      ctx.lineWidth = 1;
      for (let gx = cx; gx < cx + cw; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, cy); ctx.lineTo(gx, cy + ch); ctx.stroke();
      }
      for (let gy = cy; gy < cy + ch; gy += 40) {
        ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx + cw, gy); ctx.stroke();
      }

      // Scrolled Web Content
      const contentY = cy + 14 - this.websiteScrollY;

      // Extra short top header
      ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
      ctx.fillStyle = '#111111';
      ctx.textAlign = 'center';
      ctx.fillText('qurayshe.xd', cx + cw / 2, contentY + 22);

      // Old-School HTML Navigation Links (blue, underlined, separated by |)
      const navItems = ['Home', 'Projects', 'Lab', 'Links', 'Contact'];
      this.renderedNavLinks = [];
      ctx.font = '13px "Times New Roman", Georgia, serif';
      ctx.textAlign = 'left';

      const navMetrics = navItems.map((item) => ({
        text: item,
        w: ctx.measureText(item).width
      }));
      const sepText = ' | ';
      const sepW = ctx.measureText(sepText).width;
      const totalNavW = navMetrics.reduce((acc, m) => acc + m.w, 0) + (navItems.length - 1) * sepW;

      let curX = cx + (cw - totalNavW) / 2;
      const navY = contentY + 48;

      navItems.forEach((item, idx) => {
        const itemW = navMetrics[idx].w;
        const isHovered = (
          this.screenPointer.active &&
          this.screenPointer.x >= curX &&
          this.screenPointer.x <= curX + itemW &&
          this.screenPointer.y >= navY - 14 &&
          this.screenPointer.y <= navY + 4
        );

        this.renderedNavLinks.push({
          text: item,
          x: curX,
          y: navY - 14,
          w: itemW,
          h: 18,
          url: `http://qurayshe.xd/${item.toLowerCase()}`
        });

        // Classic HTML link: blue #0000ee, red #cc0000 when hovered
        ctx.fillStyle = isHovered ? '#cc0000' : '#0000ee';
        ctx.fillText(item, curX, navY);

        // Classic link underline
        ctx.strokeStyle = isHovered ? '#cc0000' : '#0000ee';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(curX, navY + 2);
        ctx.lineTo(curX + itemW, navY + 2);
        ctx.stroke();

        curX += itemW;
        if (idx < navItems.length - 1) {
          ctx.fillStyle = '#000000';
          ctx.fillText(sepText, curX, navY);
          curX += sepW;
        }
      });

      // Classic Beveled <hr> Horizontal Rule
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 30, contentY + 66);
      ctx.lineTo(cx + cw - 30, contentY + 66);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx + 30, contentY + 67);
      ctx.lineTo(cx + cw - 30, contentY + 67);
      ctx.stroke();

      // 28 Badges Grid (7 columns x 4 rows)
      const btnCols = 7;
      const badgeW = 88;
      const badgeH = 31;
      const gapX = 14;
      const gapY = 12;
      const gridTotalW = btnCols * badgeW + (btnCols - 1) * gapX;
      const startX = cx + (cw - gridTotalW) / 2;
      const startY = contentY + 82;

      this.renderedButtons = [];
      let hoveredBtn = null;

      for (let i = 0; i < this.retroButtonsList.length; i++) {
        const bInfo = this.retroButtonsList[i];
        const col = i % btnCols;
        const row = Math.floor(i / btnCols);
        const bx = startX + col * (badgeW + gapX);
        const by = startY + row * (badgeH + gapY);

        this.renderedButtons.push({ x: bx, y: by, w: badgeW, h: badgeH, btn: bInfo });

        const isHovered = (
          this.screenPointer.active &&
          this.screenPointer.x >= bx &&
          this.screenPointer.x <= bx + badgeW &&
          this.screenPointer.y >= by &&
          this.screenPointer.y <= by + badgeH
        );

        if (isHovered) {
          hoveredBtn = bInfo;
        }

        const img = this.retroButtonImages[bInfo.file];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, bx, by, badgeW, badgeH);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(bx, by, badgeW, badgeH);
          ctx.strokeStyle = '#c084fc';
          ctx.strokeRect(bx, by, badgeW, badgeH);
          ctx.font = 'bold 9px Tahoma, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(bInfo.title.slice(0, 12), bx + badgeW / 2, by + badgeH / 2 + 3);
        }

        // Authentic beveled badge border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.strokeRect(bx, by, badgeW, badgeH);

        if (isHovered) {
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx - 2, by - 2, badgeW + 4, badgeH + 4);
          ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
          ctx.fillRect(bx, by, badgeW, badgeH);
        }
      }

      // Footer notice
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('qurayshe.xd', cx + cw / 2, startY + 4 * (badgeH + gapY) + 24);

      ctx.restore(); // End clipping client area

      // Scrollbar on right edge
      const sbX = cx + cw - 16;
      const sbY = cy;
      const sbW = 16;
      const sbH = ch;

      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(sbX, sbY, sbW, sbH);
      ctx.strokeStyle = '#d0cdc0';
      ctx.strokeRect(sbX, sbY, sbW, sbH);

      const maxScroll = 340;
      const thumbH = 60;
      const thumbY = sbY + (this.websiteScrollY / maxScroll) * (sbH - thumbH);
      ctx.fillStyle = '#d4d0c8';
      ctx.fillRect(sbX + 1, thumbY, sbW - 2, thumbH);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(sbX + 1, thumbY, sbW - 2, thumbH);

      // 4f. Classic IE Status Bar (Image 3)
      const stY = wy + wh - 26;
      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(wx + 2, stY, ww - 4, 24);
      ctx.strokeStyle = '#d0cdc0';
      ctx.strokeRect(wx + 2, stY, ww - 4, 24);

      ctx.font = '11px Tahoma, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1e293b';

      if (hoveredBtn) {
        ctx.fillText(`Shortcut to http://qurayshe.xd/${hoveredBtn.file}`, wx + 12, stY + 16);
      } else {
        ctx.fillText('Done', wx + 12, stY + 16);
      }

      ctx.textAlign = 'right';
      ctx.fillText('Internet Zone | 100%', wx + ww - 14, stY + 16);

      ctx.restore(); // End clipping window
    }

    // 5. Interactive Luna Start Menu (If Open)
    if (this.startMenuOpen) {
      const smX = 0;
      const smY = 320;
      const smW = 340;
      const smH = 410;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffffff';
      this.drawRoundRect(ctx, smX, smY, smW, smH, [6, 6, 0, 0]);
      ctx.fill();
      ctx.restore();

      ctx.save();
      this.drawRoundRect(ctx, smX, smY, smW, smH, [6, 6, 0, 0]);
      ctx.clip();

      // Start Menu Header
      const smHGrad = ctx.createLinearGradient(0, smY, smW, smY);
      smHGrad.addColorStop(0, '#1955b5');
      smHGrad.addColorStop(1, '#3884e9');
      ctx.fillStyle = smHGrad;
      ctx.fillRect(smX, smY, smW, 54);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(smX + 32, smY + 28, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', smX + 32, smY + 34);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Tahoma, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('qurayshe @ qurayshe.xd', smX + 60, smY + 34);

      // White Left Panel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(smX, smY + 54, 180, smH - 96);
      const leftItems = ['🌐 Internet Explorer', '📝 Notepad', '💻 Terminal Lab', '🎮 Vulkan 3D Lab', '💣 Minesweeper'];
      ctx.font = '12px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      leftItems.forEach((it, i) => {
        ctx.fillText(it, smX + 10, smY + 84 + i * 40);
      });

      // Blue Right Panel
      ctx.fillStyle = '#d3e5fa';
      ctx.fillRect(smX, smY + 54, smW - 180, smH - 96);
      const rightItems = ['📁 My Documents', '💻 My Computer', '⚙️ Control Panel', '🔍 Search', '▶ Run...'];
      ctx.fillStyle = '#1e3a8a';
      rightItems.forEach((it, i) => {
        ctx.fillText(it, smX + 192, smY + 84 + i * 40);
      });

      // Bottom Bar
      ctx.fillStyle = '#1e57c8';
      ctx.fillRect(smX, smY + smH - 42, smW, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillText('🔑 Log Off      ⏻ Turn Off Computer', smX + 20, smY + smH - 16);

      ctx.restore();
    }

    // 6. Interactive XP Alert Dialog (If Triggered)
    if (this.activePopup) {
      const pw = 420;
      const ph = 180;
      const px = (W - pw) / 2;
      const py = (H - ph) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ece9d8';
      this.drawRoundRect(ctx, px, py, pw, ph, 4);
      ctx.fill();
      ctx.restore();

      ctx.save();
      this.drawRoundRect(ctx, px, py, pw, ph, 4);
      ctx.clip();

      const dlgTbGrad = ctx.createLinearGradient(0, py, 0, py + 26);
      dlgTbGrad.addColorStop(0, '#0055ea');
      dlgTbGrad.addColorStop(1, '#3b88ff');
      ctx.fillStyle = dlgTbGrad;
      ctx.fillRect(px, py, pw, 26);

      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(this.activePopup.title || 'xplinux - System Notice', px + 10, py + 18);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px + pw - 22, py + 4, 18, 18);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('✕', px + pw - 13, py + 17);

      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(px, py + 26, pw, ph - 26);

      ctx.font = '28px sans-serif';
      ctx.fillText('ℹ️', px + 36, py + 80);

      ctx.font = '12px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';

      const lines = this.activePopup.message.split('\n');
      lines.forEach((ln, lidx) => {
        ctx.fillText(ln, px + 70, py + 68 + lidx * 20);
      });

      const okW = 80;
      const okH = 26;
      const okX = px + (pw - okW) / 2;
      const okY = py + ph - 42;

      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(okX, okY, okW, okH);
      ctx.strokeStyle = '#0055ea';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(okX, okY, okW, okH);

      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText('OK', okX + okW / 2, okY + 17);
      ctx.restore();
    }

    // 7. Windows XP Virtual Mouse Pointer
    if (this.screenPointer.active) {
      const mx = this.screenPointer.x;
      const my = this.screenPointer.y;

      const isMax = (this.winState === 'maximized');
      const wx = isMax ? 0 : this.winRect.x;
      const wy = isMax ? 0 : this.winRect.y;
      const ww = isMax ? W : this.winRect.w;

      ctx.save();
      const isHoveringControls = (
        this.startMenuOpen ||
        my >= 730 ||
        (this.winState !== 'minimized' && my >= wy && my <= wy + 30 && mx >= wx + ww - 80) ||
        (this.winState !== 'minimized' && my >= wy + 90 && my <= wy + 118) ||
        (mx <= 90 && my <= 360) ||
        (this.renderedNavLinks && this.renderedNavLinks.some((l) => mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h)) ||
        (this.renderedButtons && this.renderedButtons.some((b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h))
      );

      if (isHoveringControls) {
        // Pointing Hand Cursor
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('👆', mx - 4, my + 14);
      } else {
        // Classic White Windows Arrow Cursor
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(mx + 2, my + 2);
        ctx.lineTo(mx + 2, my + 18);
        ctx.lineTo(mx + 6, my + 14);
        ctx.lineTo(mx + 11, my + 21);
        ctx.lineTo(mx + 14, my + 19);
        ctx.lineTo(mx + 9, my + 12);
        ctx.lineTo(mx + 15, my + 12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx, my + 16);
        ctx.lineTo(mx + 4, my + 12);
        ctx.lineTo(mx + 9, my + 19);
        ctx.lineTo(mx + 12, my + 17);
        ctx.lineTo(mx + 7, my + 10);
        ctx.lineTo(mx + 13, my + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // =========================================================================
    // 8. AUTHENTIC CRT MONITOR SCREEN EFFECTS (Scanlines, Phosphors, Vignette & Glare)
    // =========================================================================
    ctx.save();

    // 8a. Horizontal Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let sy = 0; sy < H; sy += 3) {
      ctx.fillRect(0, sy, W, 1);
    }

    // 8b. Subtle Phosphor Aperture Mask (Vertical subpixel triad lines)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
    for (let sx = 0; sx < W; sx += 3) {
      ctx.fillRect(sx, 0, 1, H);
    }

    // 8c. CRT Tube Glass Radial Vignette (Curved cathode tube edge & corner darkening)
    const tubeVignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, W * 0.68);
    tubeVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    tubeVignette.addColorStop(0.68, 'rgba(0, 5, 20, 0.12)');
    tubeVignette.addColorStop(0.9, 'rgba(0, 2, 12, 0.36)');
    tubeVignette.addColorStop(1, 'rgba(0, 0, 10, 0.68)');
    ctx.fillStyle = tubeVignette;
    ctx.fillRect(0, 0, W, H);

    // 8d. Deep Bezel Inset Glass Shadows & Bottom Rim Highlight
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, W, 5); // top shadow
    ctx.fillRect(0, 0, 5, H); // left shadow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, H - 4, W, 4); // bottom edge reflection
    ctx.fillRect(W - 4, 0, 4, H); // right edge reflection

    // 8e. Convex Glass Sheen / Tube Glare Reflection
    const glassGlare = ctx.createLinearGradient(0, 0, W * 0.65, H * 0.65);
    glassGlare.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    glassGlare.addColorStop(0.2, 'rgba(255, 255, 255, 0.03)');
    glassGlare.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glassGlare;
    ctx.fillRect(0, 0, W, H);

    // 8f. Dynamic Cathode Scan Beam Sync Roll
    const rollY = (Date.now() * 0.035) % (H + 100) - 50;
    const rollGrad = ctx.createLinearGradient(0, rollY, 0, rollY + 50);
    rollGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    rollGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
    rollGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rollGrad;
    ctx.fillRect(0, rollY, W, 50);

    ctx.restore();
  }


  /* --------------------------------------------------------------------------
     INTERACTIVE SCREEN CLICK & AUDIO HANDLERS WITH WINDOW MANAGEMENT
     -------------------------------------------------------------------------- */
  playRetroClickSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;

      // 1. High-frequency mechanical microswitch snap (shaped noise transient)
      const sampleRate = this.audioCtx.sampleRate;
      const bufferSize = Math.floor(sampleRate * 0.012); // ~12ms
      const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.16));
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(3.2, now);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.38, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      noise.start(now);

      // 2. Low-frequency tactile plastic contact body click
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.016);

      oscGain.gain.setValueAtTime(0.42, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

      osc.connect(oscGain);
      oscGain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.018);
    } catch (e) {}
  }


  handleScreenClick(x, y) {
    this.playRetroClickSound();

    // 1. Dismiss Active Alert Dialog
    if (this.activePopup) {
      this.activePopup = null;
      return;
    }

    // 2. Start Button Toggle (x = 0..118, y = 730..768)
    if (x >= 0 && x <= 118 && y >= 730 && y <= 768) {
      this.startMenuOpen = !this.startMenuOpen;
      return;
    }

    if (this.startMenuOpen) {
      this.startMenuOpen = false;
      return;
    }

    // 3. Taskbar Window Tab (x = 168..398, y = 734..764) - Toggles Minimize / Restore!
    if (x >= 168 && x <= 400 && y >= 732 && y <= 766) {
      if (this.winState === 'minimized') {
        this.winState = 'normal';
      } else {
        this.winState = 'minimized';
      }
      return;
    }

    // 4. Desktop Icons (When clicked on the left side)
    if (x >= 20 && x <= 75 && this.winState === 'minimized') {
      if (y >= 20 && y <= 90) {
        // IE Icon: restore window!
        this.winState = 'normal';
        return;
      }
    }

    // 5. Window Controls & Titlebar (If window is visible)
    if (this.winState !== 'minimized') {
      const isMax = (this.winState === 'maximized');
      const wx = isMax ? 0 : this.winRect.x;
      const wy = isMax ? 0 : this.winRect.y;
      const ww = isMax ? 1024 : this.winRect.w;

      const btnY = wy + 5;
      const bxMin = wx + ww - 75;
      const bxMax = wx + ww - 51;
      const bxClose = wx + ww - 27;

      // Click Minimize Button (_)
      if (x >= bxMin && x <= bxMin + 21 && y >= btnY && y <= btnY + 21) {
        this.winState = 'minimized';
        return;
      }

      // Click Maximize / Restore Button (□ / ❐)
      if (x >= bxMax && x <= bxMax + 21 && y >= btnY && y <= btnY + 21) {
        if (this.winState === 'maximized') {
          this.winState = 'normal';
          this.winRect = { ...this.winNormalRect };
        } else {
          this.winState = 'maximized';
        }
        return;
      }

      // Click Close Button (✕)
      if (x >= bxClose && x <= bxClose + 24 && y >= btnY && y <= btnY + 21) {
        this.winState = 'minimized';
        this.activePopup = {
          title: 'qurayshe.xd',
          message: 'Internet Explorer minimized to taskbar.\nClick taskbar tab to reopen!'
        };
        return;
      }

      // Titlebar drag start or double-click to toggle maximize
      if (y >= wy && y <= wy + 30 && x >= wx && x <= wx + ww - 80) {
        const now = performance.now();
        if (this.lastTitleClick && (now - this.lastTitleClick) < 300) {
          // Double-click: toggle maximize!
          if (this.winState === 'maximized') {
            this.winState = 'normal';
            this.winRect = { ...this.winNormalRect };
          } else {
            this.winState = 'maximized';
          }
          this.lastTitleClick = 0;
          return;
        }
        this.lastTitleClick = now;

        if (this.winState === 'normal') {
          this.winIsDragging = true;
          this.winDragOffset = { x: x - this.winRect.x, y: y - this.winRect.y };
        }
        return;
      }

      // 6. Clicked an Old-School HTML Navigation Link
      if (this.renderedNavLinks && this.renderedNavLinks.length > 0) {
        for (let i = 0; i < this.renderedNavLinks.length; i++) {
          const l = this.renderedNavLinks[i];
          if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) {
            this.activePopup = {
              title: 'qurayshe.xd',
              message: `Navigating to ${l.url}...\n[HTTP 200 OK - Link Active]`
            };
            return;
          }
        }
      }

      // 7. Clicked an Old-School 88x31 Button
      if (this.renderedButtons && this.renderedButtons.length > 0) {
        for (let i = 0; i < this.renderedButtons.length; i++) {
          const item = this.renderedButtons[i];
          if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
            this.activePopup = {
              title: 'qurayshe.xd',
              message: `Badge: ${item.btn.title}!\nhttp://qurayshe.xd/badges/${item.btn.file}`
            };
            return;
          }
        }
      }

      // 8. Clicked Address Bar or Navigation
      if (y >= wy + 90 && y <= wy + 118) {
        this.activePopup = {
          title: 'qurayshe.xd',
          message: 'http://qurayshe.xd\n[HTTP 200 OK - Host Connected]'
        };
        return;
      }
    }
  }


  bindEvents() {
    window.addEventListener('resize', this.onResize);

    const onMove = (clientX, clientY) => {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      this.pointer.targetX = THREE.MathUtils.clamp(x, -1, 1);
      this.pointer.targetY = THREE.MathUtils.clamp(y, -1, 1);

      this.mouse.x = x;
      this.mouse.y = y;

      if (this.screenMesh && this.camera) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.screenMesh);
        if (intersects.length > 0 && intersects[0].uv) {
          const uv = intersects[0].uv;
          this.screenPointer.x = uv.x * 1024;
          this.screenPointer.y = (1 - uv.y) * 768;
          this.screenPointer.active = true;
          this.container.style.cursor = 'none';
          document.body.style.cursor = 'none';

          if (this.winIsDragging && this.winState === 'normal') {
            const newX = Math.round(this.screenPointer.x - this.winDragOffset.x);
            const newY = Math.round(this.screenPointer.y - this.winDragOffset.y);
            this.winRect.x = Math.max(-200, Math.min(1024 - 100, newX));
            this.winRect.y = Math.max(0, Math.min(730 - 40, newY));
            this.winNormalRect = { ...this.winRect };
          }
        } else {
          this.screenPointer.active = false;
          this.container.style.cursor = '';
          document.body.style.cursor = '';
        }
      }
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('pointerup', () => {
      this.winIsDragging = false;
    });

    this.container.addEventListener('pointerleave', () => {
      this.screenPointer.active = false;
      this.winIsDragging = false;
      this.container.style.cursor = '';
      document.body.style.cursor = '';
    });

    this.container.addEventListener('pointerdown', () => {
      if (this.screenPointer.active) {
        this.handleScreenClick(this.screenPointer.x, this.screenPointer.y);
      }
    });

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.websiteScrollY = Math.max(0, Math.min(340, this.websiteScrollY + e.deltaY * 0.45));
      this.renderRetroScreen();
      if (this.screenTexture) this.screenTexture.needsUpdate = true;
    }, { passive: false });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 550;
    const height = this.container.clientHeight || 580;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr * this.pixelRatioScale);

    const rw = Math.round(width * dpr * this.pixelRatioScale);
    const rh = Math.round(height * dpr * this.pixelRatioScale);
    if (this.renderTarget) {
      this.renderTarget.setSize(rw, rh);
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    // Smooth pointer lerp
    this.pointer.x = THREE.MathUtils.lerp(this.pointer.x, this.pointer.targetX, 0.08);
    this.pointer.y = THREE.MathUtils.lerp(this.pointer.y, this.pointer.targetY, 0.08);

    // Gentle cursor parallax tilt only, keep workstation facing user
    if (this.pcGroup) {
      this.pcGroup.rotation.y = this.pointer.x * 0.22;
      this.pcGroup.rotation.x = -this.pointer.y * 0.16;
      this.pcGroup.rotation.z = 0;
    }

    // Realtime screen rendering & dynamic canvas texture update
    this.renderRetroScreen();
    if (this.screenTexture) {
      this.screenTexture.needsUpdate = true;
    }

    this.camera.lookAt(0, 0.4, 0);

    // Chromatic Aberration Post-Processing Pass (Retro CRT pixelization effect)
    if (this.renderTarget && this.chromaMaterial) {
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      this.chromaMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
      this.renderer.render(this.postScene, this.postCamera);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    this.screenPointer.active = false;
    if (this.container) this.container.style.cursor = '';
    document.body.style.cursor = '';
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
