import { THEME_OPTIONS, FONT_OPTIONS, FEATURE_ITEMS } from "../config/features.js";

const VALID_THEMES = new Set(THEME_OPTIONS.map((theme) => theme.id));
const VALID_FONTS = new Set(FONT_OPTIONS.map((font) => font.id));
const VALID_FEATURES = new Set(FEATURE_ITEMS.map((item) => item.id));
const VALID_RADIUS = new Set(["soft"]);
const VALID_MODE = new Set(["light", "dark"]);
const PARTIAL_PATH = /^partials\/[a-z0-9-]+\.html$/;

export function isAllowedPartial(url) {
  if (!url || url.includes("..") || url.includes("\\")) return false;
  return PARTIAL_PATH.test(url);
}

export function isSafeHashSelector(selector) {
  return typeof selector === "string" && /^#[a-z][a-z0-9_-]*$/i.test(selector);
}

export function sanitizeState(state, defaultState) {
  const bool = (value, fallback) => (typeof value === "boolean" ? value : fallback);

  return {
    theme: VALID_THEMES.has(state?.theme) ? state.theme : defaultState.theme,
    font: VALID_FONTS.has(state?.font) ? state.font : defaultState.font,
    radius: VALID_RADIUS.has(state?.radius) ? state.radius : defaultState.radius,
    mode: VALID_MODE.has(state?.mode) ? state.mode : defaultState.mode,
    shadows: bool(state?.shadows, defaultState.shadows),
    animations: bool(state?.animations, defaultState.animations),
    gradients: bool(state?.gradients, defaultState.gradients),
  };
}

export function sanitizeFeatureIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => VALID_FEATURES.has(id));
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
