/**
 * Parallax tile grid — inspired by @react-bits/GridMotion-JS-CSS
 * https://reactbits.dev
 */

import { bindEffectLifecycle } from "./effect-host.js";

const DEFAULT_TILE_COLORS = [
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#e94560",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#e94560",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#e94560",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#e94560",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#e94560",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
];

const ROWS = 4;
const COLS = 7;
const TOTAL_TILES = ROWS * COLS;

export function createGridMotion(container, options = {}) {
  if (!container) return null;

  const settings = {
    gradientColor: "black",
    tileColors: DEFAULT_TILE_COLORS,
    items: [],
    maxMoveAmount: 300,
    ...options,
  };

  const combinedItems =
    settings.items.length > 0
      ? settings.items.slice(0, TOTAL_TILES)
      : Array.from({ length: TOTAL_TILES }, (_, i) => `Item ${i + 1}`);

  const mount = document.createElement("div");
  mount.className = "grid-motion";
  Object.assign(mount.style, {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  });
  container.appendChild(mount);

  const intro = document.createElement("section");
  intro.className = "grid-motion__intro";
  Object.assign(intro.style, {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `radial-gradient(circle, ${settings.gradientColor} 0%, transparent 100%)`,
  });
  mount.appendChild(intro);

  const gridContainer = document.createElement("div");
  gridContainer.className = "grid-motion__container";
  Object.assign(gridContainer.style, {
    gap: "1rem",
    flex: "none",
    position: "relative",
    width: "150%",
    height: "150%",
    display: "grid",
    gridTemplateRows: `repeat(${ROWS}, 1fr)`,
    gridTemplateColumns: "100%",
    transform: "rotate(-15deg)",
    transformOrigin: "center center",
    zIndex: "2",
  });
  intro.appendChild(gridContainer);

  const rowEls = [];
  const rowPositions = new Array(ROWS).fill(0);
  const inertiaFactors = [0.6, 0.4, 0.3, 0.2];

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
    const row = document.createElement("div");
    row.className = "grid-motion__row";
    Object.assign(row.style, {
      display: "grid",
      gap: "1rem",
      gridTemplateColumns: `repeat(${COLS}, 1fr)`,
      willChange: "transform",
    });
    gridContainer.appendChild(row);
    rowEls.push(row);

    for (let itemIndex = 0; itemIndex < COLS; itemIndex++) {
      const tileIndex = rowIndex * COLS + itemIndex;
      const content = combinedItems[tileIndex];
      const tileColor = settings.tileColors[tileIndex % settings.tileColors.length] || "#111";

      const item = document.createElement("div");
      item.className = "grid-motion__item";
      Object.assign(item.style, { position: "relative" });

      const inner = document.createElement("div");
      inner.className = "grid-motion__item-inner";
      Object.assign(inner.style, {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "80px",
        overflow: "hidden",
        borderRadius: "10px",
        backgroundColor: tileColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "1.5rem",
      });

      if (typeof content === "string" && content.startsWith("http")) {
        const img = document.createElement("div");
        img.className = "grid-motion__item-img";
        Object.assign(img.style, {
          width: "100%",
          height: "100%",
          backgroundSize: "cover",
          backgroundPosition: "50% 50%",
          position: "absolute",
          inset: "0",
          backgroundImage: `url(${content})`,
        });
        inner.appendChild(img);
      } else {
        const text = document.createElement("div");
        text.className = "grid-motion__item-content";
        Object.assign(text.style, {
          padding: "1rem",
          textAlign: "center",
          zIndex: "1",
        });
        text.textContent = content;
        inner.appendChild(text);
      }

      item.appendChild(inner);
      row.appendChild(item);
    }
  }

  let mouseX = window.innerWidth / 2;
  let animateId = 0;
  let running = false;

  const onMouseMove = (e) => {
    mouseX = e.clientX;
  };

  const tick = () => {
    if (!running) return;
    animateId = requestAnimationFrame(tick);

    rowEls.forEach((row, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const target =
        ((mouseX / window.innerWidth) * settings.maxMoveAmount - settings.maxMoveAmount / 2) *
        direction;
      const lerpFactor = 0.04 + inertiaFactors[index] * 0.025;
      rowPositions[index] += (target - rowPositions[index]) * lerpFactor;
      row.style.transform = `translateX(${rowPositions[index]}px)`;
    });
  };

  window.addEventListener("mousemove", onMouseMove, { passive: true });

  const lifecycle = bindEffectLifecycle(container, {
    start: () => {
      if (running) return;
      running = true;
      animateId = requestAnimationFrame(tick);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(animateId);
    },
  });

  return {
    destroy() {
      lifecycle.end();
      lifecycle.destroyExtras();
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animateId);
      mount.remove();
    },
  };
}
