import { initThreeScene, createCyberGrid } from '../utils/common.js';

export default {
  id: 'combo-kinetic-audio',
  title: 'Kinetic 3D Soundwave & Procedural Equalizer',
  category: 'Three.js + Anime.js Synergy',
  badge: 'Hybrid',
  badgeClass: 'badge-combo',
  difficulty: 'Advanced',
  description: 'Simulate a circular 3D audio spectrum visualizer with 64 kinetic frequency bars, procedural beat synthesizer, and Anime.js spring shockwaves.',

  tutorial: {
    overview: `
      Real-time audio visualizers convert frequency spectrum data (FFT bins) into 3D geometric scales and heights.
      <br><br>
      Directly applying raw frequency data causes jittery rendering. By smoothing bar height transitions with <strong>Anime.js</strong> elastic springs and interpolating emissive colors based on amplitude, motion feels rhythmic, polished, and organic.
    `,
    keyConcepts: [
      { name: 'Radial Equalizer Coordinates', desc: 'x = cos(angle) * radius, z = sin(angle) * radius.' },
      { name: 'Emissive Color Modulation', desc: 'Dynamically interpolating material.emissive between deep blue (idle) and blazing neon magenta (peak).' },
      { name: 'Shockwave Propagation', desc: 'Anime.js expands a ring geometry radius and fades opacity to simulate sonic pressure waves.' }
    ],
    tips: 'Click "⚡ Trigger Bass Drop" to experience a massive synchronized shockwave and bar rebound!'
  },

  init(container, onStatsUpdate) {
    const { scene, camera, renderer, controls, cleanup } = initThreeScene(container, {
      cameraPos: [0, 6, 9],
      cameraTarget: [0, 0.8, 0]
    });

    createCyberGrid(scene, 24, 24);

    const barCount = 64;
    const radius = 3.2;
    const bars = [];

    const barGeo = new THREE.BoxGeometry(0.18, 1, 0.18);
    // Shift geometry pivot to bottom so scaling in Y grows upwards from floor
    barGeo.translate(0, 0.5, 0);

    const barGroup = new THREE.Group();
    scene.add(barGroup);

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const mat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x3b0764,
        roughness: 0.2,
        metalness: 0.8
      });

      const mesh = new THREE.Mesh(barGeo, mat);
      mesh.position.set(x, -2, z);
      mesh.rotation.y = -angle;
      barGroup.add(mesh);

      bars.push({
        mesh,
        material: mat,
        targetScaleY: 1,
        currentScaleY: 1,
        angle
      });
    }

    // Center Pulsing Audio Core
    const coreGeo = new THREE.DodecahedronGeometry(0.8, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xa855f7,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = -0.5;
    scene.add(coreMesh);

    const coreLight = new THREE.PointLight(0xa855f7, 3, 10);
    coreLight.position.y = -0.5;
    scene.add(coreLight);

    // Shockwave Ring
    const shockRingGeo = new THREE.RingGeometry(0.1, 0.3, 64);
    const shockRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const shockRing = new THREE.Mesh(shockRingGeo, shockRingMat);
    shockRing.rotation.x = -Math.PI / 2;
    shockRing.position.y = -1.98;
    scene.add(shockRing);

    // Audio synthesizer simulation state
    const synth = {
      bpm: 128,
      isPlaying: true,
      bassIntensity: 1.0,
      beatPhase: 0
    };

    function triggerBassDrop() {
      // 1. Shockwave ring animation
      shockRing.scale.set(0.1, 0.1, 0.1);
      shockRingMat.opacity = 1;

      anime({
        targets: shockRing.scale,
        x: 45,
        y: 45,
        duration: 900,
        easing: 'easeOutQuad',
        update: () => {
          shockRingMat.opacity = Math.max(0, 1 - shockRing.scale.x / 45);
        }
      });

      // 2. Explode bars scale
      anime({
        targets: bars.map((b) => b),
        currentScaleY: [
          { value: 5.5, duration: 150, easing: 'easeOutQuad' },
          { value: 1.0, duration: 800, easing: 'spring(1, 90, 8, 0)' }
        ],
        delay: anime.stagger(10, { from: 'center' }),
        update: () => {
          bars.forEach((b) => {
            b.mesh.scale.y = b.currentScaleY;
            b.material.emissive.setHex(0xff0055);
          });
        }
      });

      // 3. Core pop
      anime({
        targets: coreMesh.scale,
        x: [2.2, 1.0],
        y: [2.2, 1.0],
        z: [2.2, 1.0],
        duration: 600,
        easing: 'easeOutElastic(1, .6)'
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

      const time = simulatedTime;

      // Procedural Beat Synthesis (Kick + Melody Waves)
      const beatInterval = 60 / synth.bpm;
      const beatProgress = (time % beatInterval) / beatInterval;
      const kick = Math.pow(1 - beatProgress, 4) * synth.bassIntensity;

      coreMesh.rotation.y = time * 0.8;
      coreMesh.rotation.x = time * 0.5;

      bars.forEach((b, i) => {
        // Multi-frequency wave formula
        const freq1 = Math.sin(time * 6 + b.angle * 3) * 0.6;
        const freq2 = Math.cos(time * 12 + b.angle * 5) * 0.4;
        const freq3 = Math.sin(time * 3 + b.angle * 1) * 0.8;

        const combinedWave = Math.max(0.2, (freq1 + freq2 + freq3 + kick * 2.2));
        b.mesh.scale.y = THREE.MathUtils.lerp(b.mesh.scale.y, combinedWave * 2.2, 0.25);

        // Dynamic emissive coloration based on height (Purple & White palette)
        if (b.mesh.scale.y > 3.0) {
          b.material.color.setHex(0xffffff);
          b.material.emissive.setHex(0xc084fc);
        } else if (b.mesh.scale.y > 1.8) {
          b.material.color.setHex(0xc084fc);
          b.material.emissive.setHex(0x7f00ff);
        } else {
          b.material.color.setHex(0x221138);
          b.material.emissive.setHex(0x120722);
        }
      });

      barGroup.rotation.y = time * 0.1;

      if (controls) controls.update();
      renderer.render(scene, camera);

      if (onStatsUpdate) {
        onStatsUpdate({
          frequencyBars: barCount,
          simulatedBPM: synth.bpm,
          kickIntensity: (kick * 100).toFixed(0) + '%'
        });
      }
    }

    animate(performance.now());

    return {
      destroy() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        barGeo.dispose();
        coreGeo.dispose();
        coreMat.dispose();
        shockRingGeo.dispose();
        shockRingMat.dispose();
        bars.forEach(b => {
          b.material.dispose();
          b.mesh.geometry.dispose();
        });
        cleanup();
      },
      play() {
        isPaused = false;
        lastTime = performance.now();
      },
      pause() {
        isPaused = true;
      },
      restart() {
        simulatedTime = 0;
        isPaused = false;
        lastTime = performance.now();
        triggerBassDrop();
      },
      seek(progressPercent) {
        simulatedTime = (progressPercent / 100) * CYCLE_DURATION;
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
            label: '⚡ Trigger Bass Drop',
            onClick: () => triggerBassDrop()
          },
          {
            type: 'slider',
            label: 'Tempo (BPM)',
            min: 80,
            max: 180,
            step: 2,
            value: synth.bpm,
            onChange: (val) => { synth.bpm = parseInt(val, 10); }
          },
          {
            type: 'slider',
            label: 'Bass Boost',
            min: 0.5,
            max: 2.5,
            step: 0.1,
            value: synth.bassIntensity,
            onChange: (val) => { synth.bassIntensity = parseFloat(val); }
          }
        ];
      },
      codeSnippet: `// 1. Arrange 64 frequency bars in a 3D circle
for (let i = 0; i < 64; i++) {
  const angle = (i / 64) * Math.PI * 2;
  const x = Math.cos(angle) * 3.2;
  const z = Math.sin(angle) * 3.2;
  const mesh = new THREE.Mesh(barGeometry, barMaterial);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = -angle;
  scene.add(mesh);
}

// 2. Trigger Sonic Shockwave with Anime.js
anime({
  targets: shockRing.scale,
  x: 45, y: 45,
  duration: 900,
  easing: 'easeOutQuad'
});

// 3. Elastic spring rebound on frequency bars
anime({
  targets: bars,
  scaleY: [
    { value: 5.5, duration: 150 },
    { value: 1.0, duration: 800, easing: 'spring(1, 90, 8, 0)' }
  ],
  delay: anime.stagger(10, { from: 'center' })
});`
    };
  }
};

