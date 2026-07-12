/**
 * Floating particle field — adapted from @react-bits/Particles-JS-CSS
 * https://reactbits.dev
 */

import { Renderer, Camera, Geometry, Program, Mesh } from "https://esm.sh/ogl@1.0.11";
import { animationsEnabled, bindEffectLifecycle } from "./effect-host.js";

const defaultColors = ["#ffffff", "#ffffff", "#ffffff"];

const vertex = `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;

  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vRandom = random;
    vColor = color;

    vec3 pos = position * uSpread;
    pos.z *= 10.0;

    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);

    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = `
  precision highp float;

  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));

    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
}

export function createParticles(host, options = {}) {
  if (!host) return null;

  const settings = {
    particleCount: 200,
    particleSpread: 10,
    speed: 0.1,
    particleColors: null,
    moveParticlesOnHover: false,
    particleHoverFactor: 1,
    alphaParticles: false,
    particleBaseSize: 100,
    sizeRandomness: 1,
    cameraDistance: 20,
    disableRotation: false,
    pixelRatio: 1,
    ...options,
  };

  const mount = document.createElement("div");
  mount.className = "particles-container";
  host.appendChild(mount);

  const renderer = new Renderer({
    dpr: settings.pixelRatio,
    depth: false,
    alpha: true,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  gl.canvas.style.display = "block";
  mount.appendChild(gl.canvas);

  const camera = new Camera(gl, { fov: 15 });
  camera.position.set(0, 0, settings.cameraDistance);

  const mouse = { x: 0, y: 0 };

  const handleMouseMove = (e) => {
    const rect = mount.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.x = x;
    mouse.y = y;
  };

  if (settings.moveParticlesOnHover) {
    mount.addEventListener("mousemove", handleMouseMove);
  }

  const count = settings.particleCount;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const palette =
    settings.particleColors && settings.particleColors.length > 0
      ? settings.particleColors
      : defaultColors;

  for (let i = 0; i < count; i++) {
    let x;
    let y;
    let z;
    let len;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      len = x * x + y * y + z * z;
    } while (len > 1 || len === 0);
    const r = Math.cbrt(Math.random());
    positions.set([x * r, y * r, z * r], i * 3);
    randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
    colors.set(col, i * 3);
  }

  const geometry = new Geometry(gl, {
    position: { size: 3, data: positions },
    random: { size: 4, data: randoms },
    color: { size: 3, data: colors },
  });

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: settings.particleSpread },
      uBaseSize: { value: settings.particleBaseSize * settings.pixelRatio },
      uSizeRandomness: { value: settings.sizeRandomness },
      uAlphaParticles: { value: settings.alphaParticles ? 1 : 0 },
    },
    transparent: true,
    depthTest: false,
  });

  const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });

  let animateId = 0;
  let running = false;
  let lastTime = performance.now();
  let elapsed = 0;

  const resize = () => {
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height);
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
  };

  const draw = (timestamp) => {
    if (!running || !animationsEnabled()) return;
    animateId = requestAnimationFrame(draw);

    const delta = timestamp - lastTime;
    lastTime = timestamp;
    elapsed += delta * settings.speed;

    program.uniforms.uTime.value = elapsed * 0.001;

    if (settings.moveParticlesOnHover) {
      particles.position.x = -mouse.x * settings.particleHoverFactor;
      particles.position.y = -mouse.y * settings.particleHoverFactor;
    } else {
      particles.position.x = 0;
      particles.position.y = 0;
    }

    if (!settings.disableRotation) {
      particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
      particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
      particles.rotation.z += 0.01 * settings.speed;
    }

    renderer.render({ scene: particles, camera });
  };

  const lifecycle = bindEffectLifecycle(host, {
    start: () => {
      if (running) return;
      running = true;
      lastTime = performance.now();
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
      if (settings.moveParticlesOnHover) {
        mount.removeEventListener("mousemove", handleMouseMove);
      }
      if (mount.contains(gl.canvas)) mount.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      mount.remove();
    },
  };
}
