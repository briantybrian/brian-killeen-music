// Brian Killeen Music — shared site behaviour (no external libraries)

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    /* The text menu replaces the knob on wide screens, so an open
       overlay should not stay locked if the window crosses that line. */
    const desktopNav = window.matchMedia("(min-width: 801px)");
    desktopNav.addEventListener("change", () => {
      if (desktopNav.matches) setOpen(false);
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
  const introLockup = document.querySelector(".intro-lockup");
  const introPair = document.querySelector(".intro-pair");
  const introName = document.querySelector(".intro-name");
  const introHeader = document.querySelector(".site-header");
  const introWordmark = document.querySelector(".site-header .wordmark");
  const nameFigure = document.querySelector(".name-figure");
  const kMeasure = document.querySelector(".k-measure");

  if (introSpacer && introLockup && introPair && introName && !reduceMotion) {
    const MIN_FONT_PX = 24; // settled size — matches the old static wordmark
    const SETTLED_CENTER_Y = 42; // px from top the settled name's center lands on (header's vertical middle)
    const FIG_ASPECT = 950.05 / 1426.29; // native width/height of the source SVG's cropped viewBox
    const FIG_GAP_END = 8; // px gap once settled beside the small header wordmark — tighter, reads as one lockup
    const FIG_SCALE_START = 1; // figure height as a multiple of the live K cap-height, on load
    const FIG_SCALE_END = 1.3; // ...and once settled, where a bare K-height match reads too small
    // Settle finishes a touch before the spacer's scroll distance is used up,
    // so it lands just ahead of the hero content arriving rather than
    // stopping early and leaving a dead stretch of scrolling before it shows.
    const SETTLE_FRACTION = 0.85;
    let ticking = false;
    let baseFontPx = parseFloat(getComputedStyle(introLockup).fontSize);
    let gapStart = parseFloat(getComputedStyle(introPair).columnGap) || 30;

    // Re-measure the natural (CSS clamp) font size — used on load and resize,
    // since interpolating font-size directly (not transform: scale, which
    // blurs text) means we need the true un-shrunk size to start from.
    const measureBaseFont = () => {
      const prevInline = introPair.style.fontSize;
      introPair.style.fontSize = "";
      introPair.style.gap = "";
      baseFontPx = parseFloat(getComputedStyle(introLockup).fontSize);
      gapStart = parseFloat(getComputedStyle(introPair).columnGap) || 30;
      introPair.style.fontSize = prevInline;
    };

    const clearDrivenStyles = () => {
      introLockup.classList.remove("is-driven");
      introPair.style.fontSize = "";
      introPair.style.gap = "";
      introPair.style.left = "";
      introPair.style.top = "";
      if (nameFigure) {
        nameFigure.style.width = "";
        nameFigure.style.height = "";
      }
    };

    const applyIntroProgress = () => {
      const scrollRange = introSpacer.offsetHeight * SETTLE_FRACTION;
      // If the spacer hasn't laid out yet, stay at the CSS start state —
      // treating a 0-height spacer as "finished" was shrinking the title
      // on the first frame.
      const progress = scrollRange > 0
        ? Math.min(1, Math.max(0, window.scrollY / scrollRange))
        : 0;

      if (progress === 0) {
        clearDrivenStyles();
        if (introHeader) {
          introHeader.style.opacity = "0";
          introHeader.style.visibility = "hidden";
          introHeader.style.pointerEvents = "none";
        }
        ticking = false;
        return;
      }

      const fontPx = baseFontPx - progress * (baseFontPx - MIN_FONT_PX);
      const figGap = gapStart + progress * (FIG_GAP_END - gapStart);
      introPair.style.fontSize = `${fontPx}px`;
      introPair.style.gap = `${figGap}px`;

      // Figure size: live-measured against a hidden "K" at the name's
      // current font-size, so it tracks the cap-height exactly as the name
      // shrinks — never a fixed size, always relative to the text.
      if (nameFigure && kMeasure) {
        kMeasure.style.fontSize = `${fontPx}px`;
        const kHeight = kMeasure.getBoundingClientRect().height;
        const figScale = FIG_SCALE_START + progress * (FIG_SCALE_END - FIG_SCALE_START);
        nameFigure.style.height = `${Math.round(kHeight * figScale)}px`;
        nameFigure.style.width = `${Math.round(kHeight * figScale * FIG_ASPECT)}px`;
      }

      const pairRect = introPair.getBoundingClientRect();
      const nameRect = introName.getBoundingClientRect();
      const viewH = document.documentElement.clientHeight || window.innerHeight;
      const viewW = document.documentElement.clientWidth || window.innerWidth;
      const startCenterY = viewH / 2;
      const centerY = startCenterY + progress * (SETTLED_CENTER_Y - startCenterY);
      const startLeft = viewW / 2 - pairRect.width / 2;
      const nameInset = nameRect.left - pairRect.left;
      const settledLeft = introWordmark
        ? introWordmark.getBoundingClientRect().left - nameInset
        : startLeft;

      introLockup.classList.add("is-driven");
      introPair.style.left = `${Math.round(startLeft + progress * (settledLeft - startLeft))}px`;
      introPair.style.top = `${Math.round(centerY - pairRect.height / 2)}px`;

      if (introHeader) {
        const headerT = Math.min(1, Math.max(0, (progress - 0.6) / 0.4));
        introHeader.style.opacity = String(headerT);
        introHeader.style.visibility = headerT > 0.02 ? "visible" : "hidden";
        introHeader.style.pointerEvents = headerT > 0.15 ? "auto" : "none";
      }
      ticking = false;
    };

    const syncIntro = () => {
      measureBaseFont();
      applyIntroProgress();
    };

    // Fresh landings on / should start at the large centred name, not at a
    // restored mid-scroll (which made the title look already shrunk). Keep
    // hash targets like #contact.
    if (!location.hash) {
      history.scrollRestoration = "manual";
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    syncIntro();
    requestAnimationFrame(syncIntro);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncIntro);
    }
    window.addEventListener("pageshow", syncIntro);
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(applyIntroProgress);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener("resize", syncIntro);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncIntro);
    }
  } else if (!introSpacer) {
    history.scrollRestoration = "auto";
  }
});
