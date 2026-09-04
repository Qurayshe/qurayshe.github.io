import { initThreeScene, createStudioLighting, createCyberGrid } from '../utils/common.js';

export default {
  id: 'three-geometries',
  title: 'Procedural Geometries & Vertex Morphing',
  category: 'Three.js Fundamentals',
  badge: 'Three.js',
  badgeClass: 'badge-three',
  difficulty: 'Beginner',
  description: 'Explore procedural 3D geometries, real-time vertex deformation using sine waves, normal vectors, and material shading.',
  
  tutorial: {
    overview: `
      In Three.js, all 3D visible objects are built using <strong>Geometries</strong> (the mathematical 3D vertices, faces, and normals) paired with <strong>Materials</strong> (how light interacts with surfaces).
      <br><br>
      This example demonstrates how to manipulate raw vertex buffer positions in real-time within the render loop to create organic breathing/wave morphing effects without pre-baked morph targets.
    `,
    keyConcepts: [
      { name: 'THREE.BufferGeometry', desc: 'Stores vertex coordinates, normals, and UVs in efficient typed arrays (Float32Array).' },
      { name: 'position.needsUpdate = true', desc: 'Flags Three.js to re-upload modified vertex buffer data to the GPU.' },
      { name: 'THREE.MeshPhysicalMaterial', desc: 'High-end PBR material supporting roughness, metalness, clearcoat, and iridescence.' }
    ],
    tips: 'Try toggling wireframe mode and increasing the wave amplitude to inspect how individual vertices displace along their normals.'
  },

  init(container, onStatsUpdate) {
    const { scene, camera, renderer, controls, cleanup } = initThreeScene(container, {
      cameraPos: [0, 2, 5.5]
    });

    createStudioLighting(scene);
    createCyberGrid(scene, 20, 20);

    // State parameters
    const params = {
      shape: 'TorusKnot',
      waveAmp: 0.15,
      waveFreq: 3.0,
      waveSpeed: 2.0,
      roughness: 0.2,
      metalness: 0.85,
      wireframe: false,
      autoRotate: true,
      color: '#a855f7'
    };

    let mesh = null;
    let basePositions = null;

    const geometries = {
      TorusKnot: () => new THREE.TorusKnotGeometry(1.2, 0.4, 160, 32),
      Icosahedron: () => new THREE.IcosahedronGeometry(1.5, 4),
      Dodecahedron: () => new THREE.DodecahedronGeometry(1.5, 3),
      Torus: () => new THREE.TorusGeometry(1.4, 0.45, 32, 100),
      Cylinder: () => new THREE.CylinderGeometry(1.2, 1.2, 2.5, 64, 32)
    };

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(params.color),
      metalness: params.metalness,
      roughness: params.roughness,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
      wireframe: params.wireframe,
      flatShading: false
    });

    function rebuildMesh() {
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
      }

      const geo = geometries[params.shape]();
      mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Cache original vertex positions for dynamic morphing calculations
      basePositions = geo.attributes.position.array.slice();
    }

    rebuildMesh();

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

      if (mesh && params.autoRotate) {
        mesh.rotation.y = time * 0.4;
        mesh.rotation.x = Math.sin(time * 0.2) * 0.2;
      }

      // Real-time vertex wave deformation
      if (mesh && basePositions && params.waveAmp > 0) {
        const positionAttr = mesh.geometry.attributes.position;
        const posArray = positionAttr.array;

        for (let i = 0; i < posArray.length; i += 3) {
          const u = basePositions[i];
          const v = basePositions[i + 1];
          const w = basePositions[i + 2];

          // Compute distance from center
          const dist = Math.sqrt(u * u + v * v + w * w);
          // Sine wave modulation
          const offset = Math.sin(dist * params.waveFreq - time * params.waveSpeed) * params.waveAmp;

          posArray[i] = u + (u / dist) * offset;
          posArray[i + 1] = v + (v / dist) * offset;
          posArray[i + 2] = w + (w / dist) * offset;
        }

        positionAttr.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      }

      if (controls) controls.update();
      renderer.render(scene, camera);

      if (onStatsUpdate) {
        onStatsUpdate({
          vertices: mesh ? mesh.geometry.attributes.position.count : 0,
          triangles: mesh ? (mesh.geometry.index ? mesh.geometry.index.count / 3 : mesh.geometry.attributes.position.count / 3) : 0
        });
      }
    }

    animate(performance.now());

    return {
      destroy() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
        if (mesh) {
          mesh.rotation.set(0, 0, 0);
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
            type: 'select',
            label: 'Geometry Shape',
            value: params.shape,
            options: ['TorusKnot', 'Icosahedron', 'Dodecahedron', 'Torus', 'Cylinder'],
            onChange: (val) => {
              params.shape = val;
              rebuildMesh();
            }
          },
          {
            type: 'slider',
            label: 'Wave Amplitude',
            min: 0,
            max: 0.5,
            step: 0.01,
            value: params.waveAmp,
            onChange: (val) => { params.waveAmp = parseFloat(val); }
          },
          {
            type: 'slider',
            label: 'Wave Frequency',
            min: 1,
            max: 8,
            step: 0.1,
            value: params.waveFreq,
            onChange: (val) => { params.waveFreq = parseFloat(val); }
          },
          {
            type: 'slider',
            label: 'Roughness',
            min: 0,
            max: 1,
            step: 0.05,
            value: params.roughness,
            onChange: (val) => {
              params.roughness = parseFloat(val);
              material.roughness = params.roughness;
            }
          },
          {
            type: 'slider',
            label: 'Metalness',
            min: 0,
            max: 1,
            step: 0.05,
            value: params.metalness,
            onChange: (val) => {
              params.metalness = parseFloat(val);
              material.metalness = params.metalness;
            }
          },
          {
            type: 'color',
            label: 'Base Color',
            value: params.color,
            onChange: (val) => {
              params.color = val;
              material.color.set(val);
            }
          },
          {
            type: 'toggle',
            label: 'Wireframe Mode',
            value: params.wireframe,
            onChange: (val) => {
              params.wireframe = val;
              material.wireframe = val;
            }
          }
        ];
      },
      codeSnippet: `// 1. Create procedural geometry
const geo = new THREE.TorusKnotGeometry(1.2, 0.4, 160, 32);
const basePositions = geo.attributes.position.array.slice();

// 2. Create PBR material
const mat = new THREE.MeshPhysicalMaterial({
  color: 0xa855f7,
  metalness: 0.85,
  roughness: 0.2,
  clearcoat: 0.5
});
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

// 3. Real-time vertex displacement in animation loop
function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.002;
  const pos = geo.attributes.position.array;
  
  for (let i = 0; i < pos.length; i += 3) {
    const u = basePositions[i], v = basePositions[i+1], w = basePositions[i+2];
    const dist = Math.sqrt(u*u + v*v + w*w);
    const offset = Math.sin(dist * 3.0 - time) * 0.15;
    
    pos[i] = u + (u / dist) * offset;
    pos[i+1] = v + (v / dist) * offset;
    pos[i+2] = w + (w / dist) * offset;
  }
  
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
  renderer.render(scene, camera);
}`
    };
  }
};

