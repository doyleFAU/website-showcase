/**
 * Click spark burst on click — adapted from @react-bits/ClickSpark-JS-CSS
 * https://reactbits.dev
 */

const DEFAULTS = {
  sparkSize: 10,
  sparkRadius: 15,
  sparkCount: 8,
  duration: 400,
  easing: "ease-out",
  extraScale: 1.0,
};

function createEaseFunc(easing) {
  switch (easing) {
    case "linear":
      return (t) => t;
    case "ease-in":
      return (t) => t * t;
    case "ease-in-out":
      return (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    default:
      return (t) => t * (2 - t);
  }
}

function getSparkColor() {
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() ||
    "#2563eb"
  );
}

function animationsEnabled() {
  return document.documentElement.dataset.animations !== "off";
}

export function initClickSpark(options = {}) {
  const config = { ...DEFAULTS, ...options };
  const easeFunc = createEaseFunc(config.easing);

  const canvas = document.createElement("canvas");
  canvas.className = "click-spark-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let sparks = [];
  let animationId = null;

  const resizeCanvas = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
  };

  const draw = (timestamp) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sparkColor = config.sparkColor || getSparkColor();

    sparks = sparks.filter((spark) => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= config.duration) return false;

      const progress = elapsed / config.duration;
      const eased = easeFunc(progress);
      const distance = eased * config.sparkRadius * config.extraScale;
      const lineLength = config.sparkSize * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true;
    });

    animationId = requestAnimationFrame(draw);
  };

  const handleClick = (event) => {
    if (!animationsEnabled()) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();

    sparks.push(
      ...Array.from({ length: config.sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / config.sparkCount,
        startTime: now,
      }))
    );
  };

  resizeCanvas();
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleClick);
  animationId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(animationId);
    clearTimeout(resizeTimeout);
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("click", handleClick);
    canvas.remove();
  };
}
