/**
 * render.js — turns the objects in content.js into the page's HTML.
 * Each render* function owns one section; renderAll() fills every shell in index.html.
 */

/* ---------- helpers ---------- */

/** Escape text before putting it into HTML. */
const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const pad = (n) => String(n).padStart(2, '0');

/** External links open in a new tab; in-page, mailto and placeholder links don't. */
const linkAttrs = (href) =>
  /^https?:\/\//.test(href) ? `href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : `href="${esc(href)}"`;

const tags = (list) =>
  `<ul class="tags" role="list">${list.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>`;

/* ---------- inline SVG icons (stroke icons inherit currentColor) ---------- */
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  sparkle: '<path fill="currentColor" stroke="none" d="M12 1c.7 5.4 2.6 8.7 11 11-8.4 2.3-10.3 5.6-11 11-.7-5.4-2.6-8.7-11-11 8.4-2.3 10.3-5.6 11-11z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  pen: '<path d="M4 20l4-1L19 8l-3-3L5 16l-1 4zM14 7l3 3"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
  quote: '<path fill="currentColor" stroke="none" d="M3 19v-6c0-4.5 2.2-7.6 6.5-9l1.2 2.2C8.4 7.2 7.3 8.8 7.2 11H11v8H3zm10 0v-6c0-4.5 2.2-7.6 6.5-9l1.2 2.2c-2.3 1-3.4 2.6-3.5 4.8H21v8h-8z"/>',
};

export const icon = (name) =>
  `<svg class="icon icon--${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

/** Section heading row: split-text title + rule + optional trailing HTML. */
const sectionHead = (id, title, trailing = '') =>
  `<h2 class="section__title" id="${id}" data-split>${esc(title)}</h2>
   <span class="section__rule" aria-hidden="true"></span>${trailing}`;

/* ==========================================================================
   Sections
   ========================================================================== */

function renderTopbar(c) {
  const { roles, status } = c.topbar;
  return `
    <a class="topbar__brand" href="#top" aria-label="${esc(c.person.name)} — back to top">
      ${roles.map((r) => `<span>${esc(r)}</span>`).join('')}
    </a>
    <nav class="topbar__nav" aria-label="Primary">
      <ul role="list">${c.nav.map((n) => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('')}</ul>
    </nav>
    <div class="topbar__right">
      <p class="topbar__status"><span class="topbar__pulse" aria-hidden="true"></span>${esc(status)}${icon('sparkle')}</p>
    </div>`;
}

function renderHero(c) {
  const h = c.hero;
  // Giant name: words are separate masks (so they can stack on phones); every letter is a
  // span whose --i drives the staggered rise-in (animations.css)
  let i = 0;
  const word = h.bigName
    .toUpperCase()
    .split(' ')
    .map((part) => `<span class="hero__wordpart">${[...part].map((ch) => `<span class="hero__letter" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`)
    .join('');
  const stats = h.stats
    .map(
      (s) => `<li class="stat">
        <span class="stat__num" data-count="${s.value}" data-suffix="${esc(s.suffix)}">${s.value.toLocaleString()}${esc(s.suffix)}</span>
        <span class="stat__label">${s.label.map(esc).join('<br>')}</span>
      </li>`,
    )
    .join('');

  return `
    <div class="hero__fallback" aria-hidden="true"></div>
    <canvas class="hero__canvas" aria-hidden="true"></canvas>
    <h1 class="hero__bgword" id="hero-name">
      <span class="sr-only">${esc(h.hello)} ${esc(h.bigName)}</span>
      <span class="hero__word" aria-hidden="true" data-fit>${word}</span>
    </h1>
    <p class="hero__hello" aria-hidden="true" data-intro style="--delay:1.1s">${esc(h.hello)}</p>
    <div class="hero__inner">
      <figure class="hero__photo" data-intro style="--delay:.45s">
        <img src="${esc(h.photo.src)}" alt="${esc(h.photo.alt)}" width="${h.photo.width}" height="${h.photo.height}" fetchpriority="high" decoding="async">
      </figure>
      <div class="hero__content">
        <p class="hero__role" data-intro style="--delay:1s">${h.role.map(esc).join('<br>')}</p>
        <div class="hero__about">
          ${h.about.map((p, k) => `<p data-intro style="--delay:${(1.1 + k * 0.1).toFixed(2)}s">${esc(p)}</p>`).join('')}
        </div>
        <p class="hero__loc" data-intro style="--delay:1.45s">${icon('globe')}${esc(h.location)}</p>
        <ul class="stats" role="list" data-intro style="--delay:1.55s">${stats}</ul>
      </div>
    </div>`;
}

function renderProjects(c) {
  const p = c.projects;
  const cards = p.items
    .map((item, i) => {
      const links = [
        item.links.code && `<a ${linkAttrs(item.links.code)}><span data-scramble>Code</span><span class="sr-only"> for ${esc(item.title)}</span></a>`,
        item.links.live && `<a ${linkAttrs(item.links.live)}><span data-scramble>Live demo</span><span class="sr-only"> of ${esc(item.title)}</span></a>`,
      ].filter(Boolean);
      const primary = item.links.live || item.links.code || '#';
      return `
      <li class="project">
        <article class="project__card" data-tilt aria-labelledby="project-${i}">
          <div class="project__media">
            <img src="${esc(item.image)}" alt="${esc(item.alt)}" width="1600" height="1000" loading="lazy" decoding="async">
          </div>
          <div class="project__body">
            <span class="project__num" aria-hidden="true">${pad(i + 1)}</span>
            <div>
              <h3 class="project__title" id="project-${i}">${esc(item.title)}</h3>
              <p class="project__kicker">${esc(item.kicker)}</p>
            </div>
            <a class="icon-btn" ${linkAttrs(primary)} aria-label="Open ${esc(item.title)}" data-magnetic>${icon('arrow')}</a>
          </div>
          <p class="project__desc">${esc(item.description)}</p>
          ${tags(item.tech)}
          ${links.length ? `<p class="project__links">${links.join('')}</p>` : ''}
          <span class="project__glare" aria-hidden="true"></span>
          <span class="project__border" aria-hidden="true"></span>
        </article>
      </li>`;
    })
    .join('');

  return `
    <div class="container section__head">
      ${sectionHead('work-title', p.title, `<a class="link-arrow" ${linkAttrs(p.viewAll.href)} data-magnetic><span data-scramble>${esc(p.viewAll.label)}</span>${icon('arrow')}</a>`)}
    </div>
    <ol class="container projects__grid" role="list">${cards}</ol>`;
}

function renderExperience(c) {
  const e = c.experience;
  // --k on each card child drives the pop-in stagger (animations.css)
  const stages = e.items
    .map(
      (item, i) => `
      <li class="pipeline__stage" data-side="${i % 2 ? 'right' : 'left'}">
        <span class="pipeline__node" aria-hidden="true">${pad(i + 1)}</span>
        <article class="pipeline__card">
          <p class="eyebrow pipeline__label" style="--k:0">${esc(item.stage)}</p>
          <h3 class="pipeline__role" style="--k:1">${esc(item.role)}</h3>
          <p class="pipeline__org" style="--k:2">${esc(item.org)} · <time>${esc(item.period)}</time></p>
          <ul class="pipeline__points" style="--k:3">${item.points.map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>
          <div style="--k:4">${tags(item.tech)}</div>
        </article>
      </li>`,
    )
    .join('');

  const endSide = e.items.length % 2 ? 'right' : 'left';
  const end = `
      <li class="pipeline__stage pipeline__stage--end" data-side="${endSide}">
        <span class="pipeline__node" aria-hidden="true">${icon('sparkle')}</span>
        <div class="pipeline__card">
          <div style="--k:0">
            <p class="eyebrow pipeline__label">${esc(e.end.label)}</p>
            <p class="pipeline__role">${esc(e.end.text)}</p>
          </div>
          <a class="icon-btn" href="${esc(e.end.cta.href)}" aria-label="${esc(e.end.cta.label)}" style="--k:1" data-magnetic>${icon('arrow')}</a>
        </div>
      </li>`;

  return `
    <div class="container" data-scene>
      <div class="section__head">
        ${sectionHead('experience-title', e.title)}
        <p class="section__intro">${esc(e.intro)}</p>
      </div>
      <div class="pipeline" data-pipeline>
        <svg class="pipeline__svg" aria-hidden="true" focusable="false">
          <path class="pipeline__track" d=""/>
          <path class="pipeline__line" d=""/>
          <g class="pipeline__packets">
            <circle class="pipeline__packet" r="3.5" cx="-20" cy="-20"/>
            <circle class="pipeline__packet" r="2.5" cx="-20" cy="-20"/>
            <circle class="pipeline__packet" r="3" cx="-20" cy="-20"/>
          </g>
        </svg>
        <ol class="pipeline__list" role="list">${stages}${end}</ol>
      </div>
    </div>`;
}

/**
 * Brand logo from the Simple Icons CDN, drawn in light grey to suit the dark theme.
 * Decorative (empty alt) because the name is always written next to it;
 * if a slug doesn't exist the image just removes itself.
 */
const logo = (slug, cls = 'logo') =>
  slug
    ? `<img class="${cls}" src="https://cdn.simpleicons.org/${encodeURIComponent(slug)}/e6e6e6" alt="" width="16" height="16" loading="lazy" decoding="async" onerror="this.remove()">`
    : '';

function renderAbout(c) {
  const edu = c.education.items
    .map(
      (it) => `<li class="edu__item">
        ${it.logo
          ? `<img class="edu__badge" src="${esc(it.logo)}" alt="" width="44" height="44" loading="lazy">`
          : `<span class="edu__badge" aria-hidden="true">${esc(it.badge)}</span>`}
        <span class="edu__text">
          <span class="edu__degree">${esc(it.degree)}</span>
          <span class="edu__school">${esc(it.school)}</span>
        </span>
        <span class="edu__period">${esc(it.period)}</span>
      </li>`,
    )
    .join('');

  const certs = (c.education.certifications || [])
    .map((ct) => {
      const inner = `<span class="cert__logo" aria-hidden="true">${ct.icon ? logo(ct.icon) : icon('award')}</span>
        <span class="cert__name">${esc(ct.name)}</span><span class="cert__issuer">${esc(ct.issuer)}</span>`;
      return `<li>${ct.href ? `<a class="cert" ${linkAttrs(ct.href)}>${inner}</a>` : `<span class="cert">${inner}</span>`}</li>`;
    })
    .join('');

  const groups = c.skills.groups
    .map(
      (g, gi) => `<div class="skill-group" data-group="${gi}" tabindex="0" aria-label="${esc(g.name)}: ${g.items.map((s) => esc(s.name)).join(', ')}">
        <p class="skill-group__hub"><span class="skill-group__pin" aria-hidden="true"></span>${esc(g.name)}</p>
        <ul class="skill-group__chips" role="list">${g.items
          .map((s) => `<li class="chip">${logo(s.icon, 'chip__logo')}<span class="chip__name">${esc(s.name)}</span></li>`)
          .join('')}</ul>
      </div>`,
    )
    .join('');

  const q = c.quote;
  return `
    <div class="about__grid" data-scene>
      <section class="about__col about__col--edu" id="education" aria-labelledby="edu-title">
        <h2 class="section__title" id="edu-title" data-split>${esc(c.education.title)}</h2>
        <ul class="edu" role="list">${edu}</ul>
        ${certs ? `<h3 class="eyebrow">Certifications</h3><ul class="certs" role="list" data-reveal>${certs}</ul>` : ''}
      </section>

      <section class="about__col about__col--skills" id="skills" aria-labelledby="skills-title">
        <h2 class="section__title" id="skills-title" data-split>${esc(c.skills.title)}</h2>
        <div class="skills__board" data-circuit>
          <svg class="skills__circuit" aria-hidden="true" focusable="false"></svg>
          ${groups}
        </div>
      </section>

      <aside class="quote" aria-label="Quote">
        <figure>
          ${icon('quote').replace('class="icon', 'class="icon quote__mark')}
          <blockquote class="quote__text" data-reveal><p>${esc(q.text)}</p></blockquote>
          <figcaption class="quote__sig" data-reveal>${esc(q.signature)}</figcaption>
        </figure>
        <a class="quote__cta" href="${esc(q.cta.href)}"><span data-scramble>${esc(q.cta.label)}</span>${icon('sparkle')}</a>
      </aside>
    </div>`;
}

function renderContact(c) {
  const k = c.contact;
  // Glass cards: heading + short note, the whole card links to the site
  const socials = k.socials
    .map(
      (s) => `<li>
        <a class="social" ${linkAttrs(s.href)} data-tilt>
          <span class="social__icon" aria-hidden="true">${icon(s.icon)}</span>
          <span class="social__text">
            <span class="social__title" data-scramble>${esc(s.title)}</span>
            <span class="social__note">${esc(s.note)}</span>
          </span>
          <span class="social__arrow" aria-hidden="true">${icon('arrow')}</span>
        </a>
      </li>`,
    )
    .join('');
  const b = k.badge;

  return `
    <div class="container contact__grid" data-scene>
      <div>
        <h2 class="contact__title" id="contact-title"><span data-split>${k.title.map(esc).join(' ')}</span>${icon('sparkle')}</h2>
        <p class="contact__text" data-reveal>${esc(k.text)}</p>
        <a class="btn-cta" ${linkAttrs(k.cta.href)} data-magnetic>
          <span class="btn-cta__circle" aria-hidden="true">${icon('arrow')}</span><span data-scramble>${esc(k.cta.label)}</span>
        </a>
      </div>
      <ul class="socials" role="list">${socials}</ul>
      <!-- Laptop mock (tilts toward the pointer); its screen shows the animated "Contact me" badge -->
      <div class="laptop">
        <div class="laptop__inner" data-tilt>
          <div class="laptop__screen">
            <div class="laptop__nav" aria-hidden="true"><span></span><span></span><span></span></div>
            <span class="laptop__bubble" aria-hidden="true"></span>
            <span class="laptop__bubble" aria-hidden="true"></span>
            <span class="laptop__bubble" aria-hidden="true"></span>
            <div class="contact-me">
              <a class="contact-me__badge" ${linkAttrs(b.href)} aria-label="${esc(b.heading)}">
                <!-- Text runs round a circle path and slowly rotates (animations.css) -->
                <svg class="contact-me__ring" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
                  <defs><path id="contact-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0"/></defs>
                  <text><textPath href="#contact-ring" textLength="500">${esc((b.ring + b.ring).toUpperCase())}</textPath></text>
                </svg>
                <span class="contact-me__core" aria-hidden="true">${icon('arrow')}</span>
                <span class="contact-me__orb" aria-hidden="true"></span>
                <span class="contact-me__orb" aria-hidden="true"></span>
                <span class="contact-me__orb" aria-hidden="true"></span>
              </a>
              <h3 class="contact-me__heading" data-split>${esc(b.heading)}</h3>
            </div>
          </div>
          <div class="laptop__base" aria-hidden="true"></div>
        </div>
      </div>
    </div>`;
}

function renderFooter(c) {
  const f = c.footer;
  return `
    <p>© ${new Date().getFullYear()} ${esc(f.note)}</p>
    <ul class="footer__links" role="list">
      ${f.links.map((l) => `<li><a ${linkAttrs(l.href)}>${esc(l.label)}</a></li>`).join('')}
      <li><a href="#top">Back to top ↑</a></li>
    </ul>`;
}

/* ==========================================================================
   Entry
   ========================================================================== */
export function renderAll(c) {
  const fill = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };
  fill('topbar', renderTopbar(c));
  fill('top', renderHero(c));
  fill('work', renderProjects(c));
  fill('experience', renderExperience(c));
  fill('about', renderAbout(c));
  fill('contact', renderContact(c));
  fill('footer', renderFooter(c));
}
