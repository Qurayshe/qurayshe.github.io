/**
 * Interactive 3D WebGL & Anime.js Hero Experience
 * Features:
 *  - 4 Dynamic Visual Modes: Vortex Galaxy (3 branches), Quantum Polyhedron, Cyber Matrix Grid, Kinetic Wave Spectrum
 *  - Punchy shockwave affecting particles, central core, shockwave rings, and orbiting satellite nodes with elastic physics
 *  - Pointer parallax, spring lerp, and real-time ripple interference
 */

export class HeroScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this.clock = new THREE.Clock();
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.activeMode = 'pc'; // 'pc', 'vortex', 'geometry', 'matrix', 'wave'

    // Scene Groups
    this.mainGroup = null;
    this.pcGroup = null;
    this.vortexGroup = null;
    this.geometryGroup = null;
    this.matrixGroup = null;
    this.waveGroup = null;

    // Retro PC & Interactive Screen
    this.screenMesh = null;
    this.screenCanvas = null;
    this.screenCtx = null;
    this.screenTexture = null;
    this.screenPointer = { x: -1, y: -1, active: false };
    this.retroButtonsList = [];
    this.retroButtonImages = {};
    this.renderedButtons = [];
    this.websiteScrollY = 0;
    this.startMenuOpen = false;
    this.activePopup = null;
    this.audioCtx = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Objects
    this.particleSystem = null;
    this.quantumMesh = null;
    this.wireframeCage = null;
    this.orbitRing = null;
    this.shockwaveRing = null;
    this.orbitingNodes = [];
    this.matrixPoints = null;
    this.matrixLines = null;
    this.waveBars = [];

    // ASCII Filter Pipeline
    this.asciiEnabled = true;
    this.asciiCellWidth = 8;
    this.asciiCellHeight = 12;
    this.asciiChars = " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
    this.asciiCanvas = null;
    this.asciiCtx = null;
    this.sampleCanvas = null;
    this.sampleCtx = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 500;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 18);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.appendChild(this.renderer.domElement);

    // 2b. Full-scene Dynamic ASCII Filter Overlay Canvas
    this.asciiCanvas = document.createElement('canvas');
    this.asciiCanvas.className = 'hero-ascii-canvas';
    this.asciiCanvas.style.position = 'absolute';
    this.asciiCanvas.style.inset = '0';
    this.asciiCanvas.style.width = '100%';
    this.asciiCanvas.style.height = '100%';
    this.asciiCanvas.style.pointerEvents = 'none';
    this.asciiCanvas.style.zIndex = '2';
    this.asciiCtx = this.asciiCanvas.getContext('2d');

    this.sampleCanvas = document.createElement('canvas');
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });

    this.container.appendChild(this.asciiCanvas);
    this.resizeAsciiCanvases(width, height);
    this.toggleAscii(true);

    // 3. Main Rig Group
    this.mainGroup = new THREE.Group();
    this.scene.add(this.mainGroup);

    // 4. Sub-scene Mode Groups
    this.pcGroup = new THREE.Group();
    this.vortexGroup = new THREE.Group();
    this.geometryGroup = new THREE.Group();
    this.matrixGroup = new THREE.Group();
    this.waveGroup = new THREE.Group();

    this.mainGroup.add(this.pcGroup);
    this.mainGroup.add(this.vortexGroup);
    this.mainGroup.add(this.geometryGroup);
    this.mainGroup.add(this.matrixGroup);
    this.mainGroup.add(this.waveGroup);

    // Hide inactive mode groups initially
    this.vortexGroup.visible = false;
    this.geometryGroup.visible = false;
    this.matrixGroup.visible = false;
    this.waveGroup.visible = false;

    // 5. Studio Lights (Purple / Violet Primary)
    const ambientLight = new THREE.AmbientLight(0x181028, 2.8);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xa855f7, 4.5, 35);
    pointLight1.position.set(10, 12, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 3.5, 30);
    pointLight2.position.set(-10, -10, 8);
    this.scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xf43f5e, 3.0, 25);
    pointLight3.position.set(0, 12, -6);
    this.scene.add(pointLight3);

    // 6. Build Subsystems
    this.buildRetroPCScene();
    this.buildParticleVortex();
    this.buildQuantumMesh();
    this.buildOrbitingLabNodes();
    this.buildMatrixGrid();
    this.buildWaveSpectrum();
    this.buildShockwaveRing();

    // 7. Bind Events & Start Render Loop in Default PC Mode
    this.bindEvents();
    this.setVisualMode('pc');
    this.animate();
  }

  /* --------------------------------------------------------------------------
     MODE 0 (DEFAULT): RETRO PC WORKSTATION & WINDOWS XP HTML WEBSITE
     -------------------------------------------------------------------------- */
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
    monitorGroup.add(caseMesh);

    // CRT Rear Taper Tube
    const backGeo = new THREE.BoxGeometry(8.5, 6.8, 4.0);
    const backMesh = new THREE.Mesh(backGeo, casingDarkMat);
    backMesh.position.set(0, 1.2, -5.0);
    monitorGroup.add(backMesh);

    // Front Outer Bezel Frame
    const frontBezelGeo = new THREE.BoxGeometry(11.4, 8.8, 0.8);
    const frontBezelMesh = new THREE.Mesh(frontBezelGeo, bezelMat);
    frontBezelMesh.position.set(0, 1.2, 2.4);
    monitorGroup.add(frontBezelMesh);

    // Inner Recessed Dark Screen Border
    const innerBorderGeo = new THREE.BoxGeometry(9.6, 7.35, 0.4);
    const innerBorderMesh = new THREE.Mesh(innerBorderGeo, bezelInnerMat);
    innerBorderMesh.position.set(0, 1.2, 2.7);
    monitorGroup.add(innerBorderMesh);

    // CRT Screen Glass Quad (Interactive Raycast Surface)
    const screenGeo = new THREE.PlaneGeometry(9.2, 6.9);
    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.screenMesh.position.set(0, 1.2, 2.92);
    this.screenMesh.name = 'crt-screen';
    monitorGroup.add(this.screenMesh);

    // Power Button & Green LED
    const btnGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.2, 16);
    btnGeo.rotateX(Math.PI / 2);
    const pwrBtn = new THREE.Mesh(btnGeo, darkKeyMat);
    pwrBtn.position.set(4.0, -2.45, 2.85);
    monitorGroup.add(pwrBtn);

    const ledGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
    ledGeo.rotateX(Math.PI / 2);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const pwrLed = new THREE.Mesh(ledGeo, ledMat);
    pwrLed.position.set(4.6, -2.45, 2.85);
    monitorGroup.add(pwrLed);

    // Monitor Brand Badge
    const badgeGeo = new THREE.BoxGeometry(1.4, 0.35, 0.1);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0x2e273b, roughness: 0.3 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, -2.45, 2.85);
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

    // 3. Keyboard Assembly
    const kbGroup = new THREE.Group();
    kbGroup.position.set(0, -3.8, 4.8);
    kbGroup.rotation.x = -0.12;

    const kbBaseGeo = new THREE.BoxGeometry(10.6, 0.55, 3.8);
    const kbBase = new THREE.Mesh(kbBaseGeo, bezelMat);
    kbGroup.add(kbBase);

    const kbWellGeo = new THREE.BoxGeometry(10.0, 0.15, 3.2);
    const kbWell = new THREE.Mesh(kbWellGeo, casingDarkMat);
    kbWell.position.set(0, 0.25, 0);
    kbGroup.add(kbWell);

    // Keycaps Grid
    const keyRows = 5;
    const keyCols = 15;
    const keyGeo = new THREE.BoxGeometry(0.52, 0.22, 0.52);

    for (let r = 0; r < keyRows; r++) {
      for (let c = 0; c < keyCols; c++) {
        if (r === 4 && c >= 4 && c <= 10) continue; // Spacebar clearance
        const kx = (c - (keyCols - 1) / 2) * 0.62;
        const kz = (r - (keyRows - 1) / 2) * 0.60;
        const isSpecial = (c === 0 || c === keyCols - 1 || r === 0);
        const kMesh = new THREE.Mesh(keyGeo, isSpecial ? darkKeyMat : keycapMat);
        kMesh.position.set(kx, 0.38, kz);
        kbGroup.add(kMesh);
      }
    }

    const spaceGeo = new THREE.BoxGeometry(4.2, 0.22, 0.52);
    const spaceKey = new THREE.Mesh(spaceGeo, keycapMat);
    spaceKey.position.set(0, 0.38, (4 - (keyRows - 1) / 2) * 0.60);
    kbGroup.add(spaceKey);

    this.pcGroup.add(kbGroup);

    // 4. Retro Mouse
    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(6.8, -3.8, 4.8);
    mouseGroup.rotation.y = -0.08;

    const mouseGeo = new THREE.BoxGeometry(1.6, 0.6, 2.5);
    const mouseMesh = new THREE.Mesh(mouseGeo, bezelMat);
    mouseGroup.add(mouseMesh);

    const splitGeo = new THREE.BoxGeometry(0.04, 0.1, 1.1);
    const splitMesh = new THREE.Mesh(splitGeo, casingDarkMat);
    splitMesh.position.set(0, 0.3, 0.6);
    mouseGroup.add(splitMesh);

    const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMesh = new THREE.Mesh(wheelGeo, bezelInnerMat);
    wheelMesh.position.set(0, 0.32, 0.4);
    mouseGroup.add(wheelMesh);

    this.pcGroup.add(mouseGroup);

    // 5. Desk Surface
    const deskGeo = new THREE.BoxGeometry(28, 0.6, 16);
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, -4.4, 3.0);
    this.pcGroup.add(desk);

    // 6. Dedicated Lighting for Retro PC Scene
    const pcDirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    pcDirLight.position.set(5, 10, 8);
    this.pcGroup.add(pcDirLight);

    const pcAmbient = new THREE.AmbientLight(0x4a4055, 1.2);
    this.pcGroup.add(pcAmbient);

    const screenGlow = new THREE.PointLight(0x7dd3fc, 0.9, 10);
    screenGlow.position.set(0, 1.2, 4.0);
    this.pcGroup.add(screenGlow);

    // Initial Screen Draw
    this.renderRetroScreen();
  }

  /* --------------------------------------------------------------------------
     RETRO SCREEN CANVAS RENDERER: WINDOWS XP + RETRO HTML WEBSITE
     -------------------------------------------------------------------------- */
  renderRetroScreen() {
    const ctx = this.screenCtx;
    if (!ctx) return;
    const W = 1024;
    const H = 768;

    // 1. Windows XP "Bliss" Desktop Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 500);
    skyGrad.addColorStop(0, '#1c6dd0');
    skyGrad.addColorStop(0.45, '#4a94e8');
    skyGrad.addColorStop(1, '#a6d3fa');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Puffy cumulus clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath();
    ctx.arc(320, 220, 90, 0, Math.PI * 2);
    ctx.arc(430, 210, 110, 0, Math.PI * 2);
    ctx.arc(520, 230, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(780, 260, 120, 0, Math.PI * 2);
    ctx.arc(880, 250, 95, 0, Math.PI * 2);
    ctx.fill();

    // Rolling green hills
    ctx.fillStyle = '#3a9d23';
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.quadraticCurveTo(380, 410, W, 450);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    const hillGrad = ctx.createLinearGradient(0, 440, 0, 730);
    hillGrad.addColorStop(0, '#75c832');
    hillGrad.addColorStop(0.5, '#46a81e');
    hillGrad.addColorStop(1, '#206d15');
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.quadraticCurveTo(540, 440, W, 510);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // 2. Desktop Icons (Left side)
    const icons = [
      { name: 'My Computer', color: '#38bdf8', icon: '💻' },
      { name: 'Recycle Bin', color: '#10b981', icon: '🗑️' },
      { name: 'Internet Explorer', color: '#2563eb', icon: '🌐' },
      { name: 'My Documents', color: '#f59e0b', icon: '📁' }
    ];

    icons.forEach((ic, idx) => {
      const iy = 24 + idx * 85;
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ic.icon, 50, iy + 25);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(ic.name, 51, iy + 46);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ic.name, 50, iy + 45);
    });

    // 3. Windows XP Taskbar (y = 730 to 768)
    const tbGrad = ctx.createLinearGradient(0, 730, 0, 768);
    tbGrad.addColorStop(0, '#1f5fcb');
    tbGrad.addColorStop(0.15, '#2b72e5');
    tbGrad.addColorStop(1, '#1b52b3');
    ctx.fillStyle = tbGrad;
    ctx.fillRect(0, 730, W, 38);

    ctx.fillStyle = '#3882f2';
    ctx.fillRect(0, 730, W, 1);

    // Green Start Button
    const startGrad = ctx.createLinearGradient(0, 730, 0, 768);
    startGrad.addColorStop(0, '#388e3c');
    startGrad.addColorStop(0.2, '#66bb6a');
    startGrad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = startGrad;
    ctx.beginPath();
    ctx.moveTo(0, 730);
    ctx.lineTo(105, 730);
    ctx.quadraticCurveTo(116, 749, 105, 768);
    ctx.lineTo(0, 768);
    ctx.closePath();
    ctx.fill();

    // Windows Flag 4 colors
    ctx.fillStyle = '#ef4444'; ctx.fillRect(16, 742, 6, 6);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(24, 742, 6, 6);
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(16, 750, 6, 6);
    ctx.fillStyle = '#eab308'; ctx.fillRect(24, 750, 6, 6);

    ctx.font = 'bold italic 18px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText('start', 36, 755);
    ctx.shadowBlur = 0;

    // Active Taskbar Tab
    ctx.fillStyle = '#1446a8';
    ctx.fillRect(122, 734, 250, 30);
    ctx.strokeStyle = '#103688';
    ctx.strokeRect(122, 734, 250, 30);
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🌐 ~* qurayshe\'s Web Zone *~ - Micro...', 132, 753);

    // System Tray
    const trayGrad = ctx.createLinearGradient(0, 730, 0, 768);
    trayGrad.addColorStop(0, '#0e358b');
    trayGrad.addColorStop(1, '#1444ab');
    ctx.fillStyle = trayGrad;
    ctx.fillRect(880, 730, 144, 38);
    ctx.strokeStyle = '#092566';
    ctx.strokeRect(880, 730, 144, 38);

    ctx.font = '12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('🔊 🛡️ 4:20 PM', 1012, 754);

    // 4. The Single Open Interactive Window: Internet Explorer
    const wx = 75;
    const wy = 35;
    const ww = 874;
    const wh = 670;

    // Window shadow & main border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(wx + 8, wy + 8, ww, wh);

    ctx.fillStyle = '#0050e6';
    ctx.fillRect(wx, wy, ww, wh);

    // Window Luna Blue Titlebar
    const tbWGrad = ctx.createLinearGradient(0, wy, 0, wy + 30);
    tbWGrad.addColorStop(0, '#0055ea');
    tbWGrad.addColorStop(0.3, '#3b88ff');
    tbWGrad.addColorStop(1, '#0047c8');
    ctx.fillStyle = tbWGrad;
    ctx.fillRect(wx + 2, wy + 2, ww - 4, 30);

    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('🌐 Microsoft Internet Explorer - [~* qurayshe\'s cyber lab *~]', wx + 10, wy + 21);

    // Titlebar Buttons (_, □, X)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(wx + ww - 68, wy + 6, 18, 18);
    ctx.fillRect(wx + ww - 46, wy + 6, 18, 18);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(wx + ww - 24, wy + 6, 20, 18);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('_', wx + ww - 59, wy + 18);
    ctx.fillText('□', wx + ww - 37, wy + 19);
    ctx.fillText('✕', wx + ww - 14, wy + 19);

    // Browser Menu Bar
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, wy + 32, ww - 4, 24);
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText('File    Edit    View    Favorites    Tools    Help', wx + 12, wy + 48);

    // Navigation Toolbar
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, wy + 56, ww - 4, 34);
    ctx.strokeStyle = '#d0cdc0';
    ctx.beginPath();
    ctx.moveTo(wx + 2, wy + 56); ctx.lineTo(wx + ww - 2, wy + 56);
    ctx.stroke();

    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('⬅ Back    ➡ Forward    ⏹ Stop    🔄 Refresh    🏠 Home    🔍 Search    ⭐ Favorites', wx + 12, wy + 78);

    // Address Bar Row
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, wy + 90, ww - 4, 28);
    ctx.fillStyle = '#64748b';
    ctx.fillText('Address', wx + 12, wy + 108);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx + 64, wy + 94, ww - 130, 20);
    ctx.strokeStyle = '#7f9db9';
    ctx.strokeRect(wx + 64, wy + 94, ww - 130, 20);

    ctx.fillStyle = '#0f172a';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('http://www.qurayshe.geocities.ws/cyberlab/index.html', wx + 70, wy + 108);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(wx + ww - 60, wy + 94, 52, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('➔ Go', wx + ww - 34, wy + 108);

    // 5. Retro Website Client Area (HTML Webpage)
    const cx = wx + 2;
    const cy = wy + 118;
    const cw = ww - 4;
    const ch = wh - 146; // Leaves 28px for status bar

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();

    // Website Background: Deep Cyber Midnight with Stars
    ctx.fillStyle = '#060618';
    ctx.fillRect(cx, cy, cw, ch);

    // Ambient Cyber Grid
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
    ctx.lineWidth = 1;
    for (let gx = cx; gx < cx + cw; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, cy); ctx.lineTo(gx, cy + ch); ctx.stroke();
    }
    for (let gy = cy; gy < cy + ch; gy += 40) {
      ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx + cw, gy); ctx.stroke();
    }

    // Scrolled Website Content
    const contentY = cy + 18 - this.websiteScrollY;

    // Animated Top Marquee
    const mqOffset = (Date.now() * 0.08) % 1500;
    const mqText = '★★★ WELCOME TO QURAYSHE\'S UNDERGROUND 3D SYSTEMS & WEB ZONE ★★★  [ Best viewed in 800x600, Netscape 4.0 or IE 6.0 ]  ★★★  POWERED BY PURE C & 3D WEBGL  ★★★';
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(cx, contentY, cw, 24);
    ctx.strokeStyle = '#c084fc';
    ctx.strokeRect(cx, contentY, cw, 24);
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'left';
    ctx.fillText(mqText, cx + 800 - mqOffset, contentY + 16);

    // Big Rainbow Website Headline
    ctx.font = '800 22px "Courier New", Georgia, serif';
    ctx.textAlign = 'center';
    const titleGrad = ctx.createLinearGradient(cx + 100, 0, cx + cw - 100, 0);
    titleGrad.addColorStop(0, '#f43f5e');
    titleGrad.addColorStop(0.25, '#fb923c');
    titleGrad.addColorStop(0.5, '#facc15');
    titleGrad.addColorStop(0.75, '#38bdf8');
    titleGrad.addColorStop(1, '#c084fc');
    ctx.fillStyle = titleGrad;
    ctx.fillText('~*~ 3D CYBERNETICS // LOW-LEVEL SYSTEMS LAB ~*~', cx + cw / 2, contentY + 62);

    // Sub-badges & Odometer Visitor Counter
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('[ 🌐 NETSCAPE NOW! 4.0 ]   •   [ 📝 CODED IN NOTEPAD++ ]   •   [ 🕹️ WEB RING MEMBER #042 ]', cx + cw / 2, contentY + 84);

    // Visitor Counter Box
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx + cw / 2 - 95, contentY + 98, 190, 24);
    ctx.strokeStyle = '#22c55e';
    ctx.strokeRect(cx + cw / 2 - 95, contentY + 98, 190, 24);
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('VISITORS: [ 0 0 4 2 8 9 ]', cx + cw / 2, contentY + 115);

    // Retro Nav Links
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('[ 🏠 HOME ]   [ ⚙ SYSTEMS ]   [ 🎮 GRAPHICS ]   [ 🌐 SERVERS ]   [ 📖 GUESTBOOK ]', cx + cw / 2, contentY + 142);

    // Beveled Section Divider Line
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 40, contentY + 158);
    ctx.lineTo(cx + cw - 40, contentY + 158);
    ctx.stroke();

    // Web Badges Header
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('-=☆ OFFICIAL WEB RING & 88x31 BADGE COLLECTION ☆=-', cx + cw / 2, contentY + 180);

    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Click any badge below to test connection to affiliate servers!', cx + cw / 2, contentY + 198);

    // 28 Old-School Web Buttons Grid (7 cols x 4 rows)
    const btnCols = 7;
    const btnW = 88;
    const btnH = 31;
    const gapX = 14;
    const gapY = 13;
    const gridTotalW = btnCols * btnW + (btnCols - 1) * gapX;
    const startX = cx + (cw - gridTotalW) / 2;
    const startY = contentY + 215;

    this.renderedButtons = [];
    let hoveredBtn = null;

    for (let i = 0; i < this.retroButtonsList.length; i++) {
      const bInfo = this.retroButtonsList[i];
      const col = i % btnCols;
      const row = Math.floor(i / btnCols);
      const bx = startX + col * (btnW + gapX);
      const by = startY + row * (btnH + gapY);

      // Hit boundary
      this.renderedButtons.push({ x: bx, y: by, w: btnW, h: btnH, btn: bInfo });

      const isHovered = (
        this.screenPointer.active &&
        this.screenPointer.x >= bx &&
        this.screenPointer.x <= bx + btnW &&
        this.screenPointer.y >= by &&
        this.screenPointer.y <= by + btnH
      );

      if (isHovered) {
        hoveredBtn = bInfo;
      }

      const img = this.retroButtonImages[bInfo.file];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, bx, by, btnW, btnH);
      } else {
        // Authentic beveled badge placeholder
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(bx, by, btnW, btnH);
        ctx.strokeStyle = '#c084fc';
        ctx.strokeRect(bx, by, btnW, btnH);
        ctx.font = 'bold 9px Tahoma, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(bInfo.title.slice(0, 12), bx + btnW / 2, by + btnH / 2 + 3);
      }

      // Bevel border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.strokeRect(bx, by, btnW, btnH);

      // Flashy hover glow highlight on badge
      if (isHovered) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx - 2, by - 2, btnW + 4, btnH + 4);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fillRect(bx, by, btnW, btnH);
      }
    }

    // Website Footer Notice
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('© 2001-2026 qurayshe. All rights reserved. Made with raw HTML & Notepad. Click anywhere to interact!', cx + cw / 2, startY + 4 * (btnH + gapY) + 25);

    ctx.restore();

    // Scrollbar on right edge
    const sbX = cx + cw - 16;
    const sbY = cy;
    const sbW = 16;
    const sbH = ch;

    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(sbX, sbY, sbW, sbH);
    ctx.strokeStyle = '#d0cdc0';
    ctx.strokeRect(sbX, sbY, sbW, sbH);

    // Scroll Thumb
    const maxScroll = 320;
    const thumbH = 60;
    const thumbY = sbY + (this.websiteScrollY / maxScroll) * (sbH - thumbH);
    ctx.fillStyle = '#d4d0c8';
    ctx.fillRect(sbX + 1, thumbY, sbW - 2, thumbH);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(sbX + 1, thumbY, sbW - 2, thumbH);

    // 6. Browser Status Bar (y = wy + wh - 26 to wy + wh - 4)
    const stY = wy + wh - 26;
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, stY, ww - 4, 22);
    ctx.strokeStyle = '#d0cdc0';
    ctx.strokeRect(wx + 2, stY, ww - 4, 22);

    ctx.font = '11px Tahoma, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';

    if (hoveredBtn) {
      ctx.fillText(`🔗 Shortcut to http://geocities.ws/${hoveredBtn.file} (${hoveredBtn.title})`, wx + 12, stY + 15);
    } else {
      ctx.fillText('✅ Done', wx + 12, stY + 15);
    }

    ctx.textAlign = 'right';
    ctx.fillText('🌐 Internet Zone | 100%', wx + ww - 14, stY + 15);

    // 7. Interactive Start Menu (If Open)
    if (this.startMenuOpen) {
      const smX = 0;
      const smY = 320;
      const smW = 340;
      const smH = 410;

      // Outer shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(smX + 6, smY + 6, smW, smH);

      // Start Menu Header
      const smHGrad = ctx.createLinearGradient(0, smY, smW, smY);
      smHGrad.addColorStop(0, '#1955b5');
      smHGrad.addColorStop(1, '#3884e9');
      ctx.fillStyle = smHGrad;
      ctx.fillRect(smX, smY, smW, 54);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Tahoma, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('qurayshe', smX + 60, smY + 34);

      // User avatar circle
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(smX + 32, smY + 28, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', smX + 32, smY + 34);

      // White Left Panel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(smX, smY + 54, 180, smH - 96);

      const leftItems = ['🌐 Internet Explorer', '📝 Notepad', '💻 Command Prompt', '🎮 Vulkan 3D Lab', '💣 Minesweeper'];
      ctx.font = '12px Tahoma, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      leftItems.forEach((it, i) => {
        ctx.fillText(it, smX + 10, smY + 84 + i * 40);
      });

      // Blue Right Panel
      ctx.fillStyle = '#d3e5fa';
      ctx.fillRect(smX + 180, smY + 54, smW - 180, smH - 96);
      const rightItems = ['📁 My Documents', '💻 My Computer', '⚙️ Control Panel', '🔍 Search', '▶ Run...'];
      rightItems.forEach((it, i) => {
        ctx.fillText(it, smX + 192, smY + 84 + i * 40);
      });

      // Bottom Bar
      ctx.fillStyle = '#1e57c8';
      ctx.fillRect(smX, smY + smH - 42, smW, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillText('🔑 Log Off      ⏻ Turn Off Computer', smX + 20, smY + smH - 16);
    }

    // 8. Interactive XP Alert Dialog (If Triggered)
    if (this.activePopup) {
      const pw = 420;
      const ph = 180;
      const px = (W - pw) / 2;
      const py = (H - ph) / 2;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(px + 8, py + 8, pw, ph);

      // Dialog Frame
      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#0055ea';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);

      // Titlebar
      const dlgTbGrad = ctx.createLinearGradient(0, py, 0, py + 26);
      dlgTbGrad.addColorStop(0, '#0055ea');
      dlgTbGrad.addColorStop(1, '#3b88ff');
      ctx.fillStyle = dlgTbGrad;
      ctx.fillRect(px, py, pw, 26);

      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(this.activePopup.title || 'Internet Explorer', px + 10, py + 18);

      // Close [X]
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px + pw - 22, py + 4, 18, 18);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('✕', px + pw - 13, py + 17);

      // Body Icon & Text
      ctx.font = '28px sans-serif';
      ctx.fillText('ℹ️', px + 36, py + 80);

      ctx.font = '12px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';

      const lines = this.activePopup.message.split('\n');
      lines.forEach((ln, lidx) => {
        ctx.fillText(ln, px + 70, py + 68 + lidx * 20);
      });

      // [ OK ] Button
      const okW = 80;
      const okH = 26;
      const okX = px + (pw - okW) / 2;
      const okY = py + ph - 42;

      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(okX, okY, okW, okH);
      ctx.strokeStyle = '#0055ea';
      ctx.lineWidth = 2;
      ctx.strokeRect(okX, okY, okW, okH);

      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText('OK', okX + okW / 2, okY + 17);
    }

    // 9. Windows XP Mouse Pointer
    if (this.screenPointer.active) {
      const mx = this.screenPointer.x;
      const my = this.screenPointer.y;

      ctx.save();
      if (hoveredBtn || this.startMenuOpen || (my >= wy && my <= wy + 30 && mx >= wx + ww - 68)) {
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
  }

  /* --------------------------------------------------------------------------
     INTERACTIVE SCREEN CLICK & AUDIO HANDLERS
     -------------------------------------------------------------------------- */
  playRetroClickSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  handleScreenClick(x, y) {
    this.playRetroClickSound();

    // 1. Dismiss Active Alert Dialog
    if (this.activePopup) {
      this.activePopup = null;
      return;
    }

    // 2. Start Button Toggle
    if (x >= 0 && x <= 115 && y >= 730 && y <= 768) {
      this.startMenuOpen = !this.startMenuOpen;
      return;
    }

    if (this.startMenuOpen) {
      this.startMenuOpen = false;
      return;
    }

    // 3. Window Close Button [X] (wx = 75, wy = 35, ww = 874)
    if (x >= 925 && x <= 948 && y >= 38 && y <= 60) {
      this.activePopup = {
        title: 'System Notice',
        message: 'qurayshe.exe is a critical system process.\nWindow termination denied! 🚀'
      };
      return;
    }

    // 4. Clicked an Old-School 88x31 Button
    if (this.renderedButtons && this.renderedButtons.length > 0) {
      for (let i = 0; i < this.renderedButtons.length; i++) {
        const item = this.renderedButtons[i];
        if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
          this.activePopup = {
            title: 'Internet Explorer 6.0',
            message: `Connected to badge: ${item.btn.title}!\n[HTTP 200 OK - Affiliate Link Active]`
          };
          return;
        }
      }
    }

    // 5. Clicked Address Bar or Navigation
    if (y >= 94 && y <= 122) {
      this.activePopup = {
        title: 'Geocities Cyber Lab',
        message: 'You are visiting qurayshe\'s underground\n3D systems & graphics workshop!'
      };
      return;
    }
  }

  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(240, 220, 255, 0.95)');
    grad.addColorStop(0.65, 'rgba(168, 85, 247, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  /* --------------------------------------------------------------------------
     MODE 1: PARTICLE VORTEX GALAXY (3 Spiral Branches)
     -------------------------------------------------------------------------- */
  buildParticleVortex() {
    // Spawn way fewer (1200) and much larger stars for clean, bold ASCII sampling
    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);

    const color1 = new THREE.Color('#c084fc'); // Purple Core
    const color2 = new THREE.Color('#38bdf8'); // Sky Blue Arms
    const color3 = new THREE.Color('#f43f5e'); // Rose Highlights

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = Math.pow(Math.random(), 1.6) * 11.5 + 0.4;
      const branches = 3; // 3 Branches default as requested
      const branchAngle = ((i % branches) * ((2 * Math.PI) / branches));
      const spin = radius * 0.75;

      const randomX = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.28) * radius;
      const randomY = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.28) * radius;
      const randomZ = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.28) * radius;

      const x = Math.cos(branchAngle + spin) * radius + randomX;
      const y = (Math.random() - 0.5) * 1.6 + randomY;
      const z = Math.sin(branchAngle + spin) * radius + randomZ;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      originalPositions[i3] = x;
      originalPositions[i3 + 1] = y;
      originalPositions[i3 + 2] = z;

      const mixedColor = color1.clone().lerp(color2, radius / 9).lerp(color3, Math.random() * 0.25);
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: this.createParticleTexture(),
      transparent: true,
      opacity: 0.95
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.particleSystem.userData = { originalPositions };
    this.vortexGroup.add(this.particleSystem);
  }

  /* --------------------------------------------------------------------------
     MODE 2: QUANTUM POLYHEDRON CORE & FLOATING ORBITALS
     -------------------------------------------------------------------------- */
  buildQuantumMesh() {
    // 1. Central Core Mesh
    const coreGeo = new THREE.IcosahedronGeometry(2.2, 2);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x1f1438,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.6,
      roughness: 0.12,
      metalness: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      wireframe: false,
      transparent: true,
      opacity: 0.9
    });
    this.quantumMesh = new THREE.Mesh(coreGeo, coreMat);
    this.geometryGroup.add(this.quantumMesh);

    // 2. Wireframe Cage Outer Shell
    const cageGeo = new THREE.IcosahedronGeometry(3.1, 1);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    this.wireframeCage = new THREE.Mesh(cageGeo, wireframeMat);
    this.geometryGroup.add(this.wireframeCage);

    // 3. Floating Orbital Torus Ring
    const ringGeo = new THREE.TorusGeometry(4.3, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6
    });
    this.orbitRing = new THREE.Mesh(ringGeo, ringMat);
    this.orbitRing.rotation.x = Math.PI / 2.6;
    this.geometryGroup.add(this.orbitRing);
  }

  /* --------------------------------------------------------------------------
     ORBITING SATELLITE NODES (React to shockwave with radial elasticity)
     -------------------------------------------------------------------------- */
  buildOrbitingLabNodes() {
    const nodeDefs = [
      {
        id: 'systems',
        label: 'Systems & C',
        color: 0xa855f7,
        geo: new THREE.OctahedronGeometry(0.52, 0),
        orbitRadius: 5.4,
        speed: 0.75,
        offset: 0,
        shockDistance: 0
      },
      {
        id: 'servers',
        label: 'Rust & Go Servers',
        color: 0x38bdf8,
        geo: new THREE.DodecahedronGeometry(0.48, 0),
        orbitRadius: 6.2,
        speed: -0.55,
        offset: Math.PI * 0.7,
        shockDistance: 0
      },
      {
        id: 'motion',
        label: '3D Motion Lab',
        color: 0xec4899,
        geo: new THREE.TorusGeometry(0.42, 0.15, 12, 24),
        orbitRadius: 5.0,
        speed: 0.9,
        offset: Math.PI * 1.4,
        shockDistance: 0
      }
    ];

    nodeDefs.forEach((def) => {
      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.8
      });
      const mesh = new THREE.Mesh(def.geo, mat);
      mesh.userData = def;

      // Glow halo
      const glowMat = new THREE.MeshBasicMaterial({
        color: def.color,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      const glowMesh = new THREE.Mesh(def.geo.clone(), glowMat);
      glowMesh.scale.setScalar(1.4);
      mesh.add(glowMesh);

      this.geometryGroup.add(mesh);
      this.orbitingNodes.push(mesh);
    });
  }

  /* --------------------------------------------------------------------------
     MODE 3: CYBER MATRIX GRID (36x36 3D Interactive Ripple Grid)
     -------------------------------------------------------------------------- */
  buildMatrixGrid() {
    const size = 32;
    const spacing = 0.55;
    const count = size * size;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color('#a855f7');
    const c2 = new THREE.Color('#38bdf8');

    let idx = 0;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const px = (x - size / 2) * spacing;
        const pz = (z - size / 2) * spacing;
        positions[idx * 3] = px;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = pz;

        const dist = Math.sqrt(px * px + pz * pz) / 10;
        const col = c1.clone().lerp(c2, dist);
        colors[idx * 3] = col.r;
        colors[idx * 3 + 1] = col.g;
        colors[idx * 3 + 2] = col.b;
        idx++;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      sizeAttenuation: true,
      vertexColors: true,
      map: this.createParticleTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9
    });

    this.matrixPoints = new THREE.Points(geo, mat);
    this.matrixPoints.userData = { size, spacing };
    this.matrixRipples = [];
    this.matrixGroup.add(this.matrixPoints);

    // Matrix wireframe floor grid
    const gridHelper = new THREE.GridHelper(size * spacing, size, 0xa855f7, 0x38bdf8);
    gridHelper.position.y = -0.05;
    gridHelper.material.opacity = 0.25;
    gridHelper.material.transparent = true;
    this.matrixGridHelper = gridHelper;
    this.matrixGroup.add(gridHelper);

    this.matrixGroup.rotation.x = Math.PI / 4.2;
    this.matrixGroup.position.set(0, -2, 0);
  }

  /* --------------------------------------------------------------------------
     MODE 4: KINETIC WAVE SPECTRUM (64-Bar Sine Harmonics)
     -------------------------------------------------------------------------- */
  buildWaveSpectrum() {
    const barsCount = 64;
    const radius = 6.0;
    this.waveBars = [];

    const barGeo = new THREE.BoxGeometry(0.18, 1.0, 0.18);

    for (let i = 0; i < barsCount; i++) {
      const angle = (i / barsCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const color = new THREE.Color().setHSL(0.72 + (i / barsCount) * 0.25, 0.9, 0.65);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8
      });

      const mesh = new THREE.Mesh(barGeo, mat);
      mesh.position.set(x, 0, z);
      mesh.lookAt(0, 0, 0);
      mesh.userData = { index: i, angle, baseHeight: 1.0, boost: 0 };

      this.waveGroup.add(mesh);
      this.waveBars.push(mesh);
    }

    // Inner glowing ring for wave mode
    const innerRingGeo = new THREE.TorusGeometry(radius, 0.03, 16, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.4 });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    this.waveInnerRing = innerRing;
    this.waveGroup.add(innerRing);

    this.waveGroup.rotation.x = Math.PI / 6;
  }

  /* --------------------------------------------------------------------------
     EXPANDING SHOCKWAVE RING MESH
     -------------------------------------------------------------------------- */
  buildShockwaveRing() {
    const ringGeo = new THREE.RingGeometry(0.5, 0.75, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.rotation.x = Math.PI / 2;
    this.mainGroup.add(this.shockwaveRing);
  }

  /* --------------------------------------------------------------------------
     VISUAL MODE SWITCHER (With camera transitions & group visibility)
     -------------------------------------------------------------------------- */
  setVisualMode(mode) {
    this.activeMode = mode;

    // Reset visibility transitions
    const show = (grp) => {
      grp.visible = true;
      if (typeof anime !== 'undefined') {
        anime({ targets: grp.scale, x: 1, y: 1, z: 1, duration: 600, easing: 'easeOutQuad' });
      }
    };
    const hide = (grp) => {
      if (typeof anime !== 'undefined') {
        anime({
          targets: grp.scale,
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 400,
          easing: 'easeInQuad',
          complete: () => { grp.visible = false; }
        });
      } else {
        grp.visible = false;
      }
    };

    if (mode === 'pc') {
      show(this.pcGroup);
      hide(this.vortexGroup);
      hide(this.geometryGroup);
      hide(this.matrixGroup);
      hide(this.waveGroup);

      if (typeof anime !== 'undefined') {
        anime({ targets: this.camera.position, x: 0, y: 0.6, z: 15.5, duration: 900, easing: 'easeInOutQuad' });
      } else {
        this.camera.position.set(0, 0.6, 15.5);
      }

      // Retro PC ignores ASCII filter (full clarity)
      if (this.asciiCanvas) this.asciiCanvas.style.display = 'none';
      if (this.renderer && this.renderer.domElement) this.renderer.domElement.style.opacity = '1';

    } else {
      hide(this.pcGroup);

      // Restore ASCII state based on current toggle setting
      if (this.asciiCanvas) {
        this.asciiCanvas.style.display = this.asciiEnabled ? 'block' : 'none';
      }
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.style.opacity = this.asciiEnabled ? '0.06' : '1';
      }

      if (mode === 'vortex') {
        show(this.vortexGroup);
        show(this.geometryGroup);
        hide(this.matrixGroup);
        hide(this.waveGroup);

        if (typeof anime !== 'undefined') {
          anime({ targets: this.camera.position, x: 0, y: 0, z: 18, duration: 900, easing: 'easeInOutQuad' });
          anime({ targets: this.quantumMesh.scale, x: 1, y: 1, z: 1, duration: 600, easing: 'easeOutElastic(1, .8)' });
        }
        this.quantumMesh.material.wireframe = false;

      } else if (mode === 'geometry') {
        hide(this.vortexGroup);
        show(this.geometryGroup);
        hide(this.matrixGroup);
        hide(this.waveGroup);

        if (typeof anime !== 'undefined') {
          anime({ targets: this.camera.position, x: 0, y: 2, z: 12, duration: 900, easing: 'easeInOutQuad' });
          anime({ targets: this.quantumMesh.scale, x: 1.5, y: 1.5, z: 1.5, duration: 700, easing: 'easeOutElastic(1, .6)' });
        }
        this.quantumMesh.material.wireframe = true;

      } else if (mode === 'matrix') {
        hide(this.vortexGroup);
        hide(this.geometryGroup);
        show(this.matrixGroup);
        hide(this.waveGroup);

        if (typeof anime !== 'undefined') {
          anime({ targets: this.camera.position, x: 0, y: 7, z: 14, duration: 900, easing: 'easeInOutQuad' });
        }

      } else if (mode === 'wave') {
        hide(this.vortexGroup);
        hide(this.geometryGroup);
        hide(this.matrixGroup);
        show(this.waveGroup);

        if (typeof anime !== 'undefined') {
          anime({ targets: this.camera.position, x: 0, y: 8, z: 15, duration: 900, easing: 'easeInOutQuad' });
        }
      }
    }
  }

  /* --------------------------------------------------------------------------
     MODE 3 ON-CLICK: TSUNAMI RIPPLE SURGE & MATRIX KINETIC RECOIL
     -------------------------------------------------------------------------- */
  triggerMatrixRipple() {
    if (typeof anime === 'undefined') return;

    // 1. Raycast cursor click origin or default to dynamic center
    const originX = (this.pointer ? this.pointer.x * 6.5 : 0);
    const originZ = (this.pointer ? -this.pointer.y * 6.5 : 0);

    if (!this.matrixRipples) this.matrixRipples = [];
    this.matrixRipples.push({
      originX,
      originZ,
      time: 0,
      speed: 15.0,
      maxRadius: 22.0,
      amplitude: 3.8,
      birth: performance.now()
    });
    if (this.matrixRipples.length > 3) this.matrixRipples.shift();

    // 2. Expand Cyber Grid Points Bloom & Elastic Snap
    if (this.matrixPoints && this.matrixPoints.material) {
      anime({
        targets: this.matrixPoints.material,
        size: [0.42, 0.12],
        duration: 850,
        easing: 'easeOutElastic(1.3, 0.4)'
      });
    }

    // 3. Grid Helper Wireframe flash
    if (this.matrixGridHelper && this.matrixGridHelper.material) {
      anime({
        targets: this.matrixGridHelper.material,
        opacity: [0.95, 0.25],
        duration: 750,
        easing: 'easeOutExpo'
      });
    }

    // 4. Matrix Group Vertical Jolt & Recoil Pitch
    if (this.matrixGroup) {
      anime({
        targets: this.matrixGroup.position,
        y: [-0.9, -2.0],
        duration: 900,
        easing: 'easeOutElastic(1.2, 0.4)'
      });
      anime({
        targets: this.matrixGroup.rotation,
        x: [Math.PI / 3.4, Math.PI / 4.2],
        duration: 950,
        easing: 'easeOutElastic(1.3, 0.4)'
      });
    }

    // 5. Expand Floor Shockwave Ring
    if (this.shockwaveRing) {
      this.shockwaveRing.position.set(originX, -1.95, originZ);
      this.shockwaveRing.scale.set(0.4, 0.4, 0.4);
      this.shockwaveRing.material.opacity = 0.95;
      anime({
        targets: this.shockwaveRing.scale,
        x: 22,
        y: 22,
        z: 22,
        duration: 850,
        easing: 'easeOutExpo'
      });
      anime({
        targets: this.shockwaveRing.material,
        opacity: [0.95, 0],
        duration: 850,
        easing: 'easeOutExpo'
      });
    }
  }

  /* --------------------------------------------------------------------------
     MODE 4 ON-CLICK: BASS DROP EXPLOSION & 360° WARP SNAP
     -------------------------------------------------------------------------- */
  triggerWaveBassDrop() {
    if (typeof anime === 'undefined') return;

    // 1. Towering Bass Surge Stagger on all 64 equalizer bars
    if (this.waveBars && this.waveBars.length > 0) {
      this.waveBars.forEach((bar, idx) => {
        bar.userData.boost = 0;
        anime({
          targets: bar.userData,
          boost: [6.2, 0],
          duration: 1150,
          delay: anime.stagger(12, { from: 'center' }),
          easing: 'easeOutElastic(1.4, 0.35)'
        });

        // Glowing Emissive Flash
        anime({
          targets: bar.material,
          emissiveIntensity: [4.5, 0.6],
          duration: 800,
          delay: idx * 8,
          easing: 'easeOutExpo'
        });
      });
    }

    // 2. Sonic Boom Torus Ring Blast
    if (this.waveInnerRing) {
      this.waveInnerRing.scale.set(1, 1, 1);
      this.waveInnerRing.material.opacity = 1.0;
      anime({
        targets: this.waveInnerRing.scale,
        x: 2.4,
        y: 2.4,
        z: 2.4,
        duration: 850,
        easing: 'easeOutExpo',
        complete: () => {
          if (this.waveInnerRing) {
            this.waveInnerRing.scale.set(1, 1, 1);
            this.waveInnerRing.material.opacity = 0.4;
          }
        }
      });
      anime({
        targets: this.waveInnerRing.material,
        opacity: [1.0, 0.4],
        duration: 850,
        easing: 'easeOutExpo'
      });
    }

    // 3. 360° Warp Snap Spin on Wave Group
    if (this.waveGroup) {
      anime({
        targets: this.waveGroup.rotation,
        y: this.waveGroup.rotation.y + Math.PI * 2,
        duration: 1100,
        easing: 'easeOutElastic(1.1, 0.4)'
      });
    }

    // 4. Camera Punch & Elastic Snap
    anime({
      targets: this.camera.position,
      z: [22, 15],
      y: [12, 8],
      duration: 900,
      easing: 'easeOutElastic(1.2, 0.4)'
    });
  }

  /* --------------------------------------------------------------------------
     TRIGGER PUNCHY SHOCKWAVE (Mode-Aware Dispatcher)
     -------------------------------------------------------------------------- */
  triggerShockwave() {
    if (typeof anime === 'undefined') return;

    if (this.activeMode === 'matrix') {
      this.triggerMatrixRipple();
      return;
    }

    if (this.activeMode === 'wave') {
      this.triggerWaveBassDrop();
      return;
    }

    // 1. Expand Shockwave Ring (Centered for Vortex & Geometry)
    if (this.shockwaveRing) {
      this.shockwaveRing.position.set(0, 0, 0);
      this.shockwaveRing.scale.set(1, 1, 1);
      this.shockwaveRing.material.opacity = 0.9;
      anime({
        targets: this.shockwaveRing.scale,
        x: 22,
        y: 22,
        z: 22,
        duration: 900,
        easing: 'easeOutExpo'
      });
      anime({
        targets: this.shockwaveRing.material,
        opacity: [0.9, 0],
        duration: 900,
        easing: 'easeOutExpo'
      });
    }

    // 2. Explode Galaxy Particles Outward
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      const originals = this.particleSystem.userData.originalPositions;
      const count = positions.length / 3;

      const animObj = { progress: 0 };
      anime({
        targets: animObj,
        progress: [0, 1],
        duration: 1100,
        easing: 'easeOutExpo',
        update: () => {
          const p = animObj.progress;
          const wave = Math.sin(p * Math.PI);
          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const ox = originals[i3];
            const oy = originals[i3 + 1];
            const oz = originals[i3 + 2];
            const dist = Math.sqrt(ox * ox + oz * oz);

            positions[i3] = ox * (1 + wave * (0.9 / (dist * 0.18 + 1)));
            positions[i3 + 1] = oy + Math.sin(dist * 2.2 - p * 7) * wave * 1.8;
            positions[i3 + 2] = oz * (1 + wave * (0.9 / (dist * 0.18 + 1)));
          }
          this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
      });
    }

    // 3. Punch Orbiting Satellite Nodes (Push outward radially + flash glow)
    this.orbitingNodes.forEach((node, idx) => {
      node.userData.shockDistance = 3.5;
      anime({
        targets: node.userData,
        shockDistance: [3.5, 0],
        duration: 1200,
        delay: idx * 60,
        easing: 'easeOutElastic(1.3, 0.4)'
      });

      // Emissive Flash
      anime({
        targets: node.material,
        emissiveIntensity: [3.5, 0.7],
        duration: 800,
        easing: 'easeOutQuad'
      });

      // Node Rotation Spin
      anime({
        targets: node.rotation,
        x: node.rotation.x + Math.PI * 2,
        y: node.rotation.y + Math.PI * 2,
        duration: 900,
        easing: 'easeOutExpo'
      });
    });

    // 4. Quantum Core Mesh Spin & Elastic Scale Pulse
    if (this.quantumMesh) {
      anime({
        targets: this.quantumMesh.rotation,
        x: this.quantumMesh.rotation.x + Math.PI * 2,
        y: this.quantumMesh.rotation.y + Math.PI * 2,
        duration: 1000,
        easing: 'easeOutElastic(1, .5)'
      });
      anime({
        targets: this.quantumMesh.scale,
        x: [2.2, 1],
        y: [2.2, 1],
        z: [2.2, 1],
        duration: 1100,
        easing: 'easeOutElastic(1.2, 0.4)'
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize.bind(this));

    const onMove = (clientX, clientY) => {
      const rect = this.container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      this.pointer.targetX = THREE.MathUtils.clamp(x, -1, 1);
      this.pointer.targetY = THREE.MathUtils.clamp(y, -1, 1);

      this.mouse.x = x;
      this.mouse.y = y;

      if (this.activeMode === 'pc' && this.screenMesh && this.camera) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.screenMesh);
        if (intersects.length > 0 && intersects[0].uv) {
          const uv = intersects[0].uv;
          this.screenPointer.x = uv.x * 1024;
          this.screenPointer.y = (1 - uv.y) * 768;
          this.screenPointer.active = true;
        } else {
          this.screenPointer.active = false;
        }
      }
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.container.addEventListener('pointerleave', () => {
      this.screenPointer.active = false;
    });

    this.container.addEventListener('pointerdown', () => {
      if (this.activeMode === 'pc') {
        if (this.screenPointer.active) {
          this.handleScreenClick(this.screenPointer.x, this.screenPointer.y);
        }
      } else {
        this.triggerShockwave();
      }
    });

    this.container.addEventListener('wheel', (e) => {
      if (this.activeMode === 'pc') {
        e.preventDefault();
        this.websiteScrollY = Math.max(0, Math.min(320, this.websiteScrollY + e.deltaY * 0.45));
        this.renderRetroScreen();
        if (this.screenTexture) this.screenTexture.needsUpdate = true;
      }
    }, { passive: false });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 500;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.resizeAsciiCanvases(width, height);
  }

  resizeAsciiCanvases(width, height) {
    if (!this.asciiCanvas || !this.sampleCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.asciiCanvas.width = Math.round(width * dpr);
    this.asciiCanvas.height = Math.round(height * dpr);

    const cols = Math.max(10, Math.floor(width / this.asciiCellWidth));
    const rows = Math.max(10, Math.floor(height / this.asciiCellHeight));
    this.sampleCanvas.width = cols;
    this.sampleCanvas.height = rows;
  }

  toggleAscii(forceState) {
    this.asciiEnabled = typeof forceState === 'boolean' ? forceState : !this.asciiEnabled;
    if (this.activeMode === 'pc') {
      if (this.asciiCanvas) this.asciiCanvas.style.display = 'none';
      if (this.renderer && this.renderer.domElement) this.renderer.domElement.style.opacity = '1';
      return this.asciiEnabled;
    }
    if (this.asciiCanvas) {
      this.asciiCanvas.style.display = this.asciiEnabled ? 'block' : 'none';
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.opacity = this.asciiEnabled ? '0.06' : '1';
    }
    return this.asciiEnabled;
  }

  renderAscii() {
    if (!this.asciiEnabled || !this.asciiCtx || !this.sampleCtx || !this.renderer) return;

    const cols = this.sampleCanvas.width;
    const rows = this.sampleCanvas.height;
    if (cols <= 0 || rows <= 0) return;

    this.sampleCtx.clearRect(0, 0, cols, rows);
    this.sampleCtx.drawImage(this.renderer.domElement, 0, 0, cols, rows);

    let imgData;
    try {
      imgData = this.sampleCtx.getImageData(0, 0, cols, rows).data;
    } catch (e) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvasW = this.asciiCanvas.width;
    const canvasH = this.asciiCanvas.height;
    const ctx = this.asciiCtx;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.font = `bold ${Math.round(this.asciiCellHeight * dpr * 0.9)}px "JetBrains Mono", "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cellW = canvasW / cols;
    const cellH = canvasH / rows;
    const chars = this.asciiChars;
    const charLen = chars.length;

    let pIdx = 0;
    for (let y = 0; y < rows; y++) {
      const cy = y * cellH + cellH * 0.5;
      for (let x = 0; x < cols; x++) {
        const r = imgData[pIdx];
        const g = imgData[pIdx + 1];
        const b = imgData[pIdx + 2];
        const a = imgData[pIdx + 3];
        pIdx += 4;

        if (a < 15) continue;

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 14) continue;

        const charIdx = Math.min(charLen - 1, Math.floor((lum / 255) * charLen));
        const char = chars[charIdx];
        if (char === ' ') continue;

        const cx = x * cellW + cellW * 0.5;
        const boostR = Math.min(255, Math.floor(r * 1.15 + 18));
        const boostG = Math.min(255, Math.floor(g * 1.15 + 18));
        const boostB = Math.min(255, Math.floor(b * 1.15 + 18));
        const alpha = Math.min(1, (a / 255) * (0.35 + (lum / 255) * 0.65));

        ctx.fillStyle = `rgba(${boostR},${boostG},${boostB},${alpha})`;
        ctx.fillText(char, cx, cy);
      }
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const t = this.clock.getElapsedTime();

    // Smooth pointer lerp
    this.pointer.x = THREE.MathUtils.lerp(this.pointer.x, this.pointer.targetX, 0.08);
    this.pointer.y = THREE.MathUtils.lerp(this.pointer.y, this.pointer.targetY, 0.08);

    if (this.activeMode === 'pc') {
      // Gentle cursor parallax tilt only, keep workstation facing user
      this.mainGroup.rotation.y = this.pointer.x * 0.22;
      this.mainGroup.rotation.x = -this.pointer.y * 0.16;
      this.mainGroup.rotation.z = 0;

      // Realtime screen rendering & dynamic canvas texture update
      this.renderRetroScreen();
      if (this.screenTexture) {
        this.screenTexture.needsUpdate = true;
      }
    } else {
      // Parallax & Rig Rotation for cosmic/abstract scenes
      this.mainGroup.rotation.y = t * 0.12 + this.pointer.x * 0.5;
      this.mainGroup.rotation.x = Math.sin(t * 0.1) * 0.08 - this.pointer.y * 0.35;
    }

    // Quantum Core Animation
    if (this.quantumMesh) {
      this.quantumMesh.rotation.y -= 0.015;
      this.quantumMesh.rotation.x += 0.008;
      if (this.activeMode !== 'geometry') {
        const pulse = 1 + Math.sin(t * 2.5) * 0.05;
        this.quantumMesh.scale.set(pulse, pulse, pulse);
      }
    }

    if (this.wireframeCage) {
      this.wireframeCage.rotation.y += 0.008;
      this.wireframeCage.rotation.z -= 0.005;
    }

    if (this.orbitRing) {
      this.orbitRing.rotation.z = t * 0.2;
    }

    // Orbiting Satellite Nodes (with shockDistance radial expansion offset)
    this.orbitingNodes.forEach((node) => {
      const { orbitRadius, speed, offset, shockDistance } = node.userData;
      const effectiveRadius = orbitRadius + (shockDistance || 0);
      const angle = t * speed + offset;
      node.position.x = Math.cos(angle) * effectiveRadius;
      node.position.z = Math.sin(angle) * effectiveRadius;
      node.position.y = Math.sin(t * 2 + offset) * 0.8;
      node.rotation.x += 0.02;
      node.rotation.y += 0.03;
    });

    // MODE 1: Vortex Rotation
    if (this.particleSystem && this.activeMode === 'vortex') {
      this.particleSystem.rotation.y = t * 0.07;
    }

    // MODE 3: Matrix Grid Undulation Physics & Dynamic Shockwaves
    if (this.matrixPoints && this.activeMode === 'matrix') {
      const pos = this.matrixPoints.geometry.attributes.position.array;
      const { size, spacing } = this.matrixPoints.userData;
      let idx = 0;

      // Update active ripples life cycle
      const now = performance.now();
      if (this.matrixRipples && this.matrixRipples.length > 0) {
        this.matrixRipples.forEach((r) => {
          r.time = (now - r.birth) / 1000;
        });
        this.matrixRipples = this.matrixRipples.filter((r) => r.time < 1.6);
      }

      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          const px = (x - size / 2) * spacing;
          const pz = (z - size / 2) * spacing;
          const dist = Math.sqrt(px * px + pz * pz);
          // Sine ripple + cursor displacement baseline
          let waveY = Math.sin(dist * 1.4 - t * 3.5) * 0.65 + Math.cos(px * 0.8 + t * 2) * 0.2;

          // Interactive click ripple surges
          if (this.matrixRipples && this.matrixRipples.length > 0) {
            for (let r = 0; r < this.matrixRipples.length; r++) {
              const ripple = this.matrixRipples[r];
              const rdx = px - ripple.originX;
              const rdz = pz - ripple.originZ;
              const rdist = Math.sqrt(rdx * rdx + rdz * rdz);
              const waveFront = ripple.time * ripple.speed;
              const distFromFront = Math.abs(rdist - waveFront);
              if (distFromFront < 3.2) {
                const decay = Math.max(0, 1 - rdist / ripple.maxRadius) * Math.max(0, 1 - ripple.time / 1.5);
                waveY += Math.sin(distFromFront * (Math.PI / 1.6)) * ripple.amplitude * decay;
              }
            }
          }

          pos[idx * 3 + 1] = waveY;
          idx++;
        }
      }
      this.matrixPoints.geometry.attributes.position.needsUpdate = true;
      this.matrixGroup.rotation.y = t * 0.1;
    }

    // MODE 4: Wave Spectrum Harmonic Heights & Bass Boost
    if (this.activeMode === 'wave') {
      this.waveBars.forEach((bar) => {
        const { index, angle } = bar.userData;
        const freq1 = Math.sin(angle * 3 + t * 4) * 1.8;
        const freq2 = Math.cos(angle * 5 - t * 3) * 1.2;
        const boost = bar.userData.boost || 0;
        const h = Math.max(0.2, 1.2 + freq1 + freq2 + boost);
        bar.scale.y = h;
        bar.position.y = h / 2;
      });
      this.waveGroup.rotation.y = t * 0.15;
    }

    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);

    if (this.asciiEnabled && this.activeMode !== 'pc') {
      this.renderAscii();
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.asciiCanvas && this.asciiCanvas.parentNode) {
      this.asciiCanvas.parentNode.removeChild(this.asciiCanvas);
    }
  }
}
