# Dheeraj — Portfolio

A static, no-build portfolio: plain HTML, CSS and vanilla ES modules. Three.js, GSAP + ScrollTrigger and Lenis load from CDNs.

## Run locally

ES modules don't load from `file://`, so serve the folder over HTTP. Pick one:

- **VS Code:** install the *Live Server* extension, right-click `index.html`, then choose **Open with Live Server**.
- **Python:**
  ```bash
  python -m http.server 5500
  ```
  Then open http://localhost:5500
- **Node:**
  ```bash
  npx serve .
  ```

## Edit your content

All text, links, projects, experience and skills are in **`js/content.js`**. Search it for `TODO` to find the placeholders.

| What | Where |
| --- | --- |
| Name, role, bio, stats | `content.hero` |
| Projects (title, description, stack, links, image) | `content.projects.items` |
| Experience pipeline stages | `content.experience.items` (add or remove entries freely) |
| Education, skill groups | `content.education`, `content.skills.groups` |
| Contact links, footer | `content.contact`, `content.footer` |

**Photo:** `assets/portrait-cutout.webp` is your photo with the background removed (transparent WebP, 800×1000). To swap it, use another cut-out and point `hero.photo.src` at it. The bottom edge fades out automatically.

**Project images:** replace `assets/project-*.svg` with screenshots in a 16:10 ratio (e.g. 1600×1000 WebP). The grid shows 3 projects per row on laptops.

**Logos:** skills and certifications use [Simple Icons](https://simpleicons.org) slugs (`icon` in `content.js`). For school logos, put an image in `assets/` and set `logo` on the education entry; otherwise a monogram badge is shown.

**"Hi, I'm" font:** Lucida Handwriting ships with Windows; on Mac/phones a similar script font is used.

## File map

```
index.html            page shell (sections are filled by render.js)
css/base.css          tokens, reset, typography, utilities
css/sections.css      one commented block per section
css/animations.css    keyframes, entrance states, hover effects, reduced-motion
js/content.js         ALL editable content
js/render.js          builds section HTML from content.js
js/hero3d.js          Three.js particle sphere (dynamically imported)
js/bg3d.js            full-page 3D background: dust + glowing liquid bubbles the camera travels past
js/bubble.js          shared bubble shader (Fresnel rim, iridescence, wobble) used by both 3D scenes
js/intro.js           bubble loading screen that zooms into the page
js/scroll.js          Lenis + ScrollTrigger: split titles, parallax, pinned projects, pipeline, process line
js/interactions.js    cursor, tilt, magnetic buttons, counters, progress bar, skills circuit
js/main.js            entry point
assets/               favicon, placeholder photo, project images
```

## Performance and accessibility

- **3D hero and background:** both run only after `window.load`, through dynamic imports. The background pauses while the hero fills the screen. It's skipped on screens under 768px wide, on devices with fewer than 4 CPU cores, when data saver is on, and when reduced motion is set. In those cases a static CSS gradient is shown. Pixel ratio is capped at 2, and rendering pauses when the hero is off-screen or the tab is hidden.
- **Motion:** animations always run (the inline script in `index.html` sets `motion-ok`). The static fallback (`html.static`) is used only if GSAP fails to load.
- **If a CDN fails:** the same static mode kicks in.
- **Touch devices:** they keep the native cursor, with no tilt and no magnetic effect.
- **Accessibility:** semantic landmarks, a skip link, visible `:focus-visible` rings, and alt text on all images. Split-text titles keep a screen-reader copy, and decorative layers are `aria-hidden`.

## Deploy

The site is fully static. There's no build step: publish the folder as-is.

### GitHub Pages
1. Push this folder to a GitHub repo (with `index.html` at the root).
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
3. The site goes live at `https://<user>.github.io/<repo>/`. All paths are relative, so subfolders work.

### Netlify
- Drag the folder onto https://app.netlify.com/drop, **or**
- Connect the repo and leave **Build command** empty, with **Publish directory** set to `.`.

### Vercel
- Import the repo at https://vercel.com/new. Set **Framework preset** to *Other* and leave the build command empty, **or**
- Run from the folder:
  ```bash
  npx vercel --prod
  ```

## Publishing an update

Browsers cache the CSS and JavaScript files. To make sure visitors get your latest version (and never a mix of old and new files), change the `?v=…` value in `index.html` before you push. It appears in the three stylesheet links, the import map and the main script tag. Using today's date works well, for example `?v=2026-11-15`.
