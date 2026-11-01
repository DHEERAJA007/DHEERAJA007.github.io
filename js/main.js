/**
 * main.js — entry point. Renders content, then wires up interactions,
 * scroll animations and (lazily) the Three.js hero.
 */
import { content } from './content.js';
import { renderAll } from './render.js';
import { initInteractions } from './interactions.js';
import { initScroll } from './scroll.js';
import { runIntro } from './intro.js';

// Tells the watchdog in index.html that the scripts loaded
window.__portfolioStarted = true;
document.getElementById('load-error')?.remove();

const html = document.documentElement;
// Set by the inline script in index.html (motion is always on)
const reducedMotion = !html.classList.contains('motion-ok');

/** Run one start-up step; if it fails, log it and carry on so the rest of the page still works. */
const safely = (label, fn) => {
  try { fn(); } catch (err) { console.error(`${label} failed:`, err); }
};
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * True when WebGL is drawn by the CPU instead of a graphics card (hardware
 * acceleration off, or a basic display driver). 3D is far too slow there and
 * can freeze the page, so it's skipped.
 */
const softwareWebGL = () => {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    return /swiftshader|llvmpipe|software|basic render/i.test(renderer);
  } catch {
    return true;
  }
};

/** Only run WebGL on wider screens with enough CPU cores, a real GPU and no data-saver. */
const canRun3D = () =>
  !reducedMotion &&
  innerWidth >= 768 &&
  (navigator.hardwareConcurrency || 2) >= 4 &&
  !navigator.connection?.saveData &&
  !softwareWebGL();

// 1. Build the page from content.js
safely('Render', () => renderAll(content));

// 2. Pointer effects, counters, progress bar, skills circuit
safely('Interactions', () => initInteractions({ motion: !reducedMotion, finePointer }));

// 3. Smooth scroll + scroll-triggered animations (falls back to static if needed)
safely('Scroll animations', () => initScroll({ motion: !reducedMotion }));

// 4. Bubble intro loader (zooms into the page), then the hero entrance plays
runIntro({ motion: !reducedMotion })
  .catch((err) => console.warn('Intro skipped:', err))
  .then(() => Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]))
  .then(() => requestAnimationFrame(() => html.classList.add('is-loaded')));

// 5. Three.js hero sphere + full-page 3D background — imported only after the page has fully loaded
async function start3D() {
  if (!canRun3D()) return; // the static CSS gradient stays as the background
  const hero = document.getElementById('top');
  const heroCanvas = hero?.querySelector('.hero__canvas');
  const bgCanvas = document.querySelector('.bg3d');
  try {
    const [{ initHero3D }, { initBackground3D }] = await Promise.all([import('./hero3d.js'), import('./bg3d.js')]);
    if (heroCanvas) initHero3D(heroCanvas, hero);
    if (bgCanvas) initBackground3D(bgCanvas, hero);
  } catch (err) {
    console.warn('3D scenes disabled:', err);
  }
}
if (document.readyState === 'complete') start3D();
else addEventListener('load', start3D, { once: true });
