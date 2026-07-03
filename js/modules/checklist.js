import { FEATURE_ITEMS, THEME_OPTIONS, FONT_OPTIONS, THEME_LABELS, FONT_LABELS } from "../config/features.js";

const FONT_SAMPLES = {
  modern: { heading: "Clean and trustworthy", body: "Great for local businesses and services." },
  editorial: { heading: "Warm and story-driven", body: "Ideal for writers, artists, and coaches." },
  classic: { heading: "Polished and premium", body: "Works for salons, law, and real estate." },
  startup: { heading: "Confident and energetic", body: "Strong for tech, fitness, and agencies." },
  friendly: { heading: "Soft and welcoming", body: "Perfect for family brands and community groups." },
  professional: { heading: "Serious and reliable", body: "Built for doctors, lawyers, and finance." },
  playful: { heading: "Fun and colorful", body: "Kids brands, cafes, and creative shops." },
  magazine: { heading: "Big bold headlines", body: "News, sports, and event websites." },
  luxury: { heading: "Refined and upscale", body: "Jewelry, hotels, and fine dining." },
  tech: { heading: "Sharp and modern", body: "Apps, SaaS, and developer tools." },
  coffee: { heading: "Cozy and relaxed", body: "Bakeries, bookstores, and boutiques." },
  soft: { heading: "Gentle and rounded", body: "Wellness, yoga, and lifestyle brands." },
  retro: { heading: "Classic vintage feel", body: "Barbers, diners, and heritage brands." },
  minimal: { heading: "Light and sleek", body: "Portfolios and minimalist stores." },
  artsy: { heading: "Creative and unique", body: "Galleries, designers, and musicians." },
  urban: { heading: "Bold poster style", body: "Streetwear, gyms, and hype brands." },
  journal: { heading: "Comfortable long reads", body: "Authors, blogs, and newsletters." },
  handwriting: { heading: "Personal and human", body: "Invites, crafts, and local shops." },
  newsroom: { heading: "Clear editorial voice", body: "News sites and community papers." },
  runway: { heading: "High-fashion drama", body: "Boutiques, beauty, and luxury labels." },
  boardroom: { heading: "Executive confidence", body: "Consulting, finance, and B2B firms." },
  typewriter: { heading: "Vintage writer vibe", body: "Literary brands and memoir sites." },
  signature: { heading: "Elegant script flair", body: "Weddings, florists, and events." },
  geometric: { heading: "Crisp modern shapes", body: "Startups, apps, and product pages." },
  industrial: { heading: "Strong slab headlines", body: "Manufacturing, trades, and tools." },
  poster: { heading: "All-caps impact", body: "Promotions, concerts, and sales." },
  neo: { heading: "Swiss-style precision", body: "Architecture, design, and portfolios." },
  botanic: { heading: "Organic and natural", body: "Garden centers, farms, and spas." },
  cyber: { heading: "Futuristic edge", body: "Gaming, crypto, and tech demos." },
  cottage: { heading: "Warm homey feel", body: "Bed and breakfasts, bakeries, and crafts." },
  stadium: { heading: "Athletic energy", body: "Sports teams, trainers, and leagues." },
  bubble: { heading: "Playful and bubbly", body: "Kids parties, ice cream, and fun brands." },
};

export function initFontGallery(onChange) {
  const gallery = document.getElementById("font-gallery");
  if (!gallery) return;

  gallery.innerHTML = FONT_OPTIONS.map((font) => {
    const sample = FONT_SAMPLES[font.id] || { heading: font.label, body: font.hint };
    return `
      <button type="button" class="card type-card type-card-btn" data-apply-font="${font.id}" data-font-demo="${font.id}">
        <h3>${font.label}</h3>
        <p class="type-sample-heading">${sample.heading}</p>
        <p class="type-sample-body">${sample.body}</p>
        <span class="card-action">Tap to try</span>
      </button>
    `;
  }).join("");

  gallery.querySelectorAll("[data-apply-font]").forEach((card) => {
    card.addEventListener("click", () => {
      const font = card.dataset.applyFont;
      const select = document.getElementById("font-select");
      if (!select) return;
      select.value = font;
      select.dispatchEvent(new Event("change"));
      syncPickerState();
      onChange?.();
      showToast("Font updated! Check the preview above.");
    });
  });
}

export function initChecklist(onChange) {
  const container = document.getElementById("feature-checklist");
  const summary = document.getElementById("checklist-summary");
  if (!container || !summary) return () => [];

  container.innerHTML = FEATURE_ITEMS.map((item) => {
    const checked = item.defaultOn ? "checked" : "";
    return `
      <label class="checklist-item">
        <input type="checkbox" value="${item.id}" data-label="${item.label}" ${checked}>
        <span>${item.label}</span>
      </label>
    `;
  }).join("");

  const getSelected = () =>
    [...container.querySelectorAll("input:checked")].map((el) => ({
      id: el.value,
      label: el.dataset.label,
    }));

  const updateSummary = () => {
    const selected = getSelected();
    summary.textContent =
      selected.length === 1
        ? "You picked 1 thing for your website. Nice start!"
        : `You picked ${selected.length} things for your website. Great list!`;
    onChange?.();
  };

  container.addEventListener("change", updateSummary);
  updateSummary();

  return getSelected;
}

export function initVisualPickers(onChange) {
  const themeSelect = document.getElementById("theme-select");
  const fontSelect = document.getElementById("font-select");

  if (themeSelect) {
    themeSelect.innerHTML = THEME_OPTIONS.map(
      (theme) => `<option value="${theme.id}">${theme.label}</option>`
    ).join("");
  }

  if (fontSelect) {
    fontSelect.innerHTML = FONT_OPTIONS.map(
      (font) => `<option value="${font.id}">${font.label}</option>`
    ).join("");
  }

  const themeGrid = document.getElementById("theme-picker");
  const fontGrid = document.getElementById("font-picker");

  if (themeGrid) {
    themeGrid.innerHTML = THEME_OPTIONS.map(
      (theme) => `
        <button type="button" class="pick-card theme-pick" data-theme="${theme.id}" aria-pressed="false">
          <span class="pick-dot" style="background: linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})"></span>
          <strong>${theme.label}</strong>
          <span>${theme.hint}</span>
        </button>
      `
    ).join("");

    themeGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme]");
      if (!button) return;
      document.getElementById("theme-select").value = button.dataset.theme;
      document.getElementById("theme-select").dispatchEvent(new Event("change"));
      syncPickerState();
      onChange?.();
    });
  }

  if (fontGrid) {
    fontGrid.innerHTML = FONT_OPTIONS.map(
      (font) => `
        <button type="button" class="pick-card font-pick" data-font="${font.id}" aria-pressed="false">
          <strong>${font.label}</strong>
          <span>${font.hint}</span>
        </button>
      `
    ).join("");

    fontGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-font]");
      if (!button) return;
      document.getElementById("font-select").value = button.dataset.font;
      document.getElementById("font-select").dispatchEvent(new Event("change"));
      syncPickerState();
      onChange?.();
    });
  }

  document.querySelectorAll("#font-picker [data-font]").forEach((card) => {
    card.addEventListener("click", () => {
      const font = card.dataset.font;
      const select = document.getElementById("font-select");
      if (!select) return;
      select.value = font;
      select.dispatchEvent(new Event("change"));
      syncPickerState();
      onChange?.();
    });
  });

  syncPickerState();
}

export function syncPickerState() {
  const theme = document.getElementById("theme-select")?.value;
  const font = document.getElementById("font-select")?.value;
  const mode = document.getElementById("mode-select")?.value;

  document.querySelectorAll("[data-theme]").forEach((button) => {
    const active = button.dataset.theme === theme;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll("[data-font]").forEach((button) => {
    const active = button.dataset.font === font;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll("[data-mode-btn]").forEach((button) => {
    const active = button.dataset.modeBtn === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

export function initModeButtons(onChange) {
  document.querySelectorAll("[data-mode-btn]").forEach((button) => {
    button.addEventListener("click", () => {
      const select = document.getElementById("mode-select");
      if (!select) return;
      select.value = button.dataset.modeBtn;
      select.dispatchEvent(new Event("change"));
      syncPickerState();
      onChange?.();
    });
  });
}

export function initMyList(getState, getSelectedFeatures) {
  const panel = document.getElementById("my-list-panel");
  if (!panel) return () => {};

  const render = () => {
    const state = getState();
    const features = getSelectedFeatures();
    const featureHtml =
      features.length > 0
        ? features.map((item) => `<li>${item.label}</li>`).join("")
        : "<li>Nothing checked yet — browse the add-ons section below.</li>";

    panel.innerHTML = `
      <h3>Your list so far</h3>
      <p class="my-list-intro">This is what you have chosen. You can share this list when you talk to whoever is building your site.</p>
      <dl class="my-list-summary">
        <div><dt>Colors</dt><dd>${THEME_LABELS[state.theme] ?? state.theme}</dd></div>
        <div><dt>Fonts</dt><dd>${FONT_LABELS[state.font] ?? state.font}</dd></div>
        <div><dt>Look</dt><dd>${state.mode === "dark" ? "Dark background" : "Light background"}</dd></div>
      </dl>
      <p class="my-list-label">Add-ons you want:</p>
      <ul class="my-list-features">${featureHtml}</ul>
      <button class="btn btn-secondary btn-block" type="button" id="print-list">Print my list</button>
    `;

    document.getElementById("print-list")?.addEventListener("click", () => printList(getState, getSelectedFeatures));
  };

  render();
  return render;
}

function printList(getState, getSelectedFeatures) {
  const state = getState();
  const features = getSelectedFeatures();
  const lines = [
    "My Website Wish List",
    "====================",
    "",
    `Colors: ${THEME_LABELS[state.theme]}`,
    `Fonts: ${FONT_LABELS[state.font]}`,
    `Look: ${state.mode === "dark" ? "Dark" : "Light"}`,
    "",
    "Add-ons I want:",
    ...features.map((item) => `- ${item.label}`),
  ];

  const printWindow = window.open("", "_blank", "width=640,height=720");
  if (!printWindow) {
    showToast("Please allow pop-ups to print your list.");
    return;
  }

  printWindow.document.write(`<pre style="font-family: sans-serif; padding: 24px; line-height: 1.6;">${lines.join("\n")}</pre>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function showToast(message) {
  let toast = document.getElementById("site-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "site-toast";
    toast.className = "site-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

export { showToast };
