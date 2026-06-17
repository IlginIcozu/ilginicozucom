# Ilgın İçözü — Portfolio Website

Static multi-page portfolio built for GitHub Pages. Dark, WebGL-driven "light through haze"
design with GSAP-powered micro-animations, smooth scrolling, page transitions, and a custom cursor.

## Stack

All libraries load from CDNs — no build step, deploys as plain static files.

- **GSAP 3 + ScrollTrigger** — entrance choreography, scroll reveals, parallax, page-transition veil
- **Lenis** — smooth scrolling (integrated with ScrollTrigger)
- **Three.js** — fullscreen background shader (`js/gl.js`): domain-warped fog with a glowing
  contour band, mouse-reactive, dims on scroll
- **Fonts** — Space Grotesk (display), Inter (body), IBM Plex Mono (labels)

## Files

- `index.html` — hero, marquee, section 01 (Immersive Sound), site index
- `immersive-experience.html` / `creative-coding.html` / `released-music.html` / `about-contact.html`
- `styles.css` — design system (tokens at the top of the file)
- `js/data.js` — **all portfolio content** (projects, galleries, releases)
- `js/app.js` — rendering + interactions (preloader, cursor, reveals, galleries, transitions)
- `js/gl.js` — Three.js background shader
- `assets/placeholders/` — gallery images
- `xyz-bg/` — the standalone ilginicozu.xyz audiovisual sketch (kept as-is, linked from the hero)

## Edit your project entries

Open `js/data.js`. All content is in the `window.SITE_DATA` object:

- `immersiveSound`, `immersiveExperience`, `creativeCoding` — project cards
- `creativeCodingExtraGallery` — the big archive slider
- `releases` — Bandcamp discography

### Media types per project

```js
media: { type: "vimeo", id: "123456789", title: "My piece" }
media: { type: "iframe-src", src: "https://…", title: "…", interactive: true }
media: { type: "gallery", imageFit: "contain", backgroundColor: "#111",
         slides: [{ src: "assets/…", alt: "…" }] }
```

`contained: true` narrows wide media; `frameClass: "media-square"` makes it 1:1.

## Accessibility & performance notes

- `prefers-reduced-motion` disables the preloader, smooth scroll, shader loop, and reveals
- Custom cursor only activates on fine-pointer (mouse) devices
- The shader pauses when the tab is hidden; pixel ratio is capped
- All iframes are `loading="lazy"`

## Publish on GitHub Pages

1. Upload all files in this folder to your GitHub repository.
2. Repository settings → **Pages**.
3. Set the source to your main branch and the root folder. Save.
