import { createAurora } from "./aurora.js";
import { createGalaxy } from "./galaxy.js";
import { createGrainient } from "./grainient.js";
import { createDarkVeil } from "./dark-veil.js";
import { createLightRays } from "./light-rays.js";
import { createPlasma } from "./plasma.js";
import { createIridescence } from "./iridescence.js";
import { createThreads } from "./threads.js";
import { createWaves } from "./waves.js";
import { createParticles } from "./particles.js";
import { createPrism } from "./prism.js";
import { createDotGrid } from "./dot-grid.js";
import { createGridMotion } from "./grid-motion.js";
import { createLiquidChrome } from "./liquid-chrome.js";
import { createFaultyTerminal } from "./faulty-terminal.js";

const PRESET_IDS = new Set([
  "tech",
  "local",
  "creative",
  "luxury",
  "wellness",
  "professional",
  "fitness",
  "restaurant",
  "travel",
  "education",
  "photography",
  "music",
  "ecommerce",
  "construction",
  "medical",
  "nonprofit",
]);

const PRESET_EFFECTS = {
  tech: (host) =>
    createAurora(host, {
      colorStops: ["#5227FF", "#7cff67", "#5227FF"],
      amplitude: 1.0,
      blend: 0.5,
      speed: 1.0,
    }),
  luxury: (host) =>
    createGalaxy(host, {
      hueShift: 42,
      glowIntensity: 0.55,
      saturation: 0.35,
      density: 1.15,
      twinkleIntensity: 0.4,
      rotationSpeed: 0.06,
    }),
  wellness: (host) =>
    createGrainient(host, {
      color1: "#a7f3d0",
      color2: "#c4b5fd",
      color3: "#fda4af",
      timeSpeed: 0.22,
      saturation: 1.05,
      grainAmount: 0.08,
      zoom: 0.95,
    }),
  professional: (host) =>
    createDarkVeil(host, {
      hueShift: 215,
      noiseIntensity: 0.03,
      speed: 0.35,
      warpAmount: 0.15,
    }),
  creative: (host) =>
    createLightRays(host, {
      raysOrigin: "top-center",
      raysColor: "#f472b6",
      raysSpeed: 1,
      lightSpread: 0.9,
      rayLength: 1.8,
      pulsating: true,
      saturation: 1.1,
    }),
  fitness: (host) =>
    createPlasma(host, {
      color: "#f97316",
      speed: 1.15,
      scale: 1.05,
      opacity: 0.92,
    }),
  restaurant: (host) =>
    createIridescence(host, {
      color: [0.78, 0.48, 0.16],
      speed: 0.9,
      amplitude: 0.1,
    }),
  travel: (host) =>
    createThreads(host, {
      color: [0.34, 0.82, 0.95],
      amplitude: 1.2,
      distance: 0.35,
      enableMouseInteraction: false,
    }),
  education: (host) =>
    createWaves(host, {
      lineColor: "rgba(99, 102, 241, 0.45)",
      backgroundColor: "transparent",
      waveSpeedX: 0.014,
      waveSpeedY: 0.006,
      waveAmpX: 28,
      waveAmpY: 14,
    }),
  photography: (host) =>
    createParticles(host, {
      particleCount: 180,
      particleSpread: 9,
      speed: 0.08,
      particleColors: ["#fbbf24", "#f8fafc", "#e2e8f0"],
      alphaParticles: true,
      particleBaseSize: 90,
      sizeRandomness: 0.8,
      disableRotation: false,
    }),
  music: (host) =>
    createPrism(host, {
      height: 3.2,
      baseWidth: 5,
      animationType: "rotate",
      glow: 0.58,
      bloom: 0.45,
      hueShift: 0.45,
      noise: 0.18,
      scale: 4.4,
      timeScale: 0.34,
      transparent: true,
      suspendWhenOffscreen: true,
    }),
  ecommerce: (host) =>
    createDotGrid(host, {
      dotSize: 5,
      gap: 22,
      baseColor: "#312e81",
      activeColor: "#a855f7",
      proximity: 110,
    }),
  construction: (host) =>
    createGridMotion(host, {
      gradientColor: "rgba(249, 115, 22, 0.35)",
      tileColors: ["#292524", "#44403c", "#ea580c", "#1c1917", "#78716c", "#f97316", "#57534e"],
    }),
  medical: (host) =>
    createLiquidChrome(host, {
      baseColor: [0.05, 0.45, 0.55],
      speed: 0.18,
      amplitude: 0.22,
      frequencyX: 2.5,
      frequencyY: 2.5,
      interactive: false,
    }),
  nonprofit: (host) =>
    createFaultyTerminal(host, {
      scale: 1.15,
      tint: "#86efac",
      brightness: 1.15,
      noiseAmp: 1,
      glitchAmount: 0.5,
      flickerAmount: 0.85,
      scanlineIntensity: 0.35,
      curvature: 0.08,
      mouseReact: false,
      pageLoadAnimation: false,
    }),
};

let activeEffect = null;

function destroyEffect() {
  activeEffect?.destroy();
  activeEffect = null;
}

function mountEffect(panel) {
  destroyEffect();
  if (!panel?.classList.contains("is-active")) return;

  const factory = PRESET_EFFECTS[panel.dataset.presetPanel];
  if (!factory) return;

  const host = panel.querySelector("[data-effect-host]");
  if (!host) return;

  host.innerHTML = "";
  activeEffect = factory(host);
}

export function initPresets() {
  const tabs = [...document.querySelectorAll("[data-preset-tab]")];
  const panels = [...document.querySelectorAll("[data-preset-panel]")];
  if (!tabs.length || !panels.length) return;

  const activate = (id) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.presetTab === id;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    panels.forEach((panel) => {
      const active = panel.dataset.presetPanel === id;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });

    const activePanel = panels.find((panel) => panel.dataset.presetPanel === id);
    mountEffect(activePanel);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab.dataset.presetTab));
  });

  activateRef = activate;

  const fromUrl = new URLSearchParams(window.location.search).get("preset");
  const defaultId =
    panels.find((panel) => panel.classList.contains("is-active"))?.dataset.presetPanel ||
    tabs[0]?.dataset.presetTab;
  const initialId = PRESET_IDS.has(fromUrl) ? fromUrl : defaultId;

  activate(initialId);

  if (PRESET_IDS.has(fromUrl)) {
    history.replaceState(null, "", window.location.pathname);
  }
}

let activateRef = null;

export function activatePreset(id) {
  activateRef?.(id);
}
