/**
 * Independent 3D Floating Computer Scene (Retro PC Workstation & Windows XP CRT)
 * Features:
 *  - Authentic Windows XP Luna interface with Internet Explorer 6.0, DOOM, Minesweeper, Notepad, CMD, and Explorer
 *  - Rich multi-page late-90s / early-2000s mini-website (http://qurayshe.xd): Home, About, Projects, Demoscene Lab, 88x31 Badges, MIDI Jukebox, Guestbook, Contact
 *  - Full CRT filter: scanlines, phosphor aperture mask, tube curvature, chromatic aberration
 *  - Interactive sound synthesizer via Web Audio API: mechanical keyboard clacks, Minesweeper clicks, explosions, win fanfare, and retro chiptune jukebox
 *  - True right-click flagging in Minesweeper & ArrowUp/Down command history in CMD.EXE
 */

import { DoomEngine } from './doom-engine.js';

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
    this.handCursorImg = new Image();
    this.handCursorImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACQ0lEQVR4nO2WTWgTQRTH/8l212pJhHFs8QO/DiNaWsVeVUSoVASLIBU9VEEIFLSXerAULAjaHjwoiPEQclDqIa2CIsWDHxSEnoSoUet6kkqwZF2oREKyaUfeYkIqqSTd7HrJD2Z5LLv7fszbeTM+lIFxcRJAH4A0gLBp6M/gJYyLF1NT03Jy8rlkXDz2NDnBuMjn83mZzeZky8ZWktDgEg3L3FcURaELrJwF09Bzbgn48Z9pqOQhxsUYAJqFMIAFGqahxz0TuBu+ccayLFzsH0T7ntZziwuLSCQwCMBeHbWSKcK4kAX+jjOZjJydTVL89eChbkmDcTEELwS27uhYcj+d/iWTye8Uf3O1BOUIBANoalpjDwCb4NYqUDW1GDc3c7gGK2k2pdNOU1xgfv5nMX756vWScqw0r49xcYL6vqqpnVbOGgUwDCD7I/W54o+sW7+TVoJvpSXomxiPduqfphEK9V72K0oWHuIHoKmqhmAwgJFrQ3gYi2Lb9i3eGTAuTu1uOyDn5lLFmpbGleDkH7BhXFw5euy0vftVC73DuHBeNsbFzYFLw1ULFLqiYwGCcRG5dz9WlUBs/In8s1k5h3HRsWFzu5yZ+VKxwJGuHhLYXxMBgnFxgTaY0qazHJHoGCW/g1rDuBjZu++wjMcTZRPTce366C3JW3aRQJuTXL5/SJxf1dgYOdvbg+7jXXafMFIm3ic+YuLRU7x7++E2gKumoadcESAYF6sBhADQMX0tAEpGh48HpqG/sR+qU6dOHTjjN/IqQLUUCVBFAAAAAElFTkSuQmCC';
    this.pixelRatioScale = 0.52;
    this.startMenuOpen = false;
    this.activePopup = null;
    this.shutdownOpen = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Sound Synthesizer State
    this.soundEnabled = false;
    this.audioCtx = null;

    // Window Management & Stacking Order (z-index)
    this.windowOrder = ['ie'];
    this.activeWindow = 'ie'; // 'ie', 'doom', 'notepad', 'minesweeper', 'cmd', 'explorer'

    // 1. Internet Explorer & qurayshe.xd State
    this.winState = 'normal'; // 'normal', 'maximized', 'minimized'
    this.winRect = { x: 70, y: 30, w: 884, h: 670 };
    this.winNormalRect = { x: 70, y: 30, w: 884, h: 670 };
    this.winIsDragging = false;
    this.winDragOffset = { x: 0, y: 0 };
    this.lastTitleClick = 0;

    // Mini-website navigation & pages: 'home', 'about', 'projects', 'lab', 'links', 'jukebox', 'guestbook', 'contact'
    this.webPage = 'home';
    this.webHistory = ['home'];
    this.webHistoryIdx = 0;
    this.renderedDoomHeroBadge = null;
    this.renderedWebButtons = [];
    this.renderedLabButtons = [];
    this.renderedProjectLinks = [];
    this.marqueeOffset = 0;
    this.hitCount = 42139;

    // Project filter state: 'all', 'graphics', 'systems'
    this.projectCategory = 'all';

    // Lab interactive FX demo state
    this.labEffect = 'plasma'; // 'plasma', 'matrix', 'cube', 'fire', 'starfield'
    this.labPalette = 'neon'; // 'neon', 'green', 'amber', 'ice', 'fire'
    this.labSpeed = 1;

    // Jukebox Chiptune Sequencer State
    this.jukeboxPlaying = false;
    this.jukeboxTrack = 0;
    this.jukeboxStep = 0;
    this.jukeboxLastNoteTime = 0;
    this.jukeboxBpm = 138;
    this.jukeboxTracks = [
      { name: "At Doom's Gate (E1M1)", author: "Bobby Prince / Qurayshe", bpm: 140 },
      { name: "Cyber Sunrise (Tracker Chiptune)", author: "Demogroup 1999", bpm: 128 },
      { name: "Trinitron Phosphor (Vaporwave)", author: "RetroNet FM", bpm: 110 }
    ];

    // Guestbook data
    this.guestbookEntries = [
      { name: 'John_Carmack_Fan', loc: 'Dallas, TX', date: '24-Oct-2004', msg: 'Awesome DOOM wasm port! Runs like butter on this CRT.' },
      { name: 'Neo_1999', loc: 'Zion', date: '18-Oct-2004', msg: 'The Matrix is everywhere. Love the green falling code!' },
      { name: 'Viper_xX', loc: 'Berlin', date: '02-Oct-2004', msg: 'Pure C software rasterizer? You are a wizard dude.' },
      { name: 'GlitchGirl', loc: 'Tokyo', date: '21-Sep-2004', msg: 'Hatsune Miku & Half-Life 88x31 badges are peak culture. ☆' },
      { name: 'RetroSurfer99', loc: 'Silicon Valley', date: '14-Aug-2004', msg: 'Bookmarking this page. The late 90s aesthetic is impeccable!' }
    ];

    // 2. Doom Engine & Window State
    this.doomEngine = new DoomEngine();
    this.doomState = 'closed'; // 'closed', 'loading', 'normal', 'minimized', 'maximized'
    this.doomRect = { x: 190, y: 70, w: 660, h: 480 };
    this.doomNormalRect = { x: 190, y: 70, w: 660, h: 480 };
    this.doomIsDragging = false;
    this.doomDragOffset = { x: 0, y: 0 };
    this.lastDoomTitleClick = 0;

    // 3. Notepad.exe State
    this.notepadState = 'closed'; // 'closed', 'normal', 'minimized', 'maximized'
    this.notepadRect = { x: 220, y: 80, w: 590, h: 450 };
    this.notepadNormalRect = { x: 220, y: 80, w: 590, h: 450 };
    this.notepadIsDragging = false;
    this.notepadDragOffset = { x: 0, y: 0 };
    this.notepadTab = 'README.TXT';
    this.notepadScroll = 0;
    this.notepadDocs = {
      'README.TXT': [
        '====================================================',
        'QURAYSHE RETRO PC WORKSTATION (v2.4 - Windows XP)',
        '====================================================',
        '',
        '[HARDWARE SPECIFICATIONS]',
        '  CPU:       AMD Athlon 64 3200+ @ 2.2 GHz (ClawHammer)',
        '  Mainboard: ASUS A8V Deluxe (VIA K8T800 Pro Chipset)',
        '  RAM:       1024 MB Dual-Channel DDR-400 PC-3200',
        '  GPU:       3dfx Voodoo5 5500 AGP 64MB Dual VSA-100',
        '  Audio:     Creative Sound Blaster 16 ISA (DSP v4.13)',
        '  Display:   Sony Trinitron Multiscan CRT 19" (1024x768 @ 85Hz)',
        '  OS:        Microsoft Windows XP Professional (SP3)',
        '',
        '[SYSTEM HIGHLIGHTS]',
        '  - Embedded id Software DOOM (1993) shareware wasm engine',
        '  - Playable 9x9 Windows Minesweeper with timer and smiley face',
        '  - Interactive MS-DOS Command Prompt with live utilities',
        '  - Hand-crafted personal website at http://qurayshe.xd',
        '  - Real-time CRT scanlines and chromatic aberration passes'
      ],
      'CHEATS.TXT': [
        '====================================================',
        'DOOM & RETRO WORKSTATION CHEAT REPOSITORY',
        '====================================================',
        '',
        '[ID SOFTWARE DOOM 1993 CHEATS]',
        '  IDDQD      - Degreelessness Mode (God Mode / Invulnerability)',
        '  IDKFA      - Very Happy Ammo (All Weapons, Max Ammo, All Keys)',
        '  IDCLIP     - No-Clip Mode (Walk through solid walls & doors)',
        '  IDBEHOLDS  - Berserk Strength (x10 Fist Punch Damage)',
        '  IDCHOPPERS - Chainsaw with God Protection Message',
        '  IDCLEVxy   - Level Warp (x = Episode 1..3, y = Mission 1..9)',
        '',
        '[MINESWEEPER PRO-TIPS]',
        '  - Right click directly flags any suspected mine cell.',
        '  - The 4 corners often hold isolated safe tiles.',
        '  - Click the yellow smiley face anytime to reset board.',
        '  - Toggle Dig / Flag mode using the on-screen toggle button.'
      ],
      'SKILLS.TXT': [
        '====================================================',
        'SYSTEMS & LOW-LEVEL ENGINEERING PROFILE',
        '====================================================',
        '',
        '[PROGRAMMING LANGUAGES]',
        '  C (ANSI/C99/C11), C++ (C++17/C++20), Python, Rust, x86 ASM',
        '',
        '[COMPUTER GRAPHICS & RENDERING]',
        '  - Software 3D Rasterization (Fixed-point, Subpixel Barycentrics)',
        '  - Hardware APIs: Vulkan, Modern OpenGL 4.6, WebGL, WebGPU',
        '  - Ray Tracing: BVH Spatial Acceleration, SIMD Packet Traversal',
        '  - Shader Authoring: GLSL, HLSL, Compute Shader Kernels',
        '',
        '[SYSTEMS & KERNEL ARCHITECTURE]',
        '  - Linux Kernel Modules, POSIX Multi-threading, Lock-Free Queues',
        '  - Memory Management: Slab Allocators, Page Frame Tracking',
        '  - Microarchitectural Profiling (perf, Valgrind, Cache Miss Analysis)'
      ],
      'SPECS.TXT': [
        '====================================================',
        'RETRO WORKSTATION BENCHMARK SPECIFICATIONS',
        '====================================================',
        '',
        '[CHIPSET & BUS]',
        '  Northbridge: VIA K8T800 Pro (800 MHz HyperTransport)',
        '  Southbridge: VIA VT8237 (Dual SATA 150 + UltraDMA 133)',
        '  AGP Slot:    AGP 8X / 4X (0.8V / 1.5V)',
        '',
        '[3DFX VOODOO5 5500 AGP]',
        '  Architecture: 2x 3dfx VSA-100 Processors',
        '  Core Clock:   166 MHz Synchronous',
        '  Fillrate:     667 Megapixels/sec, 667 Megatexels/sec',
        '  Memory:       64 MB 166 MHz SDRAM (32 MB per VSA-100)',
        '  Features:     Hardware T-Buffer, Real-Time 4X FSAA',
        '',
        '[SONY TRINITRON CRT]',
        '  Aperture Grille Pitch: 0.24mm across screen',
        '  Horizontal Scan Rate:  30 - 107 kHz',
        '  Max Resolution:        1600x1200 @ 75Hz (Active: 1024x768 @ 85Hz)'
      ],
      'TODO.TXT': [
        '====================================================',
        'RETRO ENGINEERING ROADMAP',
        '====================================================',
        '',
        '[x] Build floating 3D CRT monitor workstation in Three.js',
        '[x] Integrate Cornelius Diekmann LinuxDoom 1.10 WASM core',
        '[x] Add playable Windows Minesweeper with timer and smiley face',
        '[x] Add interactive MS-DOS command interpreter with history & matrix',
        '[x] Build multi-page 90s cyber lair at http://qurayshe.xd',
        '[x] Add prominent featured DOOM arcade hero badge with instant launch',
        '[x] Implement authentic retro Web Audio sound effects and MIDI jukebox',
        '[ ] Port software raymarched fractal demo in C to DOS 16-bit'
      ]
    };

    // 4. Minesweeper State
    this.minesweeperState = 'closed'; // 'closed', 'normal', 'minimized'
    this.minesweeperRect = { x: 332, y: 95, w: 360, h: 480 };
    this.minesweeperNormalRect = { x: 332, y: 95, w: 360, h: 480 };
    this.minesweeperIsDragging = false;
    this.minesweeperDragOffset = { x: 0, y: 0 };
    this.minesweeperFlagMode = false;
    this.minesweeperBestTime = 38;
    this.initMinesweeper();

    // 5. MS-DOS Command Prompt State
    this.cmdState = 'closed'; // 'closed', 'normal', 'minimized', 'maximized'
    this.cmdRect = { x: 250, y: 120, w: 580, h: 380 };
    this.cmdNormalRect = { x: 250, y: 120, w: 580, h: 380 };
    this.cmdIsDragging = false;
    this.cmdDragOffset = { x: 0, y: 0 };
    this.cmdInput = '';
    this.cmdHistoryList = [];
    this.cmdHistoryIndex = -1;
    this.cmdColor = '#22c55e'; // Default matrix green
    this.cmdHistory = [
      'Microsoft Windows XP [Version 5.1.2600]',
      '(C) Copyright 1985-2001 Microsoft Corp. All rights reserved.',
      '',
      'Type HELP for available commands, or click the quick action chips below.',
      ''
    ];

    // 6. My Computer / Windows Explorer State
    this.explorerState = 'closed'; // 'closed', 'normal', 'minimized', 'maximized'
    this.explorerRect = { x: 180, y: 90, w: 600, h: 420 };
    this.explorerNormalRect = { x: 180, y: 90, w: 600, h: 420 };
    this.explorerIsDragging = false;
    this.explorerDragOffset = { x: 0, y: 0 };
    this.explorerPath = 'My Computer';

    this.onResize = this.onResize.bind(this);

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 550;
    const height = this.container.clientHeight || 580;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    this.camera.position.set(0, 1.4, 24.5);

    // 2. Renderer with retro pixelization
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr * this.pixelRatioScale);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.domElement.style.imageRendering = 'pixelated';

    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.appendChild(this.renderer.domElement);

    // Chromatic Aberration Post-Processing Setup
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.chromaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uAmount: { value: 0.0032 }
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
          vec2 offset = (vUv - 0.5) * uAmount;
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

    // 3. Clean neutral illumination (Floating workstation, no dark shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
    dirLight.position.set(5, 12, 10);
    this.scene.add(dirLight);

    // 4. Build Retro PC Workstation Meshes
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
     AUDIO SYNTHESIZER & RETRO CHIPTUNE JUKEBOX
     -------------------------------------------------------------------------- */
  initAudio() {
    this.soundEnabled = false;
  }

  playBeep() {}
  playClick() {}
  playKeyboardClack() {}
  playFlag() {}
  playExplosion() {}
  playWin() {}
  playWhoosh() {}
  stepJukebox() {}

  // Audio disabled
  /* --------------------------------------------------------------------------
     MINESWEEPER LOGIC & APP CONTROLS
     -------------------------------------------------------------------------- */
  initMinesweeper() {
    this.minesweeperRows = 9;
    this.minesweeperCols = 9;
    this.minesweeperTotalMines = 10;
    this.minesweeperMinesLeft = 10;
    this.minesweeperTimer = 0;
    this.minesweeperStartTime = 0;
    this.minesweeperStatus = 'ready'; // 'ready', 'playing', 'won', 'dead'
    this.minesweeperSmiley = '🙂';
    this.minesweeperGrid = [];

    for (let r = 0; r < this.minesweeperRows; r++) {
      const row = [];
      for (let c = 0; c < this.minesweeperCols; c++) {
        row.push({
          mine: false,
          revealed: false,
          flagged: false,
          count: 0
        });
      }
      this.minesweeperGrid.push(row);
    }
  }

  resetMinesweeper() {
    this.initMinesweeper();
    this.playClick();
  }

  plantMines(safeR, safeC) {
    let placed = 0;
    while (placed < this.minesweeperTotalMines) {
      const r = Math.floor(Math.random() * this.minesweeperRows);
      const c = Math.floor(Math.random() * this.minesweeperCols);
      if (!this.minesweeperGrid[r][c].mine && !(r === safeR && c === safeC)) {
        this.minesweeperGrid[r][c].mine = true;
        placed++;
      }
    }
    // Calculate neighbor counts
    for (let r = 0; r < this.minesweeperRows; r++) {
      for (let c = 0; c < this.minesweeperCols; c++) {
        if (!this.minesweeperGrid[r][c].mine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < this.minesweeperRows && nc >= 0 && nc < this.minesweeperCols) {
                if (this.minesweeperGrid[nr][nc].mine) count++;
              }
            }
          }
          this.minesweeperGrid[r][c].count = count;
        }
      }
    }
    this.minesweeperStatus = 'playing';
    this.minesweeperStartTime = Date.now();
  }

  revealMinesweeperCell(r, c) {
    if (this.minesweeperStatus === 'won' || this.minesweeperStatus === 'dead') return;
    if (this.minesweeperStatus === 'ready') {
      this.plantMines(r, c);
    }
    const cell = this.minesweeperGrid[r][c];
    if (cell.flagged || cell.revealed) return;

    if (cell.mine) {
      cell.revealed = true;
      this.minesweeperStatus = 'dead';
      this.minesweeperSmiley = '😵';
      this.playExplosion();
      for (let i = 0; i < this.minesweeperRows; i++) {
        for (let j = 0; j < this.minesweeperCols; j++) {
          if (this.minesweeperGrid[i][j].mine) this.minesweeperGrid[i][j].revealed = true;
        }
      }
      return;
    }

    this.playClick();

    // Flood fill
    const queue = [[r, c]];
    cell.revealed = true;
    while (queue.length > 0) {
      const [currR, currC] = queue.shift();
      const currCell = this.minesweeperGrid[currR][currC];
      if (currCell.count === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr, nc = currC + dc;
            if (nr >= 0 && nr < this.minesweeperRows && nc >= 0 && nc < this.minesweeperCols) {
              const neighbor = this.minesweeperGrid[nr][nc];
              if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
                neighbor.revealed = true;
                if (neighbor.count === 0) queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    // Check win condition
    let unrevealedSafe = 0;
    for (let i = 0; i < this.minesweeperRows; i++) {
      for (let j = 0; j < this.minesweeperCols; j++) {
        if (!this.minesweeperGrid[i][j].mine && !this.minesweeperGrid[i][j].revealed) {
          unrevealedSafe++;
        }
      }
    }
    if (unrevealedSafe === 0) {
      this.minesweeperStatus = 'won';
      this.minesweeperSmiley = '😎';
      this.minesweeperMinesLeft = 0;
      this.playWin();
      const elapsed = Math.floor((Date.now() - this.minesweeperStartTime) / 1000);
      if (elapsed < this.minesweeperBestTime) {
        this.minesweeperBestTime = elapsed;
      }
    }
  }

  flagMinesweeperCell(r, c) {
    if (this.minesweeperStatus === 'won' || this.minesweeperStatus === 'dead') return;
    const cell = this.minesweeperGrid[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    if (cell.flagged) {
      this.minesweeperMinesLeft--;
      this.playFlag();
    } else {
      this.minesweeperMinesLeft++;
      this.playClick();
    }
  }

  /* --------------------------------------------------------------------------
     COMMAND PROMPT LOGIC
     -------------------------------------------------------------------------- */
  executeCmd(rawCmd) {
    const cmd = rawCmd.trim();
    if (!cmd) return;
    this.playKeyboardClack();
    this.cmdHistoryList.push(cmd);
    this.cmdHistoryIndex = -1;
    this.cmdHistory.push(`C:\\> ${cmd}`);
    const parts = cmd.split(' ');
    const lower = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (lower === 'cls') {
      this.cmdHistory = ['Microsoft Windows XP [Version 5.1.2600]', ''];
      return;
    }
    if (lower === 'help') {
      this.cmdHistory.push(
        'Supported Commands:',
        '  DIR       - List files and directories in C:\\',
        '  TYPE file - Display contents of a text file (README, CHEATS, SKILLS)',
        '  DOOM      - Launch id Software DOOM (1993) shareware engine',
        '  MINES     - Launch Windows Minesweeper',
        '  NOTEPAD   - Launch Notepad text editor',
        '  IE        - Launch Internet Explorer (qurayshe.xd)',
        '  EXPLORER  - Open My Computer file explorer',
        '  MATRIX    - Stream digital code rain',
        '  PING host - Test network latency to host',
        '  SYSINFO   - Display Athlon 64 & Voodoo5 hardware specs',
        '  TREE      - Graphical view of directory structure',
        '  COLOR xy  - Change console text color (e.g. COLOR 0A, 0C, 0E, 0F)',
        '  WHOAMI    - Print current user and workstation domain',
        '  DATE/TIME - Display current system time',
        '  VER       - Display Windows shell version',
        '  EXIT      - Close MS-DOS prompt window'
      );
    } else if (lower === 'dir') {
      this.cmdHistory.push(
        ' Volume in drive C is WINDOWS_XP',
        ' Volume Serial Number is 1337-BEEF',
        '',
        ' Directory of C:\\',
        '',
        'DOOM     EXE     6,843,809  10-14-93   4:20p DOOM.EXE',
        'WINMINE  EXE       118,272  08-24-01   9:50a WINMINE.EXE',
        'NOTEPAD  EXE        78,336  08-24-01   9:50a NOTEPAD.EXE',
        'QURAYSHE XD         45,056  10-24-04   2:15p QURAYSHE.XD',
        'README   TXT         4,096  10-29-26   1:00p README.TXT',
        'CHEATS   TXT         2,048  10-29-26   1:00p CHEATS.TXT',
        'SKILLS   TXT         3,120  10-29-26   1:00p SKILLS.TXT',
        'SPECS    TXT         2,840  10-29-26   1:00p SPECS.TXT',
        'TODO     TXT         1,024  10-29-26   1:00p TODO.TXT',
        '       9 File(s)      7,100,601 bytes',
        '       2 Dir(s)  38,204,119,040 bytes free'
      );
    } else if (lower === 'type') {
      const fName = arg.trim().toUpperCase();
      if (this.notepadDocs[fName]) {
        this.notepadDocs[fName].forEach(line => this.cmdHistory.push(line));
      } else {
        this.cmdHistory.push(`The system cannot find the file specified: '${arg}'`);
      }
    } else if (lower === 'doom') {
      this.cmdHistory.push('Initializing DOOM engine from C:\\DOOM\\DOOM.EXE...');
      this.openDoom();
    } else if (lower === 'mines' || lower === 'winmine') {
      this.cmdHistory.push('Starting WINMINE.EXE...');
      this.openMinesweeper();
    } else if (lower === 'notepad') {
      this.cmdHistory.push('Opening NOTEPAD.EXE...');
      this.openNotepad();
    } else if (lower === 'ie') {
      this.cmdHistory.push('Opening Internet Explorer at http://qurayshe.xd...');
      this.openIE();
    } else if (lower === 'explorer') {
      this.cmdHistory.push('Opening Windows Explorer...');
      this.openExplorer();
    } else if (lower === 'ping') {
      const target = arg || 'qurayshe.xd';
      this.cmdHistory.push(
        `Pinging ${target} [192.168.1.137] with 32 bytes of data:`,
        `Reply from 192.168.1.137: bytes=32 time=8ms TTL=128`,
        `Reply from 192.168.1.137: bytes=32 time=12ms TTL=128`,
        `Reply from 192.168.1.137: bytes=32 time=9ms TTL=128`,
        `Reply from 192.168.1.137: bytes=32 time=11ms TTL=128`,
        `Ping statistics: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`
      );
    } else if (lower === 'tree') {
      this.cmdHistory.push(
        'Folder PATH listing for volume WINDOWS_XP',
        'C:\\',
        '├── DOOM',
        '│   ├── DOOM1.WAD',
        '│   └── DOOM.EXE',
        '├── WINDOWS',
        '│   ├── SYSTEM32',
        '│   └── FONTS',
        '└── PROGRAM FILES',
        '    ├── INTERNET EXPLORER',
        '    └── ACCESSORIES'
      );
    } else if (lower === 'color') {
      const code = arg.trim().toUpperCase();
      if (code === '0A') this.cmdColor = '#22c55e'; // Green
      else if (code === '0C') this.cmdColor = '#ef4444'; // Red
      else if (code === '0E') this.cmdColor = '#f59e0b'; // Amber
      else if (code === '0F') this.cmdColor = '#ffffff'; // White
      else if (code === '1F') this.cmdColor = '#60a5fa'; // Blue
      else this.cmdColor = '#22c55e';
      this.cmdHistory.push(`Console text color set to ${code || 'default'}.`);
    } else if (lower === 'whoami') {
      this.cmdHistory.push('WORKSTATION\\qurayshe');
    } else if (lower === 'date') {
      this.cmdHistory.push(`Current date is: ${new Date().toLocaleDateString()}`);
    } else if (lower === 'time') {
      this.cmdHistory.push(`Current time is: ${new Date().toLocaleTimeString()}`);
    } else if (lower === 'echo') {
      this.cmdHistory.push(arg);
    } else if (lower === 'matrix') {
      this.cmdHistory.push(
        '01001100 01101111 01100001 01100100 01101001 01101110 01100111',
        'Wake up, Neo... The Matrix has you.',
        'Follow the white rabbit. 🐇',
        'Knock, knock, Neo.'
      );
    } else if (lower === 'sysinfo') {
      this.cmdHistory.push(
        'Host Name:                 RETRO-WORKSTATION',
        'OS Name:                   Microsoft Windows XP Professional',
        'OS Version:                5.1.2600 Service Pack 3 Build 2600',
        'Processor:                 AMD Athlon(tm) 64 Processor 3200+ ~2.2GHz',
        'Total Physical Memory:     1,024 MB DDR-400',
        'Graphics Card:             3dfx Voodoo5 5500 AGP (Dual VSA-100)',
        'Sound Card:                Sound Blaster 16 ISA',
        'Primary Display:           Sony Trinitron 19" Multiscan CRT (1024x768 @ 85Hz)'
      );
    } else if (lower === 'ver') {
      this.cmdHistory.push('Microsoft Windows XP [Version 5.1.2600]');
    } else if (lower === 'exit') {
      this.cmdState = 'closed';
    } else {
      this.cmdHistory.push(`'${cmd}' is not recognized as an internal or external command.`);
    }

    if (this.cmdHistory.length > 30) {
      this.cmdHistory = this.cmdHistory.slice(this.cmdHistory.length - 30);
    }
  }

  /* --------------------------------------------------------------------------
     WINDOW MANAGEMENT & APPLICATION OPENERS
     -------------------------------------------------------------------------- */
  bringToFront(winId) {
    const idx = this.windowOrder.indexOf(winId);
    if (idx !== -1) {
      this.windowOrder.splice(idx, 1);
    }
    this.windowOrder.push(winId);
    this.activeWindow = winId;
  }

  openIE() {
    this.winState = 'normal';
    this.bringToFront('ie');
    this.playWhoosh();
  }

  openDoom() {
    this.playWhoosh();
    if (this.doomState === 'closed') {
      this.doomState = 'loading';
      this.bringToFront('doom');

      if (!this.doomEngine.loaded) {
        this.doomEngine.load().then(() => {
          if (this.doomEngine.loaded) {
            this.doomState = 'normal';
            this.doomEngine.running = true;
            this.bringToFront('doom');
          } else {
            this.doomState = 'closed';
            this.activePopup = {
              title: 'DOOM Initialization Error',
              message: `Unable to load LinuxDoom 1.10 WASM binary.\n${this.doomEngine.loadError || 'Check assets/doom/doom.wasm.'}`
            };
          }
        }).catch((err) => {
          console.warn('DoomEngine load failed:', err);
          this.doomState = 'closed';
          this.activePopup = {
            title: 'DOOM Initialization Error',
            message: 'Unable to load LinuxDoom 1.10 WASM binary or DOOM1.WAD file.\nCheck assets/doom/.'
          };
        });
      } else {
        this.doomState = 'normal';
        this.doomEngine.running = true;
        this.bringToFront('doom');
      }
    } else {
      this.doomState = 'normal';
      this.bringToFront('doom');
    }
  }

  openMinesweeper() {
    this.minesweeperState = 'normal';
    this.bringToFront('minesweeper');
    this.playWhoosh();
  }

  openNotepad(tab = 'README.TXT') {
    this.notepadState = 'normal';
    this.notepadTab = tab;
    this.notepadScroll = 0;
    this.bringToFront('notepad');
    this.playWhoosh();
  }

  openCmd() {
    this.cmdState = 'normal';
    this.bringToFront('cmd');
    this.playWhoosh();
  }

  openExplorer(path = 'My Computer') {
    this.explorerState = 'normal';
    this.explorerPath = path;
    this.bringToFront('explorer');
    this.playWhoosh();
  }

  navigateToWebPage(page) {
    if (this.webPage === page) return;
    this.webPage = page;
    this.websiteScrollY = 0;
    this.webHistory = this.webHistory.slice(0, this.webHistoryIdx + 1);
    this.webHistory.push(page);
    this.webHistoryIdx = this.webHistory.length - 1;
    this.playClick();
  }

  getWindowState(winId) {
    if (winId === 'ie') return this.winState;
    if (winId === 'doom') return this.doomState;
    if (winId === 'minesweeper') return this.minesweeperState;
    if (winId === 'notepad') return this.notepadState;
    if (winId === 'cmd') return this.cmdState;
    if (winId === 'explorer') return this.explorerPath === 'closed' ? 'closed' : this.explorerState;
    return 'closed';
  }

  setWindowState(winId, state) {
    if (winId === 'ie') this.winState = state;
    else if (winId === 'doom') this.doomState = state;
    else if (winId === 'minesweeper') this.minesweeperState = state;
    else if (winId === 'notepad') this.notepadState = state;
    else if (winId === 'cmd') this.cmdState = state;
    else if (winId === 'explorer') this.explorerState = state;
  }


  /* --------------------------------------------------------------------------
     SCREEN RENDERING (WINDOWS XP CRT DISPLAY)
     -------------------------------------------------------------------------- */
  renderRetroScreen() {
    const ctx = this.screenCtx;
    if (!ctx) return;
    const W = 1024;
    const H = 768;

    // 1. Windows XP Bliss Wallpaper
    if (this.blissImg && this.blissImg.complete && this.blissImg.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.blissImg, 0, 0, W, H);
      ctx.restore();
    } else {
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

    // 2. Desktop Icons (Left side)
    const desktopIcons = [
      { sym: '🌐', name: 'Internet Explorer', id: 'ie' },
      { sym: '👹', name: 'DOOM.exe', id: 'doom' },
      { sym: '💣', name: 'Minesweeper', id: 'minesweeper' },
      { sym: '📝', name: 'Notepad', id: 'notepad' },
      { sym: '💻', name: 'Command Prompt', id: 'cmd' },
      { sym: '🖥️', name: 'My Computer', id: 'explorer' },
      { sym: '📁', name: 'My Documents', id: 'docs' },
      { sym: '🗑️', name: 'Recycle Bin', id: 'recycle' }
    ];

    desktopIcons.forEach((di, idx) => {
      const dix = 44;
      const diy = 18 + idx * 72;
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(di.sym, dix, diy + 25);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
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
    ctx.fillText('🖥️ 🌐 👹', 125, 754);

    // Dynamic Multi-Window Taskbar Tabs
    const openApps = [];
    if (this.winState !== 'closed') openApps.push({ id: 'ie', icon: '🌐', title: 'qurayshe.xd' });
    if (this.doomState !== 'closed') openApps.push({ id: 'doom', icon: '👹', title: this.doomState === 'loading' ? 'Loading DOOM...' : 'DOOM.EXE' });
    if (this.minesweeperState !== 'closed') openApps.push({ id: 'minesweeper', icon: '💣', title: 'Minesweeper' });
    if (this.notepadState !== 'closed') openApps.push({ id: 'notepad', icon: '📝', title: `${this.notepadTab} - Notepad` });
    if (this.cmdState !== 'closed') openApps.push({ id: 'cmd', icon: '💻', title: 'Command Prompt' });
    if (this.explorerState !== 'closed') openApps.push({ id: 'explorer', icon: '🖥️', title: 'My Computer' });

    const tabStartX = 176;
    const tabAvailW = 680;
    const tabW = Math.min(145, Math.floor(tabAvailW / Math.max(1, openApps.length)));
    const tabH = 30;
    const tabY = 734;

    this.renderedTaskbarTabs = [];

    openApps.forEach((app, i) => {
      const curTabX = tabStartX + i * (tabW + 4);
      const isActive = (this.activeWindow === app.id && this.getWindowState(app.id) !== 'minimized');
      this.renderedTaskbarTabs.push({ id: app.id, x: curTabX, y: tabY, w: tabW, h: tabH });

      if (isActive) {
        ctx.fillStyle = '#1446a8';
        ctx.fillRect(curTabX, tabY, tabW, tabH);
        ctx.strokeStyle = '#0e358b';
        ctx.strokeRect(curTabX, tabY, tabW, tabH);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(curTabX + 1, tabY + 1, tabW - 2, 2);
      } else {
        ctx.fillStyle = '#2365d9';
        ctx.fillRect(curTabX, tabY, tabW, tabH);
        ctx.strokeStyle = '#4b8cfc';
        ctx.strokeRect(curTabX, tabY, tabW, tabH);
      }
      ctx.font = '13px sans-serif';
      ctx.fillText(app.icon, curTabX + 6, tabY + 20);
      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(app.title.slice(0, 15), curTabX + 24, tabY + 19);
    });

    // System Tray (Right edge)
    const trayW = 136;
    const trayX = W - trayW - 6;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const trayGrad = ctx.createLinearGradient(0, tbY, 0, H);
    trayGrad.addColorStop(0, '#0e358b');
    trayGrad.addColorStop(1, '#1444ab');
    ctx.fillStyle = trayGrad;
    ctx.fillRect(trayX, tbY, trayW + 6, tbH);
    ctx.strokeStyle = '#092566';
    ctx.strokeRect(trayX, tbY, trayW + 6, tbH);

    ctx.font = '12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    const soundSym = '🔇';
    ctx.fillText(`${soundSym} 🛡️ ${timeStr}`, W - 10, 754);
    this.renderedTraySound = { x: trayX + 4, y: tbY, w: 26, h: tbH };

    // 4. Render Open Windows in Stacking Order (Z-Index)
    this.windowOrder.forEach((winId) => {
      if (winId === 'ie') {
        if (this.winState !== 'closed' && this.winState !== 'minimized') this.renderIEWindow(ctx, W, H);
      } else if (winId === 'doom') {
        if (this.doomState !== 'closed' && this.doomState !== 'minimized') this.renderDoomWindow(ctx, W, H);
      } else if (winId === 'minesweeper') {
        if (this.minesweeperState !== 'closed' && this.minesweeperState !== 'minimized') this.renderMinesweeperWindow(ctx, W, H);
      } else if (winId === 'notepad') {
        if (this.notepadState !== 'closed' && this.notepadState !== 'minimized') this.renderNotepadWindow(ctx, W, H);
      } else if (winId === 'cmd') {
        if (this.cmdState !== 'closed' && this.cmdState !== 'minimized') this.renderCmdWindow(ctx, W, H);
      } else if (winId === 'explorer') {
        if (this.explorerState !== 'closed' && this.explorerState !== 'minimized') this.renderExplorerWindow(ctx, W, H);
      }
    });

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
      ctx.fillText('qurayshe @ retro-workstation', smX + 60, smY + 34);

      // White Left Panel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(smX, smY + 54, 180, smH - 96);
      const leftItems = ['🌐 Internet Explorer', '👹 DOOM', '💣 Minesweeper', '📝 Notepad', '💻 Command Prompt'];
      ctx.font = '12px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      leftItems.forEach((it, i) => {
        ctx.fillText(it, smX + 10, smY + 84 + i * 40);
      });

      // Blue Right Panel
      ctx.fillStyle = '#d3e5fa';
      ctx.fillRect(smX + 180, smY + 54, smW - 180, smH - 96);
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

    // 6. Interactive Shutdown Dialog (If Open)
    if (this.shutdownOpen) {
      this.renderShutdownDialog(ctx, W, H);
    }

    // 7. Interactive Alert Dialog (If Triggered)
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
      ctx.fillText(this.activePopup.title || 'System Notice', px + 10, py + 18);

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

    // 8. Virtual Mouse Pointer
    if (this.screenPointer.active) {
      const mx = this.screenPointer.x;
      const my = this.screenPointer.y;

      const isHoveringControls = (
        this.startMenuOpen ||
        my >= 730 ||
        (mx <= 90 && my <= 600) ||
        (this.renderedTaskbarTabs && this.renderedTaskbarTabs.some(t => mx >= t.x && mx <= t.x + t.w && my >= t.y && my <= t.y + t.h)) ||
        (this.renderedNavLinks && this.renderedNavLinks.some(l => mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h)) ||
        (this.webPage === 'links' && this.renderedButtons && this.renderedButtons.some(b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h)) ||
        (this.webPage === 'home' && this.renderedDoomHeroBadge && mx >= this.renderedDoomHeroBadge.x && mx <= this.renderedDoomHeroBadge.x + this.renderedDoomHeroBadge.w && my >= this.renderedDoomHeroBadge.y && my <= this.renderedDoomHeroBadge.y + this.renderedDoomHeroBadge.h) ||
        (this.webPage === 'lab' && this.renderedLabButtons && this.renderedLabButtons.some(b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h)) ||
        (this.webPage === 'projects' && this.renderedProjectLinks && this.renderedProjectLinks.some(p => mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h)) ||
        (this.webPage === 'jukebox' && this.renderedJukeboxBtns && this.renderedJukeboxBtns.some(jb => mx >= jb.x && mx <= jb.x + jb.w && my >= jb.y && my <= jb.y + jb.h)) ||
        (this.renderedCmdChips && this.renderedCmdChips.some(c => mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h))
      );

      ctx.save();
      if (isHoveringControls) {
        if (this.handCursorImg && this.handCursorImg.complete && this.handCursorImg.naturalWidth > 0) {
          ctx.drawImage(this.handCursorImg, mx - 6, my);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(mx, my, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else {
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

    // 9. CRT Scanlines & Vignette
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let sy = 0; sy < H; sy += 3) {
      ctx.fillRect(0, sy, W, 1);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let sx = 0; sx < W; sx += 3) {
      ctx.fillRect(sx, 0, 1, H);
    }

    const tubeVignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, W * 0.68);
    tubeVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    tubeVignette.addColorStop(0.68, 'rgba(0, 5, 20, 0.10)');
    tubeVignette.addColorStop(0.9, 'rgba(0, 2, 12, 0.32)');
    tubeVignette.addColorStop(1, 'rgba(0, 0, 5, 0.65)');
    ctx.fillStyle = tubeVignette;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // =========================================================================
  // INTERNET EXPLORER & MINI-WEBSITE (qurayshe.xd)
  // =========================================================================
  renderIEWindow(ctx, W, H) {
    if (this.winState === 'minimized') return;

    // Reset page-specific hitboxes every frame so inactive subpages never retain buttons
    this.renderedDoomHeroBadge = null;
    this.renderedLabButtons = [];
    this.renderedProjectLinks = [];
    this.renderedJukeboxBtns = [];
    this.renderedButtons = [];
    this.renderedFilterChips = [];

    const isMax = (this.winState === 'maximized');
    const isActive = (this.activeWindow === 'ie');
    const wx = isMax ? 0 : this.winRect.x;
    const wy = isMax ? 0 : this.winRect.y;
    const ww = isMax ? W : this.winRect.w;
    const wh = isMax ? 730 : this.winRect.h;

    // Window shadow
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

    // Luna Blue Window Frame Border
    ctx.fillStyle = isActive ? '#0050e6' : '#5a78c4';
    ctx.fillRect(wx, wy, ww, wh);

    // Titlebar
    const titleH = 28;
    const tbWGrad = ctx.createLinearGradient(0, wy, 0, wy + titleH);
    if (isActive) {
      tbWGrad.addColorStop(0, '#0058ec');
      tbWGrad.addColorStop(0.35, '#3b88ff');
      tbWGrad.addColorStop(1, '#0047c8');
    } else {
      tbWGrad.addColorStop(0, '#7697e7');
      tbWGrad.addColorStop(0.35, '#8ba7ef');
      tbWGrad.addColorStop(1, '#6688dd');
    }
    ctx.fillStyle = tbWGrad;
    ctx.fillRect(wx + 2, wy + 2, ww - 4, titleH);

    // Title Icon & Label
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌐', wx + 8, wy + 20);

    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 2;
    ctx.fillText('qurayshe.xd - Microsoft Internet Explorer', wx + 28, wy + 19);
    ctx.shadowBlur = 0;

    // Window Buttons
    const btnY = wy + 4;
    const btnH = 20;
    const btnW = 20;
    const bxMin = wx + ww - 72;
    const bxMax = wx + ww - 48;
    const bxClose = wx + ww - 24;

    // Min
    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMin, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bxMin + 5, btnY + 13, 10, 2);

    // Max/Restore
    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMax, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bxMax + 4.5, btnY + 4.5, 11, 10);

    // Close
    ctx.fillStyle = '#dc2626';
    this.drawRoundRect(ctx, bxClose, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', bxClose + 10, btnY + 14);

    // Menu Bar (y = wy + 30, h = 22)
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, wy + 30, ww - 4, 22);
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText('File    Edit    View    Favorites    Tools    Help', wx + 12, wy + 45);

    // Toolbar (y = wy + 52, h = 32)
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, wy + 52, ww - 4, 32);
    ctx.strokeStyle = '#d0cdc0';
    ctx.beginPath();
    ctx.moveTo(wx + 2, wy + 52); ctx.lineTo(wx + ww - 2, wy + 52);
    ctx.stroke();

    // Circular Green Back Button
    ctx.fillStyle = this.webHistoryIdx > 0 ? '#22c55e' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(wx + 18, wy + 67, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('←', wx + 18, wy + 71);

    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.fillText('Back', wx + 34, wy + 71);
    ctx.fillText('→ Forward    ✕ Stop    ↻ Refresh    ⌂ Home    |    ⚲ Search    ★ Favorites    |    ⎙ Print', wx + 68, wy + 71);

    // Address Bar Row
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, wy + 84, ww - 4, 26);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillText('Address', wx + 12, wy + 101);

    const addrUrl = this.webPage === 'home' ? 'http://qurayshe.xd/' : `http://qurayshe.xd/${this.webPage}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx + 64, wy + 88, ww - 130, 20);
    ctx.strokeStyle = '#7f9db9';
    ctx.strokeRect(wx + 64, wy + 88, ww - 130, 20);

    ctx.fillStyle = '#0f172a';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText(addrUrl, wx + 72, wy + 102);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(wx + ww - 60, wy + 88, 52, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Go', wx + ww - 34, wy + 102);

    // Web Client Area
    const cx = wx + 2;
    const cy = wy + 110;
    const cw = ww - 4;
    const ch = wh - 136;

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy, cw, ch);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 1;
    for (let gx = cx; gx < cx + cw; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, cy); ctx.lineTo(gx, cy + ch); ctx.stroke();
    }
    for (let gy = cy; gy < cy + ch; gy += 40) {
      ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx + cw, gy); ctx.stroke();
    }

    const contentY = cy + 12 - this.websiteScrollY;

    // Mini-Website Header (qurayshe.xd)
    ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('qurayshe.xd', cx + cw / 2, contentY + 18);

    // Animated Marquee Ticker
    this.marqueeOffset = (this.marqueeOffset + 1.2) % (cw + 500);
    ctx.save();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx + 20, contentY + 28, cw - 40, 18);
    ctx.strokeStyle = '#ca8a04';
    ctx.strokeRect(cx + 20, contentY + 28, cw - 40, 18);
    ctx.beginPath();
    ctx.rect(cx + 22, contentY + 28, cw - 44, 18);
    ctx.clip();

    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#854d0e';
    ctx.textAlign = 'left';
    const tickerText = '★ WELCOME TO QURAYSHE\'S RETRO LAIR ★ OPTIMIZED FOR 1024x768 ★ PLAYABLE DOOM BADGE BELOW ★ HAND-CRAFTED HTML & C99 ★ RETRO MIDI JUKEBOX ACTIVE ★';
    ctx.fillText(tickerText, cx + cw - 20 - this.marqueeOffset, contentY + 41);
    ctx.restore();

    // Navigation Bar Links
    const navItems = ['Home', 'About', 'Projects', 'Lab', 'Links', 'Jukebox', 'Guestbook', 'Contact'];
    ctx.font = 'bold 12px "Times New Roman", Georgia, serif';
    const sepText = ' | ';
    const sepW = ctx.measureText(sepText).width;

    let totalNavW = 0;
    const itemWidths = navItems.map(item => {
      const w = ctx.measureText(item).width;
      totalNavW += w;
      return w;
    });
    totalNavW += (navItems.length - 1) * sepW;

    let curNavX = cx + (cw - totalNavW) / 2;
    const navY = contentY + 64;

    this.renderedNavLinks = [];

    navItems.forEach((item, idx) => {
      const itemW = itemWidths[idx];
      const pageKey = item.toLowerCase();
      const isCurrentPage = (this.webPage === pageKey);
      const isHovered = (
        this.screenPointer.active &&
        this.screenPointer.x >= curNavX &&
        this.screenPointer.x <= curNavX + itemW &&
        this.screenPointer.y >= navY - 14 &&
        this.screenPointer.y <= navY + 4
      );

      this.renderedNavLinks.push({
        text: item,
        page: pageKey,
        x: curNavX,
        y: navY - 14,
        w: itemW,
        h: 18
      });

      ctx.fillStyle = isCurrentPage ? '#b91c1c' : (isHovered ? '#cc0000' : '#0000ee');
      ctx.textAlign = 'left';
      ctx.fillText(item, curNavX, navY);

      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = isCurrentPage ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(curNavX, navY + 2);
      ctx.lineTo(curNavX + itemW, navY + 2);
      ctx.stroke();

      curNavX += itemW;
      if (idx < navItems.length - 1) {
        ctx.fillStyle = '#64748b';
        ctx.fillText(sepText, curNavX, navY);
        curNavX += sepW;
      }
    });

    // Beveled <hr>
    ctx.strokeStyle = '#808080';
    ctx.beginPath();
    ctx.moveTo(cx + 25, contentY + 76);
    ctx.lineTo(cx + cw - 25, contentY + 76);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx + 25, contentY + 77);
    ctx.lineTo(cx + cw - 25, contentY + 77);
    ctx.stroke();

    // Route Subpages
    if (this.webPage === 'home') {
      this.renderWebHomePage(ctx, cx, cy, cw, ch, contentY);
    } else if (this.webPage === 'about') {
      this.renderWebAboutPage(ctx, cx, cy, cw, ch, contentY);
    } else if (this.webPage === 'projects') {
      this.renderWebProjectsPage(ctx, cx, cy, cw, ch, contentY);
    } else if (this.webPage === 'lab') {
      this.renderWebLabPage(ctx, cx, cy, cw, ch, contentY);
    } else if (this.webPage === 'links') {
      this.renderWebLinksPage(ctx, cx, cy, cw, ch, contentY);
    } else if (this.webPage === 'jukebox') {
      this.renderWebJukeboxPage(ctx, cx, cy, cw, ch, contentY);
    } else if (this.webPage === 'guestbook') {
      this.renderWebGuestbookPage(ctx, cx, cy, cw, ch, contentY);
    } else if (this.webPage === 'contact') {
      this.renderWebContactPage(ctx, cx, cy, cw, ch, contentY);
    }

    ctx.restore(); // End clipping client area

    // Scrollbar
    const sbX = cx + cw - 16;
    const sbY = cy;
    const sbW = 16;
    const sbH = ch;

    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(sbX, sbY, sbW, sbH);
    ctx.strokeStyle = '#d0cdc0';
    ctx.strokeRect(sbX, sbY, sbW, sbH);

    const maxScroll = 550;
    const thumbH = 50;
    const thumbY = sbY + (this.websiteScrollY / maxScroll) * (sbH - thumbH);
    ctx.fillStyle = '#d4d0c8';
    ctx.fillRect(sbX + 1, thumbY, sbW - 2, thumbH);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(sbX + 1, thumbY, sbW - 2, thumbH);

    // Status Bar
    const stY = wy + wh - 24;
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, stY, ww - 4, 22);
    ctx.strokeStyle = '#d0cdc0';
    ctx.strokeRect(wx + 2, stY, ww - 4, 22);

    ctx.font = '11px Tahoma, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';

    const isHoveringDoomBadge = (
      this.webPage === 'home' &&
      this.renderedDoomHeroBadge &&
      this.screenPointer.active &&
      this.screenPointer.x >= this.renderedDoomHeroBadge.x &&
      this.screenPointer.x <= this.renderedDoomHeroBadge.x + this.renderedDoomHeroBadge.w &&
      this.screenPointer.y >= this.renderedDoomHeroBadge.y &&
      this.screenPointer.y <= this.renderedDoomHeroBadge.y + this.renderedDoomHeroBadge.h
    );

    if (isHoveringDoomBadge) {
      ctx.fillText('Launch application: C:\\DOOM\\DOOM.EXE [Click to play id Software DOOM 1993!]', wx + 12, stY + 15);
    } else {
      ctx.fillText(`http://qurayshe.xd/${this.webPage === 'home' ? '' : this.webPage} - Internet Zone`, wx + 12, stY + 15);
    }

    ctx.textAlign = 'right';
    ctx.fillText('Internet Zone | 100%', wx + ww - 14, stY + 15);

    ctx.restore();
  }

  // --- 1. HOME PAGE ---
  renderWebHomePage(ctx, cx, cy, cw, ch, contentY) {
    // STANDALONE PROMINENT FEATURED DOOM ARCADE HERO CARD
    const heroW = Math.min(cw - 60, 560);
    const heroH = 92;
    const heroX = cx + (cw - heroW) / 2;
    const heroY = contentY + 90;

    const timeMs = performance.now();
    const pulse = 0.5 + 0.5 * Math.sin(timeMs * 0.006);
    const borderCol = pulse > 0.5 ? '#f59e0b' : '#dc2626';

    ctx.save();
    ctx.fillStyle = '#0f172a';
    this.drawRoundRect(ctx, heroX, heroY, heroW, heroH, 6);
    ctx.fill();
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 2.4;
    this.drawRoundRect(ctx, heroX, heroY, heroW, heroH, 6);
    ctx.stroke();

    // Hero Top Header
    const cHeaderGrad = ctx.createLinearGradient(heroX, heroY, heroX + heroW, heroY);
    cHeaderGrad.addColorStop(0, '#991b1b');
    cHeaderGrad.addColorStop(0.5, '#dc2626');
    cHeaderGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = cHeaderGrad;
    this.drawRoundRect(ctx, heroX, heroY, heroW, 24, [6, 6, 0, 0]);
    ctx.fill();

    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 FEATURED RETRO GAME: ID SOFTWARE DOOM (1993) 🔥', heroX + heroW / 2, heroY + 16);

    // Enlarged DOOM Badge (160x54 px - Big & Distinct!)
    const dbW = 160;
    const dbH = 54;
    const dbX = heroX + 14;
    const dbY = heroY + 28;

    const doomImg = this.retroButtonImages['doomrl.gif'];
    if (doomImg && doomImg.complete && doomImg.naturalWidth > 0) {
      ctx.drawImage(doomImg, dbX, dbY, dbW, dbH);
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(dbX, dbY, dbW, dbH);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('👹 DOOM', dbX + dbW / 2, dbY + 34);
    }
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(dbX, dbY, dbW, dbH);

    this.renderedDoomHeroBadge = { x: heroX, y: heroY, w: heroW, h: heroH };

    // Card Text
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Tahoma, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('C:\\DOOM\\DOOM.EXE (Shareware v1.10)', dbX + dbW + 16, dbY + 18);

    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Pure C & WebAssembly Engine • 640x400 CRT Canvas', dbX + dbW + 16, dbY + 34);

    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = pulse > 0.5 ? '#f87171' : '#fde047';
    ctx.fillText('▶ CLICK BADGE TO PLAY IN RETRO PC ◀', dbX + dbW + 16, dbY + 50);
    ctx.restore();

    // Bio & Webmaster Card
    const bioY = heroY + heroH + 18;
    ctx.font = 'italic 13px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText('Greetings fellow traveler! Welcome to my retro cyber lair.', cx + cw / 2, bioY);
    ctx.fillText('Low-level systems programming, 3D software rendering, compilers, and demoscene tech.', cx + cw / 2, bioY + 18);

    // Hit Counter
    const cntY = bioY + 38;
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`You are visitor number: [ 0 4 2 1 3 9 ] • Status: 🟢 Online (Writing C99 / Listening to Chiptunes)`, cx + cw / 2, cntY);

    // What's New Box
    const wnY = cntY + 18;
    const wnW = Math.min(cw - 80, 560);
    const wnX = cx + (cw - wnW) / 2;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(wnX, wnY, wnW, 94);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(wnX, wnY, wnW, 94);

    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillStyle = '#0369a1';
    ctx.textAlign = 'left';
    ctx.fillText('★ WHAT\'S NEW IN CYBERSPACE (UPDATE LOG)', wnX + 12, wnY + 18);

    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText('[24-Oct-2004] - Added standalone playable DOOM badge with instant launch!', wnX + 12, wnY + 36);
    ctx.fillText('[18-Oct-2004] - Built-in retro Web Audio MIDI Jukebox with bouncing spectrum.', wnX + 12, wnY + 54);
    ctx.fillText('[12-Oct-2004] - Playable Minesweeper & Command Prompt added to desktop.', wnX + 12, wnY + 72);
    ctx.fillText('[01-Aug-2004] - Uploaded fixed-point 3D software rasterizer demo in ANSI C.', wnX + 12, wnY + 90);

    // Webring Banner
    const ringY = wnY + 112;
    ctx.font = '11px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('[ << Prev ] • [ The Low-Level Systems Webring (#42) ] • [ Next >> ] • [ Random Site ]', cx + cw / 2, ringY);
  }

  // --- 2. ABOUT PAGE ---
  renderWebAboutPage(ctx, cx, cy, cw, ch, contentY) {
    const startY = contentY + 90;
    const tblW = Math.min(cw - 60, 580);
    const tblX = cx + (cw - tblW) / 2;

    ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('About the Webmaster & Retro Workstation Rig', cx + cw / 2, startY);

    // Bio Manifesto Box
    const mY = startY + 14;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(tblX, mY, tblW, 80);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(tblX, mY, tblW, 80);

    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'left';
    ctx.fillText('CREED & SYSTEMS PHILOSOPHY', tblX + 12, mY + 18);

    ctx.font = '11px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('I believe in mechanical sympathy, cache-oblivious data layouts, and clean low-level code.', tblX + 12, mY + 36);
    ctx.fillText('From bare-metal x86 paging to SIMD packet ray tracing and pure software rasterization,', tblX + 12, mY + 52);
    ctx.fillText('computing is at its best when every byte and clock cycle is respected.', tblX + 12, mY + 68);

    // Hardware Specs Table (Late-90s HTML Table with Bevels)
    const tY = mY + 92;
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Workstation Hardware Specifications (ASUS A8V Deluxe)', tblX, tY);

    const rows = [
      ['Processor (CPU)', 'AMD Athlon 64 3200+ (ClawHammer 2.2 GHz, 1MB L2)'],
      ['Mainboard', 'ASUS A8V Deluxe (VIA K8T800 Pro / VT8237 Chipset)'],
      ['Memory (RAM)', '1024 MB Dual-Channel DDR-400 PC-3200 (CL 2.5-3-3-6)'],
      ['Graphics (GPU)', '3dfx Voodoo5 5500 AGP 64MB (Dual VSA-100 Processors)'],
      ['Sound Card', 'Creative Sound Blaster 16 ISA (DSP v4.13, Yamaha OPL3)'],
      ['Primary CRT', 'Sony Trinitron Multiscan 19" (1024x768 @ 85Hz Aperture Grille)'],
      ['Operating System', 'Microsoft Windows XP Professional Service Pack 3']
    ];

    const rowH = 22;
    const tableTop = tY + 8;

    // Header Row
    ctx.fillStyle = '#000080';
    ctx.fillRect(tblX, tableTop, tblW, 22);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(tblX, tableTop, tblW, 22);

    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('Component', tblX + 10, tableTop + 15);
    ctx.fillText('Hardware Specification', tblX + 180, tableTop + 15);

    // Rows
    rows.forEach((r, idx) => {
      const ry = tableTop + 22 + idx * rowH;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f1f5f9';
      ctx.fillRect(tblX, ry, tblW, rowH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(tblX, ry, tblW, rowH);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(r[0], tblX + 10, ry + 15);

      ctx.font = '11px Tahoma, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(r[1], tblX + 180, ry + 15);
    });

    // Retro Badges at bottom of About
    const bY = tableTop + 22 + rows.length * rowH + 16;
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('[ Best Viewed in Microsoft Internet Explorer 6.0 at 1024x768 with 32-bit Color ]', cx + cw / 2, bY);
  }

  // --- 3. PROJECTS PAGE ---
  renderWebProjectsPage(ctx, cx, cy, cw, ch, contentY) {
    const startY = contentY + 90;
    const tblW = Math.min(cw - 60, 580);
    const tblX = cx + (cw - tblW) / 2;

    ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('Featured Software & Systems Projects (1998-2004)', cx + cw / 2, startY);

    // Filter Chips
    const fY = startY + 12;
    const catChips = [
      { id: 'all', label: 'All Projects' },
      { id: 'graphics', label: '3D Graphics' },
      { id: 'systems', label: 'Systems & OS' }
    ];
    let chipX = tblX;
    this.renderedFilterChips = [];

    catChips.forEach(c => {
      const cW = 100;
      const isSel = (this.projectCategory === c.id);
      ctx.fillStyle = isSel ? '#2563eb' : '#e2e8f0';
      ctx.fillRect(chipX, fY, cW, 20);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(chipX, fY, cW, 20);

      ctx.font = 'bold 10px Tahoma, sans-serif';
      ctx.fillStyle = isSel ? '#ffffff' : '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, chipX + cW / 2, fY + 14);

      this.renderedFilterChips.push({ id: c.id, x: chipX, y: fY, w: cW, h: 20 });
      chipX += cW + 10;
    });

    const allProjs = [
      { cat: 'graphics', name: 'Software 3D Rasterizer (C99)', desc: 'Pure software pipeline with sub-pixel barycentrics, 16-bit z-buffer, and affine textures.', file: 'SKILLS.TXT', action: 'notepad' },
      { cat: 'graphics', name: 'C++20 BVH Packet Raytracer', desc: 'Multithreaded raytracer with SIMD AVX2 acceleration and Möller–Trumbore intersection.', file: 'SKILLS.TXT', action: 'notepad' },
      { cat: 'systems', name: 'Autonomous x86 Micro-Kernel', desc: '32-bit x86 kernel with virtual memory paging, GDT/IDT tables, and VGA text driver.', file: 'README.TXT', action: 'notepad' },
      { cat: 'systems', name: 'Neural Compute Graph & Autodiff', desc: 'Scalar and tensor reverse-mode automatic differentiation engine from first principles in C.', file: 'TODO.TXT', action: 'notepad' },
      { cat: 'graphics', name: 'Cornelius LinuxDoom 1.10 WASM', desc: 'Playable shareware DOOM engine running live on retro PC CRT display.', file: 'DOOM', action: 'doom' }
    ];

    const projs = allProjs.filter(p => this.projectCategory === 'all' || p.cat === this.projectCategory);

    this.renderedProjectLinks = [];

    projs.forEach((p, idx) => {
      const py = fY + 28 + idx * 64;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(tblX, py, tblW, 56);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(tblX, py, tblW, 56);

      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = '#1e40af';
      ctx.textAlign = 'left';
      ctx.fillText(p.name, tblX + 12, py + 18);

      ctx.font = '11px Tahoma, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(p.desc, tblX + 12, py + 36);

      const btnW = 120;
      const btnH = 22;
      const btnX = tblX + tblW - btnW - 10;
      const btnY = py + 16;

      ctx.fillStyle = p.action === 'doom' ? '#fef08a' : '#e2e8f0';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = p.action === 'doom' ? '#ca8a04' : '#64748b';
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.font = 'bold 10px Tahoma, sans-serif';
      ctx.fillStyle = p.action === 'doom' ? '#854d0e' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(p.action === 'doom' ? '👹 Play in DOOM' : '📄 View in Notepad', btnX + btnW / 2, btnY + 15);

      this.renderedProjectLinks.push({ x: btnX, y: btnY, w: btnW, h: btnH, file: p.file, action: p.action });
    });
  }

  // --- 4. LAB PAGE ---
  renderWebLabPage(ctx, cx, cy, cw, ch, contentY) {
    const startY = contentY + 90;
    ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('Interactive Retro Graphics & Demoscene Lab', cx + cw / 2, startY);

    const canvasW = Math.min(cw - 80, 520);
    const canvasH = 155;
    const canvasX = cx + (cw - canvasW) / 2;
    const canvasY = startY + 16;

    ctx.fillStyle = '#000000';
    ctx.fillRect(canvasX, canvasY, canvasW, canvasH);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasX, canvasY, canvasW, canvasH);

    const t = performance.now() * 0.001 * this.labSpeed;

    if (this.labEffect === 'plasma') {
      const palCols = this.labPalette === 'green' ? ['#052e16', '#15803d', '#4ade80', '#bbf7d0'] :
                      this.labPalette === 'amber' ? ['#451a03', '#b45309', '#f59e0b', '#fef3c7'] :
                      this.labPalette === 'fire'  ? ['#450a0a', '#b91c1c', '#f97316', '#fef08a'] :
                      ['#1e1b4b', '#4338ca', '#ec4899', '#38bdf8'];

      for (let px = 0; px < canvasW; px += 20) {
        for (let py = 0; py < canvasH; py += 15) {
          const val = Math.sin(px * 0.04 + t) + Math.sin(py * 0.05 + t * 1.3) + Math.sin((px + py) * 0.03 + t * 0.7);
          const colIdx = Math.floor(((val + 3) / 6) * palCols.length) % palCols.length;
          ctx.fillStyle = palCols[colIdx];
          ctx.fillRect(canvasX + px, canvasY + py, 19, 14);
        }
      }
    } else if (this.labEffect === 'matrix') {
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = this.labPalette === 'amber' ? '#f59e0b' : (this.labPalette === 'fire' ? '#ef4444' : '#22c55e');
      ctx.textAlign = 'left';
      const chars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈ';
      for (let col = 0; col < canvasW; col += 18) {
        const dropY = ((t * 80 + col * 12) % canvasH);
        const char = chars[Math.floor(Math.abs(Math.sin(col + t)) * chars.length) % chars.length];
        ctx.fillText(char, canvasX + col + 4, canvasY + dropY);
      }
    } else if (this.labEffect === 'fire') {
      // Demoscene Fire Simulation
      for (let fx = 0; fx < canvasW; fx += 16) {
        const heat = Math.sin(fx * 0.1 + t * 4) * 0.5 + 0.5;
        const col = heat > 0.6 ? '#fef08a' : (heat > 0.3 ? '#f97316' : '#991b1b');
        const h = Math.round(heat * (canvasH - 20) + 20);
        ctx.fillStyle = col;
        ctx.fillRect(canvasX + fx, canvasY + canvasH - h, 14, h);
      }
    } else if (this.labEffect === 'starfield') {
      // 3D Starfield Warp
      for (let i = 0; i < 60; i++) {
        const z = ((i * 37 + t * 120) % 500) / 500;
        const sx = canvasX + canvasW / 2 + Math.cos(i * 1.7) * (1 - z) * (canvasW / 2);
        const sy = canvasY + canvasH / 2 + Math.sin(i * 2.3) * (1 - z) * (canvasH / 2);
        const sz = Math.max(1, (1 - z) * 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, sz, sz);
      }
    } else {
      // 3D Wireframe Cube
      const cx3 = canvasX + canvasW / 2;
      const cy3 = canvasY + canvasH / 2;
      const size = 44;
      const rot = t * 1.5;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      const verts = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ].map(([vx, vy, vz]) => {
        const rx = vx * cosR - vz * sinR;
        const rz = vx * sinR + vz * cosR;
        const d = 3.2 / (3.2 + rz);
        return [cx3 + rx * size * d, cy3 + vy * size * d];
      });

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      ctx.strokeStyle = this.labPalette === 'green' ? '#22c55e' : (this.labPalette === 'amber' ? '#f59e0b' : '#38bdf8');
      ctx.lineWidth = 1.8;
      edges.forEach(([v1, v2]) => {
        ctx.beginPath();
        ctx.moveTo(verts[v1][0], verts[v1][1]);
        ctx.lineTo(verts[v2][0], verts[v2][1]);
        ctx.stroke();
      });
    }

    const btnRowY = canvasY + canvasH + 14;
    this.renderedLabButtons = [
      { id: 'fx', label: `Mode: ${this.labEffect.toUpperCase()}`, x: canvasX, y: btnRowY, w: 140, h: 26 },
      { id: 'palette', label: `Palette: ${this.labPalette.toUpperCase()}`, x: canvasX + 150, y: btnRowY, w: 150, h: 26 },
      { id: 'speed', label: `Speed: ${this.labSpeed}x`, x: canvasX + 310, y: btnRowY, w: 100, h: 26 }
    ];

    this.renderedLabButtons.forEach(btn => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + 17);
    });
  }

  // --- 5. LINKS & BADGES WALL ---
  renderWebLinksPage(ctx, cx, cy, cw, ch, contentY) {
    const startY = contentY + 90;
    ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('World Wide Web Directory & 88x31 Badges', cx + cw / 2, startY);

    const fW = Math.min(cw - 80, 520);
    const fH = 50;
    const fX = cx + (cw - fW) / 2;
    const fY = startY + 14;

    ctx.fillStyle = '#450a0a';
    ctx.fillRect(fX, fY, fW, fH);
    ctx.strokeStyle = '#dc2626';
    ctx.strokeRect(fX, fY, fW, fH);

    const doomImg = this.retroButtonImages['doomrl.gif'];
    if (doomImg && doomImg.complete && doomImg.naturalWidth > 0) {
      ctx.drawImage(doomImg, fX + 10, fY + 9, 88, 31);
    }
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'left';
    ctx.fillText('FEATURED: DOOM (1993) [Click to launch in emulator!]', fX + 110, fY + 24);
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Cornelius Diekmann LinuxDoom 1.10 WASM core', fX + 110, fY + 40);

    const btnCols = 5;
    const badgeW = 88;
    const badgeH = 31;
    const gapX = 14;
    const gapY = 10;
    const gridTotalW = btnCols * badgeW + (btnCols - 1) * gapX;
    const gridStartX = cx + (cw - gridTotalW) / 2;
    const gridStartY = fY + fH + 16;

    this.renderedButtons = [];
    this.renderedButtons.push({ x: fX, y: fY, w: fW, h: fH, btn: { file: 'doomrl.gif', title: 'Doom Roguelike' } });

    for (let i = 0; i < this.retroButtonsList.length; i++) {
      const bInfo = this.retroButtonsList[i];
      const col = i % btnCols;
      const row = Math.floor(i / btnCols);
      const bx = gridStartX + col * (badgeW + gapX);
      const by = gridStartY + row * (badgeH + gapY);

      this.renderedButtons.push({ x: bx, y: by, w: badgeW, h: badgeH, btn: bInfo });

      const img = this.retroButtonImages[bInfo.file];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, bx, by, badgeW, badgeH);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx, by, badgeW, badgeH);
        ctx.font = 'bold 9px Tahoma, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(bInfo.title.slice(0, 10), bx + badgeW / 2, by + badgeH / 2 + 3);
      }
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.strokeRect(bx, by, badgeW, badgeH);
    }
  }

  // --- 6. MIDI JUKEBOX PAGE ---
  renderWebJukeboxPage(ctx, cx, cy, cw, ch, contentY) {
    const startY = contentY + 90;
    ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('Retro Web Audio MIDI & Chiptune Jukebox', cx + cw / 2, startY);

    const jkW = Math.min(cw - 80, 520);
    const jkX = cx + (cw - jkW) / 2;
    const jkY = startY + 16;

    // Jukebox Visualizer Container
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(jkX, jkY, jkW, 160);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(jkX, jkY, jkW, 160);

    // Spectrum Equalizer Bouncing Bars
    const barCount = 16;
    const barW = Math.floor((jkW - 40) / barCount);
    const t = performance.now() * 0.005;

    for (let b = 0; b < barCount; b++) {
      const bx = jkX + 20 + b * barW;
      const h = this.jukeboxPlaying
        ? Math.abs(Math.sin(t + b * 0.5) * 60 + Math.cos(t * 1.8 + b * 0.3) * 30 + 10)
        : 6;
      const by = jkY + 100 - h;

      const barGrad = ctx.createLinearGradient(0, by, 0, jkY + 100);
      barGrad.addColorStop(0, '#38bdf8');
      barGrad.addColorStop(0.5, '#22c55e');
      barGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = barGrad;
      ctx.fillRect(bx + 2, by, barW - 4, h);
    }

    // Now Playing Track Info
    const curTrack = this.jukeboxTracks[this.jukeboxTrack];
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(`▶ [${this.jukeboxPlaying ? 'PLAYING' : 'PAUSED'}] ${curTrack.name}`, jkX + jkW / 2, jkY + 124);

    ctx.font = '10px Tahoma, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Author: ${curTrack.author} • Tempo: ${curTrack.bpm} BPM • Web Audio Synth`, jkX + jkW / 2, jkY + 142);

    // Control Buttons Row
    const bY = jkY + 172;
    this.renderedJukeboxBtns = [
      { id: 'play', label: this.jukeboxPlaying ? '⏸ PAUSE' : '▶ PLAY', x: jkX, y: bY, w: 100, h: 28 },
      { id: 'next', label: '⏭ NEXT TRACK', x: jkX + 110, y: bY, w: 120, h: 28 },
      { id: 'stop', label: '⏹ STOP', x: jkX + 240, y: bY, w: 90, h: 28 },
      { id: 'mute', label: this.soundEnabled ? '🔊 MUTE' : '🔇 UNMUTE', x: jkX + 340, y: bY, w: 110, h: 28 }
    ];

    this.renderedJukeboxBtns.forEach(btn => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + 18);
    });
  }

  // --- 7. GUESTBOOK PAGE ---
  renderWebGuestbookPage(ctx, cx, cy, cw, ch, contentY) {
    const startY = contentY + 90;
    ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('★ Qurayshe\'s Cyber Guestbook ★', cx + cw / 2, startY);

    const gbW = Math.min(cw - 60, 560);
    const gbX = cx + (cw - gbW) / 2;

    const signBtnW = 180;
    const signBtnH = 28;
    const signBtnX = cx + (cw - signBtnW) / 2;
    const signBtnY = startY + 12;

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(signBtnX, signBtnY, signBtnW, signBtnH);
    ctx.strokeStyle = '#ca8a04';
    ctx.strokeRect(signBtnX, signBtnY, signBtnW, signBtnH);

    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#854d0e';
    ctx.textAlign = 'center';
    ctx.fillText('✍ Sign the Guestbook!', signBtnX + signBtnW / 2, signBtnY + 18);

    this.renderedGuestbookBtn = { x: signBtnX, y: signBtnY, w: signBtnW, h: signBtnH };

    this.guestbookEntries.forEach((entry, idx) => {
      const ey = signBtnY + signBtnH + 14 + idx * 56;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(gbX, ey, gbW, 48);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(gbX, ey, gbW, 48);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = '#0369a1';
      ctx.textAlign = 'left';
      ctx.fillText(`${entry.name} (${entry.loc}) - ${entry.date}`, gbX + 10, ey + 16);

      ctx.font = 'italic 11px "Times New Roman", Georgia, serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`"${entry.msg}"`, gbX + 10, ey + 36);
    });
  }

  // --- 8. CONTACT PAGE ---
  renderWebContactPage(ctx, cx, cy, cw, ch, contentY) {
    const startY = contentY + 90;
    ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('Electronic Mail & Instant Messaging Contacts', cx + cw / 2, startY);

    const cW = Math.min(cw - 80, 520);
    const cX = cx + (cw - cW) / 2;
    const cY = startY + 16;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cX, cY, cW, 160);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(cX, cY, cW, 160);

    const contacts = [
      '🌸 ICQ UIN: 48151623 (Online Status: Available)',
      '💬 MSN Messenger: qurayshe@retro-net.org',
      '📡 IRC: #graphics-dev on EFnet & DALnet (nick: qurayshe)',
      '✉️ Email: webmaster@qurayshe.xd',
      '🔑 PGP Public Key: 0x9F42B108E67C9241'
    ];

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    contacts.forEach((c, idx) => {
      ctx.fillText(c, cX + 16, cY + 28 + idx * 26);
    });
  }

  // =========================================================================
  // APPLICATION WINDOW 1: DOOM (1993)
  // =========================================================================
  renderDoomWindow(ctx, W, H) {
    if (this.doomState === 'closed' || this.doomState === 'minimized') return;

    if (this.doomState === 'loading') {
      const dw = 460, dh = 190;
      const dx = Math.round((W - dw) / 2);
      const dy = Math.round((H - dh) / 2);

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(dx + 4, dy + 4, dw, dh);
      ctx.fillStyle = '#ece9d8';
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = '#0055ea';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx, dy, dw, dh);

      ctx.fillStyle = '#0055ea';
      ctx.fillRect(dx + 2, dy + 2, dw - 4, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DOOM (1993) - Initializing Engine...', dx + 10, dy + 18);

      ctx.fillStyle = '#0f172a';
      ctx.font = '12px Tahoma, sans-serif';
      ctx.fillText('Fetching LinuxDoom 1.10 WASM & DOOM1.WAD (4.2 MB)...', dx + 20, dy + 65);
      ctx.fillText('Compiling pure C software renderer with Emscripten core.', dx + 20, dy + 85);

      const pbX = dx + 20;
      const pbY = dy + 105;
      const pbW = dw - 40;
      const pbH = 20;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pbX, pbY, pbW, pbH);
      ctx.strokeStyle = '#7f9db9';
      ctx.strokeRect(pbX, pbY, pbW, pbH);

      const prog = (Math.sin(performance.now() * 0.004) * 0.5 + 0.5) * pbW;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(pbX + 2, pbY + 2, prog, pbH - 4);

      const btnX = dx + dw - 95;
      const btnY = dy + dh - 36;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(btnX, btnY, 75, 24);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(btnX, btnY, 75, 24);
      ctx.fillStyle = '#0f172a';
      ctx.font = '11px Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cancel', btnX + 37, btnY + 16);
      ctx.restore();
      return;
    }

    const isMax = (this.doomState === 'maximized');
    const isActive = (this.activeWindow === 'doom');
    const dwx = isMax ? 0 : this.doomRect.x;
    const dwy = isMax ? 0 : this.doomRect.y;
    const dww = isMax ? W : this.doomRect.w;
    const dwh = isMax ? 730 : this.doomRect.h;

    ctx.save();
    ctx.fillStyle = '#ece9d8';
    this.drawRoundRect(ctx, dwx, dwy, dww, dwh, isMax ? 0 : [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = isActive ? '#0050e6' : '#5a78c4';
    this.drawRoundRect(ctx, dwx, dwy, dww, dwh, isMax ? 0 : [6, 6, 0, 0]);
    ctx.stroke();

    const titleH = 26;
    const tbGrad = ctx.createLinearGradient(0, dwy, 0, dwy + titleH);
    tbGrad.addColorStop(0, isActive ? '#0058ec' : '#7697e7');
    tbGrad.addColorStop(0.35, isActive ? '#3b88ff' : '#8ba7ef');
    tbGrad.addColorStop(1, isActive ? '#0047c8' : '#6688dd');
    ctx.fillStyle = tbGrad;
    this.drawRoundRect(ctx, dwx + 2, dwy + 2, dww - 4, titleH, isMax ? 0 : [4, 4, 0, 0]);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px sans-serif';
    ctx.fillText('👹', dwx + 8, dwy + 19);
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DOOM (1993) - LinuxDoom 1.10 WASM', dwx + 28, dwy + 18);

    // Buttons
    const btnY = dwy + 4;
    const btnW = 18;
    const btnH = 18;
    const bxMin = dwx + dww - 72;
    const bxMax = dwx + dww - 48;
    const bxClose = dwx + dww - 24;

    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMin, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bxMin + 4, btnY + 12, 10, 2);

    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMax, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bxMax + 4, btnY + 4, 10, 10);

    ctx.fillStyle = '#dc2626';
    this.drawRoundRect(ctx, bxClose, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', bxClose + 9, btnY + 13);

    // Render Canvas
    const canX = dwx + 2;
    const canY = dwy + titleH + 2;
    const canW = dww - 4;
    const canH = dwh - titleH - 24;

    if (this.doomEngine && this.doomEngine.canvas) {
      ctx.drawImage(this.doomEngine.canvas, canX, canY, canW, canH);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(canX, canY, canW, canH);
    }

    // Status Bar
    const sbY = dwy + dwh - 20;
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(dwx + 2, sbY, dww - 4, 18);
    ctx.font = '10px Tahoma, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'left';
    ctx.fillText('WASD/Arrows: Move | Ctrl/Space: Fire | Click Window to Play', dwx + 8, sbY + 13);
    ctx.restore();
  }

  // =========================================================================
  // APPLICATION WINDOW 2: MINESWEEPER (winmine.exe)
  // =========================================================================
  renderMinesweeperWindow(ctx, W, H) {
    if (this.minesweeperState === 'closed' || this.minesweeperState === 'minimized') return;

    const isActive = (this.activeWindow === 'minesweeper');
    const wx = this.minesweeperRect.x;
    const wy = this.minesweeperRect.y;
    const ww = this.minesweeperRect.w;
    const wh = this.minesweeperRect.h;

    ctx.save();
    // Clip the entire window frame so contents never spill out
    this.drawRoundRect(ctx, wx, wy, ww, wh, [6, 6, 0, 0]);
    ctx.clip();

    // Dialog background
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx, wy, ww, wh);

    // Luna Blue Window Frame Border
    ctx.strokeStyle = isActive ? '#0050e6' : '#5a78c4';
    ctx.lineWidth = 1;
    ctx.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);

    // Luna Blue Titlebar
    const titleH = 26;
    const tbGrad = ctx.createLinearGradient(0, wy, 0, wy + titleH);
    tbGrad.addColorStop(0, isActive ? '#0058ec' : '#7697e7');
    tbGrad.addColorStop(0.35, isActive ? '#3b88ff' : '#8ba7ef');
    tbGrad.addColorStop(1, isActive ? '#0047c8' : '#6688dd');
    ctx.fillStyle = tbGrad;
    ctx.fillRect(wx + 1, wy + 1, ww - 2, titleH);

    // Titlebar Icon & Text (Explicit left alignment & alphabetic baseline)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px sans-serif';
    ctx.fillText('💣', wx + 8, wy + 19);

    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Minesweeper', wx + 28, wy + 18);

    // Close and Min Buttons
    const btnY = wy + 4;
    const btnW = 18;
    const btnH = 18;
    const bxMin = wx + ww - 44;
    const bxClose = wx + ww - 22;

    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMin, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bxMin + 4, btnY + 12, 10, 2);

    ctx.fillStyle = '#dc2626';
    this.drawRoundRect(ctx, bxClose, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', bxClose + 9, btnY + 13);

    // Menu Bar
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, wy + titleH + 1, ww - 4, 20);
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText('Game    Help', wx + 10, wy + titleH + 15);

    // Sunken Header Panel
    const panX = wx + 14;
    const panY = wy + titleH + 24;
    const panW = ww - 28;
    const panH = 48;

    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(panX, panY, panW, panH);
    ctx.fillStyle = '#808080'; ctx.fillRect(panX, panY, panW, 2); ctx.fillRect(panX, panY, 2, panH);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(panX, panY + panH - 2, panW, 2); ctx.fillRect(panX + panW - 2, panY, 2, panH);

    // Left Digital Counter (Mines Left)
    ctx.fillStyle = '#000000';
    ctx.fillRect(panX + 8, panY + 7, 54, 34);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    const dispMines = Math.max(0, Math.min(999, this.minesweeperMinesLeft));
    ctx.fillText(String(dispMines).padStart(3, '0'), panX + 35, panY + 32);

    // Center Smiley Button
    const smW = 34;
    const smH = 34;
    const smX = panX + Math.round((panW - smW) / 2);
    const smY = panY + 7;
    this.minesweeperSmileyRect = { x: smX, y: smY, w: smW, h: smH };

    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(smX, smY, smW, smH);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(smX, smY, smW, 2); ctx.fillRect(smX, smY, 2, smH);
    ctx.fillStyle = '#808080'; ctx.fillRect(smX, smY + smH - 2, smW, 2); ctx.fillRect(smX + smW - 2, smY, 2, smH);

    ctx.font = '20px sans-serif';
    ctx.fillText(this.minesweeperSmiley, smX + 17, smY + 25);

    // Right Digital Counter (Timer)
    ctx.fillStyle = '#000000';
    ctx.fillRect(panX + panW - 62, panY + 7, 54, 34);
    let elapsed = 0;
    if (this.minesweeperStatus === 'playing') {
      elapsed = Math.floor((Date.now() - this.minesweeperStartTime) / 1000);
    }
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(String(Math.min(999, elapsed)).padStart(3, '0'), panX + panW - 35, panY + 32);

    // Mode Switcher (Dig vs Flag)
    const modeBtnW = 120;
    const modeBtnH = 22;
    const modeBtnX = wx + Math.round((ww - modeBtnW) / 2);
    const modeBtnY = panY + panH + 8;
    this.minesweeperModeBtnRect = { x: modeBtnX, y: modeBtnY, w: modeBtnW, h: modeBtnH };

    ctx.fillStyle = this.minesweeperFlagMode ? '#fef08a' : '#e2e8f0';
    ctx.fillRect(modeBtnX, modeBtnY, modeBtnW, modeBtnH);
    ctx.strokeStyle = '#64748b';
    ctx.strokeRect(modeBtnX, modeBtnY, modeBtnW, modeBtnH);
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillStyle = this.minesweeperFlagMode ? '#854d0e' : '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(this.minesweeperFlagMode ? '🚩 Mode: FLAG' : '⛏️ Mode: DIG', modeBtnX + modeBtnW / 2, modeBtnY + 15);

    // 9x9 Minefield Grid (Enlarged to cellSize = 36)
    const cellSize = 36;
    const gridTotalW = 9 * cellSize; // 324px
    const gridX = wx + Math.round((ww - gridTotalW) / 2);
    const gridY = modeBtnY + modeBtnH + 8;
    this.minesweeperGridOrigin = { x: gridX, y: gridY, size: cellSize };

    // Sunken Border around Minefield
    ctx.fillStyle = '#808080';
    ctx.fillRect(gridX - 3, gridY - 3, gridTotalW + 6, 3);
    ctx.fillRect(gridX - 3, gridY - 3, 3, gridTotalW + 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gridX - 3, gridY + gridTotalW, gridTotalW + 6, 3);
    ctx.fillRect(gridX + gridTotalW, gridY - 3, 3, gridTotalW + 6);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.minesweeperGrid[r][c];
        const cx = gridX + c * cellSize;
        const cy = gridY + r * cellSize;

        if (cell.revealed) {
          ctx.fillStyle = cell.mine ? '#ef4444' : '#bdbdbd';
          ctx.fillRect(cx, cy, cellSize, cellSize);
          ctx.strokeStyle = '#7c7c7c';
          ctx.strokeRect(cx, cy, cellSize, cellSize);

          if (cell.mine) {
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💣', cx + cellSize / 2, cy + cellSize / 2 + 7);
          } else if (cell.count > 0) {
            const numCols = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
            ctx.font = 'bold 20px "Arial Black", sans-serif';
            ctx.fillStyle = numCols[cell.count] || '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(cell.count, cx + cellSize / 2, cy + cellSize / 2 + 7);
          }
        } else {
          ctx.fillStyle = '#c0c0c0';
          ctx.fillRect(cx, cy, cellSize, cellSize);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(cx, cy, cellSize, 2); ctx.fillRect(cx, cy, 2, cellSize);
          ctx.fillStyle = '#808080'; ctx.fillRect(cx, cy + cellSize - 2, cellSize, 2); ctx.fillRect(cx + cellSize - 2, cy, 2, cellSize);

          if (cell.flagged) {
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🚩', cx + cellSize / 2, cy + cellSize / 2 + 6);
          }
        }
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // APPLICATION WINDOW 3: NOTEPAD (notepad.exe)
  // =========================================================================
  renderNotepadWindow(ctx, W, H) {
    if (this.notepadState === 'closed' || this.notepadState === 'minimized') return;

    const isActive = (this.activeWindow === 'notepad');
    const isMax = (this.notepadState === 'maximized');
    const wx = isMax ? 0 : this.notepadRect.x;
    const wy = isMax ? 0 : this.notepadRect.y;
    const ww = isMax ? W : this.notepadRect.w;
    const wh = isMax ? 730 : this.notepadRect.h;

    ctx.save();
    ctx.fillStyle = '#ece9d8';
    this.drawRoundRect(ctx, wx, wy, ww, wh, isMax ? 0 : [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = isActive ? '#0050e6' : '#5a78c4';
    this.drawRoundRect(ctx, wx, wy, ww, wh, isMax ? 0 : [6, 6, 0, 0]);
    ctx.stroke();

    const titleH = 26;
    const tbGrad = ctx.createLinearGradient(0, wy, 0, wy + titleH);
    tbGrad.addColorStop(0, isActive ? '#0058ec' : '#7697e7');
    tbGrad.addColorStop(0.35, isActive ? '#3b88ff' : '#8ba7ef');
    tbGrad.addColorStop(1, isActive ? '#0047c8' : '#6688dd');
    ctx.fillStyle = tbGrad;
    this.drawRoundRect(ctx, wx + 2, wy + 2, ww - 4, titleH, isMax ? 0 : [4, 4, 0, 0]);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px sans-serif';
    ctx.fillText('📝', wx + 8, wy + 19);
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.notepadTab} - Notepad`, wx + 28, wy + 18);

    // Close and Min Buttons
    const btnY = wy + 4;
    const btnW = 18;
    const btnH = 18;
    const bxMin = wx + ww - 66;
    const bxMax = wx + ww - 44;
    const bxClose = wx + ww - 22;

    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMin, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bxMin + 4, btnY + 12, 10, 2);

    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMax, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bxMax + 4, btnY + 4, 10, 10);

    ctx.fillStyle = '#dc2626';
    this.drawRoundRect(ctx, bxClose, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', bxClose + 9, btnY + 13);

    // Menu Bar
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, wy + titleH + 2, ww - 4, 20);
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText('File    Edit    Format    View    Help', wx + 10, wy + titleH + 16);

    // Document Tabs Bar
    const docTabs = Object.keys(this.notepadDocs);
    const tabRowY = wy + titleH + 22;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(wx + 2, tabRowY, ww - 4, 24);

    this.renderedNotepadTabs = [];
    let curDocX = wx + 8;

    docTabs.forEach(doc => {
      ctx.font = 'bold 11px Tahoma, sans-serif';
      const tw = ctx.measureText(doc).width + 20;
      const isSel = (this.notepadTab === doc);

      ctx.fillStyle = isSel ? '#ffffff' : '#cbd5e1';
      ctx.fillRect(curDocX, tabRowY + (isSel ? 1 : 3), tw, isSel ? 23 : 20);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(curDocX, tabRowY + (isSel ? 1 : 3), tw, isSel ? 23 : 20);

      ctx.fillStyle = isSel ? '#0055ea' : '#475569';
      ctx.textAlign = 'center';
      ctx.fillText(doc, curDocX + tw / 2, tabRowY + 16);

      this.renderedNotepadTabs.push({ doc, x: curDocX, y: tabRowY, w: tw, h: 24 });
      curDocX += tw + 4;
    });

    // Editor Text Area
    const editY = tabRowY + 24;
    const editH = wh - (editY - wy) - 22;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx + 2, editY, ww - 4, editH);
    ctx.strokeStyle = '#7f9db9';
    ctx.strokeRect(wx + 2, editY, ww - 4, editH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(wx + 6, editY + 4, ww - 12, editH - 8);
    ctx.clip();

    const docLines = this.notepadDocs[this.notepadTab] || [];
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';

    docLines.forEach((ln, idx) => {
      ctx.fillText(ln, wx + 12, editY + 18 + idx * 16 - this.notepadScroll);
    });
    ctx.restore();

    // Status Bar
    const stY = wy + wh - 20;
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, stY, ww - 4, 18);
    ctx.strokeStyle = '#d0cdc0';
    ctx.strokeRect(wx + 2, stY, ww - 4, 18);

    ctx.font = '10px Tahoma, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(`Lines: ${docLines.length} | Col: 1 | Windows (CRLF) | ANSI`, wx + 12, stY + 13);
    ctx.restore();
  }

  // =========================================================================
  // APPLICATION WINDOW 4: COMMAND PROMPT (cmd.exe)
  // =========================================================================
  renderCmdWindow(ctx, W, H) {
    if (this.cmdState === 'closed' || this.cmdState === 'minimized') return;

    const isActive = (this.activeWindow === 'cmd');
    const isMax = (this.cmdState === 'maximized');
    const wx = isMax ? 0 : this.cmdRect.x;
    const wy = isMax ? 0 : this.cmdRect.y;
    const ww = isMax ? W : this.cmdRect.w;
    const wh = isMax ? 730 : this.cmdRect.h;

    ctx.save();
    ctx.fillStyle = '#000000';
    this.drawRoundRect(ctx, wx, wy, ww, wh, isMax ? 0 : [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = isActive ? '#0050e6' : '#5a78c4';
    this.drawRoundRect(ctx, wx, wy, ww, wh, isMax ? 0 : [6, 6, 0, 0]);
    ctx.stroke();

    const titleH = 26;
    const tbGrad = ctx.createLinearGradient(0, wy, 0, wy + titleH);
    tbGrad.addColorStop(0, isActive ? '#0058ec' : '#7697e7');
    tbGrad.addColorStop(0.35, isActive ? '#3b88ff' : '#8ba7ef');
    tbGrad.addColorStop(1, isActive ? '#0047c8' : '#6688dd');
    ctx.fillStyle = tbGrad;
    this.drawRoundRect(ctx, wx + 2, wy + 2, ww - 4, titleH, isMax ? 0 : [4, 4, 0, 0]);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px sans-serif';
    ctx.fillText('💻', wx + 8, wy + 19);
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Command Prompt - cmd.exe', wx + 28, wy + 18);

    // Buttons
    const btnY = wy + 4;
    const btnW = 18;
    const btnH = 18;
    const bxMin = wx + ww - 44;
    const bxClose = wx + ww - 22;

    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMin, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bxMin + 4, btnY + 12, 10, 2);

    ctx.fillStyle = '#dc2626';
    this.drawRoundRect(ctx, bxClose, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', bxClose + 9, btnY + 13);

    // Terminal Body
    const termY = wy + titleH + 2;
    const termH = wh - titleH - 36;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(wx + 2, termY, ww - 4, termH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(wx + 8, termY + 4, ww - 16, termH - 8);
    ctx.clip();

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = this.cmdColor;
    ctx.textAlign = 'left';

    const visibleLines = Math.floor((termH - 30) / 16);
    const startIdx = Math.max(0, this.cmdHistory.length - visibleLines);

    for (let i = startIdx; i < this.cmdHistory.length; i++) {
      ctx.fillText(this.cmdHistory[i], wx + 12, termY + 18 + (i - startIdx) * 16);
    }

    // Active Input Prompt with Blinking Cursor
    const promptY = termY + 18 + (Math.min(visibleLines, this.cmdHistory.length)) * 16;
    const promptText = `C:\\> ${this.cmdInput}`;
    ctx.fillText(promptText, wx + 12, promptY);

    const isCursorBlink = Math.floor(performance.now() / 450) % 2 === 0;
    if (isCursorBlink) {
      const pW = ctx.measureText(promptText).width;
      ctx.fillRect(wx + 14 + pW, promptY - 10, 8, 12);
    }
    ctx.restore();

    // Quick Command Action Chips (Bottom Bar)
    const chipRowY = wy + wh - 30;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(wx + 2, chipRowY, ww - 4, 28);

    const chips = ['DIR', 'DOOM', 'MINES', 'NOTEPAD', 'SYSINFO', 'PING', 'TREE', 'MATRIX', 'CLS'];
    this.renderedCmdChips = [];
    let curChipX = wx + 8;

    chips.forEach(chipCmd => {
      ctx.font = 'bold 10px Tahoma, sans-serif';
      const cw = ctx.measureText(chipCmd).width + 12;

      ctx.fillStyle = '#334155';
      ctx.fillRect(curChipX, chipRowY + 4, cw, 20);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(curChipX, chipRowY + 4, cw, 20);

      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(chipCmd, curChipX + cw / 2, chipRowY + 17);

      this.renderedCmdChips.push({ cmd: chipCmd, x: curChipX, y: chipRowY + 4, w: cw, h: 20 });
      curChipX += cw + 6;
    });

    ctx.restore();
  }

  // =========================================================================
  // APPLICATION WINDOW 5: MY COMPUTER / EXPLORER (explorer.exe)
  // =========================================================================
  renderExplorerWindow(ctx, W, H) {
    if (this.explorerState === 'closed' || this.explorerState === 'minimized') return;

    const isActive = (this.activeWindow === 'explorer');
    const isMax = (this.explorerState === 'maximized');
    const wx = isMax ? 0 : this.explorerRect.x;
    const wy = isMax ? 0 : this.explorerRect.y;
    const ww = isMax ? W : this.explorerRect.w;
    const wh = isMax ? 730 : this.explorerRect.h;

    ctx.save();
    ctx.fillStyle = '#ece9d8';
    this.drawRoundRect(ctx, wx, wy, ww, wh, isMax ? 0 : [6, 6, 0, 0]);
    ctx.fill();

    const titleH = 26;
    const tbGrad = ctx.createLinearGradient(0, wy, 0, wy + titleH);
    tbGrad.addColorStop(0, isActive ? '#0058ec' : '#7697e7');
    tbGrad.addColorStop(0.35, isActive ? '#3b88ff' : '#8ba7ef');
    tbGrad.addColorStop(1, isActive ? '#0047c8' : '#6688dd');
    ctx.fillStyle = tbGrad;
    this.drawRoundRect(ctx, wx + 2, wy + 2, ww - 4, titleH, isMax ? 0 : [4, 4, 0, 0]);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px sans-serif';
    ctx.fillText('🖥️', wx + 8, wy + 19);
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('My Computer', wx + 28, wy + 18);

    // Controls
    const btnY = wy + 4;
    const btnW = 18;
    const btnH = 18;
    const bxMin = wx + ww - 44;
    const bxClose = wx + ww - 22;

    ctx.fillStyle = '#2563eb';
    this.drawRoundRect(ctx, bxMin, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bxMin + 4, btnY + 12, 10, 2);

    ctx.fillStyle = '#dc2626';
    this.drawRoundRect(ctx, bxClose, btnY, btnW, btnH, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', bxClose + 9, btnY + 13);

    // Address Bar
    const addrY = wy + titleH + 4;
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, addrY, ww - 4, 24);
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText('Address', wx + 10, addrY + 16);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx + 60, addrY + 2, ww - 70, 20);
    ctx.strokeStyle = '#7f9db9';
    ctx.strokeRect(wx + 60, addrY + 2, ww - 70, 20);
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(this.explorerPath, wx + 68, addrY + 16);

    // Drives & Files Grid
    const fX = wx + 4;
    const fY = addrY + 28;
    const fW = ww - 8;
    const fH = wh - (fY - wy) - 24;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fX, fY, fW, fH);
    ctx.strokeStyle = '#7f9db9';
    ctx.strokeRect(fX, fY, fW, fH);

    const drives = [
      { id: 'c', sym: '💾', name: '3½ Floppy (A:)', sub: '1.44 MB' },
      { id: 'c', sym: '💽', name: 'Local Disk (C:)', sub: '38.2 GB Free' },
      { id: 'd', sym: '💿', name: 'CD-ROM (D:)', sub: 'DOOM_SHAREWARE' },
      { id: 'doom', sym: '👹', name: 'DOOM.EXE', sub: '6,843 KB' },
      { id: 'mines', sym: '💣', name: 'WINMINE.EXE', sub: '118 KB' },
      { id: 'notepad', sym: '📝', name: 'README.TXT', sub: '4 KB' }
    ];

    this.renderedExplorerItems = [];

    drives.forEach((it, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const ix = fX + 24 + col * 180;
      const iy = fY + 20 + row * 76;

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(it.sym, ix + 30, iy + 30);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(it.name, ix + 30, iy + 48);

      ctx.font = '10px Tahoma, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(it.sub, ix + 30, iy + 62);

      this.renderedExplorerItems.push({ id: it.id, x: ix, y: iy, w: 160, h: 68 });
    });

    // Status Bar
    const sbarY = wy + wh - 22;
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(wx + 2, sbarY, ww - 4, 20);
    ctx.strokeStyle = '#d0cdc0';
    ctx.strokeRect(wx + 2, sbarY, ww - 4, 20);

    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText('6 object(s) (Disk free space: 38.2 GB)', wx + 12, sbarY + 14);
    ctx.restore();
  }

  // =========================================================================
  // SHUTDOWN DIALOG
  // =========================================================================
  renderShutdownDialog(ctx, W, H) {
    const sw = 400;
    const sh = 200;
    const sx = (W - sw) / 2;
    const sy = (H - sh) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0055ea';
    this.drawRoundRect(ctx, sx, sy, sw, sh, 6);
    ctx.fill();

    const topGrad = ctx.createLinearGradient(0, sy, 0, sy + 44);
    topGrad.addColorStop(0, '#0055ea');
    topGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = topGrad;
    this.drawRoundRect(ctx, sx, sy, sw, 44, [6, 6, 0, 0]);
    ctx.fill();

    ctx.font = 'bold 14px Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('Turn off computer', sx + 16, sy + 28);

    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(sx + 2, sy + 44, sw - 4, sh - 46);

    const actions = [
      { sym: '💤', name: 'Stand By', col: '#eab308' },
      { sym: '⏻', name: 'Turn Off', col: '#ef4444' },
      { sym: '↻', name: 'Restart', col: '#22c55e' }
    ];

    actions.forEach((act, idx) => {
      const ax = sx + 50 + idx * 110;
      const ay = sy + 70;

      ctx.fillStyle = act.col;
      ctx.beginPath();
      ctx.arc(ax + 24, ay + 24, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(act.sym, ax + 24, ay + 31);

      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(act.name, ax + 24, ay + 60);
    });

    const cBtnW = 80;
    const cBtnH = 24;
    const cBtnX = sx + sw - cBtnW - 16;
    const cBtnY = sy + sh - 34;

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cBtnX, cBtnY, cBtnW, cBtnH);
    ctx.strokeStyle = '#64748b';
    ctx.strokeRect(cBtnX, cBtnY, cBtnW, cBtnH);

    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('Cancel', cBtnX + cBtnW / 2, cBtnY + 16);

    this.renderedShutdownButtons = {
      ok: { x: sx + 140, y: sy + 70, w: 80, h: 70 },
      cancel: { x: cBtnX, y: cBtnY, w: cBtnW, h: cBtnH }
    };
    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     INTERACTIVE SCREEN CLICK & EVENT DISPATCHER
     -------------------------------------------------------------------------- */
  handleScreenClick(x, y) {
    this.initAudio();

    // 1. Dismiss Active Alert Dialog
    if (this.activePopup) {
      this.activePopup = null;
      this.playClick();
      return;
    }

    // 2. Handle Shutdown Dialog
    if (this.shutdownOpen) {
      if (this.renderedShutdownButtons) {
        const { ok, cancel } = this.renderedShutdownButtons;
        if (x >= ok.x && x <= ok.x + ok.w && y >= ok.y && y <= ok.y + ok.h) {
          this.shutdownOpen = false;
          this.playWhoosh();
          this.activePopup = {
            title: 'Windows',
            message: 'It is now safe to turn off your computer.\n[Restarting retro workstation...]'
          };
          return;
        }
        if (x >= cancel.x && x <= cancel.x + cancel.w && y >= cancel.y && y <= cancel.y + cancel.h) {
          this.shutdownOpen = false;
          this.playClick();
          return;
        }
      }
      this.shutdownOpen = false;
      return;
    }

    // 3. Tray Sound Toggle
    if (this.renderedTraySound && x >= this.renderedTraySound.x && x <= this.renderedTraySound.x + this.renderedTraySound.w && y >= this.renderedTraySound.y && y <= this.renderedTraySound.y + this.renderedTraySound.h) {
      // Sound permanently disabled
      this.soundEnabled = false;
      return;
    }

    // 4. Start Button Toggle (x = 0..118, y = 730..768)
    if (x >= 0 && x <= 118 && y >= 730 && y <= 768) {
      this.startMenuOpen = !this.startMenuOpen;
      this.playClick();
      return;
    }

    // 5. Start Menu Items Click
    if (this.startMenuOpen) {
      const smX = 0;
      const smY = 320;
      // Left Column (White)
      if (x >= smX + 10 && x <= smX + 180 && y >= smY + 54 && y <= smY + 368) {
        const itemIdx = Math.floor((y - (smY + 64)) / 40);
        if (itemIdx === 0) this.openIE();
        else if (itemIdx === 1) this.openDoom();
        else if (itemIdx === 2) this.openMinesweeper();
        else if (itemIdx === 3) this.openNotepad();
        else if (itemIdx === 4) this.openCmd();
        this.startMenuOpen = false;
        return;
      }
      // Right Column (Blue)
      if (x >= smX + 185 && x <= smX + 340 && y >= smY + 54 && y <= smY + 368) {
        const itemIdx = Math.floor((y - (smY + 64)) / 40);
        if (itemIdx === 0) this.openExplorer('My Documents');
        else if (itemIdx === 1) this.openExplorer('My Computer');
        else if (itemIdx === 2) this.openExplorer('Control Panel');
        else if (itemIdx === 3) this.openCmd();
        else if (itemIdx === 4) this.openCmd();
        this.startMenuOpen = false;
        return;
      }
      // Bottom Bar (Shut Down)
      if (x >= smX && x <= smX + 340 && y >= smY + 368 && y <= smY + 410) {
        this.shutdownOpen = true;
        this.startMenuOpen = false;
        this.playWhoosh();
        return;
      }
      this.startMenuOpen = false;
      return;
    }

    // 6. Taskbar Window Tabs
    if (this.renderedTaskbarTabs && this.renderedTaskbarTabs.length > 0 && y >= 730 && y <= 768) {
      for (let i = 0; i < this.renderedTaskbarTabs.length; i++) {
        const tab = this.renderedTaskbarTabs[i];
        if (x >= tab.x && x <= tab.x + tab.w && y >= tab.y && y <= tab.y + tab.h) {
          const curState = this.getWindowState(tab.id);
          if (curState === 'minimized') {
            this.setWindowState(tab.id, 'normal');
            this.bringToFront(tab.id);
            this.playWhoosh();
          } else if (this.activeWindow === tab.id) {
            this.setWindowState(tab.id, 'minimized');
            this.playClick();
          } else {
            this.bringToFront(tab.id);
            this.playClick();
          }
          return;
        }
      }
    }

    // 7. Quick Launch Icons (🖥️ 🌐 👹)
    if (y >= 734 && y <= 766 && x >= 120 && x <= 174) {
      if (x < 138) this.openExplorer('My Computer');
      else if (x < 156) this.openIE();
      else this.openDoom();
      return;
    }

    // 8. Desktop Icons (Left side)
    if (x >= 10 && x <= 80 && y <= 600) {
      const iconIdx = Math.floor((y - 18) / 72);
      if (iconIdx === 0) { this.openIE(); return; }
      if (iconIdx === 1) { this.openDoom(); return; }
      if (iconIdx === 2) { this.openMinesweeper(); return; }
      if (iconIdx === 3) { this.openNotepad(); return; }
      if (iconIdx === 4) { this.openCmd(); return; }
      if (iconIdx === 5) { this.openExplorer(); return; }
      if (iconIdx === 6) { this.openExplorer('My Documents'); return; }
      if (iconIdx === 7) {
        this.playClick();
        this.activePopup = { title: 'Recycle Bin', message: 'Recycle Bin is empty.\nNo deleted files.' };
        return;
      }
    }

    // 9. Window Click Dispatching (Top-to-Bottom by reversed Z-Index)
    const reversedOrder = [...this.windowOrder].reverse();
    for (let i = 0; i < reversedOrder.length; i++) {
      const winId = reversedOrder[i];
      if (winId === 'ie' && this.winState !== 'closed' && this.winState !== 'minimized') {
        if (this.handleIEClick(x, y)) return;
      } else if (winId === 'doom' && this.doomState !== 'closed' && this.doomState !== 'minimized') {
        if (this.handleDoomClick(x, y)) return;
      } else if (winId === 'minesweeper' && this.minesweeperState !== 'closed' && this.minesweeperState !== 'minimized') {
        if (this.handleMinesweeperClick(x, y)) return;
      } else if (winId === 'notepad' && this.notepadState !== 'closed' && this.notepadState !== 'minimized') {
        if (this.handleNotepadClick(x, y)) return;
      } else if (winId === 'cmd' && this.cmdState !== 'closed' && this.cmdState !== 'minimized') {
        if (this.handleCmdClick(x, y)) return;
      } else if (winId === 'explorer' && this.explorerState !== 'closed' && this.explorerState !== 'minimized') {
        if (this.handleExplorerClick(x, y)) return;
      }
    }
  }

  // --- CLICK HANDLER: INTERNET EXPLORER & MINI-WEBSITE ---
  handleIEClick(x, y) {
    const isMax = (this.winState === 'maximized');
    const wx = isMax ? 0 : this.winRect.x;
    const wy = isMax ? 0 : this.winRect.y;
    const ww = isMax ? 1024 : this.winRect.w;
    const wh = isMax ? 730 : this.winRect.h;

    if (x >= wx && x <= wx + ww && y >= wy && y <= wy + wh) {
      this.bringToFront('ie');

      // Titlebar Controls
      const btnY = wy + 4;
      const bxMin = wx + ww - 72;
      const bxMax = wx + ww - 48;
      const bxClose = wx + ww - 24;

      if (x >= bxMin && x <= bxMin + 20 && y >= btnY && y <= btnY + 20) {
        this.winState = 'minimized';
        this.playClick();
        return true;
      }
      if (x >= bxMax && x <= bxMax + 20 && y >= btnY && y <= btnY + 20) {
        if (this.winState === 'maximized') {
          this.winState = 'normal';
          this.winRect = { ...this.winNormalRect };
        } else {
          this.winState = 'maximized';
        }
        this.playClick();
        return true;
      }
      if (x >= bxClose && x <= bxClose + 24 && y >= btnY && y <= btnY + 20) {
        this.winState = 'minimized';
        this.playClick();
        return true;
      }

      // Titlebar Drag
      if (y >= wy && y <= wy + 28 && x >= wx && x <= wx + ww - 80) {
        if (this.winState === 'normal') {
          this.winIsDragging = true;
          this.winDragOffset = { x: x - this.winRect.x, y: y - this.winRect.y };
        }
        return true;
      }

      // Navigation Toolbar (Back, Forward, Stop, Refresh, Home)
      if (y >= wy + 52 && y <= wy + 84) {
        if (x >= wx + 6 && x <= wx + 64) {
          if (this.webHistoryIdx > 0) {
            this.webHistoryIdx--;
            this.webPage = this.webHistory[this.webHistoryIdx];
            this.websiteScrollY = 0;
            this.playClick();
          }
          return true;
        }
        if (x >= wx + 65 && x <= wx + 135) {
          if (this.webHistoryIdx < this.webHistory.length - 1) {
            this.webHistoryIdx++;
            this.webPage = this.webHistory[this.webHistoryIdx];
            this.websiteScrollY = 0;
            this.playClick();
          }
          return true;
        }
        if (x >= wx + 185 && x <= wx + 250) {
          this.websiteScrollY = 0;
          this.playClick();
          return true;
        }
        if (x >= wx + 252 && x <= wx + 310) {
          this.navigateToWebPage('home');
          return true;
        }
      }

      // Standalone DOOM Arcade Hero Card Click (Only on Home Page)
      if (this.webPage === 'home' && this.renderedDoomHeroBadge) {
        const db = this.renderedDoomHeroBadge;
        if (x >= db.x && x <= db.x + db.w && y >= db.y && y <= db.y + db.h) {
          this.openDoom();
          return true;
        }
      }

      // HTML Navigation Links
      if (this.renderedNavLinks && this.renderedNavLinks.length > 0) {
        for (let i = 0; i < this.renderedNavLinks.length; i++) {
          const l = this.renderedNavLinks[i];
          if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) {
            this.navigateToWebPage(l.page);
            return true;
          }
        }
      }

      // Filter Chips on Projects Page
      if (this.webPage === 'projects' && this.renderedFilterChips) {
        for (let i = 0; i < this.renderedFilterChips.length; i++) {
          const chip = this.renderedFilterChips[i];
          if (x >= chip.x && x <= chip.x + chip.w && y >= chip.y && y <= chip.y + chip.h) {
            this.projectCategory = chip.id;
            this.playClick();
            return true;
          }
        }
      }

      // Project Links
      if (this.webPage === 'projects' && this.renderedProjectLinks) {
        for (let i = 0; i < this.renderedProjectLinks.length; i++) {
          const p = this.renderedProjectLinks[i];
          if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
            if (p.action === 'doom') {
              this.openDoom();
            } else {
              this.openNotepad(p.file);
            }
            return true;
          }
        }
      }

      // Lab Controls
      if (this.webPage === 'lab' && this.renderedLabButtons) {
        for (let i = 0; i < this.renderedLabButtons.length; i++) {
          const btn = this.renderedLabButtons[i];
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            this.playClick();
            if (btn.id === 'fx') {
              const modes = ['plasma', 'matrix', 'cube', 'fire', 'starfield'];
              this.labEffect = modes[(modes.indexOf(this.labEffect) + 1) % modes.length];
            } else if (btn.id === 'palette') {
              const pals = ['neon', 'green', 'amber', 'ice', 'fire'];
              this.labPalette = pals[(pals.indexOf(this.labPalette) + 1) % pals.length];
            } else if (btn.id === 'speed') {
              const speeds = [1, 2, 0.5];
              this.labSpeed = speeds[(speeds.indexOf(this.labSpeed) + 1) % speeds.length];
            }
            return true;
          }
        }
      }

      // Jukebox Controls
      if (this.webPage === 'jukebox' && this.renderedJukeboxBtns) {
        for (let i = 0; i < this.renderedJukeboxBtns.length; i++) {
          const btn = this.renderedJukeboxBtns[i];
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            this.playClick();
            if (btn.id === 'play') {
              this.jukeboxPlaying = !this.jukeboxPlaying;
              if (this.jukeboxPlaying) this.initAudio();
            } else if (btn.id === 'next') {
              this.jukeboxTrack = (this.jukeboxTrack + 1) % this.jukeboxTracks.length;
              this.jukeboxStep = 0;
            } else if (btn.id === 'stop') {
              this.jukeboxPlaying = false;
              this.jukeboxStep = 0;
            } else if (btn.id === 'mute') {
              this.soundEnabled = !this.soundEnabled;
            }
            return true;
          }
        }
      }

      // Guestbook Button
      if (this.webPage === 'guestbook' && this.renderedGuestbookBtn) {
        const gb = this.renderedGuestbookBtn;
        if (x >= gb.x && x <= gb.x + gb.w && y >= gb.y && y <= gb.y + gb.h) {
          const now = new Date();
          const dStr = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()}`;
          this.guestbookEntries.unshift({
            name: 'Web_Surfer_' + Math.floor(Math.random() * 900 + 100),
            loc: 'Cyberspace',
            date: dStr,
            msg: 'Awesome retro portfolio! The playable DOOM, Minesweeper, and Web Audio Jukebox rock!'
          });
          this.playWin();
          this.activePopup = {
            title: 'Guestbook',
            message: 'Thank you for signing the guestbook!\nYour entry has been recorded in the database.'
          };
          return true;
        }
      }

      // 88x31 Badges Collection
      if (this.webPage === 'links' && this.renderedButtons && this.renderedButtons.length > 0) {
        for (let i = 0; i < this.renderedButtons.length; i++) {
          const item = this.renderedButtons[i];
          if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
            this.playClick();
            if (item.btn.file === 'doomrl.gif') {
              this.openDoom();
              return true;
            }
            this.activePopup = {
              title: 'Badge Directory',
              message: `Badge: ${item.btn.title}\nFile: assets/oldschoolbuttons/${item.btn.file}\nURL: http://qurayshe.xd/badges`
            };
            return true;
          }
        }
      }

      return true;
    }
    return false;
  }

  // --- CLICK HANDLER: DOOM ---
  handleDoomClick(x, y) {
    if (this.doomState === 'loading') {
      const dw = 460, dh = 190;
      const dx = Math.round((1024 - dw) / 2);
      const dy = Math.round((768 - dh) / 2);
      const btnX = dx + dw - 95;
      const btnY = dy + dh - 36;
      if (x >= btnX && x <= btnX + 75 && y >= btnY && y <= btnY + 24) {
        this.doomState = 'closed';
        this.playClick();
        return true;
      }
      return (x >= dx && x <= dx + dw && y >= dy && y <= dy + dh);
    }

    const isMax = (this.doomState === 'maximized');
    const dwx = isMax ? 0 : this.doomRect.x;
    const dwy = isMax ? 0 : this.doomRect.y;
    const dww = isMax ? 1024 : this.doomRect.w;
    const dwh = isMax ? 730 : this.doomRect.h;

    if (x >= dwx && x <= dwx + dww && y >= dwy && y <= dwy + dwh) {
      this.bringToFront('doom');

      const btnY = dwy + 4;
      const bxMin = dwx + dww - 72;
      const bxMax = dwx + dww - 48;
      const bxClose = dwx + dww - 24;

      if (x >= bxMin && x <= bxMin + 20 && y >= btnY && y <= btnY + 20) {
        this.doomState = 'minimized';
        this.playClick();
        return true;
      }
      if (x >= bxMax && x <= bxMax + 20 && y >= btnY && y <= btnY + 20) {
        this.doomState = (this.doomState === 'maximized' ? 'normal' : 'maximized');
        this.playClick();
        return true;
      }
      if (x >= bxClose && x <= bxClose + 24 && y >= btnY && y <= btnY + 20) {
        this.doomState = 'closed';
        this.playClick();
        return true;
      }

      if (y >= dwy && y <= dwy + 28 && x >= dwx && x <= dwx + dww - 80) {
        if (this.doomState === 'normal') {
          this.doomIsDragging = true;
          this.doomDragOffset = { x: x - this.doomRect.x, y: y - this.doomRect.y };
        }
        return true;
      }

      if (y >= dwy + 28 && y <= dwy + dwh - 22) {
        if (this.doomEngine) this.doomEngine.simulateFire();
        return true;
      }
      return true;
    }
    return false;
  }

  // --- CLICK HANDLER: MINESWEEPER ---
  handleMinesweeperClick(x, y) {
    const wx = this.minesweeperRect.x;
    const wy = this.minesweeperRect.y;
    const ww = this.minesweeperRect.w;
    const wh = this.minesweeperRect.h;

    if (x >= wx && x <= wx + ww && y >= wy && y <= wy + wh) {
      this.bringToFront('minesweeper');

      const btnY = wy + 4;
      const bxMin = wx + ww - 44;
      const bxClose = wx + ww - 22;

      if (x >= bxMin && x <= bxMin + 18 && y >= btnY && y <= btnY + 18) {
        this.minesweeperState = 'minimized';
        this.playClick();
        return true;
      }
      if (x >= bxClose && x <= bxClose + 18 && y >= btnY && y <= btnY + 18) {
        this.minesweeperState = 'closed';
        this.playClick();
        return true;
      }

      if (y >= wy && y <= wy + 26 && x <= bxMin) {
        this.minesweeperIsDragging = true;
        this.minesweeperDragOffset = { x: x - wx, y: y - wy };
        return true;
      }

      if (this.minesweeperSmileyRect) {
        const sm = this.minesweeperSmileyRect;
        if (x >= sm.x && x <= sm.x + sm.w && y >= sm.y && y <= sm.y + sm.h) {
          this.resetMinesweeper();
          return true;
        }
      }

      if (this.minesweeperModeBtnRect) {
        const mb = this.minesweeperModeBtnRect;
        if (x >= mb.x && x <= mb.x + mb.w && y >= mb.y && y <= mb.y + mb.h) {
          this.minesweeperFlagMode = !this.minesweeperFlagMode;
          this.playClick();
          return true;
        }
      }

      if (this.minesweeperGridOrigin) {
        const { x: gx, y: gy, size } = this.minesweeperGridOrigin;
        const col = Math.floor((x - gx) / size);
        const row = Math.floor((y - gy) / size);
        if (row >= 0 && row < 9 && col >= 0 && col < 9) {
          if (this.minesweeperFlagMode) {
            this.flagMinesweeperCell(row, col);
          } else {
            this.revealMinesweeperCell(row, col);
          }
          return true;
        }
      }
      return true;
    }
    return false;
  }

  // --- CLICK HANDLER: NOTEPAD ---
  handleNotepadClick(x, y) {
    const isMax = (this.notepadState === 'maximized');
    const wx = isMax ? 0 : this.notepadRect.x;
    const wy = isMax ? 0 : this.notepadRect.y;
    const ww = isMax ? 1024 : this.notepadRect.w;
    const wh = isMax ? 730 : this.notepadRect.h;

    if (x >= wx && x <= wx + ww && y >= wy && y <= wy + wh) {
      this.bringToFront('notepad');

      const btnY = wy + 4;
      const bxMin = wx + ww - 66;
      const bxMax = wx + ww - 44;
      const bxClose = wx + ww - 22;

      if (x >= bxMin && x <= bxMin + 18 && y >= btnY && y <= btnY + 18) {
        this.notepadState = 'minimized';
        this.playClick();
        return true;
      }
      if (x >= bxMax && x <= bxMax + 18 && y >= btnY && y <= btnY + 18) {
        this.notepadState = (this.notepadState === 'maximized' ? 'normal' : 'maximized');
        this.playClick();
        return true;
      }
      if (x >= bxClose && x <= bxClose + 18 && y >= btnY && y <= btnY + 18) {
        this.notepadState = 'closed';
        this.playClick();
        return true;
      }

      if (y >= wy && y <= wy + 26 && x <= bxMin) {
        if (!isMax) {
          this.notepadIsDragging = true;
          this.notepadDragOffset = { x: x - wx, y: y - wy };
        }
        return true;
      }

      if (this.renderedNotepadTabs) {
        for (let i = 0; i < this.renderedNotepadTabs.length; i++) {
          const tab = this.renderedNotepadTabs[i];
          if (x >= tab.x && x <= tab.x + tab.w && y >= tab.y && y <= tab.y + tab.h) {
            this.notepadTab = tab.doc;
            this.notepadScroll = 0;
            this.playClick();
            return true;
          }
        }
      }
      return true;
    }
    return false;
  }

  // --- CLICK HANDLER: CMD ---
  handleCmdClick(x, y) {
    const isMax = (this.cmdState === 'maximized');
    const wx = isMax ? 0 : this.cmdRect.x;
    const wy = isMax ? 0 : this.cmdRect.y;
    const ww = isMax ? 1024 : this.cmdRect.w;
    const wh = isMax ? 730 : this.cmdRect.h;

    if (x >= wx && x <= wx + ww && y >= wy && y <= wy + wh) {
      this.bringToFront('cmd');

      const btnY = wy + 4;
      const bxMin = wx + ww - 44;
      const bxClose = wx + ww - 22;

      if (x >= bxMin && x <= bxMin + 18 && y >= btnY && y <= btnY + 18) {
        this.cmdState = 'minimized';
        this.playClick();
        return true;
      }
      if (x >= bxClose && x <= bxClose + 18 && y >= btnY && y <= btnY + 18) {
        this.cmdState = 'closed';
        this.playClick();
        return true;
      }

      if (y >= wy && y <= wy + 26 && x <= bxMin) {
        if (!isMax) {
          this.cmdIsDragging = true;
          this.cmdDragOffset = { x: x - wx, y: y - wy };
        }
        return true;
      }

      if (this.renderedCmdChips) {
        for (let i = 0; i < this.renderedCmdChips.length; i++) {
          const chip = this.renderedCmdChips[i];
          if (x >= chip.x && x <= chip.x + chip.w && y >= chip.y && y <= chip.y + chip.h) {
            this.executeCmd(chip.cmd);
            return true;
          }
        }
      }
      return true;
    }
    return false;
  }

  // --- CLICK HANDLER: EXPLORER ---
  handleExplorerClick(x, y) {
    const isMax = (this.explorerState === 'maximized');
    const wx = isMax ? 0 : this.explorerRect.x;
    const wy = isMax ? 0 : this.explorerRect.y;
    const ww = isMax ? 1024 : this.explorerRect.w;
    const wh = isMax ? 730 : this.explorerRect.h;

    if (x >= wx && x <= wx + ww && y >= wy && y <= wy + wh) {
      this.bringToFront('explorer');

      const btnY = wy + 4;
      const bxMin = wx + ww - 44;
      const bxClose = wx + ww - 22;

      if (x >= bxMin && x <= bxMin + 18 && y >= btnY && y <= btnY + 18) {
        this.explorerState = 'minimized';
        this.playClick();
        return true;
      }
      if (x >= bxClose && x <= bxClose + 18 && y >= btnY && y <= btnY + 18) {
        this.explorerState = 'closed';
        this.playClick();
        return true;
      }

      if (y >= wy && y <= wy + 26 && x <= bxMin) {
        if (!isMax) {
          this.explorerIsDragging = true;
          this.explorerDragOffset = { x: x - wx, y: y - wy };
        }
        return true;
      }

      if (this.renderedExplorerItems) {
        for (let i = 0; i < this.renderedExplorerItems.length; i++) {
          const it = this.renderedExplorerItems[i];
          if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) {
            this.playClick();
            if (it.id === 'doom') this.openDoom();
            else if (it.id === 'mines') this.openMinesweeper();
            else if (it.id === 'notepad') this.openNotepad();
            else if (it.id === 'c') this.explorerPath = 'C:\\';
            else if (it.id === 'd') this.openDoom();
            return true;
          }
        }
      }
      return true;
    }
    return false;
  }

  /* --------------------------------------------------------------------------
     EVENTS, KEYBOARD & ANIMATION LOOP
     -------------------------------------------------------------------------- */
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
            this.winRect.x = Math.max(-200, Math.min(1024 - 100, Math.round(this.screenPointer.x - this.winDragOffset.x)));
            this.winRect.y = Math.max(0, Math.min(730 - 40, Math.round(this.screenPointer.y - this.winDragOffset.y)));
            this.winNormalRect = { ...this.winRect };
          }
          if (this.doomIsDragging && this.doomState === 'normal') {
            this.doomRect.x = Math.max(-200, Math.min(1024 - 100, Math.round(this.screenPointer.x - this.doomDragOffset.x)));
            this.doomRect.y = Math.max(0, Math.min(730 - 40, Math.round(this.screenPointer.y - this.doomDragOffset.y)));
            this.doomNormalRect = { ...this.doomRect };
          }
          if (this.minesweeperIsDragging) {
            this.minesweeperRect.x = Math.max(0, Math.min(1024 - 100, Math.round(this.screenPointer.x - this.minesweeperDragOffset.x)));
            this.minesweeperRect.y = Math.max(0, Math.min(730 - 40, Math.round(this.screenPointer.y - this.minesweeperDragOffset.y)));
          }
          if (this.notepadIsDragging) {
            this.notepadRect.x = Math.max(-100, Math.min(1024 - 100, Math.round(this.screenPointer.x - this.notepadDragOffset.x)));
            this.notepadRect.y = Math.max(0, Math.min(730 - 40, Math.round(this.screenPointer.y - this.notepadDragOffset.y)));
          }
          if (this.cmdIsDragging) {
            this.cmdRect.x = Math.max(-100, Math.min(1024 - 100, Math.round(this.screenPointer.x - this.cmdDragOffset.x)));
            this.cmdRect.y = Math.max(0, Math.min(730 - 40, Math.round(this.screenPointer.y - this.cmdDragOffset.y)));
          }
          if (this.explorerIsDragging) {
            this.explorerRect.x = Math.max(-100, Math.min(1024 - 100, Math.round(this.screenPointer.x - this.explorerDragOffset.x)));
            this.explorerRect.y = Math.max(0, Math.min(730 - 40, Math.round(this.screenPointer.y - this.explorerDragOffset.y)));
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
      if (e.touches.length > 0) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('pointerup', () => {
      this.winIsDragging = false;
      this.doomIsDragging = false;
      this.minesweeperIsDragging = false;
      this.notepadIsDragging = false;
      this.cmdIsDragging = false;
      this.explorerIsDragging = false;
      if (this.minesweeperStatus === 'playing') {
        this.minesweeperSmiley = '🙂';
      }
    });

    this.container.addEventListener('pointerleave', () => {
      this.screenPointer.active = false;
      this.winIsDragging = false;
      this.doomIsDragging = false;
      this.minesweeperIsDragging = false;
      this.notepadIsDragging = false;
      this.cmdIsDragging = false;
      this.explorerIsDragging = false;
      this.container.style.cursor = '';
      document.body.style.cursor = '';
    });

    this.container.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return; // Right click handled by contextmenu
      if (this.screenPointer.active) {
        if (this.minesweeperStatus === 'playing' && this.activeWindow === 'minesweeper') {
          this.minesweeperSmiley = '😮';
        }
        this.handleScreenClick(this.screenPointer.x, this.screenPointer.y);
      }
    });

    // Native Right-Click for Minesweeper Flagging
    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!this.screenPointer.active) return;
      const x = this.screenPointer.x;
      const y = this.screenPointer.y;

      if (this.minesweeperState !== 'closed' && this.minesweeperState !== 'minimized' && this.activeWindow === 'minesweeper') {
        if (this.minesweeperGridOrigin) {
          const { x: gx, y: gy, size } = this.minesweeperGridOrigin;
          const col = Math.floor((x - gx) / size);
          const row = Math.floor((y - gy) / size);
          if (row >= 0 && row < 9 && col >= 0 && col < 9) {
            this.flagMinesweeperCell(row, col);
          }
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      // DOOM Controls
      if (this.doomState !== 'closed' && this.doomState !== 'minimized' && this.activeWindow === 'doom') {
        const gameKeys = [
          'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
          'KeyW', 'KeyA', 'KeyS', 'KeyD',
          'Space', 'ControlLeft', 'ControlRight', 'KeyE',
          'Enter', 'NumpadEnter', 'Escape', 'Tab',
          'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'
        ];
        if (gameKeys.includes(e.code)) e.preventDefault();
        if (this.doomEngine) this.doomEngine.handleKeyDown(e);
      }

      // Command Prompt Typing
      if (this.cmdState !== 'closed' && this.cmdState !== 'minimized' && this.activeWindow === 'cmd') {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.executeCmd(this.cmdInput);
          this.cmdInput = '';
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          this.cmdInput = this.cmdInput.slice(0, -1);
          this.playKeyboardClack();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.cmdHistoryList.length > 0) {
            if (this.cmdHistoryIndex === -1) {
              this.cmdHistoryIndex = this.cmdHistoryList.length - 1;
            } else if (this.cmdHistoryIndex > 0) {
              this.cmdHistoryIndex--;
            }
            this.cmdInput = this.cmdHistoryList[this.cmdHistoryIndex] || '';
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.cmdHistoryIndex !== -1) {
            if (this.cmdHistoryIndex < this.cmdHistoryList.length - 1) {
              this.cmdHistoryIndex++;
              this.cmdInput = this.cmdHistoryList[this.cmdHistoryIndex] || '';
            } else {
              this.cmdHistoryIndex = -1;
              this.cmdInput = '';
            }
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const known = ['DIR', 'DOOM', 'MINES', 'NOTEPAD', 'IE', 'EXPLORER', 'SYSINFO', 'PING', 'TREE', 'MATRIX', 'COLOR 0A', 'HELP', 'CLS', 'EXIT'];
          const match = known.find(k => k.toLowerCase().startsWith(this.cmdInput.toLowerCase()));
          if (match) this.cmdInput = match;
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.cmdInput += e.key;
          this.playKeyboardClack();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.doomState !== 'closed' && this.doomState !== 'minimized' && this.activeWindow === 'doom') {
        if (this.doomEngine) this.doomEngine.handleKeyUp(e);
      }
    });

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.activeWindow === 'notepad') {
        this.notepadScroll = Math.max(0, this.notepadScroll + e.deltaY * 0.4);
      } else {
        this.websiteScrollY = Math.max(0, Math.min(550, this.websiteScrollY + e.deltaY * 0.45));
      }
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

    this.pointer.x = THREE.MathUtils.lerp(this.pointer.x, this.pointer.targetX, 0.08);
    this.pointer.y = THREE.MathUtils.lerp(this.pointer.y, this.pointer.targetY, 0.08);

    if (this.pcGroup) {
      this.pcGroup.rotation.y = this.pointer.x * 0.22;
      this.pcGroup.rotation.x = -this.pointer.y * 0.16;
      this.pcGroup.rotation.z = 0;
    }

    if (this.doomEngine && this.doomEngine.loaded && this.doomEngine.running) {
      this.doomEngine.step();
    }

    this.stepJukebox();

    this.renderRetroScreen();
    if (this.screenTexture) {
      this.screenTexture.needsUpdate = true;
    }

    this.camera.lookAt(0, -0.35, 0);

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
    if (this.doomEngine) this.doomEngine.running = false;
    if (this.container) this.container.style.cursor = '';
    document.body.style.cursor = '';
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    if (this.renderTarget) this.renderTarget.dispose();
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
