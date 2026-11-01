/**
 * hero3d.js — Three.js particle sphere behind the hero name.
 *
 * - ~2,600 red points on a Fibonacci sphere (evenly spaced), additive blending
 *   so overlapping points glow, inside a wobbling iridescent bubble shell.
 * - After the intro it "settles back": starts ~2.8× too big and eases into place.
 * - Mouse position tilts the sphere (parallax, eased toward the target).
 * - Scrolling through the hero morphs the surface with layered sine "noise"
 *   and scales it up, so the sphere dissolves as you leave.
 * - Rendering pauses when the hero is off-screen or the tab is hidden.
 *
 * Loaded with a dynamic import() from main.js after window "load", and only on
 * capable devices without prefers-reduced-motion.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { makeBubbleMaterial } from './bubble.js';

const ACCENT = 0xe10600;

/** Soft round sprite so points render as glowing dots instead of squares. */
function makeDotTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initHero3D(canvas, hero) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap DPR at 2
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Outer group follows the mouse; inner group spins on its own
  const parallax = new THREE.Group();
  const spinner = new THREE.Group();
  parallax.add(spinner);
  scene.add(parallax);

  /* ---------- Particle sphere ---------- */
  const COUNT = 2600;
  const RADIUS = 2.4;
  const base = new Float32Array(COUNT * 3);   // rest positions
  const positions = new Float32Array(COUNT * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = i * golden;
    base[i * 3] = Math.cos(theta) * r * RADIUS;
    base[i * 3 + 1] = y * RADIUS;
    base[i * 3 + 2] = Math.sin(theta) * r * RADIUS;
  }
  positions.set(base);

  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', posAttr);

  const pointsMat = new THREE.PointsMaterial({
    color: ACCENT,
    size: 0.075,
    map: makeDotTexture(),
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, pointsMat);
  spinner.add(points);

  /* ---------- Liquid bubble shell around the particles (see bubble.js) ---------- */
  const shellMat = makeBubbleMaterial({ iridescence: 0.45, wobble: 0.06, opacity: 0.9 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), shellMat);
  shell.scale.setScalar(RADIUS * 1.12);
  parallax.add(shell); // not in the spinner, so its highlight stays put while the particles turn

  /* ---------- Intro "settle": starts oversized and eases back to its place ---------- */
  let settleFrom = null;
  const beginSettle = () => { settleFrom = performance.now(); };
  if (document.documentElement.classList.contains('is-intro')) addEventListener('intro:done', beginSettle, { once: true });
  else beginSettle();
  const settle = () => {
    if (settleFrom === null) return 0;
    const k = Math.min((performance.now() - settleFrom) / 2400, 1);
    return 1 - (1 - k) ** 4; // easeOutQuart
  };

  /* ---------- Sizing ---------- */
  const resize = () => {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the sphere a similar on-screen size on wide and tall layouts
    camera.position.z = camera.aspect < 1 ? 11 : 9;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(hero);

  /* ---------- Inputs: mouse (-1..1) and hero scroll progress (0..1) ---------- */
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  let morph = 0;       // eased value used in the shader-free morph
  const scrollProgress = () => Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight)));

  /* ---------- Frame loop ---------- */
  const clock = new THREE.Clock();
  let firstFrame = true;

  const render = () => {
    const t = clock.getElapsedTime();
    morph += (scrollProgress() - morph) * 0.08;

    // Morph: displace each point along its normal with layered sine waves.
    // At rest it gently "breathes"; scrolling increases the amplitude.
    const amp = 0.05 + morph * 0.6;
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const bx = base[ix], by = base[ix + 1], bz = base[ix + 2];
      const n =
        Math.sin(bx * 1.6 + t * 0.9) * Math.cos(by * 1.9 + t * 0.7) +
        Math.sin(bz * 2.3 - t * 0.6) * 0.5;
      const s = 1 + n * amp;
      positions[ix] = bx * s;
      positions[ix + 1] = by * s;
      positions[ix + 2] = bz * s;
    }
    posAttr.needsUpdate = true;

    // Self rotation + mouse parallax (eased)
    spinner.rotation.y = t * 0.12;
    spinner.rotation.x = Math.sin(t * 0.2) * 0.15;
    parallax.rotation.y += (mouse.x * 0.45 - parallax.rotation.y) * 0.05;
    parallax.rotation.x += (mouse.y * 0.3 - parallax.rotation.x) * 0.05;
    parallax.position.x += (mouse.x * 0.25 - parallax.position.x) * 0.05;

    // Settle in after the intro, then grow and fade as the hero scrolls away
    const s = settle();
    const scale = (1 + morph * 0.6) * (1 + (1 - s) * 1.8);
    parallax.scale.setScalar(scale);
    pointsMat.opacity = 0.95 * (1 - morph * 0.7) * (0.3 + s * 0.7);
    shellMat.uniforms.uTime.value = t;
    shellMat.uniforms.uOpacity.value = 0.9 * (1 - morph * 0.8);

    renderer.render(scene, camera);
    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('is-ready'); // CSS fades the canvas in
    }
  };

  /* ---------- Pause when off-screen or tab hidden ---------- */
  let inView = true;
  const update = () => renderer.setAnimationLoop(inView && !document.hidden ? render : null);
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }).observe(hero);
  document.addEventListener('visibilitychange', update);
  update();
}
