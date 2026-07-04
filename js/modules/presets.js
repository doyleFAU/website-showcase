import { createAurora } from "./aurora.js";
import { createGalaxy } from "./galaxy.js";
import { createGrainient } from "./grainient.js";
import { createDarkVeil } from "./dark-veil.js";

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

  const initial = panels.find((panel) => panel.classList.contains("is-active"));
  mountEffect(initial);

  activateRef = activate;
}

let activateRef = null;

export function activatePreset(id) {
  activateRef?.(id);
}
