/**
 * Iridescent shifting waves — adapted from @react-bits/Iridescence-JS-CSS
 * https://reactbits.dev
 */

import { Renderer, Program, Mesh, Color, Triangle } from "https://esm.sh/ogl@1.0.11";
import { bindEffectLifecycle } from "./effect-host.js";

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

function normalizeColor(color) {
  if (Array.isArray(color) && color.length >= 3) {
    return color.slice(0, 3);
  }
  if (typeof color === "string") {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (!result) return [0.72, 0.45, 0.18];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  }
  return [0.72, 0.45, 0.18];
}

export function createIridescence(container, options = {}) {
  if (!container) return null;

  const settings = {
    color: [0.72, 0.45, 0.18],
    speed: 0.85,
    amplitude: 0.08,
    ...options,
  };

  const mount = document.createElement("div");
  mount.className = "iridescence-container";
  container.appendChild(mount);

  const renderer = new Renderer({ alpha: false, antialias: false });
  const gl = renderer.gl;
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  gl.canvas.style.display = "block";
  mount.appendChild(gl.canvas);

  const rgb = normalizeColor(settings.color);
  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(...rgb) },
      uResolution: {
        value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / Math.max(gl.canvas.height, 1)),
      },
      uAmplitude: { value: settings.amplitude },
      uSpeed: { value: settings.speed },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });
  let animateId = 0;
  let running = false;

  const resize = () => {
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height);
    program.uniforms.uResolution.value = new Color(
      gl.canvas.width,
      gl.canvas.height,
      gl.canvas.width / Math.max(gl.canvas.height, 1)
    );
    renderer.render({ scene: mesh });
  };

  const draw = (time) => {
    if (!running) return;
    animateId = requestAnimationFrame(draw);
    program.uniforms.uTime.value = time * 0.001;
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
