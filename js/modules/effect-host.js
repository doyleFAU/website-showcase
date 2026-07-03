export function animationsEnabled() {
  return document.documentElement.dataset.animations !== "off";
}

export function bindEffectLifecycle(container, { start, stop, onResize }) {
  let active = false;

  const begin = () => {
    if (active || !animationsEnabled()) return;
    active = true;
    onResize?.();
    start();
  };

  const end = () => {
    if (!active) return;
    active = false;
    stop();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) begin();
        else end();
      });
    },
    { threshold: 0.05 }
  );

  observer.observe(container);

  const onWindowResize = () => onResize?.();
  window.addEventListener("resize", onWindowResize);

  onResize?.();
  begin();

  return {
    begin,
    end,
    destroyExtras() {
      end();
      observer.disconnect();
      window.removeEventListener("resize", onWindowResize);
    },
  };
}
