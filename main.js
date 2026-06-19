import * as THREE from "three";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";

const container = document.getElementById("ascii-hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let camera, scene, renderer, effect, cube, rig, frame;
const frameElement = container.parentElement;
let pointer = { x: 0, y: 0 };
let targetPointer = { x: 0, y: 0 };
let pointerDown = false;
const spheres = [];
const cubeBasePosition = new THREE.Vector3();
const cubeAvoidance = new THREE.Vector3();
const cubeCollisionPoint = new THREE.Vector3();
const cubeLocalPoint = new THREE.Vector3();
const cubeWorldPoint = new THREE.Vector3();
const cubeNormal = new THREE.Vector3();
const cubeInverseQuaternion = new THREE.Quaternion();
const cubeHalfSize = new THREE.Vector3();
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const pointerHit = new THREE.Vector3();
const tempVector = new THREE.Vector3();
const tempOffset = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const baseFrameTransform = { x: 0, y: 0 };

init();
animate();

function init() {
  const { clientWidth: w, clientHeight: h } = container;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(42, w / h, 1, 1000);
  camera.position.set(0, 0, 430);

  rig = new THREE.Group();
  scene.add(rig);

  frame = new THREE.Group();
  rig.add(frame);

  const key = new THREE.PointLight(0xb79dff, 3.2, 0, 0);
  key.position.set(420, 360, 520);
  scene.add(key);

  const fill = new THREE.PointLight(0x7e5cff, 1.1, 0, 0);
  fill.position.set(-380, -240, -320);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0x251533, 1.15));

  const cubeGeometry = new THREE.BoxGeometry(68, 68, 68);
  const material = new THREE.MeshStandardMaterial({
    color: 0xb693ff,
    metalness: 0.15,
    roughness: 0.28,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  cube = new THREE.Mesh(cubeGeometry, material);
  frame.add(cube);
  cubeBasePosition.set(0, 0, 0);
  cubeHalfSize.set(34, 34, 34);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cubeGeometry),
    new THREE.LineBasicMaterial({ color: 0xf3ecff, transparent: true, opacity: 0.38 })
  );
  cube.add(edges);

  const sphereGeometry = new THREE.SphereGeometry(12, 20, 20);
  for (let i = 0; i < 12; i += 1) {
    const sphere = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xe7d9ff,
        metalness: 0.25,
        roughness: 0.2,
      })
    );
    sphere.userData = {
      base: new THREE.Vector3(
        (Math.random() - 0.5) * 220,
        (Math.random() - 0.5) * 220,
        (Math.random() - 0.5) * 160
      ),
      velocity: new THREE.Vector3(),
      phase: Math.random() * Math.PI * 2,
      radius: 12 + Math.random() * 8,
    };
    sphere.scale.setScalar(0.7 + Math.random() * 0.5);
    sphere.position.copy(sphere.userData.base);
    frame.add(sphere);
    spheres.push(sphere);
  }

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(180, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x6f44ff,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    })
  );
  frame.add(glow);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  effect = new AsciiEffect(renderer, " .:-=+*#%@", { invert: true, resolution: 0.22 });
  effect.setSize(w, h);
  effect.domElement.style.color = "var(--accent-strong)";
  effect.domElement.style.backgroundColor = "transparent";
  effect.domElement.style.position = "absolute";
  effect.domElement.style.inset = "0";
  effect.domElement.style.pointerEvents = "none";
  effect.domElement.style.whiteSpace = "pre";
  container.appendChild(effect.domElement);

  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
}

function onResize() {
  const { clientWidth: w, clientHeight: h } = container;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  effect.setSize(w, h);
}

function onPointerMove(e) {
  const rect = container.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  pointer.x = THREE.MathUtils.clamp(x, -1, 1);
  pointer.y = THREE.MathUtils.clamp(y, -1, 1);
  targetPointer.x = pointer.x;
  targetPointer.y = pointer.y;
}

function onPointerDown(e) {
  pointerDown = true;
  onPointerMove(e);
}

function onPointerUp() {
  pointerDown = false;
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const easedX = THREE.MathUtils.lerp(baseFrameTransform.x, targetPointer.x, 0.12);
  const easedY = THREE.MathUtils.lerp(baseFrameTransform.y, targetPointer.y, 0.12);
  baseFrameTransform.x = easedX;
  baseFrameTransform.y = easedY;

  const parallaxX = easedX * 0.55;
  const parallaxY = easedY * 0.55;

  if (!reduceMotion) {
    rig.rotation.y = t * 0.35 + parallaxX * 0.8;
    rig.rotation.x = t * 0.22 - parallaxY * 0.7;
    rig.position.x = parallaxX * 18;
    rig.position.y = parallaxY * 16;
    cube.rotation.y += 0.008 + parallaxX * 0.02;
    cube.rotation.x += 0.006 - parallaxY * 0.02;
  }

  frameElement.style.setProperty("--frame-x", `${parallaxX * 10}px`);
  frameElement.style.setProperty("--frame-y", `${parallaxY * 10}px`);

  camera.lookAt(0, 0, 0);

  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(pointerPlane, pointerHit);

  const attractStrength = pointerDown ? 0.15 : 0.025;
  cubeAvoidance.set(0, 0, 0);
  cube.position.copy(cubeBasePosition);
  cube.rotation.x *= 0.98;
  cube.rotation.y *= 0.98;

  for (const sphere of spheres) {
    const { base, velocity, phase, radius } = sphere.userData;
    const orbit = new THREE.Vector3(
      Math.sin(t * 1.3 + phase) * 14,
      Math.cos(t * 1.1 + phase * 0.8) * 12,
      Math.sin(t * 1.7 + phase * 1.3) * 10
    );
    const pointerOffset = tempOffset
      .copy(pointerHit)
      .multiplyScalar(pointerDown ? 1.25 : 0.45)
      .add(new THREE.Vector3(parallaxX * 120, parallaxY * 120, 0));

    tempVector.copy(base).add(orbit).add(pointerOffset.multiplyScalar(0.35));

    if (pointerDown) {
      tempVector.lerp(pointerHit, 0.4);
    }

    velocity.lerp(tempVector.sub(sphere.position), attractStrength);
    sphere.position.add(velocity);
    sphere.position.addScaledVector(tempVector.clone().sub(sphere.position), 0.02);
    sphere.position.y += Math.sin(t * 2 + phase) * 0.2;
    sphere.scale.setScalar(THREE.MathUtils.lerp(sphere.scale.x, 0.7 + radius / 24, 0.08));
    sphere.quaternion.copy(tempQuaternion.setFromEuler(new THREE.Euler(t * 0.3 + phase, t * 0.2, t * 0.15)));

    cubeInverseQuaternion.copy(cube.quaternion).invert();
    cubeLocalPoint.copy(sphere.position).applyQuaternion(cubeInverseQuaternion);
    cubeCollisionPoint.copy(cubeLocalPoint).clamp(
      cubeHalfSize.clone().negate(),
      cubeHalfSize
    );
    cubeWorldPoint.copy(cubeCollisionPoint).applyQuaternion(cube.quaternion);
    const collisionDistance = cubeWorldPoint.distanceTo(sphere.position);
    const collisionThreshold = sphere.userData.radius + 10;

    if (collisionDistance < collisionThreshold) {
      cubeNormal.copy(sphere.position).sub(cubeWorldPoint).normalize();
      if (cubeNormal.lengthSq() === 0) {
        cubeNormal.set(0, 1, 0);
      }
      const push = (collisionThreshold - collisionDistance) * 0.06;
      cubeAvoidance.addScaledVector(cubeNormal, -push * 0.45);
      sphere.position.addScaledVector(cubeNormal, push * 0.22);
      velocity.addScaledVector(cubeNormal, push * 0.06);
    }
  }

  cube.position.copy(cubeBasePosition).add(cubeAvoidance);
  cube.rotation.x += cubeAvoidance.y * 0.03;
  cube.rotation.y += cubeAvoidance.x * 0.03;
  cube.rotation.z += cubeAvoidance.z * 0.02;

  effect.render(scene, camera);
}
