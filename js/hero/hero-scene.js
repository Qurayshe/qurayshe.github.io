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
    this.activeMode = 'vortex'; // 'vortex', 'geometry', 'matrix', 'wave'

    // Scene Groups
    this.mainGroup = null;
    this.vortexGroup = null;
    this.geometryGroup = null;
    this.matrixGroup = null;
    this.waveGroup = null;

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
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 3. Main Rig Group
    this.mainGroup = new THREE.Group();
    this.scene.add(this.mainGroup);

    // 4. Sub-scene Mode Groups
    this.vortexGroup = new THREE.Group();
    this.geometryGroup = new THREE.Group();
    this.matrixGroup = new THREE.Group();
    this.waveGroup = new THREE.Group();

    this.mainGroup.add(this.vortexGroup);
    this.mainGroup.add(this.geometryGroup);
    this.mainGroup.add(this.matrixGroup);
    this.mainGroup.add(this.waveGroup);

    // Hide inactive mode groups initially
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
    this.buildParticleVortex();
    this.buildQuantumMesh();
    this.buildOrbitingLabNodes();
    this.buildMatrixGrid();
    this.buildWaveSpectrum();
    this.buildShockwaveRing();

    // 7. Bind Events & Start Render Loop
    this.bindEvents();
    this.animate();
  }

  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(230, 200, 255, 0.9)');
    grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  /* --------------------------------------------------------------------------
     MODE 1: PARTICLE VORTEX GALAXY (3 Spiral Branches)
     -------------------------------------------------------------------------- */
  buildParticleVortex() {
    const count = 18000;
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
      size: 0.08,
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
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.container.addEventListener('pointerdown', () => {
      this.triggerShockwave();
    });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 500;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const t = this.clock.getElapsedTime();

    // Smooth pointer lerp
    this.pointer.x = THREE.MathUtils.lerp(this.pointer.x, this.pointer.targetX, 0.08);
    this.pointer.y = THREE.MathUtils.lerp(this.pointer.y, this.pointer.targetY, 0.08);

    // Parallax & Rig Rotation
    this.mainGroup.rotation.y = t * 0.12 + this.pointer.x * 0.5;
    this.mainGroup.rotation.x = Math.sin(t * 0.1) * 0.08 - this.pointer.y * 0.35;

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
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
