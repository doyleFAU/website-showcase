import { INDUSTRY_PICKS } from "../config/features.js";
import { activatePreset } from "./presets.js";
import { setFeatureSelections, showToast } from "./checklist.js";

export function initIndustry(onChange) {
  const grid = document.getElementById("industry-grid");
  if (!grid) return;

  grid.innerHTML = INDUSTRY_PICKS.map(
    (pick) => `
      <button type="button" class="card industry-card glare-hover" data-industry="${pick.id}" data-glare>
        <h3>${pick.label}</h3>
        <p>${pick.hint}</p>
        <span class="card-action">Try this setup</span>
      </button>
    `
  ).join("");

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-industry]");
    if (!button) return;

    const pick = INDUSTRY_PICKS.find((item) => item.id === button.dataset.industry);
    if (!pick) return;

    activatePreset(pick.preset);
    setFeatureSelections(pick.features);
    onChange?.();

    const presets = document.getElementById("presets");
    if (presets) {
      presets.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast(`Loaded ideas for ${pick.label}. Tweak anything you like!`);
      return;
    }

    sessionStorage.setItem(
      "showcase-toast",
      `Loaded ideas for ${pick.label}. Tweak anything you like!`
    );
    window.location.href = `presets.html?preset=${encodeURIComponent(pick.preset)}`;
  });
}
