/**
 * Organic plasma gradients — adapted from @react-bits/Plasma-JS-CSS
 * https://reactbits.dev
 */

import { Renderer, Program, Mesh, Triangle } from "https://esm.sh/ogl@1.0.11";
import { bindEffectLifecycle } from "./effect-host.js";

const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;

  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  for (vec2 r = iResolution.xy, Q; ++i < 60.; O += o.w / d * o.xyz) {
    p = z * normalize(vec3(C - 0.5 * r, r.y));
    p.z -= 4.;
    S = p;
    d = p.y - T;

    p.x += 0.4 * (1. + p.y) * sin(d + p.x * 0.1) * cos(0.34 * d + p.x * 0.05);
    Q = p.xz *= mat2(cos(p.y + vec4(0, 11, 33, 0) - T));
    z += d = abs(sqrt(length(Q * Q)) - 0.25 * (5. + S.y)) / 3. + 8e-4;
    o = 1. + sin(S.y + p.z * 0.5 + S.z - length(S - p) + vec4(2, 1, 0, 8));
  }

  o.xyz = tanh(O / 1e4);
}

bool finite1(float x) { return !(isnan(x) || isinf(x)); }

vec3 sanitize(vec3 c) {
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);

  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));

  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}
`;

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.98, 0.45, 0.09];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

export function createPlasma(container, options = {}) {
  if (!container) return null;

  const settings = {
    color: "#f97316",
    speed: 1.1,
    direction: 1,
    scale: 1.05,
    opacity: 0.9,
    ...options,
  };

  const mount = document.createElement("div");
  mount.className = "plasma-container";
  container.appendChild(mount);

  let renderer;
  try {
    renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
  } catch {
    mount.remove();
    return null;
  }

  const gl = renderer.gl;
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  gl.canvas.style.display = "block";
  mount.appendChild(gl.canvas);

  const geometry = new Triangle(gl);
  const customColorRgb = hexToRgb(settings.color);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new Float32Array([1, 1]) },
      uCustomColor: { value: new Float32Array(customColorRgb) },
      uUseCustomColor: { value: settings.color ? 1.0 : 0.0 },
      uSpeed: { value: settings.speed * 0.4 },
      uDirection: { value: settings.direction },
      uScale: { value: settings.scale },
      uOpacity: { value: settings.opacity },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });
  const startTime = performance.now();
  let animateId = 0;
  let running = false;

  const resize = () => {
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height);
    const res = program.uniforms.iResolution.value;
    res[0] = gl.drawingBufferWidth;
    res[1] = gl.drawingBufferHeight;
    renderer.render({ scene: mesh });
  };

  const draw = (time) => {
    if (!running) return;
    animateId = requestAnimationFrame(draw);
    program.uniforms.iTime.value = (time - startTime) * 0.001;
    renderer.render({ scene: mesh });
  };

  const lifecycle = bindEffectLifecycle(container, {
    start: () => {
      if (running) return;
      running = true;
      animateId = requestAnimationFrame(draw);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(animateId);
    },
    onResize: resize,
  });

  return {
    destroy() {
      lifecycle.end();
      lifecycle.destroyExtras();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      mount.remove();
    },
  };
}
