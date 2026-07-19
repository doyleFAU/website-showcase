import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from "../config/supabase.js";
import { showToast } from "./checklist.js";

function sanitizeText(value, max) {
  return String(value ?? "")
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setStatus(el, text, isError = false) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("is-error", isError);
  el.classList.toggle("is-success", !isError && Boolean(text));
}

export function initContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-form-status");
  if (!form) return;

  if (!isSupabaseConfigured()) {
    setStatus(
      status,
      "Contact form is not connected yet. Add Supabase keys in your project settings.",
      true,
    );
    form.querySelectorAll("input, textarea, button").forEach((el) => {
      el.disabled = true;
    });
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "");

    const data = new FormData(form);
    if (data.get("company")) return;

    const email = sanitizeText(data.get("email"), 254);
    const name = sanitizeText(data.get("name"), 80);
    const message = sanitizeText(data.get("message"), 2000);

    if (!email || !message) {
      setStatus(status, "Please enter your email and message.", true);
      return;
    }

    if (!isValidEmail(email)) {
      setStatus(status, "Please enter a valid email address.", true);
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button?.setAttribute("disabled", "true");

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/contact-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, name, message }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || body.error) {
        throw new Error(body.error || "Something went wrong. Please try again.");
      }

      form.reset();
      setStatus(status, "Thanks — your message was sent. We'll get back to you soon.");
      showToast("Message sent!");
    } catch (error) {
      setStatus(status, error.message || "Could not send your message.", true);
    } finally {
      button?.removeAttribute("disabled");
    }
  });
}
