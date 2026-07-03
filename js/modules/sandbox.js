import { sanitizeState } from "./security.js";
import { DEFAULT_STATE } from "../config/state.js";

export function applySandboxState(state) {
  const root = document.documentElement;

  root.dataset.theme = state.theme;
  root.dataset.font = state.font;
  root.dataset.radius = state.radius;
  root.dataset.mode = state.mode;
  root.dataset.shadows = state.shadows ? "on" : "off";
  root.dataset.animations = state.animations ? "on" : "off";
  root.dataset.gradients = state.gradients ? "on" : "off";
}

export function readControls(state) {
  const get = (id) => document.getElementById(id);

  return sanitizeState(
    {
      theme: get("theme-select")?.value ?? state.theme,
      font: get("font-select")?.value ?? state.font,
      radius: get("radius-select")?.value ?? state.radius,
      mode: get("mode-select")?.value ?? state.mode,
      shadows: get("toggle-shadows")?.checked ?? state.shadows,
      animations: get("toggle-animations")?.checked ?? state.animations,
      gradients: get("toggle-gradients")?.checked ?? state.gradients,
    },
    DEFAULT_STATE
  );
}

export function syncControls(state) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof value === "boolean") el.checked = value;
    else el.value = value;
  };

  set("theme-select", state.theme);
  set("font-select", state.font);
  set("radius-select", state.radius);
  set("mode-select", state.mode);
  set("toggle-shadows", state.shadows);
  set("toggle-animations", state.animations);
  set("toggle-gradients", state.gradients);
}

export function loadState(defaultState, storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    return saved ? sanitizeState({ ...defaultState, ...saved }, defaultState) : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

export function saveState(state, storageKey) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function initSandbox(defaultState, storageKey, onChange) {
  let state = loadState(defaultState, storageKey);
  syncControls(state);
  applySandboxState(state);
  onChange?.(state);

  const update = () => {
    state = readControls(state);
    applySandboxState(state);
    saveState(state, storageKey);
    onChange?.(state);
  };

  [
    "theme-select",
    "font-select",
    "radius-select",
    "mode-select",
    "toggle-shadows",
    "toggle-animations",
    "toggle-gradients",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", update);
  });

  document.getElementById("reset-sandbox")?.addEventListener("click", () => {
    state = { ...defaultState };
    syncControls(state);
    applySandboxState(state);
    saveState(state, storageKey);
    onChange?.(state);
  });

  return () => state;
}
