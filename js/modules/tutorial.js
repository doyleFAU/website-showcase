import { DEFAULT_STATE, STORAGE_KEY } from "../config/state.js";
import {
  INDUSTRY_PICKS,
  FEATURE_ITEMS,
  THEME_OPTIONS,
  FONT_OPTIONS,
  THEME_LABELS,
  FONT_LABELS,
} from "../config/features.js";
import {
  TUTORIAL_STEPS,
  SHOWCASE_STEP,
  PERSIST_STEP,
  TUTORIAL_STORAGE_KEY,
  TUTORIAL_THEMES,
  TUTORIAL_FONTS,
  PRESET_OPTIONS,
  PRESET_HERO,
  INDUSTRY_SITE_NAMES,
  INDUSTRY_ICONS,
  STEP_ESTIMATES,
  splitFeatureGroups,
} from "../config/tutorial.js";
import { applySandboxState, saveState, loadState } from "./sandbox.js";
import { saveFeatureSelections, formatWishList, showToast, loadFeatureSelections } from "./checklist.js";
import { escapeHtml } from "./security.js";

const { essentials: ESSENTIAL_FEATURES, extras: EXTRA_FEATURES } = splitFeatureGroups(FEATURE_ITEMS);

function themeOptions() {
  return THEME_OPTIONS.filter((theme) => TUTORIAL_THEMES.includes(theme.id));
}

function fontOptions() {
  return FONT_OPTIONS.filter((font) => TUTORIAL_FONTS.includes(font.id));
}

function defaultFeatures() {
  return FEATURE_ITEMS.filter((item) => item.defaultOn).map((item) => item.id);
}

function nextButtonLabel(step) {
  if (step === 0) return "Begin";
  if (step === PERSIST_STEP) return "See my website";
  return "Next";
}

function loadTutorialProgress() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(TUTORIAL_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return null;
    return saved;
  } catch {
    return null;
  }
}

function saveTutorialProgress(tutorial) {
  sessionStorage.setItem(
    TUTORIAL_STORAGE_KEY,
    JSON.stringify({
      step: tutorial.step,
      industryId: tutorial.industryId,
      industryLabel: tutorial.industryLabel,
      siteName: tutorial.siteName,
      theme: tutorial.theme,
      font: tutorial.font,
      mode: tutorial.mode,
      preset: tutorial.preset,
      features: tutorial.features,
      suggestedPreset: tutorial.suggestedPreset,
    })
  );
}

function clearTutorialProgress() {
  sessionStorage.removeItem(TUTORIAL_STORAGE_KEY);
}

export function initTutorial() {
  const root = document.getElementById("tutorial-app");
  if (!root) return;

  const saved = loadState(DEFAULT_STATE, STORAGE_KEY);
  const savedFeatures = loadFeatureSelections();
  const resumed = loadTutorialProgress();

  const tutorial = {
    step: resumed?.step ?? 0,
    industryId: resumed?.industryId ?? "",
    industryLabel: resumed?.industryLabel ?? "",
    siteName: resumed?.siteName ?? "",
    theme: resumed?.theme ?? saved.theme,
    font: resumed?.font ?? saved.font,
    mode: resumed?.mode ?? saved.mode,
    preset: resumed?.preset ?? "tech",
    features: resumed?.features ?? savedFeatures ?? defaultFeatures(),
    suggestedPreset: resumed?.suggestedPreset ?? "",
  };

  if (tutorial.step > SHOWCASE_STEP) tutorial.step = SHOWCASE_STEP;

  if (!tutorial.suggestedPreset && tutorial.industryId) {
    tutorial.suggestedPreset =
      INDUSTRY_PICKS.find((pick) => pick.id === tutorial.industryId)?.preset ?? "";
  }

  const stepMeta = (index = tutorial.step) => TUTORIAL_STEPS[index] ?? TUTORIAL_STEPS[0];

  const applyLive = () => {
    const state = {
      ...DEFAULT_STATE,
      theme: tutorial.theme,
      font: tutorial.font,
      mode: tutorial.mode,
    };
    applySandboxState(state);
    saveState(state, STORAGE_KEY);
  };

  const persistAll = () => {
    applyLive();
    saveFeatureSelections(tutorial.features);
    saveTutorialProgress(tutorial);
  };

  const featureLabels = () =>
    tutorial.features
      .map((id) => FEATURE_ITEMS.find((item) => item.id === id)?.label)
      .filter(Boolean);

  const displaySiteName = () => tutorial.siteName.trim() || siteNameFallback();

  const siteNameFallback = () =>
    INDUSTRY_SITE_NAMES[tutorial.industryId] ||
    tutorial.industryLabel ||
    "Your Business";

  const domainSlug = (name = displaySiteName()) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "yourbusiness";

  const secondsRemaining = () =>
    TUTORIAL_STEPS.slice(tutorial.step + 1).reduce(
      (sum, step) => sum + (STEP_ESTIMATES[step.id] ?? 0),
      0
    );

  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return "";
    if (seconds < 60) return `~${seconds}s left`;
    return `~${Math.ceil(seconds / 60)} min left`;
  };

  const themeById = (id) => THEME_OPTIONS.find((theme) => theme.id === id);

  const renderChoicesStrip = () => {
    if (tutorial.step === 0 || tutorial.step >= SHOWCASE_STEP) return "";

    const chips = [];
    if (tutorial.industryLabel) {
      chips.push(`<span class="tutorial-choice-chip">${escapeHtml(tutorial.industryLabel)}</span>`);
    }
    if (tutorial.step >= 2) {
      const theme = themeById(tutorial.theme);
      const swatch = theme
        ? `style="background: linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})"`
        : "";
      chips.push(
        `<span class="tutorial-choice-chip tutorial-choice-chip--swatch"><span class="tutorial-choice-swatch" ${swatch} aria-hidden="true"></span>${escapeHtml(THEME_LABELS[tutorial.theme] ?? tutorial.theme)}</span>`
      );
    }
    if (tutorial.step >= 3) {
      chips.push(
        `<span class="tutorial-choice-chip">${escapeHtml(FONT_LABELS[tutorial.font] ?? tutorial.font)}</span>`
      );
    }
    if (tutorial.step >= 4) {
      chips.push(
        `<span class="tutorial-choice-chip">${tutorial.mode === "dark" ? "Dark" : "Light"} mode</span>`
      );
    }
    if (tutorial.step >= 5) {
      const presetLabel =
        PRESET_OPTIONS.find((item) => item.id === tutorial.preset)?.label || "Homepage";
      chips.push(`<span class="tutorial-choice-chip">${escapeHtml(presetLabel)}</span>`);
    }
    if (tutorial.step >= 6 && tutorial.siteName.trim()) {
      chips.push(`<span class="tutorial-choice-chip">${escapeHtml(displaySiteName())}</span>`);
    }

    if (!chips.length) return "";

    return `
      <div class="tutorial-choices-strip" aria-label="Your choices so far">
        <span class="tutorial-choices-label">So far</span>
        <div class="tutorial-choices-chips">${chips.join("")}</div>
      </div>
    `;
  };

  const renderProgress = () => {
    const total = TUTORIAL_STEPS.length;
    const current = stepMeta();
    const timeLeft = formatTimeLeft(secondsRemaining());
    const pct = Math.round((tutorial.step / (total - 1)) * 100);
    return `
      <nav class="tutorial-progress" aria-label="Tutorial progress">
        <div class="tutorial-progress-bar" aria-hidden="true">
          <span class="tutorial-progress-fill" style="width: ${pct}%"></span>
        </div>
        <ol class="tutorial-progress-list">
          ${TUTORIAL_STEPS.map((step, index) => {
            const state =
              index < tutorial.step ? "done" : index === tutorial.step ? "current" : "upcoming";
            return `
              <li
                class="tutorial-progress-step is-${state}"
                aria-current="${index === tutorial.step ? "step" : "false"}"
              >
                <span class="tutorial-progress-dot" aria-hidden="true"></span>
                <span class="tutorial-progress-name">${escapeHtml(step.label)}</span>
              </li>
            `;
          }).join("")}
        </ol>
      </nav>
      <p class="tutorial-step-label">
        Step ${tutorial.step + 1} of ${total} — ${escapeHtml(current.label)}
        ${timeLeft ? `<span class="tutorial-time-left">${escapeHtml(timeLeft)}</span>` : ""}
      </p>
      ${renderChoicesStrip()}
    `;
  };

  const renderStepHeading = (index, tag = "h2") => {
    const meta = stepMeta(index);
    const id = index === tutorial.step ? ' id="tutorial-title"' : "";
    return `<${tag}${id}>${escapeHtml(meta.title)}</${tag}>`;
  };

  const renderWelcome = () => {
    const meta = stepMeta(0);
    const overviewSteps = TUTORIAL_STEPS.slice(1, -1);
    return `
    <div class="tutorial-step tutorial-step--welcome">
      <p class="eyebrow">Start here</p>
      ${renderStepHeading(0, "h1")}
      <p class="tutorial-lead">${escapeHtml(meta.lead)}</p>
      <p class="tutorial-welcome-meta"><span class="tutorial-badge">~3 minutes</span><span>No account needed</span></p>
      <ol class="tutorial-overview">
        ${overviewSteps
          .map(
            (step) => `
          <li>
            <strong>${escapeHtml(step.label)}</strong>
            <span>${escapeHtml(step.lead)}</span>
          </li>
        `
          )
          .join("")}
        <li>
          <strong>Your site</strong>
          <span>${escapeHtml(TUTORIAL_STEPS[SHOWCASE_STEP].overview || TUTORIAL_STEPS[SHOWCASE_STEP].lead)}</span>
        </li>
      </ol>
    </div>
  `;
  };

  const renderBusiness = () => `
    <div class="tutorial-step">
      ${renderStepHeading(1)}
      <p class="tutorial-lead">${escapeHtml(stepMeta(1).lead)}</p>
      ${
        tutorial.industryId
          ? `<p class="tutorial-selection-note" role="status">Selected: <strong>${escapeHtml(tutorial.industryLabel)}</strong> — homepage and features pre-filled for you.</p>`
          : ""
      }
      <div class="tutorial-card-grid" role="listbox" aria-label="Business type">
        ${INDUSTRY_PICKS.map(
          (pick) => `
          <button
            type="button"
            class="tutorial-card ${tutorial.industryId === pick.id ? "is-selected" : ""}"
            data-industry="${pick.id}"
            role="option"
            aria-selected="${tutorial.industryId === pick.id ? "true" : "false"}"
          >
            <span class="tutorial-card-icon" aria-hidden="true">${INDUSTRY_ICONS[pick.id] || "✨"}</span>
            <strong>${escapeHtml(pick.label)}</strong>
            <span>${escapeHtml(pick.hint)}</span>
          </button>
        `
        ).join("")}
      </div>
    </div>
  `;

  const renderColors = () => `
    <div class="tutorial-step">
      ${renderStepHeading(2)}
      <p class="tutorial-lead">${escapeHtml(stepMeta(2).lead)}</p>
      <div class="tutorial-pick-grid tutorial-pick-grid--colors" role="listbox" aria-label="Color theme">
        ${themeOptions()
          .map(
            (theme) => `
          <button
            type="button"
            class="tutorial-pick ${tutorial.theme === theme.id ? "is-selected" : ""}"
            data-theme="${theme.id}"
            role="option"
            aria-selected="${tutorial.theme === theme.id ? "true" : "false"}"
            aria-label="${escapeHtml(theme.label)} — ${escapeHtml(theme.hint)}"
          >
            <span class="tutorial-swatch" style="background: linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})" aria-hidden="true"></span>
            <strong>${escapeHtml(theme.label)}</strong>
            <span>${escapeHtml(theme.hint)}</span>
          </button>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  const renderFonts = () => `
    <div class="tutorial-step">
      ${renderStepHeading(3)}
      <p class="tutorial-lead">${escapeHtml(stepMeta(3).lead)}</p>
      <div class="tutorial-pick-grid tutorial-pick-grid--fonts" role="listbox" aria-label="Font pairing">
        ${fontOptions()
          .map(
            (font) => `
          <button
            type="button"
            class="tutorial-pick ${tutorial.font === font.id ? "is-selected" : ""}"
            data-font="${font.id}"
            data-font-demo="${font.id}"
            role="option"
            aria-selected="${tutorial.font === font.id ? "true" : "false"}"
          >
            <strong class="tutorial-font-sample">${escapeHtml(font.label)}</strong>
            <span>${escapeHtml(font.hint)}</span>
          </button>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  const renderMode = () => `
    <div class="tutorial-step">
      ${renderStepHeading(4)}
      <p class="tutorial-lead">${escapeHtml(stepMeta(4).lead)}</p>
      <div class="tutorial-mode-toggle tutorial-mode-toggle--large" role="group" aria-label="Background mode">
        <button
          type="button"
          class="tutorial-mode ${tutorial.mode === "light" ? "is-selected" : ""}"
          data-mode="light"
          aria-pressed="${tutorial.mode === "light" ? "true" : "false"}"
        >
          <span class="tutorial-mode-preview tutorial-mode-preview--light" aria-hidden="true"></span>
          <strong>Light</strong>
          <span>Bright and clean</span>
        </button>
        <button
          type="button"
          class="tutorial-mode ${tutorial.mode === "dark" ? "is-selected" : ""}"
          data-mode="dark"
          aria-pressed="${tutorial.mode === "dark" ? "true" : "false"}"
        >
          <span class="tutorial-mode-preview tutorial-mode-preview--dark" aria-hidden="true"></span>
          <strong>Dark</strong>
          <span>Bold and modern</span>
        </button>
      </div>
    </div>
  `;

  const renderHomepage = () => `
    <div class="tutorial-step">
      ${renderStepHeading(5)}
      <p class="tutorial-lead">${escapeHtml(stepMeta(5).lead)}</p>
      <div class="tutorial-card-grid tutorial-card-grid--presets" role="listbox" aria-label="Homepage layout">
        ${PRESET_OPTIONS.map((preset) => {
          const suggested = tutorial.suggestedPreset === preset.id;
          return `
          <button
            type="button"
            class="tutorial-card tutorial-card--preset ${tutorial.preset === preset.id ? "is-selected" : ""}"
            data-preset="${preset.id}"
            role="option"
            aria-selected="${tutorial.preset === preset.id ? "true" : "false"}"
          >
            <span class="tutorial-preset-thumb tutorial-preset-thumb--${preset.id}" aria-hidden="true"></span>
            <strong>${escapeHtml(preset.label)}</strong>
            <span>${escapeHtml(preset.hint)}</span>
            ${suggested ? `<span class="tutorial-suggested-badge">Suggested for you</span>` : ""}
          </button>
        `;
        }).join("")}
      </div>
    </div>
  `;

  const renderSiteName = () => `
    <div class="tutorial-step">
      ${renderStepHeading(6)}
      <p class="tutorial-lead">${escapeHtml(stepMeta(6).lead)}</p>
      <label class="tutorial-name-field">
        <span>Business or site name</span>
        <input
          type="text"
          id="tutorial-site-name"
          value="${escapeHtml(displaySiteName())}"
          maxlength="48"
          placeholder="e.g. Harbor Yoga Studio"
          autocomplete="organization"
          aria-describedby="tutorial-name-hint tutorial-domain-preview"
        >
      </label>
      <p class="tutorial-domain-preview" id="tutorial-domain-preview" aria-live="polite">
        Preview: <strong>${escapeHtml(domainSlug())}.com</strong>
      </p>
      <p class="tutorial-name-hint" id="tutorial-name-hint">This appears in your final preview and on the browser bar.</p>
    </div>
  `;

  const renderFeatureGroup = (stepIndex, items, lead, { allowClearAll = false } = {}) => {
    const selectedCount = items.filter((item) => tutorial.features.includes(item.id)).length;
    return `
    <div class="tutorial-step">
      ${renderStepHeading(stepIndex)}
      <p class="tutorial-lead">${escapeHtml(lead)}</p>
      <div class="tutorial-checklist-toolbar">
        <p class="tutorial-feature-count" aria-live="polite">
          <span data-tutorial-feature-count>${selectedCount}</span> of ${items.length} selected
        </p>
        <div class="tutorial-checklist-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-tutorial-select-all>Select all</button>
          ${
            allowClearAll
              ? `<button type="button" class="btn btn-ghost btn-sm" data-tutorial-clear-all>Clear all</button>`
              : ""
          }
        </div>
      </div>
      <div class="tutorial-checklist">
        ${items
          .map((item) => {
            const checked = tutorial.features.includes(item.id) ? "checked" : "";
            return `
            <label class="tutorial-check">
              <input type="checkbox" value="${item.id}" ${checked}>
              <span>${escapeHtml(item.label)}</span>
            </label>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
  };

  const renderEssentials = () =>
    renderFeatureGroup(7, ESSENTIAL_FEATURES, stepMeta(7).lead);

  const renderExtras = () =>
    renderFeatureGroup(8, EXTRA_FEATURES, stepMeta(8).lead, { allowClearAll: true });

  const renderShowcase = () => {
    const hero = PRESET_HERO[tutorial.preset] || PRESET_HERO.tech;
    const presetLabel = PRESET_OPTIONS.find((item) => item.id === tutorial.preset)?.label || "Homepage";
    const labels = featureLabels();
    const name = displaySiteName();
    const domain = domainSlug(name);

    const addonChips =
      labels.length > 0
        ? labels
            .map((label) => `<span class="tutorial-addon-chip">${escapeHtml(label)}</span>`)
            .join("")
        : `<span class="tutorial-addon-chip">Room to grow</span>`;

    return `
      <div class="tutorial-step tutorial-step--showcase">
        <p class="eyebrow">You did it</p>
        ${renderStepHeading(SHOWCASE_STEP)}
        <p class="tutorial-lead tutorial-lead--center">${escapeHtml(stepMeta(SHOWCASE_STEP).lead)}</p>

        <div class="tutorial-showcase tutorial-showcase--large card">
          <div class="tutorial-browser-bar">
            <span></span><span></span><span></span>
            <p>${escapeHtml(domain)}.com</p>
          </div>
          <div class="tutorial-showcase-body tutorial-showcase-body--${tutorial.preset}">
            <header class="tutorial-showcase-nav">
              <span class="tutorial-showcase-logo">${escapeHtml(name)}</span>
              <nav aria-label="Preview navigation">
                <span>About</span>
                <span>Services</span>
                <span>Contact</span>
              </nav>
              <span class="tutorial-showcase-cta btn btn-primary btn-sm">Contact us</span>
            </header>
            <div class="tutorial-showcase-hero">
              <p class="tutorial-showcase-kicker">${escapeHtml(hero.kicker)}</p>
              <h3>${escapeHtml(hero.headline)}</h3>
              <p class="tutorial-showcase-lead">${escapeHtml(hero.lead)}</p>
              <div class="tutorial-showcase-actions">
                <span class="btn btn-primary">Get started</span>
                <span class="btn btn-secondary">Learn more</span>
              </div>
            </div>
            <div class="tutorial-showcase-cards">
              <div class="tutorial-showcase-card">
                <strong>Homepage style</strong>
                <span>${escapeHtml(presetLabel)}</span>
              </div>
              <div class="tutorial-showcase-card">
                <strong>Color theme</strong>
                <span>${escapeHtml(THEME_LABELS[tutorial.theme] ?? tutorial.theme)}</span>
              </div>
              <div class="tutorial-showcase-card">
                <strong>Font pairing</strong>
                <span>${escapeHtml(FONT_LABELS[tutorial.font] ?? tutorial.font)}</span>
              </div>
            </div>
            <div class="tutorial-showcase-section">
              <h4>Included on your site</h4>
              <div class="tutorial-addon-strip">${addonChips}</div>
            </div>
          </div>
        </div>

        <div class="tutorial-summary card">
          <h3>Everything you picked</h3>
          <dl class="tutorial-summary-list">
            <div>
              <dt>Business</dt>
              <dd>
                ${escapeHtml(tutorial.industryLabel || "General")}
                <button type="button" class="tutorial-summary-edit" data-tutorial-goto="1">Change</button>
              </dd>
            </div>
            <div>
              <dt>Site name</dt>
              <dd>
                ${escapeHtml(name)}
                <button type="button" class="tutorial-summary-edit" data-tutorial-goto="6">Change</button>
              </dd>
            </div>
            <div>
              <dt>Homepage</dt>
              <dd>
                ${escapeHtml(presetLabel)}
                <button type="button" class="tutorial-summary-edit" data-tutorial-goto="5">Change</button>
              </dd>
            </div>
            <div>
              <dt>Colors</dt>
              <dd>
                ${escapeHtml(THEME_LABELS[tutorial.theme] ?? tutorial.theme)}
                <button type="button" class="tutorial-summary-edit" data-tutorial-goto="2">Change</button>
              </dd>
            </div>
            <div>
              <dt>Fonts</dt>
              <dd>
                ${escapeHtml(FONT_LABELS[tutorial.font] ?? tutorial.font)}
                <button type="button" class="tutorial-summary-edit" data-tutorial-goto="3">Change</button>
              </dd>
            </div>
            <div>
              <dt>Look</dt>
              <dd>
                ${tutorial.mode === "dark" ? "Dark background" : "Light background"}
                <button type="button" class="tutorial-summary-edit" data-tutorial-goto="4">Change</button>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    `;
  };

  const renderStep = () => {
    switch (tutorial.step) {
      case 0:
        return renderWelcome();
      case 1:
        return renderBusiness();
      case 2:
        return renderColors();
      case 3:
        return renderFonts();
      case 4:
        return renderMode();
      case 5:
        return renderHomepage();
      case 6:
        return renderSiteName();
      case 7:
        return renderEssentials();
      case 8:
        return renderExtras();
      default:
        return renderShowcase();
    }
  };

  const canContinue = () => {
    const meta = stepMeta();
    if (meta.requires === "industry") return Boolean(tutorial.industryId);
    if (meta.requires === "siteName") return Boolean(tutorial.siteName.trim());
    return true;
  };

  const validationMessage = () => {
    if (canContinue()) return "";
    return stepMeta().hint || "Complete this step to continue.";
  };

  const focusStep = () => {
    requestAnimationFrame(() => {
      const heading = root.querySelector("#tutorial-title");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      } else if (tutorial.step === 6) {
        const input = root.querySelector("#tutorial-site-name");
        input?.focus();
        input?.select();
      }
    });
  };

  const updatePickSelection = (selector, dataKey, value) => {
    root.querySelectorAll(selector).forEach((el) => {
      const match = el.dataset[dataKey] === value;
      el.classList.toggle("is-selected", match);
      if (el.hasAttribute("aria-selected")) {
        el.setAttribute("aria-selected", match ? "true" : "false");
      }
      if (el.hasAttribute("aria-pressed")) {
        el.setAttribute("aria-pressed", match ? "true" : "false");
      }
    });
  };

  const refreshChoicesStrip = () => {
    const existing = root.querySelector(".tutorial-choices-strip");
    const html = renderChoicesStrip();
    if (existing) {
      existing.outerHTML = html || "";
    } else if (html) {
      root.querySelector(".tutorial-step-label")?.insertAdjacentHTML("afterend", html);
    }
  };

  const updateDomainPreview = () => {
    const preview = root.querySelector("#tutorial-domain-preview strong");
    if (preview) preview.textContent = `${domainSlug()}.com`;
  };

  const gotoStep = (step) => {
    tutorial.step = step;
    saveTutorialProgress(tutorial);
    render({ focus: true });
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const currentFeatureItems = () =>
    tutorial.step === 7 ? ESSENTIAL_FEATURES : tutorial.step === 8 ? EXTRA_FEATURES : [];

  const updateFeatureCount = () => {
    const items =
      tutorial.step === 7 ? ESSENTIAL_FEATURES : tutorial.step === 8 ? EXTRA_FEATURES : null;
    if (!items) return;
    const count = items.filter((item) => tutorial.features.includes(item.id)).length;
    const el = root.querySelector("[data-tutorial-feature-count]");
    if (el) el.textContent = String(count);
  };

  const advanceStep = () => {
    if (tutorial.step === 6) {
      const input = root.querySelector("#tutorial-site-name");
      tutorial.siteName = input?.value.trim() || "";
    }
    if (!canContinue()) return false;

    if (tutorial.step === PERSIST_STEP) {
      syncFeaturesFromDom();
      persistAll();
      tutorial.step = SHOWCASE_STEP;
    } else {
      tutorial.step += 1;
      if (tutorial.step <= PERSIST_STEP) saveTutorialProgress(tutorial);
    }
    return true;
  };

  const render = ({ focus = false } = {}) => {
    const isShowcase = tutorial.step >= SHOWCASE_STEP;
    const blocked = validationMessage();
    root.classList.toggle("tutorial-page--finale", isShowcase);

    root.innerHTML = `
      <section class="tutorial-shell card ${isShowcase ? "tutorial-shell--finale" : ""}" aria-labelledby="tutorial-title">
        ${isShowcase ? "" : renderProgress()}
        <div class="tutorial-body tutorial-body--enter">
          ${renderStep()}
        </div>
        <div class="tutorial-footer">
          ${
            tutorial.step > 0 && !isShowcase
              ? `<button type="button" class="btn btn-secondary" data-tutorial-back>Back</button>`
              : `<span aria-hidden="true"></span>`
          }
          ${
            isShowcase
              ? `
            <div class="tutorial-final-actions">
              <button type="button" class="btn btn-primary" data-tutorial-copy>Copy my list</button>
              <a class="btn btn-secondary" href="my-list.html">View my list</a>
              <a class="btn btn-ghost" href="presets.html?preset=${encodeURIComponent(tutorial.preset)}">See full homepage</a>
              <button type="button" class="btn btn-ghost" data-tutorial-restart>Start over</button>
            </div>
          `
              : `
            <div class="tutorial-footer-next">
              ${
                blocked
                  ? `<p class="tutorial-validation" role="alert">${escapeHtml(blocked)}</p>`
                  : ""
              }
              <button type="button" class="btn btn-primary" data-tutorial-next ${canContinue() ? "" : "disabled"}>
                ${nextButtonLabel(tutorial.step)}
              </button>
            </div>
          `
          }
        </div>
      </section>
    `;

    bindEvents();
    if (tutorial.step >= 2 && tutorial.step <= PERSIST_STEP) applyLive();
    if (focus) focusStep();
  };

  const syncFeaturesFromDom = () => {
    tutorial.features = [...root.querySelectorAll(".tutorial-check input:checked")].map((el) => el.value);
  };

  const bindEvents = () => {
    root.querySelector("[data-tutorial-next]")?.addEventListener("click", () => {
      if (!advanceStep()) return;
      render({ focus: true });
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    root.querySelector("[data-tutorial-back]")?.addEventListener("click", () => {
      if (tutorial.step === 6) {
        const input = root.querySelector("#tutorial-site-name");
        tutorial.siteName = input?.value.trim() || tutorial.siteName;
      }
      if (tutorial.step === 7 || tutorial.step === 8) syncFeaturesFromDom();
      tutorial.step = Math.max(0, tutorial.step - 1);
      saveTutorialProgress(tutorial);
      render({ focus: true });
    });

    root.querySelector("[data-tutorial-restart]")?.addEventListener("click", () => {
      clearTutorialProgress();
      tutorial.step = 0;
      tutorial.industryId = "";
      tutorial.industryLabel = "";
      tutorial.siteName = "";
      tutorial.suggestedPreset = "";
      tutorial.theme = DEFAULT_STATE.theme;
      tutorial.font = DEFAULT_STATE.font;
      tutorial.mode = DEFAULT_STATE.mode;
      tutorial.preset = "tech";
      tutorial.features = defaultFeatures();
      render({ focus: true });
    });

    root.querySelector("[data-tutorial-copy]")?.addEventListener("click", () => {
      const presetLabel = PRESET_OPTIONS.find((item) => item.id === tutorial.preset)?.label || "Homepage";
      const text = [
        formatWishList(
          { theme: tutorial.theme, font: tutorial.font, mode: tutorial.mode },
          featureLabels().map((label) => ({ label }))
        ),
        "",
        `Business type: ${tutorial.industryLabel || "General"}`,
        `Site name: ${displaySiteName()}`,
        `Homepage: ${presetLabel}`,
      ].join("\n");
      navigator.clipboard?.writeText(text).then(
        () => showToast("Copied! Paste into a text or email."),
        () => showToast("Copy failed — please try again.")
      );
    });

    root.querySelector("#tutorial-site-name")?.addEventListener("input", (event) => {
      tutorial.siteName = event.target.value;
      updateDomainPreview();
      const next = root.querySelector("[data-tutorial-next]");
      const validation = root.querySelector(".tutorial-validation");
      const blocked = validationMessage();
      if (next) next.disabled = !canContinue();
      if (validation) {
        if (blocked) {
          validation.textContent = blocked;
          validation.hidden = false;
        } else {
          validation.remove();
        }
      } else if (blocked) {
        const wrap = root.querySelector(".tutorial-footer-next");
        if (wrap) {
          wrap.insertAdjacentHTML(
            "afterbegin",
            `<p class="tutorial-validation" role="alert">${escapeHtml(blocked)}</p>`
          );
        }
      }
      refreshChoicesStrip();
    });

    root.querySelectorAll("[data-tutorial-goto]").forEach((button) => {
      button.addEventListener("click", () => {
        const step = Number(button.dataset.tutorialGoto);
        if (Number.isFinite(step)) gotoStep(step);
      });
    });

    root.querySelector("[data-tutorial-select-all]")?.addEventListener("click", () => {
      const items = currentFeatureItems();
      tutorial.features = [...new Set([...tutorial.features, ...items.map((item) => item.id)])];
      root.querySelectorAll(".tutorial-check input").forEach((input) => {
        input.checked = items.some((item) => item.id === input.value);
      });
      updateFeatureCount();
      saveTutorialProgress(tutorial);
    });

    root.querySelector("[data-tutorial-clear-all]")?.addEventListener("click", () => {
      const items = currentFeatureItems();
      const ids = new Set(items.map((item) => item.id));
      tutorial.features = tutorial.features.filter((id) => !ids.has(id));
      root.querySelectorAll(".tutorial-check input").forEach((input) => {
        if (ids.has(input.value)) input.checked = false;
      });
      updateFeatureCount();
      saveTutorialProgress(tutorial);
    });

    root.querySelectorAll("[data-industry]").forEach((button) => {
      button.addEventListener("click", () => {
        const pick = INDUSTRY_PICKS.find((item) => item.id === button.dataset.industry);
        if (!pick) return;
        tutorial.industryId = pick.id;
        tutorial.industryLabel = pick.label;
        tutorial.preset = pick.preset;
        tutorial.suggestedPreset = pick.preset;
        tutorial.siteName = INDUSTRY_SITE_NAMES[pick.id] || pick.label;
        tutorial.features = [...new Set([...defaultFeatures(), ...pick.features])];
        saveTutorialProgress(tutorial);
        render({ focus: true });
      });
    });

    root.querySelectorAll("[data-theme]").forEach((button) => {
      button.addEventListener("click", () => {
        tutorial.theme = button.dataset.theme;
        applyLive();
        updatePickSelection("[data-theme]", "theme", tutorial.theme);
        saveTutorialProgress(tutorial);
        refreshChoicesStrip();
      });
    });

    root.querySelectorAll("[data-font]").forEach((button) => {
      button.addEventListener("click", () => {
        tutorial.font = button.dataset.font;
        applyLive();
        updatePickSelection("[data-font]", "font", tutorial.font);
        saveTutorialProgress(tutorial);
        refreshChoicesStrip();
      });
    });

    root.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        tutorial.mode = button.dataset.mode;
        applyLive();
        updatePickSelection("[data-mode]", "mode", tutorial.mode);
        saveTutorialProgress(tutorial);
        refreshChoicesStrip();
      });
    });

    root.querySelectorAll("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        tutorial.preset = button.dataset.preset;
        updatePickSelection("[data-preset]", "preset", tutorial.preset);
        saveTutorialProgress(tutorial);
        refreshChoicesStrip();
      });
    });

    root.querySelectorAll(".tutorial-check input").forEach((input) => {
      input.addEventListener("change", () => {
        syncFeaturesFromDom();
        updateFeatureCount();
        saveTutorialProgress(tutorial);
      });
    });
  };

  const onKeyDown = (event) => {
    if (event.key !== "Enter" || event.target.closest("textarea")) return;
    if (tutorial.step >= SHOWCASE_STEP) return;
    if (event.target.matches("#tutorial-site-name")) return;
    if (!canContinue()) return;
    if (event.target.closest(".tutorial-check")) return;

    const next = root.querySelector("[data-tutorial-next]");
    if (!next || next.disabled) return;
    event.preventDefault();
    if (advanceStep()) {
      render({ focus: true });
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  root.addEventListener("keydown", onKeyDown);

  if (resumed?.step > 0 && resumed.step < SHOWCASE_STEP) {
    showToast(`Welcome back — resuming step ${resumed.step + 1}.`);
  }

  render({ focus: resumed?.step > 0 });
}
