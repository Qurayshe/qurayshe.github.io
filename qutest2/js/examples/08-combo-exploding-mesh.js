import { initThreeScene, createStudioLighting, createCyberGrid } from '../utils/common.js';

export default {
  id: 'combo-exploding-mesh',
  title: '3D Mechanical Assembly & Exploding Stagger',
  category: 'Three.js + Anime.js Synergy',
  badge: 'Hybrid',
  badgeClass: 'badge-combo',
  difficulty: 'Advanced',
  description: 'Explode and reassemble a 3D procedural mechanical core into 125+ floating components using Anime.js 3D vector staggers and spring physics.',

  tutorial: {
    overview: `
      In 3D motion graphics and product showcases, "exploding views" reveal internal mechanics.
      <br><br>
      By caching each mesh component's base local transform <code>(x, y, z, rx, ry, rz)</code> and calculating its radial dispersion vector from the center, <strong>Anime.js</strong> can animate all pieces outward with staggered physics delays.
    `,
    keyConcepts: [
      { name: 'Radial Dispersion Vector', desc: 'Normalized direction from origin: dir = pos.normalize(). Scaled by explosion factor to determine target exploded position.' },
      { name: 'anime.stagger with 3D sorting', desc: 'Delaying outer pieces first or inner pieces first produces dynamic layered shockwave disassembly.' },
      { name: 'Spring Restitution', desc: 'Anime.js spring curves (spring(1, 90, 12, 0)) give physical mechanical snapping upon reassembly.' }
    ],
    tips: 'Click "Explode Core" or drag the Explosion Distance slider to inspect internal structures in mid-flight!'
  },

  init(container, onStatsUpdate) {
    const { scene, camera, renderer, controls, cleanup } = initThreeScene(container, {
      cameraPos: [0, 5, 10],
      cameraTarget: [0, 1.2, 0]
    });

    createStudioLighting(scene, { ambientIntensity: 0.4, dirIntensity: 1.6 });
    createCyberGrid(scene, 24, 24);

    // Glowing Inner Energy Core
    const coreGeo = new THREE.IcosahedronGeometry(0.9, 3);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 1.2;
    scene.add(coreMesh);

    const coreLight = new THREE.PointLight(0xa855f7, 3, 10);
    coreLight.position.y = 1.2;
    scene.add(coreLight);

    // Build 5x5x5 Modular Mechanical Cube
    const dim = 5;
    const spacing = 0.55;
    const offset = ((dim - 1) * spacing) / 2;
    const parts = [];

    const boxGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1a0f2e,
      metalness: 0.85,
      roughness: 0.25
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x7f00ff,
      metalness: 0.9,
      roughness: 0.15
    });
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      metalness: 0.8,
      roughness: 0.2
    });

    const group = new THREE.Group();
    group.position.y = 1.2;
    scene.add(group);

    for (let x = 0; x < dim; x++) {
      for (let y = 0; y < dim; y++) {
        for (let z = 0; z < dim; z++) {
          // Leave room for inner glowing core
          if (x >= 1 && x <= 3 && y >= 1 && y <= 3 && z >= 1 && z <= 3) {
            continue;
          }

          const posX = x * spacing - offset;
          const posY = y * spacing - offset;
          const posZ = z * spacing - offset;

          // Pick material based on position
          let mat = metalMat;
          if ((x + y + z) % 3 === 0) mat = accentMat;
          else if ((x + y + z) % 5 === 0) mat = whiteMat;

          const mesh = new THREE.Mesh(boxGeo, mat);
          mesh.position.set(posX, posY, posZ);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);

          const distFromCenter = Math.sqrt(posX * posX + posY * posY + posZ * posZ);
          const dirX = posX / (distFromCenter || 1);
          const dirY = posY / (distFromCenter || 1);
          const dirZ = posZ / (distFromCenter || 1);

          parts.push({
            mesh,
            basePos: { x: posX, y: posY, z: posZ },
            dir: { x: dirX, y: dirY, z: dirZ },
            dist: distFromCenter,
            current: {
              x: posX,
              y: posY,
              z: posZ,
              rx: 0,
              ry: 0,
              rz: 0,
              scale: 1
            }
          });
        }
      }
    }

    // Sort parts from inner to outer for natural staggered waves
    parts.sort((a, b) => a.dist - b.dist);

    let isExploded = false;
    let activeAnim = null;
    const explosionFactor = 2.4;

    function triggerExplosion(explode = true) {
      if (activeAnim) activeAnim.pause();
      isExploded = explode;

      const targets = parts.map((p) => p.current);

      activeAnim = anime({
        targets,
        x: (el, i) => explode ? parts[i].basePos.x + parts[i].dir.x * (explosionFactor * (parts[i].dist * 0.8)) : parts[i].basePos.x,
        y: (el, i) => explode ? parts[i].basePos.y + parts[i].dir.y * (explosionFactor * (parts[i].dist * 0.8)) : parts[i].basePos.y,
        z: (el, i) => explode ? parts[i].basePos.z + parts[i].dir.z * (explosionFactor * (parts[i].dist * 0.8)) : parts[i].basePos.z,
        rx: (el, i) => explode ? parts[i].dir.x * 2.5 : 0,
        ry: (el, i) => explode ? parts[i].dir.y * 2.5 : 0,
        rz: (el, i) => explode ? parts[i].dir.z * 2.5 : 0,
        scale: explode ? 0.8 : 1.0,
        delay: anime.stagger(15, { from: explode ? 'first' : 'last' }),
        duration: 1400,
        easing: explode ? 'easeOutExpo' : 'spring(1, 80, 12, 0)',
        update: () => {
          parts.forEach((p) => {
            p.mesh.position.set(p.current.x, p.current.y, p.current.z);
            p.mesh.rotation.set(p.current.rx, p.current.ry, p.current.rz);
            p.mesh.scale.setScalar(p.current.scale);
          });
        },
        complete: () => {
          if (onStatsUpdate) {
            onStatsUpdate({
              totalBlocks: parts.length,
              status: isExploded ? 'Exploded State' : 'Assembled Solid'
            });
          }
        }
      });
    }

    let animationFrameId = null;
    let isPaused = false;
    let simulatedTime = 0;
    let lastTime = performance.now();
    const CYCLE_DURATION = 10;

    function animate(now) {
      animationFrameId = requestAnimationFrame(animate);
      if (!lastTime) lastTime = now;
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isPaused) {
        simulatedTime += delta;
      }

      const t = simulatedTime;

      group.rotation.y = t * 0.3;
      coreMesh.rotation.y = -t * 0.8;
      coreMesh.rotation.x = t * 0.5;

      const pulse = 1 + Math.sin(t * 4) * 0.15;
      coreMesh.scale.setScalar(pulse);
      coreLight.intensity = 2.5 + Math.sin(t * 4) * 1.5;

      if (controls) controls.update();
      renderer.render(scene, camera);
    }

    animate(performance.now());

    return {
      destroy() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (activeAnim) activeAnim.pause();
        boxGeo.dispose();
        metalMat.dispose();
        accentMat.dispose();
        whiteMat.dispose();
        cleanup();
      },
      play() {
        isPaused = false;
        lastTime = performance.now();
        if (activeAnim) activeAnim.play();
      },
      pause() {
        isPaused = true;
        if (activeAnim) activeAnim.pause();
      },
      restart() {
        simulatedTime = 0;
        isPaused = false;
        lastTime = performance.now();
        triggerExplosion(false);
      },
      seek(progressPercent) {
        simulatedTime = (progressPercent / 100) * CYCLE_DURATION;
        triggerExplosion(progressPercent > 40);
      },
      getProgress() {
        return {
          progress: ((simulatedTime % CYCLE_DURATION) / CYCLE_DURATION) * 100,
          time: simulatedTime
        };
      },
      getControls() {
        return [
          {
            type: 'button',
            label: '💥 Explode Mechanical Core',
            onClick: () => triggerExplosion(true)
          },
          {
            type: 'button',
            label: '🧲 Reassemble Core (Spring Snap)',
            onClick: () => triggerExplosion(false)
          },
          {
            type: 'button',
            label: '🔄 Toggle Explode / Assemble',
            onClick: () => triggerExplosion(!isExploded)
          }
        ];
      },
      codeSnippet: `// 1. Calculate radial dispersion direction for each voxel
const dist = Math.sqrt(x*x + y*y + z*z);
const dir = { x: x / dist, y: y / dist, z: z / dist };

// 2. Animate mesh positions outward with Anime.js staggers
anime({
  targets: parts.map(p => p.current),
  x: (el, i) => parts[i].basePos.x + parts[i].dir.x * 2.5,
  y: (el, i) => parts[i].basePos.y + parts[i].dir.y * 2.5,
  z: (el, i) => parts[i].basePos.z + parts[i].dir.z * 2.5,
  rx: (el, i) => parts[i].dir.x * 2.0,
  ry: (el, i) => parts[i].dir.y * 2.0,
  // 3. Stagger radial wave from inner core to outer shell
  delay: anime.stagger(15, { from: 'first' }),
  duration: 1400,
  easing: 'easeOutExpo',
  update: () => {
    parts.forEach(p => {
      p.mesh.position.set(p.current.x, p.current.y, p.current.z);
      p.mesh.rotation.set(p.current.rx, p.current.ry, p.current.rz);
    });
  }
});`
    };
  }
};

