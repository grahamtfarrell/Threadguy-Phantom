// Threadguy × Phantom — soft gate + centered hero lockup

const UNLOCK_KEY = "phantom-brand-unlocked-v2";
// SHA-256 of the site password (soft lock only — not real security)
const PASS_HASH =
  "601f8253bfebfef2e1032a88027e3008ea55a5a896db3d3f6da67de14c471c74";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function unlockSite() {
  const input = document.getElementById("gate-password");
  if (input) input.blur();

  document.documentElement.classList.remove("is-locked");
  const gate = document.getElementById("gate");
  if (gate) gate.setAttribute("aria-hidden", "true");

  // iOS Safari often leaves a scroll offset after the keyboard closes from
  // the password field — that clips the logo and peeks the slides underneath.
  const resetScroll = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };
  resetScroll();
  requestAnimationFrame(() => {
    resetScroll();
    requestAnimationFrame(resetScroll);
  });
  setTimeout(resetScroll, 50);
  setTimeout(resetScroll, 300);
}

async function initGate() {
  if (!document.documentElement.classList.contains("is-locked")) {
    return;
  }

  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-password");
  const error = document.getElementById("gate-error");
  if (!form || !input) {
    unlockSite();
    return;
  }

  requestAnimationFrame(() => input.focus());

  await new Promise((resolve) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      error.hidden = true;
      form.classList.remove("is-wrong");

      const hash = await sha256Hex(input.value.trim());
      if (hash !== PASS_HASH) {
        error.hidden = false;
        form.classList.add("is-wrong");
        input.select();
        return;
      }

      try {
        localStorage.setItem(UNLOCK_KEY, "1");
      } catch (_) {
        /* private mode — still unlock this session */
      }
      unlockSite();
      resolve();
    });
  });
}

function initHeroLogo() {
  const wrap = document.getElementById("hero-logo");
  if (!wrap) {
    document.body.classList.remove("is-booting");
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    wrap.classList.add("is-in");
    document.body.classList.remove("is-booting");
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => wrap.classList.add("is-in"));
  });
  window.setTimeout(() => document.body.classList.remove("is-booting"), 480);
}

function initContents() {
  const toggle = document.getElementById("contents-toggle");
  const panel = document.getElementById("contents-panel");
  const backdrop = document.getElementById("contents-backdrop");
  const nav = document.getElementById("contents-nav");
  const slides = Array.from(document.querySelectorAll(".slide[id]"));

  if (!toggle || !panel || !backdrop || !nav || slides.length === 0) return;

  const frag = document.createDocumentFragment();
  slides.forEach((slide, index) => {
    const titleEl = slide.querySelector(".slide__title");
    const title = titleEl ? titleEl.textContent.trim() : `Slide ${index + 1}`;
    const num = String(index + 1).padStart(2, "0");

    const link = document.createElement("a");
    link.className = "contents-link";
    link.href = `#${slide.id}`;
    link.innerHTML =
      `<span class="contents-link__num">${num}</span>` +
      `<span class="contents-link__label">${title}</span>`;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      closeContents();
      requestAnimationFrame(() => {
        slide.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    frag.appendChild(link);
  });
  nav.appendChild(frag);

  function openContents() {
    backdrop.hidden = false;
    void backdrop.offsetWidth;
    document.body.classList.add("contents-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close contents");
    panel.setAttribute("aria-hidden", "false");
  }

  function closeContents() {
    document.body.classList.remove("contents-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open contents");
    panel.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      if (!document.body.classList.contains("contents-open")) {
        backdrop.hidden = true;
      }
    }, 450);
  }

  function toggleContents() {
    if (document.body.classList.contains("contents-open")) closeContents();
    else openContents();
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleContents();
  });

  backdrop.addEventListener("click", closeContents);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("contents-open")) {
      closeContents();
    }
  });
}

function initSlideReveal() {
  const slides = Array.from(document.querySelectorAll(".slide"));
  if (slides.length === 0) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    slides.forEach((slide) => slide.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    }
  );

  slides.forEach((slide) => observer.observe(slide));
}

(async function boot() {
  await initGate();
  initContents();
  initSlideReveal();
  initHeroLogo();
})();
