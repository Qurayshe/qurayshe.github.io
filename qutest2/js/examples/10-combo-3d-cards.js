import { initThreeScene, createStudioLighting, createCyberGrid } from '../utils/common.js';

export default {
  id: 'combo-3d-cards',
  title: 'Raycasted 3D Interactive Card Deck',
  category: 'Three.js + Anime.js Synergy',
  badge: 'Hybrid',
  badgeClass: 'badge-combo',
  difficulty: 'Intermediate',
  description: 'Hover and click interactive 3D holographic cards using Three.js Raycasting paired with Anime.js 3D physics tilt, flip, and fan-out mechanics.',

  tutorial: {
    overview: `
      Web 3D micro-interactions combine <strong>Raycasting</strong> (casting an invisible ray from screen mouse coordinates into the 3D scene) with <strong>Anime.js</strong> physics easing.
      <br><br>
      When a card is hovered, mouse offset is mapped to subtle 3D rotational tilt <code>(rotation.x, rotation.y)</code>, while clicking executes a 180° flip animation with spring overshoot.
    `,
    keyConcepts: [
      { name: 'THREE.Raycaster', desc: 'Projects a ray from camera through 2D normalized mouse coordinates (-1 to +1) to find intersecting 3D meshes.' },
      { name: '3D Cursor Parallax Tilt', desc: 'Calculating angle = (mouseX - cardX) * sensitivity and tweening with Anime.js.' },
      { name: 'Multi-card Deck Layouts', desc: 'Anime.js staggers positions and z-rotations to fan out or stack card groups.' }
    ],
    tips: 'Hover over each card to see dynamic 3D tilt tracking, click any card to flip it over, or toggle between "Fan Out" and "Stack Deck".'
  },

  init(container, onStatsUpdate) {
    const { scene, camera, renderer, controls, cleanup } = initThreeScene(container, {
      cameraPos: [0, 1, 6],
      cameraTarget: [0, 0, 0],
      enableControls: true
    });

    createStudioLighting(scene, { ambientIntensity: 0.5, dirIntensity: 1.8 });
    createCyberGrid(scene, 20, 20);

    // Card dimensions
    const cardWidth = 1.8;
    const cardHeight = 2.6;
    const cardDepth = 0.05;

    const cardsData = [
      { id: 0, title: 'QUANTUM LOTUS', color: '#c084fc', cost: '99' },
      { id: 1, title: 'CYBER ARCHON', color: '#a855f7', cost: '120' },
      { id: 2, title: 'STELLAR CORE', color: '#ffffff', cost: '85' }
    ];

    // Helper to generate canvas texture for card front
    function createCardFrontTexture(data) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 740;
      const ctx = canvas.getContext('2d');

      // Card Background
      ctx.fillStyle = '#140c22';
      ctx.fillRect(0, 0, 512, 740);

      // Glowing border
      ctx.strokeStyle = data.color;
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, 492, 720);

      // Inner Frame
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, 464, 692);

      // Art Box
      const grad = ctx.createLinearGradient(0, 50, 512, 400);
      grad.addColorStop(0, '#22113a');
      grad.addColorStop(1, data.color);
      ctx.fillStyle = grad;
      ctx.fillRect(40, 60, 432, 340);

      // Header Text
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(data.title, 45, 450);

      // Cost Badge
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = data.color;
      ctx.fillText('PWR: ' + data.cost, 45, 485);

      // Tech details
      ctx.font = '16px monospace';
      ctx.fillStyle = '#d8b4fe';
      ctx.fillText('NFT // ACCESS CODE: 0x' + Math.floor(Math.random() * 0xffffff).toString(16), 45, 530);
      ctx.fillText('AUTHENTICATED THREE.JS ASSET', 45, 560);

      return new THREE.CanvasTexture(canvas);
    }

    // Helper to generate card back texture
    function createCardBackTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 740;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0e0818';
      ctx.fillRect(0, 0, 512, 740);
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, 492, 720);

      // Tech Emblem
      ctx.beginPath();
      ctx.arc(256, 370, 100, 0, Math.PI * 2);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('SECURITY LOCK', 256, 378);

      return new THREE.CanvasTexture(canvas);
    }

    const backTexture = createCardBackTexture();
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cardMeshes = [];
    const raycastTargets = [];

    cardsData.forEach((data, i) => {
      const frontTex = createCardFrontTexture(data);
      const materials = [
        new THREE.MeshStandardMaterial({ color: 0x1f1236, roughness: 0.3 }), // right
        new THREE.MeshStandardMaterial({ color: 0x1f1236, roughness: 0.3 }), // left
        new THREE.MeshStandardMaterial({ color: 0x1f1236, roughness: 0.3 }), // top
        new THREE.MeshStandardMaterial({ color: 0x1f1236, roughness: 0.3 }), // bottom
        new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.2, metalness: 0.1 }), // front
        new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.2, metalness: 0.1 }) // back
      ];

      const geo = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
      const mesh = new THREE.Mesh(geo, materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: i, isFlipped: false, frontTex, animState: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 } };

      cardGroup.add(mesh);
      cardMeshes.push(mesh);
      raycastTargets.push(mesh);
    });

    let isFanned = true;

    function applyLayout(fanned = true) {
      isFanned = fanned;
      const count = cardMeshes.length;

      cardMeshes.forEach((mesh, i) => {
        let targetX = 0;
        let targetY = 0;
        let targetZ = 0;
        let targetRz = 0;

        if (fanned) {
          const spread = 2.4;
          targetX = (i - 1) * spread;
          targetY = -Math.abs(i - 1) * 0.15;
          targetZ = 0;
          targetRz = -(i - 1) * 0.08;
        } else {
          // Stacked Deck
          targetX = 0;
          targetY = 0;
          targetZ = i * 0.1;
          targetRz = (i - 1) * 0.04;
        }

        anime({
          targets: mesh.userData.animState,
          x: targetX,
          y: targetY,
          z: targetZ,
          rz: targetRz,
          duration: 1000,
          easing: 'spring(1, 80, 10, 0)',
          update: () => {
            mesh.position.set(mesh.userData.animState.x, mesh.userData.animState.y, mesh.userData.animState.z);
            mesh.rotation.z = mesh.userData.animState.rz;
          }
        });
      });
    }

    applyLayout(true);

    // Raycasting & Mouse Tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let hoveredCard = null;

    const domElement = renderer.domElement;

    function onMouseMove(e) {
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastTargets);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredCard !== hit) {
          if (hoveredCard) resetCardHover(hoveredCard);
          hoveredCard = hit;
          elevateCardHover(hoveredCard);
        }

        // Tilt effect towards cursor
        const hitPoint = intersects[0].point;
        const tiltX = (hitPoint.y - hit.position.y) * -0.35;
        const tiltY = (hitPoint.x - hit.position.x) * 0.35;

        anime({
          targets: hit.rotation,
          x: tiltX,
          y: hit.userData.isFlipped ? Math.PI + tiltY : tiltY,
          duration: 250,
          easing: 'easeOutQuad'
        });
      } else {
        if (hoveredCard) {
          resetCardHover(hoveredCard);
          hoveredCard = null;
        }
      }
    }

    function onClick(e) {
      if (hoveredCard) {
        flipCard(hoveredCard);
      }
    }

    function elevateCardHover(mesh) {
      domElement.style.cursor = 'pointer';
      anime({
        targets: mesh.position,
        z: mesh.userData.animState.z + 0.6,
        duration: 400,
        easing: 'easeOutCubic'
      });
    }

    function resetCardHover(mesh) {
      domElement.style.cursor = 'default';
      anime({
        targets: mesh.position,
        z: mesh.userData.animState.z,
        duration: 500,
        easing: 'spring(1, 80, 10, 0)'
      });
      anime({
        targets: mesh.rotation,
        x: 0,
        y: mesh.userData.isFlipped ? Math.PI : 0,
        duration: 500,
        easing: 'spring(1, 80, 10, 0)'
      });
    }

    function flipCard(mesh) {
      mesh.userData.isFlipped = !mesh.userData.isFlipped;
      const targetY = mesh.userData.isFlipped ? Math.PI : 0;

      anime({
        targets: mesh.rotation,
        y: targetY,
        duration: 900,
        easing: 'easeOutElastic(1, .7)'
      });

      anime({
        targets: mesh.position,
        y: [mesh.userData.animState.y, mesh.userData.animState.y + 0.5, mesh.userData.animState.y],
        duration: 700,
        easing: 'easeInOutSine'
      });

      if (onStatsUpdate) {
        onStatsUpdate({
          action: `Flipped Card #${mesh.userData.id + 1}`,
          orientation: mesh.userData.isFlipped ? 'Card Back (Lock)' : 'Card Front (Artwork)'
        });
      }
    }

    domElement.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('click', onClick);

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

      cardGroup.position.y = Math.sin(simulatedTime * 1.5) * 0.08;

      if (controls) controls.update();
      renderer.render(scene, camera);
    }

    animate(performance.now());

    return {
      destroy() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        domElement.removeEventListener('mousemove', onMouseMove);
        domElement.removeEventListener('click', onClick);
        backTexture.dispose();
        cardMeshes.forEach(m => {
          m.userData.frontTex.dispose();
          m.geometry.dispose();
          m.material.forEach(mat => mat.dispose());
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
        applyLayout(true);
        cardMeshes.forEach(m => {
          if (m.userData.isFlipped) flipCard(m);
        });
      },
      seek(progressPercent) {
        simulatedTime = (progressPercent / 100) * CYCLE_DURATION;
        if (progressPercent > 50 && isFanned) {
          applyLayout(false);
        } else if (progressPercent <= 50 && !isFanned) {
          applyLayout(true);
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
            label: '🎴 Toggle Fan Out / Stack Deck',
            onClick: () => applyLayout(!isFanned)
          },
          {
            type: 'button',
            label: '🔄 Flip All Cards',
            onClick: () => cardMeshes.forEach(m => flipCard(m))
          }
        ];
      },
      codeSnippet: `// 1. Raycaster detects mouse over 3D card
raycaster.setFromCamera(mouse, camera);
const hits = raycaster.intersectObjects(cardMeshes);

if (hits.length > 0) {
  const card = hits[0].object;
  const tiltX = (hits[0].point.y - card.position.y) * -0.35;
  const tiltY = (hits[0].point.x - card.position.x) * 0.35;

  // 2. Anime.js applies physical 3D tilt
  anime({
    targets: card.rotation,
    x: tiltX,
    y: tiltY,
    duration: 250,
    easing: 'easeOutQuad'
  });
}

// 3. Click triggers 180° flip with spring bounce
anime({
  targets: card.rotation,
  y: isFlipped ? Math.PI : 0,
  duration: 900,
  easing: 'easeOutElastic(1, .7)'
});`
    };
  }
};

