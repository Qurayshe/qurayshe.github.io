import { initThreeScene, createCyberGrid } from '../utils/common.js';

export default {
  id: 'combo-hologram-pulse',
  title: 'Holographic Shader Uniforms & Glitch Pulse',
  category: 'Three.js + Anime.js Synergy',
  badge: 'Hybrid',
  badgeClass: 'badge-combo',
  difficulty: 'Advanced',
  description: 'Drive GLSL custom ShaderMaterial uniforms (Fresnel rim glow, holographic scanlines, and digital glitch pulses) dynamically with Anime.js.',

  tutorial: {
    overview: `
      Custom WebGL Shaders (written in GLSL) run directly on the GPU for maximum rendering speed.
      <br><br>
      <strong>Uniforms</strong> are bridge variables sent from CPU JavaScript to the GPU fragment shader. By targeting uniform values with <strong>Anime.js</strong>, we can trigger digital glitches, color phase transitions, and holographic wave ripples in real-time.
    `,
    keyConcepts: [
      { name: 'Fresnel Effect', desc: 'Calculates the dot product between the surface normal and view ray (dot(N, V)), making holographic edges glow brightly.' },
      { name: 'Scanline Frequency Math', desc: 'Fragment function: sin(vPosition.y * uFrequency + uTime) creates traveling horizontal laser scanlines.' },
      { name: 'Uniform Tweening', desc: 'Anime.js directly mutates uniform values like shaderMaterial.uniforms.uGlow.value.' }
    ],
    tips: 'Click "Trigger Cyber Glitch" to see an intense multi-stage uniform distortion sequence animated via Anime.js keyframes.'
  },

  init(container, onStatsUpdate) {
    const { scene, camera, renderer, controls, cleanup } = initThreeScene(container, {
      cameraPos: [0, 2, 5.5],
      cameraTarget: [0, 0, 0]
    });

    createCyberGrid(scene, 20, 20);

    // Custom Hologram GLSL Shader
    const customHoloShader = {
      uniforms: {
        uTime: { value: 0 },
        uScanlines: { value: 25.0 },
        uGlowIntensity: { value: 1.8 },
        uFresnelPower: { value: 2.2 },
        uGlitchOffset: { value: 0.0 },
        uColorA: { value: new THREE.Color('#ffffff') },
        uColorB: { value: new THREE.Color('#a855f7') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewDir;
        uniform float uGlitchOffset;
        uniform float uTime;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          vec3 pos = position;
          // Vertex glitch displacement
          if (uGlitchOffset > 0.01) {
            pos.x += sin(pos.y * 10.0 + uTime * 20.0) * uGlitchOffset;
            pos.z += cos(pos.x * 10.0 + uTime * 20.0) * uGlitchOffset;
          }

          vec4 modelViewPos = modelViewMatrix * vec4(pos, 1.0);
          vViewDir = normalize(-modelViewPos.xyz);
          gl_Position = projectionMatrix * modelViewPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewDir;

        uniform float uTime;
        uniform float uScanlines;
        uniform float uGlowIntensity;
        uniform float uFresnelPower;
        uniform vec3 uColorA;
        uniform vec3 uColorB;

        void main() {
          // Fresnel Edge Glow
          float fresnel = 1.0 - max(dot(vViewDir, vNormal), 0.0);
          fresnel = pow(fresnel, uFresnelPower);

          // Moving Scanlines
          float scanline = sin(vPosition.y * uScanlines - uTime * 4.0) * 0.5 + 0.5;
          scanline = pow(scanline, 1.5);

          // Gradient color
          vec3 baseColor = mix(uColorA, uColorB, (vPosition.y + 1.0) * 0.5);

          // Final Composite
          vec3 finalColor = baseColor * (fresnel * uGlowIntensity + scanline * 0.5);
          float alpha = fresnel * 0.8 + scanline * 0.3;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    };

    const holoMat = new THREE.ShaderMaterial({
      uniforms: customHoloShader.uniforms,
      vertexShader: customHoloShader.vertexShader,
      fragmentShader: customHoloShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    // Hologram Mesh: Icosahedron with internal floating ring
    const geo = new THREE.IcosahedronGeometry(1.6, 16);
    const mesh = new THREE.Mesh(geo, holoMat);
    scene.add(mesh);

    // Inner Gyro Rings
    const ringGeo = new THREE.TorusGeometry(1.2, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = Math.PI / 2;
    mesh.add(ring1);
    mesh.add(ring2);

    let glitchAnim = null;

    function triggerGlitch() {
      if (glitchAnim) glitchAnim.pause();

      glitchAnim = anime({
        targets: holoMat.uniforms.uGlitchOffset,
        value: [
          { value: 0.25, duration: 80, easing: 'steps(2)' },
          { value: 0.0, duration: 150, easing: 'easeOutQuad' }
        ],
        complete: () => {
          holoMat.uniforms.uGlitchOffset.value = 0.0;
        }
      });

      anime({
        targets: holoMat.uniforms.uGlowIntensity,
        value: [
          { value: 4.5, duration: 150 },
          { value: 1.8, duration: 400, easing: 'easeOutQuad' }
        ]
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

      holoMat.uniforms.uTime.value = time;
      mesh.rotation.y = time * 0.3;
      ring1.rotation.x = time * 0.8;
      ring2.rotation.y = time * 0.6;

      if (controls) controls.update();
      renderer.render(scene, camera);

      if (onStatsUpdate) {
        onStatsUpdate({
          shaderType: 'GLSL Custom ShaderMaterial',
          fresnelPower: holoMat.uniforms.uFresnelPower.value.toFixed(1),
          scanlineDensity: holoMat.uniforms.uScanlines.value.toFixed(0)
        });
      }
    }

    animate(performance.now());

    return {
      destroy() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (glitchAnim) glitchAnim.pause();
        geo.dispose();
        holoMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
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
            label: '⚡ Trigger Cyber Glitch',
            onClick: () => triggerGlitch()
          },
          {
            type: 'slider',
            label: 'Glow Intensity',
            min: 0.5,
            max: 4.0,
            step: 0.1,
            value: 1.8,
            onChange: (val) => { holoMat.uniforms.uGlowIntensity.value = parseFloat(val); }
          },
          {
            type: 'slider',
            label: 'Scanline Density',
            min: 5,
            max: 50,
            step: 1,
            value: 25,
            onChange: (val) => { holoMat.uniforms.uScanlines.value = parseFloat(val); }
          },
          {
            type: 'slider',
            label: 'Fresnel Power',
            min: 0.5,
            max: 5.0,
            step: 0.1,
            value: 2.2,
            onChange: (val) => { holoMat.uniforms.uFresnelPower.value = parseFloat(val); }
          }
        ];
      },
      codeSnippet: `// 1. Custom GLSL Shader with Uniforms
const holoMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uGlitchOffset: { value: 0.0 },
    uGlowIntensity: { value: 1.8 },
    uFresnelPower: { value: 2.2 }
  },
  vertexShader: vertexShaderCode,
  fragmentShader: fragmentShaderCode,
  transparent: true,
  blending: THREE.AdditiveBlending
});

// 2. Animate shader uniforms with Anime.js keyframes
anime({
  targets: holoMat.uniforms.uGlitchOffset,
  value: [
    { value: 0.25, duration: 80 },
    { value: 0.05, duration: 60 },
    { value: 0.35, duration: 100 },
    { value: 0.0, duration: 150 }
  ]
});`
    };
  }
};

