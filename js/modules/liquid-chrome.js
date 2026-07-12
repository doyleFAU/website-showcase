/**
 * Liquid chrome distortion — adapted from @react-bits/LiquidChrome-JS-CSS
 * https://reactbits.dev
 */

import { Renderer, Program, Mesh, Triangle } from "https://esm.sh/ogl@1.0.11";
import { animationsEnabled, bindEffectLifecycle } from "./effect-host.js";

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec3 uBaseColor;
uniform float uAmplitude;
uniform float uFrequencyX;
uniform float uFrequencyY;
uniform vec2 uMouse;
varying vec2 vUv;

vec4 renderImage(vec2 uvCoord) {
    vec2 fragCoord = uvCoord * uResolution.xy;
    vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);

    for (float i = 1.0; i < 10.0; i++){
        uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
        uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
    }

    vec2 diff = (uvCoord - uMouse);
    float dist = length(diff);
    float falloff = exp(-dist * 20.0);
    float ripple = sin(10.0 * dist - uTime * 2.0) * 0.03;
    uv += (diff / (dist + 0.0001)) * ripple * falloff;

    vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
    return vec4(color, 1.0);
}

void main() {
    vec4 col = vec4(0.0);
    int samples = 0;
    for (int i = -1; i <= 1; i++){
        for (int j = -1; j <= 1; j++){
            vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));
            col += renderImage(vUv + offset);
            samples++;
        }
    }
    gl_FragColor = col / float(samples);
}
`;

function normalizeColor(color) {
  if (Array.isArray(color) && color.length >= 3) {
    return color.slice(0, 3);
  }
  return [0.1, 0.1, 0.1];
}

export function createLiquidChrome(host, options = {}) {
  if (!host) return null;

  const settings = {
    baseColor: [0.1, 0.1, 0.1],
    speed: 0.2,
    amplitude: 0.3,
    frequencyX: 3,
    frequencyY: 3,
    interactive: true,
    ...options,
  };

  const mount = document.createElement("div");
  mount.className = "liquid-chrome-container";
  host.appendChild(mount);

  const renderer = new Renderer({ antialias: true });
  const gl = renderer.gl;
  gl.clearColor(1, 1, 1, 1);
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  gl.canvas.style.display = "block";
  mount.appendChild(gl.canvas);

  const baseColor = normalizeColor(settings.baseColor);
  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uResolution: {
        value: new Float32Array([
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height,
        ]),
      },
      uBaseColor: { value: new Float32Array(baseColor) },
      uAmplitude: { value: settings.amplitude },
      uFrequencyX: { value: settings.frequencyX },
      uFrequencyY: { value: settings.frequencyY },
      uMouse: { value: new Float32Array([0, 0]) },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  const handleMouseMove = (event) => {
    const rect = mount.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1 - (event.clientY - rect.top) / rect.height;
    const mouseUniform = program.uniforms.uMouse.value;
    mouseUniform[0] = x;
    mouseUniform[1] = y;
  };

  const handleTouchMove = (event) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = mount.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / rect.width;
      const y = 1 - (touch.clientY - rect.top) / rect.height;
      const mouseUniform = program.uniforms.uMouse.value;
      mouseUniform[0] = x;
      mouseUniform[1] = y;
    }
  };

  if (settings.interactive) {
    mount.addEventListener("mousemove", handleMouseMove);
    mount.addEventListener("touchmove", handleTouchMove);
  }

  let animateId = 0;
  let running = false;

  const resize = () => {
    const width = Math.max(1, mount.offsetWidth);
    const height = Math.max(1, mount.offsetHeight);
    renderer.setSize(width, height);
    const resUniform = program.uniforms.uResolution.value;
    resUniform[0] = gl.canvas.width;
    resUniform[1] = gl.canvas.height;
    resUniform[2] = gl.canvas.width / gl.canvas.height;
  };

  const draw = (timestamp) => {
    if (!running || !animationsEnabled()) return;
    animateId = requestAnimationFrame(draw);
    program.uniforms.uTime.value = timestamp * 0.001 * settings.speed;
    renderer.render({ scene: mesh });
  };

  const lifecycle = bindEffectLifecycle(host, {
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
      if (settings.interactive) {
        mount.removeEventListener("mousemove", handleMouseMove);
        mount.removeEventListener("touchmove", handleTouchMove);
      }
      if (mount.contains(gl.canvas)) mount.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      mount.remove();
    },
  };
}
