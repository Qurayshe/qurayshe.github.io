/**
 * Common Three.js & Animation helper utilities.
 * Ensures leak-free scene lifecycle, responsive resizing, and studio presets.
 */

export function initThreeScene(container, options = {}) {
  const {
    fov = 50,
    near = 0.1,
    far = 1000,
    cameraPos = [0, 2, 6],
    cameraTarget = [0, 0, 0],
    enableControls = true,
    enableShadows = true,
    alpha = true,
    antialias = true
  } = options;

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(fov, width / height, near, far);
  camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias,
    alpha,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  if (enableShadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Orbit Controls
  let controls = null;
  if (enableControls && typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
    controls.maxDistance = 80;
    controls.minDistance = 0.5;
  }

  // Responsive Resizer using ResizeObserver
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    }
  });
  resizeObserver.observe(container);

  // Cleanup helper
  const cleanup = () => {
    resizeObserver.disconnect();
    if (controls) controls.dispose();
    disposeHierarchy(scene);
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };

  return {
    scene,
    camera,
    renderer,
    controls,
    cleanup,
    width,
    height
  };
}

/**
 * Deeply disposes all geometries, materials, and textures in a Three.js hierarchy.
 */
export function disposeHierarchy(obj) {
  if (!obj) return;

  obj.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => disposeMaterial(mat));
      } else {
        disposeMaterial(child.material);
      }
    }
  });

  while (obj.children.length > 0) {
    obj.remove(obj.children[0]);
  }
}

function disposeMaterial(material) {
  if (!material) return;
  // Dispose all possible texture maps
  const textureKeys = [
    'map', 'bumpMap', 'normalMap', 'displacementMap', 'roughnessMap',
    'metalnessMap', 'alphaMap', 'emissiveMap', 'envMap', 'lightMap', 'aoMap'
  ];
  for (const key of textureKeys) {
    if (material[key] && typeof material[key].dispose === 'function') {
      material[key].dispose();
    }
  }
  material.dispose();
}

/**
 * Creates a sleek studio lighting environment.
 */
export function createStudioLighting(scene, { ambientIntensity = 0.4, dirIntensity = 1.2 } = {}) {
  const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, dirIntensity);
  mainLight.position.set(5, 10, 7);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 30;
  mainLight.shadow.bias = -0.001;
  scene.add(mainLight);

  const fillLight = new THREE.PointLight(0xa855f7, 1.6, 20);
  fillLight.position.set(-6, 3, -4);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xd8b4fe, 2.0, 20);
  rimLight.position.set(4, -2, -5);
  scene.add(rimLight);

  return { ambientLight, mainLight, fillLight, rimLight };
}

/**
 * Creates a sleek purple and dark studio floor grid.
 */
export function createCyberGrid(scene, size = 30, divisions = 30) {
  const gridHelper = new THREE.GridHelper(size, divisions, 0xa855f7, 0x2e1065);
  gridHelper.position.y = -2;
  scene.add(gridHelper);

  const planeGeo = new THREE.PlaneGeometry(size, size);
  const planeMat = new THREE.MeshStandardMaterial({
    color: 0x0c0714,
    roughness: 0.8,
    metalness: 0.2
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -2.01;
  plane.receiveShadow = true;
  scene.add(plane);

  return { gridHelper, plane };
}

