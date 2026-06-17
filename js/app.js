/* ─────────────────────────────────────────────────────────────────────────
   APP — rendering + interaction layer
   Requires: js/data.js (content). Enhances with GSAP / ScrollTrigger / Lenis
   when available; every feature degrades gracefully without them.
   ───────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  const html = document.documentElement;
  const DATA = window.SITE_DATA || {};
  const hasGsap = typeof window.gsap !== "undefined";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const ANIM = hasGsap && !reducedMotion;

  if (hasGsap) {
    gsap.config({ force3D: true });
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
    }
  }

  /* ── helpers ──────────────────────────────────────────────────────────── */

  const pad2 = (n) => String(n).padStart(2, "0");

  function escapeHtml(text = "") {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Split an element's text into per-character spans (each word wrapped in an
  // overflow-hidden span so characters can slide up from behind a mask).
  function splitChars(el) {
    if (el.dataset.splitDone) return el.querySelectorAll(".split-char");
    const text = el.textContent;
    el.setAttribute("aria-label", text.trim());
    el.textContent = "";
    const frag = document.createDocumentFragment();
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(" "));
        return;
      }
      const word = document.createElement("span");
      word.className = "split-word";
      word.setAttribute("aria-hidden", "true");
      Array.from(part).forEach((ch) => {
        const c = document.createElement("span");
        c.className = "split-char";
        c.textContent = ch;
        word.appendChild(c);
      });
      frag.appendChild(word);
    });
    el.appendChild(frag);
    el.dataset.splitDone = "1";
    return el.querySelectorAll(".split-char");
  }

  /* ── content rendering ────────────────────────────────────────────────── */

  function renderMedia(media, title) {
    if (!media) return "";
    const wrapCls = ["media"];
    if (media.contained) wrapCls.push("media-contained");
    if (media.mediaClass) wrapCls.push(media.mediaClass);
    const frameCls = ["media-frame"];
    if (media.frameClass) frameCls.push(media.frameClass);

    // Videos run full-bleed; interactive/contained embeds and galleries don't.
    const isVideo = media.type === "vimeo" || (media.type === "iframe-src" && !media.interactive);
    if (isVideo && !media.contained) wrapCls.push("media-bleed");

    if (media.type === "vimeo" || media.type === "iframe-src") {
      const src =
        media.type === "vimeo"
          ? `https://player.vimeo.com/video/${media.id}?title=0&byline=0&portrait=0`
          : media.src;
      return `
        <div class="${wrapCls.join(" ")}">
          <div class="${frameCls.join(" ")}" data-media-reveal>
            <iframe
              src="${src}"
              title="${escapeHtml(media.title || title)}"
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
          ${media.interactive ? `<p class="media-hint mono">[ Interactive — click / scroll inside ]</p>` : ""}
        </div>
      `;
    }

    if (media.type === "gallery") {
      const fit = media.imageFit === "contain" ? "contain" : "cover";
      const bg = media.backgroundColor || "#0d0d0f";
      return `
        <div class="${wrapCls.join(" ")}" data-gallery>
          <div class="${frameCls.join(" ")} gallery" data-media-reveal data-cursor-label="Drag" style="background:${bg}">
            <div class="gallery-track" data-gallery-track>
              ${media.slides
                .map(
                  (slide) => `
                    <figure class="gallery-slide">
                      <img src="${slide.src}" alt="${escapeHtml(slide.alt || title)}" loading="lazy" decoding="async" draggable="false" style="object-fit:${fit}" />
                    </figure>
                  `
                )
                .join("")}
            </div>
          </div>
          <div class="gallery-ui mono">
            <span class="gallery-count" data-gallery-count>01 / ${pad2(media.slides.length)}</span>
            <div class="gallery-nav">
              <button class="gallery-btn" type="button" data-gallery-prev aria-label="Previous slide">←</button>
              <button class="gallery-btn" type="button" data-gallery-next aria-label="Next slide">→</button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="${wrapCls.join(" ")}">
        <div class="${frameCls.join(" ")}" data-media-reveal>
          <img src="${media.src}" alt="${escapeHtml(media.alt || title)}" loading="lazy" decoding="async" data-parallax />
        </div>
      </div>
    `;
  }

  function renderProject(project, index, total) {
    const hasTitle = (project.title || "").trim().length > 0;
    const hasBody = (project.bodyHtml || "").trim().length > 0;
    return `
      <article class="project">
        ${
          hasTitle
            ? `
        <header class="project-head">
          <span class="project-num mono" data-reveal>(&nbsp;${pad2(index + 1)}&nbsp;/&nbsp;${pad2(total)}&nbsp;)</span>
          <h3 class="project-title" data-split>${escapeHtml(project.title)}</h3>
          ${project.kicker ? `<p class="project-kicker mono" data-reveal>${escapeHtml(project.kicker)}</p>` : ""}
        </header>`
            : ""
        }
        ${renderMedia(project.media, project.title || "Work")}
        ${
          hasBody
            ? `
        <div class="project-body">
          <div class="project-aside mono" data-reveal><span>↳</span></div>
          <div class="project-text" data-reveal>${project.bodyHtml}</div>
        </div>`
            : ""
        }
      </article>
    `;
  }

  function mountProjects(targetId, items) {
    const target = document.getElementById(targetId);
    if (!target || !items) return;
    target.innerHTML = items.map((p, i) => renderProject(p, i, items.length)).join("");
  }

  function renderRelease(release, index) {
    return `
      <a class="release" href="${release.url}" target="_blank" rel="noopener noreferrer" data-reveal>
        <span class="release-num mono">${pad2(index + 1)}</span>
        <div class="release-cover" data-tilt>
          <img src="${release.cover}" alt="${escapeHtml(release.title)} cover" loading="lazy" decoding="async" draggable="false" />
        </div>
        <div class="release-info">
          <span class="release-format mono">${escapeHtml(release.format)}</span>
          <h3 class="release-title">${escapeHtml(release.title)}</h3>
          <p class="release-meta mono">${escapeHtml(release.release)} · ${escapeHtml(release.tracks)}</p>
          ${release.note ? `<p class="release-note">${escapeHtml(release.note)}</p>` : ""}
          ${
            release.tags?.length
              ? `<div class="release-tags">${release.tags.map((t) => `<span class="release-tag mono">${escapeHtml(t)}</span>`).join("")}</div>`
              : ""
          }
        </div>
        <span class="release-arrow" aria-hidden="true">↗</span>
      </a>
    `;
  }

  function mountReleases(targetId, items) {
    const target = document.getElementById(targetId);
    if (!target || !items) return;
    target.innerHTML = items.map(renderRelease).join("");
  }

  mountProjects("immersive-sound-list", DATA.immersiveSound);
  mountProjects("immersive-experience-list", DATA.immersiveExperience);
  mountProjects("creative-coding-list", DATA.creativeCoding);
  mountProjects("creative-coding-extra-gallery", DATA.creativeCodingExtraGallery);
  mountReleases("release-music-list", DATA.releases);

  /* ── smooth scrolling (Lenis) ─────────────────────────────────────────── */

  // Native scrolling only. A rAF-driven smooth-scroll library (Lenis) lagged
  // 1–2s and snapped to wrong positions whenever the main thread was busy
  // (the homepage hero sketch saturates it). Native scroll stays in sync.
  const lenis = null;

  function scrollToTop() {
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  /* ── header / nav ─────────────────────────────────────────────────────── */

  function currentPage() {
    const file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  document.querySelectorAll(".main-nav a, .menu-nav a").forEach((link) => {
    const href = (link.getAttribute("href") || "").split("#")[0];
    if (href === currentPage()) link.classList.add("is-active");
  });

  const menuToggle = document.getElementById("menu-toggle");
  const menuOverlay = document.getElementById("menu-overlay");
  if (menuToggle && menuOverlay) {
    menuToggle.addEventListener("click", () => {
      const open = html.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuOverlay.setAttribute("aria-hidden", String(!open));
      menuToggle.textContent = open ? "Close" : "Menu";
      if (lenis) open ? lenis.stop() : lenis.start();
    });
  }

  function closeMenu() {
    if (!html.classList.contains("menu-open")) return;
    html.classList.remove("menu-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "Menu";
    }
    if (menuOverlay) menuOverlay.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
  }

  /* ── page transitions (glitch dissolve) ───────────────────────────────── */

  const veil = document.querySelector(".veil");
  const veilFill = veil && veil.querySelector(".veil-fill");
  const veilBars = veil ? veil.querySelectorAll(".veil-bar") : [];
  const veilStrip = veil && veil.querySelector(".veil-strip");

  const rnd = (a, b) => a + Math.random() * (b - a);

  // Glitch dissolve — the calmer "first version" feel: #page tears as a
  // FULL-WIDTH horizontal slice shoved sideways, and clean full-width white
  // band lines flash at the tear (x:0, so they always span the whole width).
  // A short `near` window concentrates the glitch so it reads smooth and
  // natural rather than busy. A thin red strip sits on the left edge.
  // `mode` is "out" (leaving) or "in" (arriving).
  function pageGlitch(mode, onComplete) {
    const page = document.getElementById("page");
    if (!page || !veil) {
      if (onComplete) onComplete();
      return;
    }
    const FRAMES = 9;
    const step = 0.045;
    const tl = gsap.timeline({ onComplete });

    gsap.set(veil, { opacity: 1 });

    for (let i = 0; i < FRAMES; i++) {
      const at = i * step;
      const top = Math.round(rnd(0, 66));
      const bot = Math.round(rnd(0, 86 - top));
      const shove = (Math.random() - 0.5) * 30;
      const near = mode === "out" ? i >= FRAMES - 4 : i < 4; // glitch concentrates here
      const bandY = top;
      const bandH = Math.max(5, 100 - top - bot);

      // #page tears as a full-width horizontal slice, shoved sideways
      tl.set(page, {
        clipPath: `inset(${top}% 0% ${bot}% 0%)`,
        x: shove,
        skewX: (Math.random() - 0.5) * 4,
        opacity: i % 2 ? (mode === "out" && near ? 0.32 : 0.72) : 1
      }, at);

      // clean full-width white band lines at the tear (x:0 → always full width)
      veilBars.forEach((bar, bi) => {
        const h = bi === 0 ? Math.min(bandH, 24) : rnd(1.5, 5);
        tl.set(bar, {
          display: near ? "block" : "none",
          x: 0,
          scaleX: 1,
          top: Math.min(95, bandY + bi * 7) + "%",
          height: h + "%",
          opacity: near ? rnd(0.5, 0.9) : 0
        }, at);
      });

      // thin red strip on the left edge at the tear (kept by request)
      tl.set(veilStrip, {
        display: near ? "block" : "none",
        top: bandY + "%",
        height: bandH + "%",
        width: rnd(4, 8) + "px",
        opacity: near ? rnd(0.7, 1) : 0
      }, at);

      // dark fill cover envelope (rises while leaving, falls while arriving)
      const cover = mode === "out"
        ? (near ? (i % 2 ? 0.6 : 0.95) : 0)
        : Math.max(0, (i % 2 ? 0.85 : 0.45) - i * 0.12);
      tl.set(veilFill, { opacity: cover }, at);
    }

    // settle
    tl.set([...veilBars, veilStrip], { display: "none", opacity: 0 });
    if (mode === "out") {
      tl.set(veilFill, { opacity: 1 });
      tl.set(page, { clipPath: "inset(0% 0% 0% 0%)", x: 0, skewX: 0, opacity: 0 });
    } else {
      tl.set(veilFill, { opacity: 0 });
      tl.set(page, { clearProps: "clipPath,transform,opacity" });
      tl.set(veil, { opacity: 0 });
    }
    return tl;
  }

  function veilIn(onDone) {
    if (!ANIM || !veil) {
      onDone();
      return;
    }
    let fired = false;
    const go = () => { if (!fired) { fired = true; onDone(); } };
    pageGlitch("out", go);
    // safety: if rAF stalls (e.g. tab backgrounded mid-transition), still navigate
    setTimeout(go, 800);
  }

  function veilOut() {
    if (!veil) {
      html.classList.remove("is-veiled");
      return 0;
    }
    gsap.set(veil, { opacity: 1 });
    if (veilFill) gsap.set(veilFill, { opacity: 1 });
    const clear = () => {
      html.classList.remove("is-veiled");
      gsap.set(veil, { clearProps: "opacity" });
    };
    pageGlitch("in", clear);
    // safety: never leave the new page stranded under the veil
    setTimeout(() => { if (html.classList.contains("is-veiled")) clear(); }, 1400);
    return 0.5;
  }

  document.addEventListener("click", (e) => {
    if (!ANIM) return;
    const link = e.target.closest("a[href]");
    if (!link || link.target === "_blank") return;
    const href = link.getAttribute("href");
    if (!href || !href.includes(".html") || href.startsWith("http")) return;
    const [page] = href.split("#");
    if (page === currentPage()) {
      // same-page anchors scroll natively; same-page links do nothing
      if (!href.includes("#")) e.preventDefault();
      return;
    }
    e.preventDefault();
    closeMenu();
    try {
      sessionStorage.setItem("ii-veil", "1");
    } catch (err) {}
    veilIn(() => {
      window.location.href = href;
    });
  });

  /* ── scroll-driven + entrance animations ──────────────────────────────── */

  function showEverything() {
    // No-animation path: make sure nothing is left hidden.
    html.classList.remove("is-loading");
    const pre = document.getElementById("preloader");
    if (pre) pre.remove();
    html.classList.remove("is-veiled");
  }

  function initScrollAnimations() {
    if (!window.ScrollTrigger) return;

    // generic fade-up reveals
    const reveals = gsap.utils.toArray("[data-reveal]");
    if (reveals.length) {
      gsap.set(reveals, { y: 30, opacity: 0 });
      ScrollTrigger.batch(reveals, {
        start: "top 90%",
        once: true,
        onEnter: (els) =>
          gsap.to(els, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power3.out" })
      });
    }

    // character-mask heading reveals
    gsap.utils.toArray("[data-split]").forEach((el) => {
      const chars = splitChars(el);
      gsap.set(chars, { yPercent: 120 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () =>
          gsap.to(chars, { yPercent: 0, duration: 0.9, stagger: 0.016, ease: "power4.out" })
      });
    });

    // media reveals — transform + opacity only (GPU-composited; clip-path on
    // an <iframe> forces a full repaint every frame and reads as jittery)
    gsap.utils.toArray("[data-media-reveal]").forEach((frame) => {
      gsap.fromTo(
        frame,
        { y: 46, autoAlpha: 0, scale: 0.97 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: frame, start: "top 90%", once: true }
        }
      );
    });

    // gentle parallax for plain images
    gsap.utils.toArray("[data-parallax]").forEach((img) => {
      gsap.fromTo(
        img,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: img.closest(".media-frame") || img, scrub: 1 }
        }
      );
    });

    // top progress bar
    const bar = document.querySelector(".progress-bar");
    if (bar) {
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
        }
      );
    }
  }

  function runIntro(extraDelay = 0) {
    html.classList.remove("is-loading");
    const tl = gsap.timeline({ delay: extraDelay, defaults: { ease: "power4.out" } });

    tl.fromTo(".site-header", { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.05);

    const heroTitles = document.querySelectorAll("[data-split-intro]");
    heroTitles.forEach((el, i) => {
      const chars = el.querySelectorAll(".split-char");
      tl.to(chars, { yPercent: 0, duration: 1.15, stagger: 0.028, ease: "power4.out" }, 0.12 + i * 0.1);
    });

    const fades = document.querySelectorAll("[data-intro-fade]");
    if (fades.length) tl.to(fades, { y: 0, opacity: 1, duration: 0.95, stagger: 0.08 }, 0.45);

    const rules = document.querySelectorAll("[data-intro-rule]");
    if (rules.length) tl.to(rules, { scaleX: 1, duration: 1.2, ease: "power3.inOut" }, 0.4);

    tl.add(() => window.ScrollTrigger && ScrollTrigger.refresh(), 0.6);
  }

  function boot() {
    if (!ANIM) {
      showEverything();
      return;
    }

    // pre-hide intro elements
    document.querySelectorAll("[data-split-intro]").forEach((el) => {
      const chars = splitChars(el);
      gsap.set(chars, { yPercent: 120 });
    });
    if (document.querySelector("[data-intro-fade]")) gsap.set("[data-intro-fade]", { y: 26, opacity: 0 });
    if (document.querySelector("[data-intro-rule]")) gsap.set("[data-intro-rule]", { scaleX: 0, transformOrigin: "left center" });

    initScrollAnimations();

    const veiled = html.classList.contains("is-veiled");
    const preloader = document.getElementById("preloader");
    let seen = false;
    try {
      seen = !!sessionStorage.getItem("ii-seen");
      sessionStorage.setItem("ii-seen", "1");
    } catch (err) {}

    if (preloader && !seen && !veiled) {
      const counter = preloader.querySelector("[data-preloader-count]");
      const state = { n: 0 };
      const tl = gsap.timeline();
      tl.fromTo(".preloader-inner > *", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" });
      tl.to(state, {
        n: 100,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
          if (counter) counter.textContent = pad2(Math.round(state.n));
        }
      }, 0.1);
      tl.to(preloader, {
        yPercent: -100,
        duration: 0.85,
        ease: "power4.inOut",
        onComplete: () => preloader.remove()
      }, "+=0.15");
      tl.add(() => runIntro(), "-=0.55");
    } else {
      if (preloader) preloader.remove();
      let wait = 0;
      if (veiled) wait = veilOut() * 0.45;
      runIntro(wait);
    }
  }

  /* ── galleries ────────────────────────────────────────────────────────── */

  function initGalleries() {
    document.querySelectorAll("[data-gallery]").forEach((gallery) => {
      const track = gallery.querySelector("[data-gallery-track]");
      const slides = gallery.querySelectorAll(".gallery-slide");
      const count = gallery.querySelector("[data-gallery-count]");
      const prev = gallery.querySelector("[data-gallery-prev]");
      const next = gallery.querySelector("[data-gallery-next]");
      if (!track || slides.length === 0) return;

      let index = 0;
      let timer = null;

      function go(to) {
        index = (to + slides.length) % slides.length;
        if (ANIM) gsap.to(track, { xPercent: -100 * index, duration: 0.8, ease: "power3.inOut", overwrite: true });
        else track.style.transform = `translateX(-${index * 100}%)`;
        if (count) count.textContent = `${pad2(index + 1)} / ${pad2(slides.length)}`;
      }

      function play() {
        stop();
        if (slides.length <= 1 || reducedMotion) return;
        timer = setInterval(() => go(index + 1), 5200);
      }
      function stop() {
        if (timer) clearInterval(timer);
        timer = null;
      }

      prev?.addEventListener("click", () => { go(index - 1); play(); });
      next?.addEventListener("click", () => { go(index + 1); play(); });

      // swipe / drag
      let startX = null;
      const frame = gallery.querySelector(".gallery");
      frame?.addEventListener("pointerdown", (e) => { startX = e.clientX; stop(); });
      window.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        play();
      });

      gallery.addEventListener("mouseenter", stop);
      gallery.addEventListener("mouseleave", play);
      gallery.addEventListener("focusin", stop);
      gallery.addEventListener("focusout", play);

      go(0);
      play();
    });
  }

  /* ── custom cursor ────────────────────────────────────────────────────── */

  function initCursor() {
    const cursor = document.querySelector(".cursor");
    if (!cursor || !finePointer || !ANIM) {
      cursor?.remove();
      return;
    }
    const dot = cursor.querySelector(".cursor-dot");
    const ring = cursor.querySelector(".cursor-ring");
    const label = cursor.querySelector(".cursor-label");
    const tR = cursor.querySelector(".cursor-trail--r");
    const tC = cursor.querySelector(".cursor-trail--c");

    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    // RGB trail dots lag further behind — the faster you move, the more the
    // red/cyan ghosts separate and brighten (chromatic delay scales with speed).
    const rX = gsap.quickTo(tR, "x", { duration: 0.26, ease: "power2" });
    const rY = gsap.quickTo(tR, "y", { duration: 0.26, ease: "power2" });
    const cX = gsap.quickTo(tC, "x", { duration: 0.42, ease: "power2" });
    const cY = gsap.quickTo(tC, "y", { duration: 0.42, ease: "power2" });

    let shown = false;
    let lastX = 0, lastY = 0, lastT = performance.now();
    let speed = 0;

    window.addEventListener("pointermove", (e) => {
      if (!shown) {
        html.classList.add("cursor-active");
        shown = true;
        lastX = e.clientX; lastY = e.clientY;
      }
      const now = performance.now();
      const dt = Math.max(now - lastT, 1);
      const v = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt; // px per ms
      speed += (Math.min(v / 2.2, 1) - speed) * 0.35;
      lastX = e.clientX; lastY = e.clientY; lastT = now;

      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
      rX(e.clientX); rY(e.clientY);
      cX(e.clientX); cY(e.clientY);
    }, { passive: true });

    // drive trail opacity from (decaying) speed every frame
    gsap.ticker.add(() => {
      speed *= 0.9;
      const hidden = !shown || html.classList.contains("cursor-hidden");
      const amt = hidden ? 0 : Math.min(speed * 1.4, 1);
      tR.style.opacity = amt * 0.85;
      tC.style.opacity = amt * 0.85;
    });

    document.addEventListener("pointerover", (e) => {
      if (e.target.closest("iframe")) {
        html.classList.add("cursor-hidden");
        return;
      }
      html.classList.remove("cursor-hidden");
      const target = e.target.closest("a, button, [data-cursor-label]");
      if (target) {
        html.classList.add("cursor-link");
        const text = target.closest("[data-cursor-label]")?.dataset.cursorLabel || "";
        if (label) label.textContent = text;
        cursor.classList.toggle("has-label", !!text);
      } else {
        html.classList.remove("cursor-link");
        cursor.classList.remove("has-label");
      }
    });

    document.addEventListener("pointerleave", () => html.classList.remove("cursor-active"));
    document.addEventListener("pointerenter", () => shown && html.classList.add("cursor-active"));
  }

  /* ── magnetic elements + release tilt ─────────────────────────────────── */

  function initMagnetic() {
    if (!finePointer || !ANIM) return;
    document.querySelectorAll(".magnetic").forEach((el) => {
      let rect = null;
      el.addEventListener("pointerenter", () => { rect = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", (e) => {
        if (!rect) return;
        gsap.to(el, {
          x: (e.clientX - (rect.left + rect.width / 2)) * 0.32,
          y: (e.clientY - (rect.top + rect.height / 2)) * 0.32,
          duration: 0.45,
          ease: "power3.out"
        });
      });
      el.addEventListener("pointerleave", () => {
        rect = null;
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.35)" });
      });
    });
  }

  function initTilt() {
    if (!finePointer || !ANIM) return;
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, {
          rotationY: px * 9,
          rotationX: -py * 9,
          transformPerspective: 700,
          duration: 0.5,
          ease: "power2.out"
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ── footer: local time, year, back-to-top ────────────────────────────── */

  function initFooter() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const timeEl = document.getElementById("local-time");
    if (timeEl) {
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Madrid",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      const tick = () => { timeEl.textContent = fmt.format(new Date()); };
      tick();
      setInterval(tick, 1000);
    }

    document.getElementById("to-top")?.addEventListener("click", scrollToTop);
  }

  /* ── hero background: pause when off-screen ────────────────────────────── */

  function initHeroBg() {
    const bg = document.querySelector(".hero-bg");
    const hero = document.querySelector(".hero");
    if (!bg || !hero) return;
    // The embedded sketch is GPU/CPU-heavy and runs every frame. Hiding its
    // container (display:none) makes the browser pause the iframe's render
    // loop, so it stops taxing the main thread once you scroll past the hero.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          bg.style.display = e.isIntersecting ? "" : "none";
        });
      },
      { threshold: 0 }
    );
    io.observe(hero);
  }

  /* ── go ───────────────────────────────────────────────────────────────── */

  initGalleries();
  initCursor();
  initMagnetic();
  initTilt();
  initFooter();
  initHeroBg();
  boot();
})();
