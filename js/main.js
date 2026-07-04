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
import { initNavigation, loadPartials, initHelpSteps, initBackToTop } from "./modules/ui.js";
import { initClickSpark } from "./modules/click-spark.js";
import { initPresets } from "./modules/presets.js";
import { initIndustry } from "./modules/industry.js";

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
  initPresets();

  const notify = () => {
    syncPickerState();
    refreshMyList();
  };

  initIndustry(notify);
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
  notify();
}

boot();
