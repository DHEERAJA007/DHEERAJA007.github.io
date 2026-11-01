/**
 * scroll.js — Lenis smooth scrolling + GSAP ScrollTrigger animations.
 *
 * GSAP, ScrollTrigger and Lenis are loaded as classic <script defer> tags in
 * index.html and read from `window` here. If motion is disabled (reduced
 * motion) or a library failed to load, the page falls back to a static layout.
 */

import { offsetWithin } from './interactions.js';

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ==========================================================================
   SPLIT TEXT (free replacement for GSAP's SplitText)
   Wraps every letter in a span, grouped by word so lines never break mid-word.
   Screen readers get the original text from a visually-hidden copy.
   ========================================================================== */
export function splitText(el) {
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  const srCopy = document.createElement('span');
  srCopy.className = 'sr-only';
  srCopy.textContent = text;

  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  const chars = [];
  text.split(' ').forEach((word, i, words) => {
    const w = document.createElement('span');
    w.className = 'split__word';
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'split__char';
      c.textContent = ch;
      w.append(c);
      chars.push(c);
    }
    visual.append(w);
    if (i < words.length - 1) visual.append(' ');
  });

  el.replaceChildren(srCopy, visual);
  return chars;
}

/* ==========================================================================
   EXPERIENCE PIPELINE GEOMETRY
   Measures the centre of every node and builds one SVG path through them:
   a straight lead-in from the top, then a vertical S-curve (cubic Bézier)
   between each pair of nodes. Also records how far along the path (0..1)
   each node sits, so cards can appear exactly when the drawn line reaches them.
   ========================================================================== */
function createPipeline() {
  const root = qs('[data-pipeline]');
  if (!root) return null;
  const svg = qs('.pipeline__svg', root);
  const track = qs('.pipeline__track', root);
  const line = qs('.pipeline__line', root);
  const packets = qsa('.pipeline__packet', root);
  const stages = qsa('.pipeline__stage', root);
  const state = { total: 0, stops: [] };

  const layout = () => {
    // Layout offsets (not getBoundingClientRect) so 3D section transforms can't skew the path
    svg.setAttribute('viewBox', `0 0 ${root.offsetWidth} ${root.offsetHeight}`);
    const pts = stages.map((s) => {
      const r = offsetWithin(qs('.pipeline__node', s), root);
      return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    });
    if (!pts.length) return;

    // Build the path piece by piece, measuring the length up to each node
    let d = `M${pts[0].x} 0 L${pts[0].x} ${pts[0].y}`;
    track.setAttribute('d', d);
    const lengths = [track.getTotalLength()];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const midY = (a.y + b.y) / 2;
      d += ` C${a.x} ${midY} ${b.x} ${midY} ${b.x} ${b.y}`;
      track.setAttribute('d', d);
      lengths.push(track.getTotalLength());
    }
    line.setAttribute('d', d);
    state.total = lengths[lengths.length - 1];
    state.stops = lengths.map((l) => l / state.total);
  };

  return { root, line, packets, stages, state, layout };
}

/* ==========================================================================
   STATIC FALLBACK — no smooth scroll, no scroll-linked effects
   ========================================================================== */
function initStatic(pipeline) {
  const html = document.documentElement;
  html.classList.remove('motion-ok');
  html.classList.add('static');
  if (pipeline) {
    pipeline.layout();
    pipeline.stages.forEach((s) => s.classList.add('is-reached'));
    let frame = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(pipeline.layout);
    }).observe(pipeline.root);
  }
}

/* ==========================================================================
   MAIN
   ========================================================================== */
export function initScroll({ motion }) {
  const { gsap, ScrollTrigger, Lenis } = window;
  const pipeline = createPipeline();

  if (!motion || !gsap || !ScrollTrigger) {
    initStatic(pipeline);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll, driven by GSAP's ticker so both stay in sync ---------- */
  if (Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // In-page anchor links scroll through Lenis (and move focus for keyboard users)
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : id.length > 1 && qs(id);
      if (!target) return;
      e.preventDefault();
      // Land just below the sticky top bar
      const offset = id === '#top' ? 0 : -(qs('.topbar')?.offsetHeight || 0);
      lenis.scrollTo(target, { offset, duration: 1.4 });
      history.pushState(null, '', id);
      const focusable = id === '#top' ? qs('#main') : target;
      if (!focusable.hasAttribute('tabindex')) focusable.setAttribute('tabindex', '-1');
      focusable.focus({ preventScroll: true });
    });

    // Locked while the intro loader plays
    if (document.documentElement.classList.contains('is-intro')) {
      lenis.stop();
      addEventListener('intro:done', () => lenis.start(), { once: true });
    }
  }
  // The intro shrinks the page while triggers are created, so re-measure once it's done
  addEventListener('intro:done', () => ScrollTrigger.refresh(), { once: true });

  /* All reveals below are SCRUBBED: each element's visibility is tied directly to its
     position on screen, so the motion runs in both directions. Scrolling down, things
     rise in at the bottom and float out at the top; scrolling up, the exact reverse —
     they drop back in from the top and sink out at the bottom. */
  const ENTER = { start: 'top 98%', end: 'top 70%', scrub: 0.6 };
  const EXIT = { start: 'bottom 30%', end: 'bottom 2%', scrub: 0.6 };

  /* ---------- Section titles: letters rise out of their word masks ---------- */
  qsa('[data-split]').forEach((el) => {
    const chars = splitText(el);
    gsap.fromTo(chars, { yPercent: 115 }, {
      yPercent: 0, ease: 'power2.out', stagger: 0.03,
      scrollTrigger: { trigger: el, ...ENTER, end: 'top 75%' },
    });
    // ...and slide up out of them at the top
    gsap.to(chars, {
      yPercent: -115, ease: 'power2.in', stagger: 0.03, immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 22%', end: 'top 2%', scrub: 0.6 },
    });
  });

  /* ---------- Generic reveals: rise + fade + slight scale ----------
     (The skills board moves as one piece so the circuit traces stay aligned with the chips;
     social cards animate via their <li> so GSAP doesn't override the cards' tilt transform.) */
  gsap.utils.toArray('[data-reveal], .edu__item, .skills__board, .socials li, .laptop, .section__intro').forEach((el) => {
    gsap.fromTo(el, { y: 60, autoAlpha: 0, scale: 0.96 }, {
      y: 0, autoAlpha: 1, scale: 1, ease: 'power2.out',
      scrollTrigger: { trigger: el, ...ENTER },
    });
    gsap.to(el, {
      y: -50, autoAlpha: 0, scale: 0.96, ease: 'power2.in', immediateRender: false,
      scrollTrigger: { trigger: el, ...EXIT },
    });
  });

  /* ---------- Hero: parallax layers as the hero scrolls away ---------- */
  const heroScroll = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__bgword', { yPercent: 35, ease: 'none', scrollTrigger: heroScroll });
  gsap.to('.hero__photo img', { yPercent: 10, scale: 1.05, ease: 'none', scrollTrigger: heroScroll });
  // "Hi, I'm" drifts with the name (position only: its opacity belongs to the CSS intro fade)
  gsap.to('.hero__hello', { y: () => innerHeight * 0.25, ease: 'none', scrollTrigger: heroScroll });
  gsap.to('.hero__content', { y: -80, autoAlpha: 0.15, ease: 'none', scrollTrigger: { ...heroScroll, start: 'top+=10% top' } });

  /* ---------- Projects: 3D cascade into the grid ----------
     Each card tips up from below (rotateX + rise + fade); cards further right in a row
     finish slightly later, so a row lands left → right. Reversed when scrolling up. */
  gsap.utils.toArray('.project').forEach((card, i) => {
    const lag = (i % 3) * 7;
    gsap.fromTo(card, { y: 80, rotateX: -18, autoAlpha: 0, transformPerspective: 1200 }, {
      y: 0, rotateX: 0, autoAlpha: 1, ease: 'power2.out',
      scrollTrigger: { trigger: card, start: 'top 98%', end: `top ${68 - lag}%`, scrub: 0.6 },
    });
    gsap.to(card, {
      y: -50, rotateX: 12, autoAlpha: 0, ease: 'power2.in', immediateRender: false,
      scrollTrigger: { trigger: card, ...EXIT },
    });
  });

  /* ---------- Experience pipeline: draw the line, light nodes, pop cards, move packets ---------- */
  if (pipeline) {
    const { line, packets, stages, state } = pipeline;
    let progress = 0;
    let visible = false;

    // Re-measure the path before ScrollTrigger recalculates positions (resize, fonts, pin spacers)
    const relayout = () => {
      pipeline.layout();
      line.style.strokeDasharray = state.total;
      line.style.strokeDashoffset = state.total * (1 - progress);
    };
    ScrollTrigger.addEventListener('refreshInit', relayout);
    relayout();

    ScrollTrigger.create({
      trigger: pipeline.root,
      start: 'top 75%',
      end: 'bottom 65%',
      scrub: 0.6,
      onUpdate: (self) => {
        progress = self.progress;
        // stroke-dashoffset: total = hidden, 0 = fully drawn
        line.style.strokeDashoffset = state.total * (1 - progress);
        // A stage is "reached" once the drawn length passes its node
        stages.forEach((s, i) => s.classList.toggle('is-reached', progress >= state.stops[i] - 0.002));
      },
    });

    // Glowing data packets loop along the part of the line that is already drawn
    ScrollTrigger.create({
      trigger: pipeline.root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => { visible = self.isActive; },
    });
    const speeds = [0.16, 0.11, 0.13];
    const offsets = [0, 0.38, 0.71];
    gsap.ticker.add((time) => {
      if (!visible) return;
      const drawn = state.total * progress;
      packets.forEach((p, i) => {
        if (drawn < 30) { p.setAttribute('opacity', 0); return; }
        const t = (time * speeds[i] + offsets[i]) % 1;
        const pt = line.getPointAtLength(t * drawn);
        p.setAttribute('cx', pt.x);
        p.setAttribute('cy', pt.y);
        // fade in at the start and out near the drawing head
        p.setAttribute('opacity', Math.min(1, t * 8, (1 - t) * 8));
      });
    });
  }

  /* ---------- 3D section transitions ----------
     Like pages turning: each block tips back in from below (rotateX + scale + rise),
     sits flat while it fills the screen, then tilts away over the top as it leaves.
     Scrubbed, so it plays forwards scrolling down and backwards scrolling up. */
  gsap.utils.toArray('[data-scene]').forEach((el) => {
    gsap.set(el, { transformPerspective: 1400 });
    gsap.fromTo(el,
      { rotateX: 16, scale: 0.88, y: 90, autoAlpha: 0.15, transformOrigin: '50% 0%' },
      { rotateX: 0, scale: 1, y: 0, autoAlpha: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 40%', scrub: 0.6 } });
    gsap.to(el, {
      rotateX: -12, scale: 0.92, autoAlpha: 0.3, transformOrigin: '50% 100%', ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: el, start: 'bottom 45%', end: 'bottom top', scrub: 0.6 },
    });
  });

  // Recalculate once images and fonts have settled
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
