import { DEFAULT_STATE, STORAGE_KEY } from "./config/state.js";
import { initSandbox } from "./modules/sandbox.js";
import { initPalette } from "./modules/palette.js";
import {
  initChecklist,
  initVisualPickers,
  initModeButtons,
  initMyList,
  initFontGallery,
  syncPickerState,
} from "./modules/checklist.js";
import { initNavigation, loadPartials, initHelpSteps, initBackToTop, showPendingToast } from "./modules/ui.js";
import { initClickSpark } from "./modules/click-spark.js";
import { initPresets } from "./modules/presets.js";
import { initIndustry } from "./modules/industry.js";
import { initReactBitsEffects, initGlareHover } from "./modules/reactbits-effects.js";
import { initTutorial } from "./modules/tutorial.js";
import { applySandboxState, loadState, syncControls } from "./modules/sandbox.js";
import { initAuth, initLoginPage, initResetPasswordPage, scheduleCloudSave } from "./modules/auth.js";
import { loadFeatureSelections } from "./modules/checklist.js";

let currentState = { ...DEFAULT_STATE };
let getSelectedFeatures = () => [];
let refreshMyList = () => {};

async function boot() {
  try {
    await loadPartials();
  } catch {
    const main = document.getElementById("main");
    if (main) {
      main.insertAdjacentHTML(
        "afterbegin",
        '<p class="container help-error">This page needs a simple web server to load. Ask your developer to open it locally or publish it online.</p>'
      );
    }
    return;
  }

  initNavigation();
  initBackToTop();
  initClickSpark();

  if (document.getElementById("login-form")) {
    initLoginPage();
    initAuth({});
    return;
  }

  if (document.getElementById("reset-password-form")) {
    initResetPasswordPage();
    initAuth({});
    return;
  }

  initAuth({
    onPlanApplied: (state) => {
      currentState = state;
      applySandboxState(state);
      syncControls(state);
      onNotify?.();
    },
    getSnapshot: () => ({
      choices: currentState,
      features: loadFeatureSelections() || [],
    }),
  });

  let onNotify = null;

  if (document.getElementById("tutorial-app")) {
    const saved = loadState(DEFAULT_STATE, STORAGE_KEY);
    applySandboxState(saved);
    currentState = saved;
    initTutorial();
    return;
  }

  initPresets();
  showPendingToast();

  const notify = () => {
    syncPickerState();
    refreshMyList();
    scheduleCloudSave(() => ({
      choices: currentState,
      features: loadFeatureSelections() || [],
    }));
  };
  onNotify = notify;

  initIndustry(notify);
  initReactBitsEffects();
  initHelpSteps();

  initSandbox(DEFAULT_STATE, STORAGE_KEY, (state) => {
    currentState = state;
    notify();
  });

  initPalette();
  initVisualPickers(notify);
  initModeButtons(notify);
  initFontGallery(notify);
  getSelectedFeatures = initChecklist(notify);
  refreshMyList = initMyList(() => currentState, () => getSelectedFeatures()) || (() => {});
  initGlareHover();
  notify();
}

boot();
