import { initThreeScene } from '../utils/common.js';

export default {
  id: 'three-particle-galaxy',
  title: 'Particle Vortex Galaxy (100k Points)',
  category: 'Three.js Fundamentals',
  badge: 'Three.js',
  badgeClass: 'badge-three',
  difficulty: 'Intermediate',
  description: 'Simulate an astronomical spiral galaxy with 100,000+ individual particles using GPU-optimized BufferGeometry and additive blending.',

  tutorial: {
    overview: `
      Rendering hundreds of thousands of individual 3D meshes causes massive CPU-GPU draw call bottlenecks.
      <br><br>
      <code>THREE.Points</code> solves this by batching all particles into a single draw call. Every vertex in a <code>BufferGeometry</code> represents a particle coordinate, and custom attribute buffers (like colors and scales) can be passed directly to the GPU shader.
    `,
    keyConcepts: [
      { name: 'THREE.Points', desc: 'A single draw call container that renders all vertices as point sprites.' },
      { name: 'THREE.AdditiveBlending', desc: 'Blends overlapping particle colors additively, creating realistic glowing energy fields and nebulae.' },
      { name: 'Logarithmic Spiral Math', desc: 'Mathematical polar coordinates (r, θ) where particle angle increases logarithmically with radius to form natural spiral arms.' }
    ],
    tips: 'Adjust the "Spiral Branches" and "Core / Arm Colors" to see immediate procedural galaxy transformations.'
  },

  init(container, onStatsUpdate) {
    const { scene, camera, renderer, controls, cleanup } = initThreeScene(container, {
      cameraPos: [0, 8, 14],
      cameraTarget: [0, 0, 0]
    });

    const params = {
      count: 75000,
      size: 0.025,
      radius: 8.0,
      branches: 3,
      spin: 1.2,
      randomness: 0.45,
      power: 3.5,
      rotationSpeed: 0.6,
      insideColor: '#ffffff',
      outsideColor: '#a855f7'
    };

    let geometry = null;
    let material = null;
    let points = null;

    // Helper to generate circular particle texture for round, glowing points
    function createParticleTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    }

    const particleTexture = createParticleTexture();

    function generateGalaxy() {
      if (points !== null) {
        geometry.dispose();
        material.dispose();
        scene.remove(points);
      }

      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(params.count * 3);
      const colors = new Float32Array(params.count * 3);

      const colorInside = new THREE.Color(params.insideColor);
      const colorOutside = new THREE.Color(params.outsideColor);

      for (let i = 0; i < params.count; i++) {
        const i3 = i * 3;

        // Position math
        const radius = Math.random() * params.radius;
        const spinAngle = radius * params.spin;
        const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

        const randomX = Math.pow(Math.random(), params.power) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
        const randomY = Math.pow(Math.random(), params.power) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
        const randomZ = Math.pow(Math.random(), params.power) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        // Color gradient interpolation from core to spiral tips
        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / params.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // Particle Material
      material = new THREE.PointsMaterial({
        size: params.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        map: particleTexture,
        transparent: true
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);
    }

    generateGalaxy();

    let animationFrameId = null;
    let isPaused = false;
    let simulatedTime = 0;
    let lastTime = performance.now();
    const CYCLE_DURATION = 12;

    function animate(now) {
      animationFrameId = requestAnimationFrame(animate);
      if (!lastTime) lastTime = now;
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isPaused) {
        simulatedTime += delta;
      }

      const elapsedTime = simulatedTime;

      if (points) {
        points.rotation.y = elapsedTime * (params.rotationSpeed * 0.1);
      }

      if (controls) controls.update();
      renderer.render(scene, camera);

      if (onStatsUpdate) {
        onStatsUpdate({
          totalParticles: params.count.toLocaleString(),
          drawCalls: 1
        });
      }
    }

    animate(performance.now());

    return {
      destroy() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        particleTexture.dispose();
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
        if (points) {
          points.rotation.y = 0;
        }
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
            type: 'slider',
            label: 'Particle Count',
            min: 10000,
            max: 120000,
            step: 5000,
            value: params.count,
            onChange: (val) => {
              params.count = parseInt(val, 10);
              generateGalaxy();
            }
          },
          {
            type: 'slider',
            label: 'Spiral Branches',
            min: 2,
            max: 8,
            step: 1,
            value: params.branches,
            onChange: (val) => {
              params.branches = parseInt(val, 10);
              generateGalaxy();
            }
          },
          {
            type: 'slider',
            label: 'Vortex Spin',
            min: -3,
            max: 3,
            step: 0.1,
            value: params.spin,
            onChange: (val) => {
              params.spin = parseFloat(val);
              generateGalaxy();
            }
          },
          {
            type: 'slider',
            label: 'Rotation Speed',
            min: 0,
            max: 2,
            step: 0.1,
            value: params.rotationSpeed,
            onChange: (val) => { params.rotationSpeed = parseFloat(val); }
          },
          {
            type: 'slider',
            label: 'Particle Size',
            min: 0.01,
            max: 0.08,
            step: 0.005,
            value: params.size,
            onChange: (val) => {
              params.size = parseFloat(val);
              if (material) material.size = params.size;
            }
          },
          {
            type: 'color',
            label: 'Core Color',
            value: params.insideColor,
            onChange: (val) => {
              params.insideColor = val;
              generateGalaxy();
            }
          },
          {
            type: 'color',
            label: 'Arm Tip Color',
            value: params.outsideColor,
            onChange: (val) => {
              params.outsideColor = val;
              generateGalaxy();
            }
          }
        ];
      },
      codeSnippet: `// 1. Create BufferGeometry for 75,000 points
const count = 75000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

// 2. Compute spiral math & color gradients
for (let i = 0; i < count; i++) {
  const i3 = i * 3;
  const radius = Math.random() * 8.0;
  const spinAngle = radius * 1.2;
  const branchAngle = ((i % 3) / 3) * Math.PI * 2;
  
  positions[i3]     = Math.cos(branchAngle + spinAngle) * radius;
  positions[i3 + 1] = (Math.random() - 0.5) * 0.5;
  positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius;
  
  // Blend colors
  const mixedColor = colorInside.clone().lerp(colorOutside, radius / 8.0);
  colors[i3] = mixedColor.r; colors[i3+1] = mixedColor.g; colors[i3+2] = mixedColor.b;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// 3. Additive blended Points material (1 single draw call)
const material = new THREE.PointsMaterial({
  size: 0.025,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const galaxy = new THREE.Points(geometry, material);
scene.add(galaxy);`
    };
  }
};

