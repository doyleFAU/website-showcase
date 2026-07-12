const PALETTE_KEYS = [
  { token: "primary", label: "Main color" },
  { token: "bg", label: "Background" },
  { token: "surface", label: "Boxes and cards" },
  { token: "text", label: "Text" },
  { token: "success", label: "Success green" },
  { token: "danger", label: "Alert red" },
];

export function renderPalette() {
  const container = document.getElementById("palette-display");
  if (!container) return;

  container.innerHTML = PALETTE_KEYS.map(({ token, label }) => {
    return `
      <article class="palette-chip">
        <div class="palette-chip-color token-${token}" aria-hidden="true"></div>
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
