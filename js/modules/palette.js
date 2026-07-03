const PALETTE_KEYS = [
  { key: "--color-primary", label: "Main color" },
  { key: "--color-bg", label: "Background" },
  { key: "--color-surface", label: "Boxes and cards" },
  { key: "--color-text", label: "Text" },
  { key: "--color-success", label: "Success green" },
  { key: "--color-danger", label: "Alert red" },
];

function readCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function renderPalette() {
  const container = document.getElementById("palette-display");
  if (!container) return;

  container.innerHTML = PALETTE_KEYS.map(({ key, label }) => {
    const value = readCssVar(key);
    return `
      <article class="palette-chip">
        <div class="palette-chip-color" style="background: ${value}"></div>
        <div class="palette-chip-meta">
          <strong>${label}</strong>
        </div>
      </article>
    `;
  }).join("");
}

export function initPalette() {
  renderPalette();

  const observer = new MutationObserver(() => renderPalette());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-mode"],
  });
}
