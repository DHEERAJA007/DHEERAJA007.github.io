/**
 * intro.js — the bubble loading screen.
 *
 * 1. A glass bubble floats in the middle of a dark screen with a 0 → 100 counter
 *    (eases to 90 while assets load, then finishes once fonts + window load are done).
 * 2. A circular hole opens in the loader exactly inside the bubble's rim: the page
 *    appears *inside* the bubble, shrunk to half size.
 * 3. Zoom: the hole, the bubble rim and the page all scale up together, so it feels
 *    like flying into the bubble until the page fills the screen.
 * 4. 'intro:done' is dispatched — the hero sphere "settles back" from oversized
 *    (hero3d.js), Lenis is unlocked and ScrollTrigger re-measures (scroll.js).
 *
 * The hole is a CSS radial-gradient mask whose radius is the --hole custom property.
 */
import { scramble } from './interactions.js';

export async function runIntro({ motion }) {
  const html = document.documentElement;
  const intro = document.querySelector('.intro');
  const { gsap } = window;
  const finish = () => {
    intro?.remove();
    html.classList.remove('is-intro');
    html.style.overflow = '';
    dispatchEvent(new Event('intro:done'));
  };
  if (!intro || !motion || !gsap) { finish(); return; }

  const page = document.getElementById('page');
  const bubble = intro.querySelector('.intro__bubble');
  const count = intro.querySelector('.intro__count');
  const label = intro.querySelector('.intro__label');

  // Hard time limit: on a slow machine or a stalled animation, never hold the visitor
  // on the loader for more than 9 seconds.
  const timeLimit = new Promise((resolve) => setTimeout(resolve, 9000));
  try {
    await Promise.race([play({ gsap, html, intro, page, bubble, count, label }), timeLimit]);
  } finally {
    // Always hand the page back, even if something above failed or timed out
    gsap.killTweensOf([page, intro, bubble, count, label]);
    gsap.set(page, { clearProps: 'transform' });
    page.style.transformOrigin = '';
    finish();
  }
}

async function play({ gsap, html, intro, page, bubble, count, label }) {
  html.style.overflow = 'hidden';
  // Zoom around the centre of what's currently on screen
  page.style.transformOrigin = `50% ${scrollY + innerHeight / 2}px`;
  gsap.set(page, { scale: 0.5 });
  gsap.set(intro, { '--hole': '0px' });
  scramble(label, { duration: 900 });

  /* ---------- 1. Counter ---------- */
  const counter = { v: 0 };
  const show = () => { count.textContent = Math.round(counter.v); };
  const loaded = Promise.all([
    document.readyState === 'complete' ? null : new Promise((r) => addEventListener('load', r, { once: true })),
    document.fonts?.ready,
  ]);
  const minTime = gsap.to(counter, { v: 90, duration: 1.4, ease: 'power2.out', onUpdate: show }).then();
  const failsafe = new Promise((r) => setTimeout(r, 5000));
  await Promise.race([Promise.all([loaded, minTime]), failsafe]);
  await gsap.to(counter, { v: 100, duration: 0.35, ease: 'power1.out', onUpdate: show }).then();

  /* ---------- 2 + 3. Open the bubble, then zoom through it ---------- */
  const r = bubble.offsetWidth / 2;
  const cover = Math.hypot(innerWidth, innerHeight); // radius that covers the whole screen
  const tl = gsap.timeline();
  tl.to([count, label], { autoAlpha: 0, scale: 0.8, duration: 0.35, ease: 'power2.in' })
    .to(intro, { '--hole': `${r * 0.9}px`, duration: 0.7, ease: 'power3.inOut' })
    .to({}, { duration: 0.25 })
    .addLabel('zoom')
    .to(intro, { '--hole': `${cover}px`, duration: 1.25, ease: 'expo.inOut' }, 'zoom')
    .to(bubble, { scale: cover / r, duration: 1.25, ease: 'expo.inOut' }, 'zoom')
    .to(bubble, { autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, 'zoom+=0.75')
    .to(page, { scale: 1, duration: 1.25, ease: 'expo.inOut' }, 'zoom');
  await tl.then();
}
