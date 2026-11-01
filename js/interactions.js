/**
 * interactions.js — pointer-driven effects and small UI behaviours:
 * custom cursor, 3D tilt, magnetic buttons, count-up stats,
 * scroll progress bar and the skills "circuit board".
 */

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Layout position of `el` relative to `root`, ignoring CSS transforms
 * (sums offsetLeft/Top up the offsetParent chain). Used for SVG geometry so
 * 3D section transitions and reveal animations can't skew the measurements.
 */
export function offsetWithin(el, root) {
  let x = 0, y = 0, node = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/* ==========================================================================
   TEXT SCRAMBLE
   Letters cycle through random glyphs and lock in left → right, like data being
   decoded. Only used on plain-text elements (no child markup to destroy).
   ========================================================================== */
const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFXZ';

export function scramble(el, { duration = 650 } = {}) {
  if (!el) return;
  const original = el.dataset.text ?? (el.dataset.text = el.textContent);
  const start = performance.now();
  cancelAnimationFrame(el._scramble);
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const locked = Math.floor(p * original.length);
    let out = '';
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      out += i < locked || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) el._scramble = requestAnimationFrame(step);
    else el.textContent = original;
  };
  el._scramble = requestAnimationFrame(step);
}

function initScramble() {
  // On hover: links decode their label (the [data-scramble] span, or the link itself if it is plain text)
  qsa('.topbar__nav a, .footer a, .project__links a, .link-arrow, .btn-cta, .social, .quote__cta').forEach((link) => {
    const target = link.querySelector('[data-scramble]') || (link.children.length === 0 ? link : null);
    if (!target) return;
    if (target === link) link.setAttribute('aria-label', link.textContent.trim()); // stable accessible name
    link.addEventListener('pointerenter', () => scramble(target));
    link.addEventListener('focus', () => scramble(target));
  });

  // In view: small labels decode every time they scroll into view (either direction)
  const labels = qsa('.eyebrow, .project__kicker, .chip__name, .edu__period, .topbar__brand span').filter((el) => el.children.length === 0);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) scramble(e.target, { duration: 800 }); });
  }, { threshold: 0.9 });
  labels.forEach((el) => io.observe(el));
}

/* ==========================================================================
   RIPPLE — a soft light ring spreads from the press point on glass controls
   ========================================================================== */
function initRipple() {
  const HOSTS = '.icon-btn, .chip, .topbar__nav a, .btn-cta, .social, .contact-me__badge, .project__links a';
  document.addEventListener('pointerdown', (e) => {
    const host = e.target.closest(HOSTS);
    if (!host) return;
    const box = host.querySelector('.btn-cta__circle, .contact-me__core') || host;
    const r = box.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.setProperty('--rx', `${e.clientX - r.left}px`);
    ripple.style.setProperty('--ry', `${e.clientY - r.top}px`);
    ripple.style.setProperty('--rs', `${Math.max(r.width, r.height) * 2.4}px`);
    box.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

/* ==========================================================================
   STICKY TOP BAR + ACTIVE SECTION
   .is-stuck once the page has scrolled; the nav link for the section that
   fills the middle of the viewport gets aria-current="true".
   ========================================================================== */
function initTopbar() {
  const bar = qs('.topbar');
  if (!bar) return;
  const onScroll = () => bar.classList.toggle('is-stuck', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = qsa('.topbar__nav a[href^="#"]');
  const sections = links.map((a) => qs(a.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${entry.target.id}`)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' }); // a thin band across the middle of the screen
  sections.forEach((s) => io.observe(s));
}

/* ==========================================================================
   CUSTOM CURSOR
   A dot that follows the pointer exactly and a ring that trails behind it
   (linear interpolation each frame). The ring grows over interactive elements.
   Only enabled for fine pointers — touch devices keep their native behaviour.
   ========================================================================== */
function initCursor({ motion }) {
  const root = qs('.cursor');
  if (!root) return;
  document.documentElement.classList.add('has-cursor');

  const dot = qs('.cursor__dot', root);
  const ring = qs('.cursor__ring', root);
  const follow = motion ? 0.18 : 1; // no lag when reduced motion is on
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my, scale = 1, targetScale = 1;
  let running = false;

  const tick = () => {
    rx = lerp(rx, mx, follow);
    ry = lerp(ry, my, follow);
    scale = lerp(scale, targetScale, motion ? 0.15 : 1);
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale})`;
    // Stop the loop once the ring has caught up, to save battery
    if (Math.abs(rx - mx) + Math.abs(ry - my) + Math.abs(scale - targetScale) > 0.1) {
      requestAnimationFrame(tick);
    } else running = false;
  };
  const wake = () => {
    if (!running) { running = true; requestAnimationFrame(tick); }
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    root.classList.add('is-visible');
    wake();
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => root.classList.remove('is-visible'));

  // Grow over links / buttons / anything marked data-cursor
  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest('a, button, [data-cursor], [data-tilt], .skill-group');
    root.classList.toggle('is-hover', !!hit);
    targetScale = hit ? (hit.matches('[data-tilt]') ? 1.4 : 1.8) : 1;
    wake();
  });
  addEventListener('pointerdown', () => { targetScale *= 0.75; wake(); });
  addEventListener('pointerup', () => { targetScale /= 0.75; wake(); });
}

/* ==========================================================================
   3D TILT + GLARE
   The card's rotateX/Y follow the pointer (CSS variables --rx/--ry, applied
   under a perspective parent). --mx/--my move the glare highlight.
   ========================================================================== */
function initTilt() {
  qsa('[data-tilt]').forEach((el) => {
    const max = el.classList.contains('social') ? 12 : el.classList.contains('laptop__inner') ? 14 : 9; // degrees
    let frame = 0;

    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;   // 0 → 1
        const py = (e.clientY - r.top) / r.height;   // 0 → 1
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
        el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      });
    });

    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      el.classList.remove('is-tilting');
      ['--rx', '--ry', '--mx', '--my'].forEach((p) => el.style.removeProperty(p)); // spring back to CSS defaults
    });
  });
}

/* ==========================================================================
   MAGNETIC BUTTONS
   While hovered, the element is pulled a fraction of the way toward the pointer;
   on leave it springs back (CSS transition on transform).
   ========================================================================== */
function initMagnetic() {
  qsa('[data-magnetic]').forEach((el) => {
    const strength = 0.35;
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.classList.add('is-magnet');
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-magnet');
      el.style.transform = '';
    });
  });
}

/* ==========================================================================
   COUNT-UP STATS
   Numbers start at 0 and ease up to their value the first time they are
   at least 60% visible (IntersectionObserver).
   ========================================================================== */
function initCounters({ motion }) {
  const els = qsa('[data-count]');
  if (!motion || !('IntersectionObserver' in window)) return; // keep final values

  const format = (el, n) => `${Math.round(n).toLocaleString()}${el.dataset.suffix || ''}`;
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

  const run = (el) => {
    const target = Number(el.dataset.count);
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = format(el, target * easeOutExpo(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      run(entry.target);
    });
  }, { threshold: 0.6 });

  els.forEach((el) => {
    el.textContent = format(el, 0);
    io.observe(el);
  });
}

/* ==========================================================================
   SCROLL PROGRESS BAR — scaleX = how far down the page we are
   ========================================================================== */
function initProgress() {
  const bar = qs('.progress__bar');
  if (!bar) return;
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

/* ==========================================================================
   SKILLS CIRCUIT BOARD
   For each skill group, draws right-angled SVG "traces" from the group's pin
   down a vertical bus and across to every chip, with a solder dot at the end.
   Geometry is measured from the DOM, so it is rebuilt whenever the board resizes.
   Hover / focus on a group lights its traces and dims the rest.
   ========================================================================== */
function initCircuit() {
  const board = qs('[data-circuit]');
  if (!board) return;
  const svg = qs('.skills__circuit', board);
  const groups = qsa('.skill-group', board);
  const NS = 'http://www.w3.org/2000/svg';

  const layout = () => {
    svg.setAttribute('viewBox', `0 0 ${board.offsetWidth} ${board.offsetHeight}`);
    svg.replaceChildren();

    groups.forEach((group, gi) => {
      const pin = offsetWithin(qs('.skill-group__pin', group), board);
      const busX = pin.x + pin.w / 2;
      const startY = pin.y + pin.h;

      qsa('.chip', group).forEach((chip) => {
        const r = offsetWithin(chip, board);
        const cy = r.y + r.h / 2;
        const cx = r.x;
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M${busX} ${startY} V${cy} H${cx}`);
        path.setAttribute('class', 'circuit__line');
        path.dataset.group = gi;
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', cy);
        dot.setAttribute('r', 2.5);
        dot.setAttribute('class', 'circuit__dot');
        dot.dataset.group = gi;
        svg.append(path, dot);
      });
    });
  };

  const setActive = (gi) => {
    groups.forEach((g, i) => g.classList.toggle('is-lit', i === gi));
    svg.querySelectorAll('[data-group]').forEach((n) => {
      const mine = Number(n.dataset.group) === gi;
      n.classList.toggle('is-lit', gi !== null && mine);
      n.classList.toggle('is-dim', gi !== null && !mine);
    });
  };

  groups.forEach((g, gi) => {
    g.addEventListener('pointerenter', () => setActive(gi));
    g.addEventListener('pointerleave', () => setActive(null));
    g.addEventListener('focus', () => setActive(gi));
    g.addEventListener('blur', () => setActive(null));
  });

  let frame = 0;
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(layout); };
  new ResizeObserver(schedule).observe(board);
  document.fonts?.ready.then(schedule);
  layout();
}

/* ==========================================================================
   HERO NAME FIT
   Sizes the giant name so it spans the hero's width exactly, whatever the font
   or screen. On narrow screens, where one line would be too small, the two words
   stack and each line is fitted instead. The size is exposed on the hero as
   --word-size so the "Hi, I'm" script and the photo/text offsets can follow it.
   ========================================================================== */
function initHeroFit() {
  const hero = qs('.hero');
  const word = qs('[data-fit]', hero);
  if (!word) return;
  const parts = qsa('.hero__wordpart', word);

  const fit = () => {
    const target = word.parentElement.clientWidth - parseFloat(getComputedStyle(word.parentElement).paddingLeft) * 2;
    // Measure at a reference size of 100px, then scale
    word.style.setProperty('--word-size', '100px');
    hero.style.setProperty('--word-size', '100px');
    word.classList.remove('is-stacked');
    const widths = parts.map((p) => p.scrollWidth);
    const gap = parseFloat(getComputedStyle(word).columnGap) || 0;
    const oneLine = (target / (widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1))) * 100;
    let size;
    if (oneLine >= 72 || parts.length < 2) {
      size = Math.min(oneLine, 260);
    } else {
      word.classList.add('is-stacked');
      size = Math.min((target / Math.max(...widths)) * 100, 170);
    }
    size = Math.floor(size * 0.99);
    word.style.setProperty('--word-size', `${size}px`);
    hero.style.setProperty('--word-size', `${size}px`);
  };

  let frame = 0;
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };
  new ResizeObserver(schedule).observe(hero);
  document.fonts?.ready.then(schedule);
  fit();
}

/* ==========================================================================
   Entry
   ========================================================================== */
export function initInteractions({ motion, finePointer }) {
  initHeroFit();
  initTopbar();
  initProgress();
  initCounters({ motion });
  initCircuit();
  if (motion) {
    initScramble();
    initRipple();
  }
  if (finePointer) {
    initCursor({ motion });
    if (motion) {
      initTilt();
      initMagnetic();
    }
  }
}
