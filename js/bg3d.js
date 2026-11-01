/**
 * bg3d.js — fixed, full-page Three.js scene of glowing bubbles behind every section.
 *
 * Scrolling moves the camera down a tall "shaft":
 * - Dust: ~1,200 tiny red/white particles for depth parallax.
 * - Large bubbles (iridescent Fresnel shells + a soft red halo sprite) are placed
 *   along the shaft, alternating left/right in the margins. Each brightens and
 *   swells as the camera passes it, and fades as you move on.
 * - Small bubbles constantly rise and pulse with light. They are recycled around
 *   the camera, so there are always some on screen whichever way you scroll.
 * - Scroll speed makes small bubbles rise faster; the mouse adds camera parallax.
 *
 * Imported lazily from main.js (same capability checks as the hero sphere).
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { makeBubbleMaterial, makeRadialTexture } from './bubble.js';

const DEPTH = 80; // world units travelled from the top of the page to the bottom
const rand = (a, b) => a + Math.random() * (b - a);

export function initBackground3D(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // background layer: lower DPR is plenty
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.045); // fades distant dust
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
  camera.position.set(0, 0, 6);
  const dotTex = makeRadialTexture();
  const haloTex = makeRadialTexture([[0, 0.9], [0.25, 0.35], [1, 0]]);

  /* ---------- Dust ---------- */
  const N = 1200;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const red = new THREE.Color(0xe10600);
  for (let i = 0; i < N; i++) {
    pos.set([rand(-17, 17), 8 - Math.random() * (DEPTH + 20), rand(-32, -2)], i * 3);
    const c = Math.random() < 0.18 ? new THREE.Color(0x808080) : red.clone().multiplyScalar(rand(0.4, 1.2));
    col.set([c.r, c.g, c.b], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.07, map: dotTex, vertexColors: true, transparent: true, opacity: 0.8,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  /* ---------- Large bubbles along the shaft ---------- */
  const bigGeo = new THREE.SphereGeometry(1, 56, 40);
  const bigDefs = [
    { x: 6.5, y: -9, z: -9, r: 2.3 },
    { x: -6.8, y: -23, z: -8, r: 2.7 },
    { x: 6.6, y: -37, z: -7, r: 2.0 },
    { x: -6.4, y: -51, z: -9, r: 2.5 },
    { x: 6.1, y: -65, z: -8, r: 2.2 },
    { x: -5.6, y: -78, z: -7, r: 1.9 },
  ];
  const bigs = bigDefs.map((d, i) => {
    const mat = makeBubbleMaterial({ iridescence: 0.5, wobble: 0.07, seed: i * 2.3 });
    const mesh = new THREE.Mesh(bigGeo, mat);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, color: 0xe10600, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    const group = new THREE.Group();
    group.add(halo, mesh);
    group.position.set(d.x, d.y, d.z);
    scene.add(group);
    return { group, mesh, mat, halo, ...d };
  });

  /* ---------- Small rising bubbles, recycled around the camera ---------- */
  const smallGeo = new THREE.SphereGeometry(1, 24, 16);
  const SMALL = 44;
  const placeSmall = (s, y) => {
    s.mesh.position.set(rand(-13, 13), y, rand(-18, -3));
    s.r = 0.07 + Math.random() ** 3 * 0.45;
    s.mesh.scale.setScalar(s.r);
  };
  const smalls = Array.from({ length: SMALL }, (_, i) => {
    const mat = makeBubbleMaterial({ iridescence: 0.35, wobble: 0.08, seed: i * 1.7, opacity: 0.8 });
    const mesh = new THREE.Mesh(smallGeo, mat);
    scene.add(mesh);
    const s = { mesh, mat, speed: rand(0.25, 0.8), phase: rand(0, 6.28), r: 0.2 };
    placeSmall(s, rand(-14, 12));
    return s;
  });

  /* ---------- Sizing ---------- */
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);

  /* ---------- Inputs ---------- */
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  const pageProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? scrollY / max : 0;
  };

  /* ---------- Frame loop ---------- */
  const clock = new THREE.Clock();
  let camY = -pageProgress() * DEPTH;
  let lastScroll = scrollY;
  let velocity = 0;
  let first = true;

  const render = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    velocity += ((scrollY - lastScroll) - velocity) * 0.1;
    lastScroll = scrollY;

    camY += (-pageProgress() * DEPTH - camY) * 0.08;
    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
    camera.position.y = camY - mouse.y * 0.6;
    camera.lookAt(camera.position.x * 0.3, camY, -12);
    dust.rotation.y = Math.sin(t * 0.05) * 0.08;

    // Large bubbles: breathe, drift, and light up when the camera is near
    bigs.forEach((b, i) => {
      b.mat.uniforms.uTime.value = t;
      b.group.position.y = b.y + Math.sin(t * 0.5 + i) * 0.4;
      b.group.rotation.y = t * 0.1;
      const near = Math.exp(-((b.group.position.y - camY) ** 2) / 70);
      const breathe = 1 + Math.sin(t * 1.1 + i) * 0.025;
      b.mesh.scale.set(b.r * breathe, b.r / breathe, b.r * breathe); // liquid squash & stretch
      b.group.scale.setScalar(0.8 + near * 0.35);
      b.mat.uniforms.uOpacity.value = 0.3 + near * 0.9;
      b.halo.scale.setScalar(b.r * 4.2);
      b.halo.material.opacity = 0.05 + near * 0.28;
    });

    // Small bubbles: rise, sway, pulse; recycle when they leave the view band
    const lift = Math.min(Math.abs(velocity) * 0.03, 3);
    smalls.forEach((s) => {
      const m = s.mesh;
      s.mat.uniforms.uTime.value = t;
      m.position.y += dt * (s.speed + lift);
      m.position.x += Math.sin(t * 0.6 + s.phase) * dt * 0.2;
      if (m.position.y > camY + 13) placeSmall(s, camY - 13 - Math.random() * 3);
      else if (m.position.y < camY - 17) placeSmall(s, camY + 10 + Math.random() * 3);
      s.mat.uniforms.uOpacity.value = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2 * s.speed + s.phase));
    });

    renderer.render(scene, camera);
    if (first) {
      first = false;
      canvas.classList.add('is-ready');
    }
  };

  const update = () => renderer.setAnimationLoop(document.hidden ? null : render);
  document.addEventListener('visibilitychange', update);
  update();
}
