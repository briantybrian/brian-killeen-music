// Brian Killeen Music — shared site behaviour (no external libraries)

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll-reveal via IntersectionObserver */
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Hero title staggered letter/word rise */
  document.querySelectorAll("[data-stagger-text]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((word, i) => `<span style="animation-delay:${0.08 * i}s">${word}</span>`)
      .join(" ");
  });

  /* Nav overlay toggle */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* Dial reflects the current page as a channel: tick rotates to this
     page's position among the nav links, number confirms it. Single
     source of truth is aria-current="page", already set per-page. */
  const dialTick = document.querySelector(".nav-toggle .dial-tick");
  const dialChannel = document.querySelector(".nav-toggle .dial-channel");
  const pageLinks = document.querySelectorAll(".main-nav a:not(.btn)");
  if (dialTick && pageLinks.length) {
    const angles = [-54, -27, 0, 27, 54];
    const current = Array.from(pageLinks).findIndex((a) => a.getAttribute("aria-current") === "page");
    const channel = current >= 0 ? current : 0;
    dialTick.style.transform = `rotate(${angles[channel] ?? 0}deg)`;
    if (dialChannel) dialChannel.textContent = String(channel + 1).padStart(2, "0");
  }

  /* Home intro: name recedes (scale down + rise) as the page scrolls, then
     freezes in place as its own small permanent title — no separate
     wordmark to hand off to. Only the menu icon fades in, and only over
     the tail end of the scroll, so there's no long half-visible/dead zone. */
  const introSpacer = document.querySelector(".intro-spacer");
  const introName = document.querySelector(".intro-name");
  const introHeader = document.querySelector(".site-header");
  const introWordmark = document.querySelector(".site-header .wordmark");
  const nameFigure = document.querySelector(".name-figure");
  const kMeasure = document.querySelector(".k-measure");

  if (introSpacer && introName && !reduceMotion) {
    const MIN_FONT_PX = 24; // settled size — matches the old static wordmark
    const SETTLED_CENTER_Y = 42; // px from top the settled name's center lands on (header's vertical middle)
    const FIG_ASPECT = 950.05 / 1426.29; // native width/height of the source SVG's cropped viewBox
    const FIG_GAP_START = 30; // px gap on load, name+figure centred as a big group
    const FIG_GAP_END = 8; // px gap once settled beside the small header wordmark — tighter, reads as one lockup
    const FIG_SCALE_START = 1; // figure height as a multiple of the live K cap-height, on load
    const FIG_SCALE_END = 1.3; // ...and once settled, where a bare K-height match reads too small
    // Settle finishes a touch before the spacer's scroll distance is used up,
    // so it lands just ahead of the hero content arriving rather than
    // stopping early and leaving a dead stretch of scrolling before it shows.
    const SETTLE_FRACTION = 0.85;
    let ticking = false;
    let baseFontPx = parseFloat(getComputedStyle(introName).fontSize);

    // Re-measure the natural (CSS clamp) font size — used on load and resize,
    // since interpolating font-size directly (not transform: scale, which
    // blurs text) means we need the true un-shrunk size to start from.
    const measureBaseFont = () => {
      const prevInline = introName.style.fontSize;
      introName.style.fontSize = "";
      baseFontPx = parseFloat(getComputedStyle(introName).fontSize);
      introName.style.fontSize = prevInline;
    };

    const applyIntroProgress = () => {
      const scrollRange = introSpacer.offsetHeight * SETTLE_FRACTION;
      const progress = scrollRange > 0
        ? Math.min(1, Math.max(0, window.scrollY / scrollRange))
        : 1;
      introName.style.fontSize = `${baseFontPx - progress * (baseFontPx - MIN_FONT_PX)}px`;

      // Position via top/left (not transform) so text stays pixel-crisp —
      // re-measure after the font-size change since it affects box size.
      const rect = introName.getBoundingClientRect();
      const startCenterY = window.innerHeight / 2;
      const centerY = startCenterY + progress * (SETTLED_CENTER_Y - startCenterY);

      // Figure size: live-measured against a hidden "K" at the name's
      // current font-size, so it tracks the cap-height exactly as the name
      // shrinks — never a fixed size, always relative to the text.
      let figWidth = 0;
      let figHeight = 0;
      if (nameFigure && kMeasure) {
        kMeasure.style.fontSize = introName.style.fontSize;
        const kHeight = kMeasure.getBoundingClientRect().height;
        const figScale = FIG_SCALE_START + progress * (FIG_SCALE_END - FIG_SCALE_START);
        figHeight = kHeight * figScale;
        figWidth = figHeight * FIG_ASPECT;
      }
      const figGap = FIG_GAP_START + progress * (FIG_GAP_END - FIG_GAP_START);

      // Horizontal: starts with the whole name+figure group centred as one
      // unit, ends with the name exactly where the (hidden) header wordmark
      // sits — so it settles into the same left-aligned spot the title
      // occupies on every other page, with the figure following right after
      // it the entire way, never just the bare text alone.
      const groupWidth = rect.width + (nameFigure ? figGap + figWidth : 0);
      const startLeft = window.innerWidth / 2 - groupWidth / 2;
      const settledLeft = introWordmark ? introWordmark.getBoundingClientRect().left : startLeft;
      const nameLeft = Math.round(startLeft + progress * (settledLeft - startLeft));
      introName.style.left = `${nameLeft}px`;
      introName.style.top = `${Math.round(centerY - rect.height / 2)}px`;

      if (nameFigure) {
        nameFigure.style.width = `${Math.round(figWidth)}px`;
        nameFigure.style.height = `${Math.round(figHeight)}px`;
        nameFigure.style.left = `${Math.round(nameLeft + rect.width + figGap)}px`;
        nameFigure.style.top = `${Math.round(centerY - figHeight / 2)}px`;
      }

      if (introHeader) {
        const headerT = Math.min(1, Math.max(0, (progress - 0.6) / 0.4));
        introHeader.style.opacity = String(headerT);
        introHeader.style.visibility = headerT > 0.02 ? "visible" : "hidden";
        introHeader.style.pointerEvents = headerT > 0.15 ? "auto" : "none";
      }
      ticking = false;
    };

    applyIntroProgress();
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(applyIntroProgress);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener("resize", () => {
      measureBaseFont();
      applyIntroProgress();
    });
  }
});
