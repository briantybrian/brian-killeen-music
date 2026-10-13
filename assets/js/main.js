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

  /* Home: the big name is ordinary page content and scrolls away at
     full size. The header appears, wordmark already at its own size,
     once that name has left the top of the screen. An intersection
     observer follows the name even if the page scrolls on document
     rather than window. */
  const introLockup = document.querySelector(".intro-lockup");
  const introPair = document.querySelector(".intro-pair");
  const introHeader = document.querySelector(".site-header");

  if (introLockup && introHeader && !reduceMotion) {
    const mark = introPair || introLockup;

    const applyHeader = () => {
      introHeader.classList.toggle("is-shown", mark.getBoundingClientRect().bottom <= 0);
    };

    // Fresh landings on / start at the large centred name. Keep hash
    // targets like #contact, where the header should already be showing.
    if (!location.hash) {
      history.scrollRestoration = "manual";
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    applyHeader();
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(applyHeader);
      observer.observe(mark);
    }
    window.addEventListener("scroll", applyHeader, { passive: true });
    document.addEventListener("scroll", applyHeader, { passive: true });
    window.addEventListener("pageshow", applyHeader);
    window.addEventListener("resize", applyHeader);
  } else if (!introLockup) {
    history.scrollRestoration = "auto";
  }
});
