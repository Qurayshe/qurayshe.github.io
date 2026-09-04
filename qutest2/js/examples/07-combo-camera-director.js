import { initThreeScene, createStudioLighting, createCyberGrid } from '../utils/common.js';

export default {
  id: 'combo-camera-director',
  title: 'Cinematic Camera Choreography & Dolly Zoom',
  category: 'Three.js + Anime.js Synergy',
  badge: 'Hybrid',
  badgeClass: 'badge-combo',
  difficulty: 'Advanced',
  description: 'Drive Three.js camera position coordinates, lookAt vectors, and FOV transitions using Anime.js smooth easing timelines and Vertigo Dolly Zooms.',

  tutorial: {
    overview: `
      Combining <strong>Three.js</strong> 3D rendering with <strong>Anime.js</strong> allows cinematic camera transitions that feel fluid and natural.
      <br><br>
      By tweening both the camera's <code>position</code> (x, y, z) and an interpolated <code>lookAtTarget</code> object, the camera sweeps seamlessly between focal subjects.
      <br><br>
      The <strong>Dolly Zoom (Vertigo Effect)</strong> mathematically pairs camera FOV expansion with physical camera approach:
      <code>distance = baseDistance / tan(FOV / 2)</code>
    `,
    keyConcepts: [
      { name: 'Camera Position Interpolation', desc: 'Anime.js tweens an object {x, y, z} and applies it to camera.position every tick.' },
      { name: 'Camera.lookAt(target)', desc: 'Keeps the viewpoint centered on the current subject throughout translation.' },
      { name: 'camera.updateProjectionMatrix()', desc: 'Must be invoked after modifying camera.fov to update the GPU perspective projection frustum.' }
    ],
    tips: 'Click "Trigger Dolly Zoom" to observe the Hollywood Vertigo effect where background perspective warps while subject size stays fixed!'
  },

  init(container, onStatsUpdate) {
    const { scene, camera, renderer, controls, cleanup } = initThreeScene(container, {
      cameraPos: [0, 8, 16],
      cameraTarget: [0, 1, 0]
    });

    createStudioLighting(scene, { ambientIntensity: 0.3, dirIntensity: 1.5 });
    createCyberGrid(scene, 30, 30);

    // 4 Art Exhibition Stations
    const stations = [
      {
        id: 'crystal',
        name: 'Quantum Obelisk',
        pos: [-5, 1.5, -2],
        cameraPos: [-5, 2.5, 3],
        lookAt: [-5, 1.5, -2],
        color: 0xa855f7,
        mesh: new THREE.Mesh(
          new THREE.ConeGeometry(1, 3, 4),
          new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.1, metalness: 0.9 })
        )
      },
      {
        id: 'torus',
        name: 'Neon Knot',
        pos: [5, 1.5, -2],
        cameraPos: [5, 2.8, 3.5],
        lookAt: [5, 1.5, -2],
        color: 0xc084fc,
        mesh: new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.9, 0.3, 100, 16),
          new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.2, metalness: 0.8 })
        )
      },
      {
        id: 'sphere',
        name: 'White Star Sphere',
        pos: [0, 1.5, -6],
        cameraPos: [0, 2.5, -1],
        lookAt: [0, 1.5, -6],
        color: 0xffffff,
        mesh: new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.2, 3),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.85 })
        )
      },
      {
        id: 'overview',
        name: 'Gallery Overview',
        pos: [0, 0, 0],
        cameraPos: [0, 9, 14],
        lookAt: [0, 1, -2],
        color: 0xe9d5ff,
        mesh: null
      }
    ];

    // Build stations into scene
    stations.forEach((s) => {
      if (s.mesh) {
        s.mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
        s.mesh.castShadow = true;
        s.mesh.receiveShadow = true;
        scene.add(s.mesh);

        // Glowing Pedestal
        const ped = new THREE.Mesh(
          new THREE.CylinderGeometry(1.4, 1.6, 0.4, 32),
          new THREE.MeshStandardMaterial({ color: 0x201235, roughness: 0.4 })
        );
        ped.position.set(s.pos[0], -0.2, s.pos[2]);
        ped.receiveShadow = true;
        scene.add(ped);

        // Local Point Light
        const pLight = new THREE.PointLight(s.color, 1.5, 8);
        pLight.position.set(s.pos[0], s.pos[1] + 2, s.pos[2]);
        scene.add(pLight);
      }
    });

    const camState = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      targetX: 0,
      targetY: 1,
      targetZ: 0,
      fov: 50
    };

    let activeAnim = null;
    let currentStationIndex = 0;

    function flyToStation(index) {
      if (activeAnim) activeAnim.pause();
      if (controls) controls.enabled = false;

      currentStationIndex = index;
      const target = stations[index];

      activeAnim = anime({
        targets: camState,
        x: target.cameraPos[0],
        y: target.cameraPos[1],
        z: target.cameraPos[2],
        targetX: target.lookAt[0],
        targetY: target.lookAt[1],
        targetZ: target.lookAt[2],
        fov: 50,
        duration: 1800,
        easing: 'easeInOutCubic',
        update: () => {
          camera.position.set(camState.x, camState.y, camState.z);
          camera.fov = camState.fov;
          camera.updateProjectionMatrix();

          if (controls) {
            controls.target.set(camState.targetX, camState.targetY, camState.targetZ);
          }
          camera.lookAt(camState.targetX, camState.targetY, camState.targetZ);
        },
        complete: () => {
          if (controls) controls.enabled = true;
          if (onStatsUpdate) {
            onStatsUpdate({
              activeSubject: target.name,
              cameraCoords: `X:${camState.x.toFixed(1)} Y:${camState.y.toFixed(1)} Z:${camState.z.toFixed(1)}`,
              fov: camState.fov.toFixed(0) + '°'
            });
          }
        }
      });
    }

    function triggerDollyZoom() {
      if (activeAnim) activeAnim.pause();
      if (controls) controls.enabled = false;

      // Dolly Zoom on Quantum Obelisk
      const focalObjPos = [-5, 1.5, -2];
      camState.x = focalObjPos[0];
      camState.y = focalObjPos[1] + 0.5;
      camState.targetX = focalObjPos[0];
      camState.targetY = focalObjPos[1];
      camState.targetZ = focalObjPos[2];

      const dollyTimeline = anime.timeline({
        direction: 'alternate',
        easing: 'easeInOutQuad',
        complete: () => {
          if (controls) controls.enabled = true;
        }
      });

      dollyTimeline.add({
        targets: camState,
        z: [1.2, 8.5],
        fov: [30, 85],
        duration: 2200,
        update: () => {
          camera.position.set(camState.x, camState.y, camState.z);
          camera.fov = camState.fov;
          camera.updateProjectionMatrix();
          camera.lookAt(camState.targetX, camState.targetY, camState.targetZ);
          if (controls) controls.target.set(camState.targetX, camState.targetY, camState.targetZ);
        }
      });
    }

    let animationFrameId = null;
    let isPaused = false;
    let simulatedTime = 0;
    let lastTime = performance.now();
    const CYCLE_DURATION = 16;

    function animate(now) {
      animationFrameId = requestAnimationFrame(animate);
      if (!lastTime) lastTime = now;
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isPaused) {
        simulatedTime += delta;
      }

      const time = simulatedTime;

      // Rotate showcase meshes
      stations.forEach((s) => {
        if (s.mesh) {
          s.mesh.rotation.y = time * 0.5;
          s.mesh.rotation.x = Math.sin(time * 0.3) * 0.2;
        }
      });

      if (controls && controls.enabled) controls.update();
      renderer.render(scene, camera);
    }

    animate(performance.now());
    flyToStation(0);

    return {
      destroy() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (activeAnim) activeAnim.pause();
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
        flyToStation(0);
      },
      seek(progressPercent) {
        simulatedTime = (progressPercent / 100) * CYCLE_DURATION;
        const targetStation = Math.min(3, Math.floor((progressPercent / 100) * 4));
        if (targetStation !== currentStationIndex) {
          currentStationIndex = targetStation;
          flyToStation(targetStation);
        }
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
            label: 'Station 1: Quantum Obelisk',
            onClick: () => flyToStation(0)
          },
          {
            type: 'button',
            label: 'Station 2: Neon Knot',
            onClick: () => flyToStation(1)
          },
          {
            type: 'button',
            label: 'Station 3: Plasma Sphere',
            onClick: () => flyToStation(2)
          },
          {
            type: 'button',
            label: 'Station 4: Gallery Overview',
            onClick: () => flyToStation(3)
          },
          {
            type: 'button',
            label: '🎬 Trigger Dolly Zoom (Vertigo)',
            onClick: () => triggerDollyZoom()
          }
        ];
      },
      codeSnippet: `// 1. Camera target state object
const camState = {
  x: camera.position.x,
  y: camera.position.y,
  z: camera.position.z,
  targetX: 0, targetY: 1, targetZ: 0,
  fov: 50
};

// 2. Smoothly fly camera to new 3D coordinate
anime({
  targets: camState,
  x: targetX,
  y: targetY,
  z: targetZ,
  duration: 1800,
  easing: 'easeInOutCubic',
  update: () => {
    camera.position.set(camState.x, camState.y, camState.z);
    camera.lookAt(camState.targetX, camState.targetY, camState.targetZ);
    controls.target.set(camState.targetX, camState.targetY, camState.targetZ);
  }
});

// 3. Dolly Zoom (Vertigo Effect)
anime({
  targets: camState,
  z: [1.2, 8.5],
  fov: [30, 85],
  duration: 2200,
  easing: 'easeInOutQuad',
  direction: 'alternate',
  update: () => {
    camera.position.z = camState.z;
    camera.fov = camState.fov;
    camera.updateProjectionMatrix(); // Required when changing FOV
  }
});`
    };
  }
};

