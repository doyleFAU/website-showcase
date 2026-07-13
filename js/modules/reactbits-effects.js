import { initShinyText } from "./shiny-text.js";
import { createLightRays } from "./light-rays.js";
import { animationsEnabled } from "./effect-host.js";

let raysDemo = null;

function hexToRgba(hex, opacity = 0.4) {
  const value = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) return `rgba(255,255,255,${opacity})`;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function initGlareHover() {
  document.querySelectorAll("[data-glare]").forEach((el) => {
    el.classList.add("glare-hover");
    if (el.classList.contains("logo")) return;

    const primary = getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim();
    el.style.setProperty("--gh-angle", el.dataset.glareAngle || "-45deg");
    el.style.setProperty("--gh-duration", `${el.dataset.glareDuration || 650}ms`);
    el.style.setProperty("--gh-size", `${el.dataset.glareSize || 250}%`);
    el.style.setProperty("--gh-rgba", hexToRgba(primary, 0.35));
  });
}

export function initElectricFrames() {
  document.querySelectorAll("[data-electric-frame]").forEach((el) => {
    el.classList.add("electric-frame");
  });
}

export function initCountUp() {
  document.querySelectorAll("[data-countup]").forEach((el) => {
    const target = Number(el.dataset.countup);
    const suffix = el.dataset.countupSuffix || "";
    const decimals = Number(el.dataset.countupDecimals || 0);
    if (Number.isNaN(target)) return;

    let started = false;

    const run = () => {
      if (started || !animationsEnabled()) {
        el.textContent = `${target.toFixed(decimals)}${suffix}`;
        return;
      }
      started = true;
      const duration = Number(el.dataset.countupDuration || 1800);
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = `${value.toFixed(decimals)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    el.textContent = `${(0).toFixed(decimals)}${suffix}`;
  });
}

export function initLogoLoops() {
  document.querySelectorAll("[data-logoloop]").forEach((root) => {
    const items = (root.dataset.logoloop || "").split("|").map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;

    const listHtml = items.map((item) => `<span class="logoloop__item">${item}</span>`).join("");
    root.classList.add("logoloop");
    root.innerHTML = `
      <div class="logoloop__track">
        <div class="logoloop__list">${listHtml}</div>
        <div class="logoloop__list" aria-hidden="true">${listHtml}</div>
      </div>
    `;
  });
}

export function initLightRaysDemos() {
  const host = document.querySelector("[data-light-rays-demo]");
  if (!host) return;

  raysDemo = createLightRays(host, {
    raysOrigin: "top-center",
    raysColor: "#a78bfa",
    raysSpeed: 1.2,
    lightSpread: 0.85,
    rayLength: 1.6,
    saturation: 1.2,
    pulsating: true,
  });
}

export function initReactBitsEffects() {
  initGlareHover();
  initElectricFrames();
  initCountUp();
  initLogoLoops();
  initLightRaysDemos();
  initShinyText();
}

export function destroyLightRaysDemo() {
  raysDemo?.destroy();
  raysDemo = null;
}
