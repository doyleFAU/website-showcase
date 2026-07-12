/**
 * Interactive dot grid — adapted from @react-bits/DotGrid-JS-CSS
 * https://reactbits.dev
 */

import { bindEffectLifecycle } from "./effect-host.js";

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

export function createDotGrid(container, options = {}) {
  if (!container) return null;

  const settings = {
    dotSize: 16,
    gap: 32,
    baseColor: "#5227FF",
    activeColor: "#5227FF",
    proximity: 150,
    speedTrigger: 100,
    shockRadius: 250,
    shockStrength: 5,
    maxSpeed: 5000,
    springStiffness: 0.08,
    damping: 0.82,
    pushScale: 0.12,
    ...options,
  };

  const mount = document.createElement("div");
  mount.className = "dot-grid";
  Object.assign(mount.style, {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  });
  container.appendChild(mount);

  const wrap = document.createElement("div");
  wrap.className = "dot-grid__wrap";
  Object.assign(wrap.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
  });
  mount.appendChild(wrap);

  const canvas = document.createElement("canvas");
  canvas.className = "dot-grid__canvas";
  Object.assign(canvas.style, {
    display: "block",
    width: "100%",
    height: "100%",
  });
  wrap.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    mount.remove();
    return null;
  }

  let dots = [];
  let circlePath = null;
  let baseRgb = hexToRgb(settings.baseColor);
  let activeRgb = hexToRgb(settings.activeColor);

  const pointer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  };

  let animateId = 0;
  let running = false;

  const buildGrid = () => {
    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, width * dpr);
    canvas.height = Math.max(1, height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { dotSize, gap } = settings;
    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;
    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          vx: 0,
          vy: 0,
        });
      }
    }

    if (typeof Path2D !== "undefined") {
      circlePath = new Path2D();
      circlePath.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    } else {
      circlePath = null;
    }
  };

  const applyPush = (dot, px, py, impulseX, impulseY) => {
    const dist = Math.hypot(dot.cx - px, dot.cy - py);
    if (dist >= settings.proximity) return;
    const falloff = 1 - dist / settings.proximity;
    dot.vx += impulseX * falloff;
    dot.vy += impulseY * falloff;
  };

  const stepPhysics = () => {
    const { springStiffness, damping } = settings;
    for (const dot of dots) {
      dot.vx += -dot.xOffset * springStiffness;
      dot.vy += -dot.yOffset * springStiffness;
      dot.vx *= damping;
      dot.vy *= damping;
      dot.xOffset += dot.vx;
      dot.yOffset += dot.vy;
    }
  };

  const draw = () => {
    if (!running || !circlePath) return;
    animateId = requestAnimationFrame(draw);

    stepPhysics();

    const { width, height } = wrap.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);

    const proxSq = settings.proximity * settings.proximity;
    const { x: px, y: py } = pointer;

    for (const dot of dots) {
      const ox = dot.cx + dot.xOffset;
      const oy = dot.cy + dot.yOffset;
      const dx = dot.cx - px;
      const dy = dot.cy - py;
      const dsq = dx * dx + dy * dy;

      let fill = settings.baseColor;
      if (dsq <= proxSq) {
        const dist = Math.sqrt(dsq);
        const t = 1 - dist / settings.proximity;
        const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
        const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
        const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
        fill = `rgb(${r},${g},${b})`;
      }

      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = fill;
      ctx.fill(circlePath);
      ctx.restore();
    }
  };

  const onMove = (e) => {
    const now = performance.now();
    const dt = pointer.lastTime ? now - pointer.lastTime : 16;
    const dx = e.clientX - pointer.lastX;
    const dy = e.clientY - pointer.lastY;
    let vx = (dx / dt) * 1000;
    let vy = (dy / dt) * 1000;
    let speed = Math.hypot(vx, vy);

    if (speed > settings.maxSpeed) {
      const scale = settings.maxSpeed / speed;
      vx *= scale;
      vy *= scale;
      speed = settings.maxSpeed;
    }

    pointer.lastTime = now;
    pointer.lastX = e.clientX;
    pointer.lastY = e.clientY;
    pointer.vx = vx;
    pointer.vy = vy;
    pointer.speed = speed;

    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;

    if (speed > settings.speedTrigger) {
      for (const dot of dots) {
        const pushX = (dot.cx - pointer.x + vx * 0.005) * settings.pushScale;
        const pushY = (dot.cy - pointer.y + vy * 0.005) * settings.pushScale;
        applyPush(dot, pointer.x, pointer.y, pushX, pushY);
      }
    }
  };

  const onClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    for (const dot of dots) {
      const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
      if (dist < settings.shockRadius) {
        const falloff = Math.max(0, 1 - dist / settings.shockRadius);
        dot.vx += (dot.cx - cx) * settings.shockStrength * falloff * 0.15;
        dot.vy += (dot.cy - cy) * settings.shockStrength * falloff * 0.15;
      }
    }
  };

  baseRgb = hexToRgb(settings.baseColor);
  activeRgb = hexToRgb(settings.activeColor);

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("click", onClick);

  const lifecycle = bindEffectLifecycle(container, {
    start: () => {
      if (running) return;
      buildGrid();
      running = true;
      animateId = requestAnimationFrame(draw);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(animateId);
    },
    onResize: buildGrid,
  });

  return {
    destroy() {
      lifecycle.end();
      lifecycle.destroyExtras();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      cancelAnimationFrame(animateId);
      mount.remove();
    },
  };
}
