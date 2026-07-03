export function initNavigation() {
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scroll);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

  const links = [...document.querySelectorAll(".site-nav a")];
  const sections = links
    .map((link) => {
      const id = link.getAttribute("href")?.replace("#", "");
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove("is-active"));
        const match = sections.find(({ section }) => section === entry.target);
        match?.link.classList.add("is-active");
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach(({ section }) => observer.observe(section));
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
      const url = slot.dataset.partial;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load partial: ${url}`);
      slot.innerHTML = await response.text();
    })
  );
}

export function initHelpSteps() {
  document.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.step);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
