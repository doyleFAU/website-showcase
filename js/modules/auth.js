import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from "../config/supabase.js";
import { DEFAULT_STATE, STORAGE_KEY, FEATURES_STORAGE_KEY } from "../config/state.js";
import { sanitizeState, sanitizeFeatureIds } from "./security.js";
import { applySandboxState, saveState, syncControls } from "./sandbox.js";
import { saveFeatureSelections, setFeatureSelections, showToast } from "./checklist.js";

let client = null;
let saveTimer = null;
let currentUser = null;

function getClient() {
  if (!isSupabaseConfigured()) return null;
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

function planFromLocal() {
  let choices = { ...DEFAULT_STATE };
  let features = [];

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved) choices = sanitizeState(saved, DEFAULT_STATE);
  } catch {
    /* ignore */
  }

  try {
    const saved = JSON.parse(localStorage.getItem(FEATURES_STORAGE_KEY) || "null");
    if (saved) features = sanitizeFeatureIds(saved);
  } catch {
    /* ignore */
  }

  return { choices, features };
}

function applyPlanToApp({ choices, features }, onApplied) {
  applySandboxState(choices);
  saveState(choices, STORAGE_KEY);
  syncControls(choices);
  setFeatureSelections(features);
  onApplied?.(choices);
}

export async function loadCloudPlan(userId) {
  const supabase = getClient();
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("user_plans")
    .select("choices, features")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    choices: sanitizeState(data.choices || {}, DEFAULT_STATE),
    features: sanitizeFeatureIds(data.features || []),
  };
}

async function resolveAuthUser() {
  const supabase = getClient();
  if (!supabase) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (!userError && userData.user) return userData.user;

  const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
  if (sessionError || !sessionData.session?.user) return null;

  return sessionData.session.user;
}

export async function saveCloudPlan(userId, { choices, features }) {
  const supabase = getClient();
  if (!supabase || !userId) return;

  const user = await resolveAuthUser();
  if (!user || user.id !== userId) {
    throw new Error("Not signed in");
  }

  const payload = {
    choices: sanitizeState(choices, DEFAULT_STATE),
    features: sanitizeFeatureIds(features),
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: readError } = await supabase
    .from("user_plans")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) throw readError;

  if (existing) {
    const { error } = await supabase.from("user_plans").update(payload).eq("user_id", user.id);
    if (error) throw error;
    return;
  }

  const { error: insertError } = await supabase
    .from("user_plans")
    .insert({ ...payload, user_id: user.id });

  if (!insertError) return;

  // Another device may have created the row between read and insert.
  if (insertError.code === "23505") {
    const { error: updateError } = await supabase
      .from("user_plans")
      .update(payload)
      .eq("user_id", user.id);
    if (updateError) throw updateError;
    return;
  }

  throw insertError;
}

export function scheduleCloudSave(getSnapshot) {
  if (!currentUser) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try {
      const user = await resolveAuthUser();
      if (!user) {
        currentUser = null;
        renderAuthSlot();
        return;
      }

      currentUser = user;
      await saveCloudPlan(user.id, getSnapshot());
    } catch (error) {
      console.error("Cloud save failed:", error);
    }
  }, 900);
}

function renderAuthSlot() {
  const slot = document.getElementById("auth-slot");
  if (!slot || !isSupabaseConfigured()) return;

  slot.hidden = false;

  if (currentUser) {
    const label = currentUser.email?.split("@")[0] || "Account";
    slot.innerHTML = `
      <span class="auth-user" title="${currentUser.email || ""}">${label}</span>
      <button class="btn btn-ghost btn-sm" type="button" id="auth-sign-out">Log out</button>
    `;
    slot.querySelector("#auth-sign-out")?.addEventListener("click", signOut);
    return;
  }

  slot.innerHTML = `<a class="btn btn-secondary btn-sm" href="login.html">Log in</a>`;
}

async function syncSessionPlan(onPlanApplied) {
  if (!currentUser) return;

  try {
    const cloud = await loadCloudPlan(currentUser.id);
    if (cloud) {
      applyPlanToApp(cloud, onPlanApplied);
      showToast("Loaded your saved plan.");
      return;
    }

    const local = planFromLocal();
    await saveCloudPlan(currentUser.id, local);
    showToast("Saved your current picks to your account.");
  } catch {
    showToast("Could not sync your account. Your local picks still work.");
  }
}

export async function signOut() {
  const supabase = getClient();
  if (!supabase) return;
  await supabase.auth.signOut();
  currentUser = null;
  renderAuthSlot();
  showToast("Logged out.");
}

export async function signInWithPassword(email, password) {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(email, password) {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function resendConfirmationEmail(email) {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });
  if (error) throw error;
}

function resetPasswordRedirectUrl() {
  return `${window.location.origin}/reset-password.html`;
}

export async function requestPasswordReset(email) {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetPasswordRedirectUrl(),
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

function formatAuthError(error) {
  const msg = error?.message || "";
  if (msg.toLowerCase().includes("email not confirmed")) {
    return "Please confirm your email first. Check your inbox (and spam), or click Resend confirmation below.";
  }
  return msg || "Something went wrong. Please try again.";
}

function initPasswordToggles(root = document) {
  root.querySelectorAll(".password-toggle").forEach((button) => {
    const wrap = button.closest(".password-wrap");
    const input = wrap?.querySelector("input");
    if (!input) return;

    button.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.setAttribute("aria-pressed", String(show));
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });
}

export function initAuth({ onPlanApplied, getSnapshot }) {
  const supabase = getClient();
  if (!supabase) return;

  supabase.auth.getSession().then(({ data }) => {
    currentUser = data.session?.user ?? null;
    renderAuthSlot();
    if (currentUser) syncSessionPlan(onPlanApplied);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    const nextUser = session?.user ?? null;
    const wasLoggedIn = Boolean(currentUser);
    currentUser = nextUser;
    renderAuthSlot();

    if (nextUser && !wasLoggedIn) {
      syncSessionPlan(onPlanApplied);
    }
  });

  window.addEventListener("beforeunload", () => {
    if (!currentUser) return;
    const snapshot = getSnapshot?.();
    if (snapshot) {
      saveCloudPlan(currentUser.id, snapshot);
    }
  });
}

export function initLoginPage() {
  const form = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const forgotForm = document.getElementById("forgot-form");
  const message = document.getElementById("auth-message");

  initPasswordToggles();

  if (!isSupabaseConfigured()) {
    if (message) {
      message.textContent =
        "Login is not set up yet. Add your Supabase URL and anon key in js/config/supabase.js.";
    }
    form?.querySelectorAll("input, button").forEach((el) => {
      el.disabled = true;
    });
    signupForm?.querySelectorAll("input, button").forEach((el) => {
      el.disabled = true;
    });
    return;
  }

  const showError = (error) => {
    if (message) {
      message.textContent = formatAuthError(error);
      message.classList.toggle("is-info", false);
    }
  };

  const showInfo = (text) => {
    if (message) {
      message.textContent = text;
      message.classList.add("is-info");
    }
  };

  document.getElementById("show-forgot")?.addEventListener("click", () => {
    forgotForm?.removeAttribute("hidden");
    document.querySelector(".auth-grid")?.setAttribute("hidden", "");
    if (message) message.textContent = "";
  });

  document.getElementById("hide-forgot")?.addEventListener("click", () => {
    forgotForm?.setAttribute("hidden", "");
    document.querySelector(".auth-grid")?.removeAttribute("hidden");
    if (message) message.textContent = "";
  });

  forgotForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(forgotForm);
    const email = String(data.get("email") || "").trim();

    try {
      await requestPasswordReset(email);
      showInfo("Reset link sent. Check your inbox and spam folder.");
      forgotForm.setAttribute("hidden", "");
      document.querySelector(".auth-grid")?.removeAttribute("hidden");
    } catch (error) {
      showError(error);
    }
  });

  document.getElementById("resend-confirm")?.addEventListener("click", async () => {
    const email = String(new FormData(form).get("email") || "").trim();
    if (!email) {
      showError({ message: "Enter your email in the Log in form first." });
      return;
    }

    try {
      await resendConfirmationEmail(email);
      showInfo("Confirmation email sent. Check your inbox and spam folder.");
    } catch (error) {
      showError(error);
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    try {
      await signInWithPassword(email, password);
      window.location.href = "index.html";
    } catch (error) {
      showError(error);
    }
  });

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(signupForm);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    try {
      await signUpWithPassword(email, password);
      if (message) {
        message.textContent =
          "Account created. Check your email to confirm (if required), then log in.";
      }
    } catch (error) {
      showError(error);
    }
  });
}

export function initResetPasswordPage() {
  const form = document.getElementById("reset-password-form");
  const message = document.getElementById("reset-message");
  const intro = document.getElementById("reset-intro");
  const supabase = getClient();

  initPasswordToggles();

  if (!supabase || !form) return;

  const showError = (error) => {
    if (message) {
      message.textContent = formatAuthError(error);
      message.classList.remove("is-info");
    }
  };

  const showInfo = (text) => {
    if (message) {
      message.textContent = text;
      message.classList.add("is-info");
    }
  };

  const revealForm = () => {
    form.removeAttribute("hidden");
    if (intro) intro.textContent = "Choose a new password for your account.";
  };

  const showInvalidLink = () => {
    if (intro) {
      intro.textContent =
        "This reset link is missing or expired. Request a new one from the log in page.";
    }
    showError({ message: "Go to Log in → Forgot password? to try again." });
  };

  supabase.auth.getSession().then(({ data }) => {
    if (data.session) revealForm();
    else if (!window.location.hash.includes("type=recovery")) showInvalidLink();
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" || session) revealForm();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = String(new FormData(form).get("password") || "");

    try {
      await updatePassword(password);
      showInfo("Password updated. Redirecting to log in...");
      await supabase.auth.signOut();
      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (error) {
      showError(error);
    }
  });
}
