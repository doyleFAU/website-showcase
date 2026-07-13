/**
 * Shiny text — adapted from @react-bits/ShinyText-JS-CSS
 * https://reactbits.dev/text-animations/shiny-text
 */

import { animationsEnabled } from "./effect-host.js";

export function refreshShinyTextColors() {
  document.querySelectorAll(".shiny-text").forEach((el) => {
    el.style.removeProperty("--shiny-color");
  });
}

function mountShinyText(el) {
  const text = (el.dataset.shinyText || el.textContent || "").trim();
  if (!text) return null;

  el.textContent = text;
  el.classList.add("shiny-text");

  const speed = Number(el.dataset.shinySpeed || 2.4) * 1000;
  const delay = Number(el.dataset.shinyDelay || 1.1) * 1000;
  const spread = Number(el.dataset.shinySpread || 125);
  const pauseOnHover = el.dataset.shinyPauseHover !== "false";

  el.style.setProperty("--shiny-shine", "#ffffff");
  el.style.setProperty("--shiny-spread", `${spread}deg`);

  let elapsed = 0;
  let lastTime = null;
  let paused = false;
  let raf = null;

  const tick = (time) => {
    if (!animationsEnabled()) {
      el.style.backgroundPosition = "0% center";
      return;
    }

    if (lastTime === null) {
      lastTime = time;
      raf = requestAnimationFrame(tick);
      return;
    }

    if (!paused) {
      elapsed += time - lastTime;
      const cycleDuration = speed + delay;
      const cycleTime = elapsed % cycleDuration;
      const progress = cycleTime < speed ? (cycleTime / speed) * 100 : 100;
      el.style.backgroundPosition = `${150 - progress * 2}% center`;
    }

    lastTime = time;
    raf = requestAnimationFrame(tick);
  };

  const onEnter = () => {
    if (pauseOnHover) paused = true;
  };

  const onLeave = () => {
    if (pauseOnHover) paused = false;
  };

  el.addEventListener("mouseenter", onEnter);
  el.addEventListener("mouseleave", onLeave);

  raf = requestAnimationFrame(tick);

  return () => {
    if (raf) cancelAnimationFrame(raf);
    el.removeEventListener("mouseenter", onEnter);
    el.removeEventListener("mouseleave", onLeave);
  };
}

export function initShinyText() {
  const cleanups = [];

  document.querySelectorAll("[data-shiny-text]").forEach((el) => {
    const cleanup = mountShinyText(el);
    if (cleanup) cleanups.push(cleanup);
  });

  return () => cleanups.forEach((fn) => fn());
}
