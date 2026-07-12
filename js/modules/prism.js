/**
 * Ray-marched prism — adapted from @react-bits/Prism-JS-CSS
 * https://reactbits.dev
 */

import { Renderer, Triangle, Program, Mesh } from "https://esm.sh/ogl@1.0.11";
import { bindEffectLifecycle } from "./effect-host.js";

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2  iResolution;
uniform float iTime;

uniform float uHeight;
uniform float uBaseHalf;
uniform mat3  uRot;
uniform int   uUseBaseWobble;
uniform float uGlow;
uniform vec2  uOffsetPx;
uniform float uNoise;
uniform float uSaturation;
uniform float uScale;
uniform float uHueShift;
uniform float uColorFreq;
uniform float uBloom;
uniform float uCenterShift;
uniform float uInvBaseHalf;
uniform float uInvHeight;
uniform float uMinAxis;
uniform float uPxScale;
uniform float uTimeScale;

vec4 tanh4(vec4 x){
  vec4 e2x = exp(2.0*x);
  return (e2x - 1.0) / (e2x + 1.0);
}

float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
}

float sdOctaAnisoInv(vec3 p){
  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
  float m = q.x + q.y + q.z - 1.0;
  return m * uMinAxis * 0.5773502691896258;
}

float sdPyramidUpInv(vec3 p){
  float oct = sdOctaAnisoInv(p);
  float halfSpace = -p.y;
  return max(oct, halfSpace);
}

mat3 hueRotation(float a){
  float c = cos(a), s = sin(a);
  mat3 W = mat3(
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114
  );
  mat3 U = mat3(
     0.701, -0.587, -0.114,
    -0.299,  0.413, -0.114,
    -0.300, -0.588,  0.886
  );
  mat3 V = mat3(
     0.168, -0.331,  0.500,
     0.328,  0.035, -0.500,
    -0.497,  0.296,  0.201
  );
  return W + U * c + V * s;
}

void main(){
  vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;

  float z = 5.0;
  float d = 0.0;

  vec3 p;
  vec4 o = vec4(0.0);

  float centerShift = uCenterShift;
  float cf = uColorFreq;

  mat2 wob = mat2(1.0);
  if (uUseBaseWobble == 1) {
    float t = iTime * uTimeScale;
    float c0 = cos(t + 0.0);
    float c1 = cos(t + 33.0);
    float c2 = cos(t + 11.0);
    wob = mat2(c0, c1, c2, c0);
  }

  const int STEPS = 100;
  for (int i = 0; i < STEPS; i++) {
    p = vec3(f, z);
    p.xz = p.xz * wob;
    p = uRot * p;
    vec3 q = p;
    q.y += centerShift;
    d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
    z -= d;
    o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
  }

  o = tanh4(o * o * (uGlow * uBloom) / 1e5);

  vec3 col = o.rgb;
  float n = rand(gl_FragCoord.xy + vec2(iTime));
  col += (n - 0.5) * uNoise;
  col = clamp(col, 0.0, 1.0);

  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);

  if(abs(uHueShift) > 0.0001){
    col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
  }

  gl_FragColor = vec4(col, o.a);
}
`;

function setMat3FromEuler(yawY, pitchX, rollZ, out) {
  const cy = Math.cos(yawY);
  const sy = Math.sin(yawY);
  const cx = Math.cos(pitchX);
  const sx = Math.sin(pitchX);
  const cz = Math.cos(rollZ);
  const sz = Math.sin(rollZ);

  out[0] = cy * cz + sy * sx * sz;
  out[1] = cx * sz;
  out[2] = -sy * cz + cy * sx * sz;
  out[3] = -cy * sz + sy * sx * cz;
  out[4] = cx * cz;
  out[5] = sy * sz + cy * sx * cz;
  out[6] = sy * cx;
  out[7] = -sx;
  out[8] = cy * cx;
  return out;
}

export function createPrism(container, options = {}) {
  if (!container) return null;

  const settings = {
    height: 3.5,
    baseWidth: 5.5,
    animationType: "rotate",
    glow: 1,
    offset: { x: 0, y: 0 },
    noise: 0.5,
    transparent: true,
    scale: 3.6,
    hueShift: 0,
    colorFrequency: 1,
    hoverStrength: 2,
    inertia: 0.05,
    bloom: 1,
    suspendWhenOffscreen: true,
    timeScale: 0.5,
    ...options,
  };

  const H = Math.max(0.001, settings.height);
  const BW = Math.max(0.001, settings.baseWidth);
  const BASE_HALF = BW * 0.5;
  const GLOW = Math.max(0, settings.glow);
  const NOISE = Math.max(0, settings.noise);
  const offX = settings.offset?.x ?? 0;
  const offY = settings.offset?.y ?? 0;
  const SAT = settings.transparent ? 1.5 : 1;
  const SCALE = Math.max(0.001, settings.scale);
  const HUE = settings.hueShift || 0;
  const CFREQ = Math.max(0, settings.colorFrequency || 1);
  const BLOOM = Math.max(0, settings.bloom || 1);
  const TS = Math.max(0, settings.timeScale || 1);
  const HOVSTR = Math.max(0, settings.hoverStrength || 1);
  const INERT = Math.max(0, Math.min(1, settings.inertia || 0.12));
  const NOISE_IS_ZERO = NOISE < 1e-6;

  const mount = document.createElement("div");
  mount.className = "prism-container";
  Object.assign(mount.style, {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  });
  container.appendChild(mount);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const renderer = new Renderer({
    dpr,
    alpha: settings.transparent,
    antialias: false,
  });
  const gl = renderer.gl;
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);

  Object.assign(gl.canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
  });
  mount.appendChild(gl.canvas);

  const iResBuf = new Float32Array(2);
  const offsetPxBuf = new Float32Array(2);
  const rotBuf = new Float32Array(9);

  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      iResolution: { value: iResBuf },
      iTime: { value: 0 },
      uHeight: { value: H },
      uBaseHalf: { value: BASE_HALF },
      uUseBaseWobble: { value: 1 },
      uRot: { value: rotBuf },
      uGlow: { value: GLOW },
      uOffsetPx: { value: offsetPxBuf },
      uNoise: { value: NOISE },
      uSaturation: { value: SAT },
      uScale: { value: SCALE },
      uHueShift: { value: HUE },
      uColorFreq: { value: CFREQ },
      uBloom: { value: BLOOM },
      uCenterShift: { value: H * 0.25 },
      uInvBaseHalf: { value: 1 / BASE_HALF },
      uInvHeight: { value: 1 / H },
      uMinAxis: { value: Math.min(BASE_HALF, H) },
      uPxScale: { value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE) },
      uTimeScale: { value: TS },
    },
  });

  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const rnd = () => Math.random();
  const wX = 0.3 + rnd() * 0.6;
  const wY = 0.2 + rnd() * 0.7;
  const wZ = 0.1 + rnd() * 0.5;
  const phX = rnd() * Math.PI * 2;
  const phZ = rnd() * Math.PI * 2;

  let yaw = 0;
  let pitch = 0;
  let roll = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  const pointer = { x: 0, y: 0, inside: true };

  const lerp = (a, b, t) => a + (b - a) * t;

  let animateId = 0;
  let running = false;
  const t0 = performance.now();

  const resize = () => {
    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;
    renderer.setSize(w, h);
    iResBuf[0] = gl.drawingBufferWidth;
    iResBuf[1] = gl.drawingBufferHeight;
    offsetPxBuf[0] = offX * dpr;
    offsetPxBuf[1] = offY * dpr;
    program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE);
  };

  const onMove = (e) => {
    const ww = Math.max(1, window.innerWidth);
    const wh = Math.max(1, window.innerHeight);
    const cx = ww * 0.5;
    const cy = wh * 0.5;
    const nx = (e.clientX - cx) / (ww * 0.5);
    const ny = (e.clientY - cy) / (wh * 0.5);
    pointer.x = Math.max(-1, Math.min(1, nx));
    pointer.y = Math.max(-1, Math.min(1, ny));
    pointer.inside = true;
  };

  const onLeave = () => {
    pointer.inside = false;
  };

  const onBlur = () => {
    pointer.inside = false;
  };

  const startRender = () => {
    if (running) return;
    running = true;
    animateId = requestAnimationFrame(draw);
  };

  let onPointerMove = null;
  if (settings.animationType === "hover") {
    onPointerMove = (e) => {
      onMove(e);
      startRender();
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onBlur);
    program.uniforms.uUseBaseWobble.value = 0;
  } else if (settings.animationType === "3drotate") {
    program.uniforms.uUseBaseWobble.value = 0;
  } else {
    program.uniforms.uUseBaseWobble.value = 1;
  }

  const draw = (t) => {
    if (!running) return;

    const time = (t - t0) * 0.001;
    program.uniforms.iTime.value = time;

    let continueRAF = true;

    if (settings.animationType === "hover") {
      const maxPitch = 0.6 * HOVSTR;
      const maxYaw = 0.6 * HOVSTR;
      targetYaw = (pointer.inside ? -pointer.x : 0) * maxYaw;
      targetPitch = (pointer.inside ? pointer.y : 0) * maxPitch;
      yaw = lerp(yaw, targetYaw, INERT);
      pitch = lerp(pitch, targetPitch, INERT);
      roll = lerp(roll, 0, 0.1);
      program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);

      if (NOISE_IS_ZERO) {
        const settled =
          Math.abs(yaw - targetYaw) < 1e-4 &&
          Math.abs(pitch - targetPitch) < 1e-4 &&
          Math.abs(roll) < 1e-4;
        if (settled) continueRAF = false;
      }
    } else if (settings.animationType === "3drotate") {
      const tScaled = time * TS;
      yaw = tScaled * wY;
      pitch = Math.sin(tScaled * wX + phX) * 0.6;
      roll = Math.sin(tScaled * wZ + phZ) * 0.5;
      program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);
      if (TS < 1e-6) continueRAF = false;
    } else {
      rotBuf[0] = 1;
      rotBuf[1] = 0;
      rotBuf[2] = 0;
      rotBuf[3] = 0;
      rotBuf[4] = 1;
      rotBuf[5] = 0;
      rotBuf[6] = 0;
      rotBuf[7] = 0;
      rotBuf[8] = 1;
      program.uniforms.uRot.value = rotBuf;
      if (TS < 1e-6) continueRAF = false;
    }

    renderer.render({ scene: mesh });

    if (continueRAF) {
      animateId = requestAnimationFrame(draw);
    } else {
      running = false;
      animateId = 0;
    }
  };

  let lifecycle = null;

  if (settings.suspendWhenOffscreen) {
    lifecycle = bindEffectLifecycle(container, {
      start: () => {
        if (running) return;
        running = true;
        animateId = requestAnimationFrame(draw);
      },
      stop: () => {
        running = false;
        cancelAnimationFrame(animateId);
        animateId = 0;
      },
      onResize: resize,
    });
  } else {
    resize();
    running = true;
    animateId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
  }

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(animateId);

      if (lifecycle) {
        lifecycle.end();
        lifecycle.destroyExtras();
      } else {
        window.removeEventListener("resize", resize);
      }

      if (settings.animationType === "hover") {
        if (onPointerMove) window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("mouseleave", onLeave);
        window.removeEventListener("blur", onBlur);
      }

      if (mount.contains(gl.canvas)) mount.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      mount.remove();
    },
  };
}
