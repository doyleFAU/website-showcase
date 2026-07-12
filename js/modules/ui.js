import { isAllowedPartial, isSafeHashSelector } from "./security.js";
import { HASH_TO_PAGE } from "../config/routes.js";
import { showToast } from "./checklist.js";

function currentPage() {
  const path = window.location.pathname.split("/").pop();
  return path || "index.html";
}

function navigateToTarget(selector) {
  if (!isSafeHashSelector(selector)) return;

  const target = document.querySelector(selector);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const page = HASH_TO_PAGE[selector];
  if (page) window.location.href = page;
}

export function initNavigation() {
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => navigateToTarget(button.dataset.scroll));
  });

  const menuButton = document.getElementById("menu-toggle");
  const nav = document.getElementById("site-nav");
  menuButton?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("is-open"));
  });

  if (!nav) return;

  const page = currentPage();
  nav.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    const isHome = page === "index.html" && (href === "index.html" || href === "./");
    const isMatch = href === page || href.endsWith(`/${page}`);
    link.classList.toggle("is-active", isHome || isMatch);
  });
}

export function initBackToTop() {
  const button = document.getElementById("back-to-top");
  if (!button) return;

  const showAfter = 320;

  const update = () => {
    const visible = window.scrollY > showAfter;
    button.hidden = !visible;
    button.classList.toggle("is-visible", visible);
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", update, { passive: true });
  update();
}

export async function loadPartials() {
  const slots = document.querySelectorAll("[data-partial]");
  await Promise.all(
    [...slots].map(async (slot) => {
      if (slot.innerHTML.trim()) return;
      const url = slot.dataset.partial;
      if (!isAllowedPartial(url)) throw new Error(`Blocked partial path: ${url}`);
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Failed to load partial: ${url}`);
      slot.innerHTML = await response.text();
    })
  );
}

export function initHelpSteps() {
  document.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => navigateToTarget(button.dataset.step));
  });
}

export function showPendingToast() {
  const message = sessionStorage.getItem("showcase-toast");
  if (!message) return;
  sessionStorage.removeItem("showcase-toast");
  showToast(message);
}
