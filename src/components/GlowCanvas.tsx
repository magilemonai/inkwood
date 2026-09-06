import { useEffect, useRef } from "react";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import { useGameStore } from "../store";
import type { GlowLight, SceneManifest } from "../scenes/manifest";

/**
 * Full-container WebGL quad, screen-blended over the SVG scene.
 *
 * One fragment shader does all the work per pixel: light falloff from
 * the manifest's sources (with noise flicker), a drifting fbm haze band,
 * soft dust motes (positions and brightness computed on the CPU each
 * frame so the shader stays cheap), a brief global bloom when a phrase
 * completes, and brightening film grain that lives in the dark.
 *
 * Hygiene: DPR capped at 1.5, one renderer per mount, paused while the
 * tab is hidden, disposed on unmount. A short FPS probe after warm-up
 * turns the layer off on hardware that can't hold it — the game beneath
 * is the shipped SVG game, untouched.
 *
 * Reduced motion: flicker, drift, and grain animation go still; the
 * light itself stays.
 */

const VIEW_W = 400;
const VIEW_H = 250;
const MAX_LIGHTS = 12;
const MAX_MOTES = 24;
const DPR_CAP = 1.5;
const PROBE_WARMUP = 12;
const PROBE_FRAMES = 60;
const PROBE_MAX_MS = 26; // ~38 fps average → not worth the battery; turn off

const VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  #define MAX_LIGHTS ${MAX_LIGHTS}
  #define MAX_MOTES ${MAX_MOTES}

  uniform vec2 uRes;          // drawing buffer size (device px)
  uniform vec3 uView;         // viewBox→device: scale, offX, offY
  uniform float uTime;
  uniform float uExhale;
  uniform float uReduced;
  uniform int uLightCount;
  uniform vec4 uLights[MAX_LIGHTS];      // x, y, radius, intensity
  uniform vec4 uLightColor[MAX_LIGHTS];  // r, g, b, flicker
  uniform vec4 uLightShape[MAX_LIGHTS];  // yScale, core, -, -
  uniform vec4 uHaze;         // top, bottom, density, on
  uniform vec3 uHazeColor;
  uniform int uMoteCount;
  uniform vec4 uMotes[MAX_MOTES];        // x, y, size, brightness
  uniform vec3 uMoteColor;
  uniform float uGrain;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float noise1(float t) {
    float i = floor(t);
    float f = fract(t);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash11(i), hash11(i + 1.0), f);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise2(p);
      p = p * 2.03 + 17.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Device px, top-left origin, into viewBox units.
    vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    vec2 vb = (px - uView.yz) / uView.x;

    vec3 col = vec3(0.0);
    float lit = 0.0;

    // ── Light sources ──
    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= uLightCount) break;
      vec4 L = uLights[i];
      if (L.w <= 0.001) continue;
      vec4 C = uLightColor[i];
      vec4 S = uLightShape[i];
      float ph = float(i) * 7.31;
      float fl = 1.0;
      if (C.w > 0.0 && uReduced < 0.5) {
        float n1 = noise1(uTime * 8.0 + ph) * 2.0 - 1.0;
        float n2 = noise1(uTime * 21.0 + ph * 1.7) * 2.0 - 1.0;
        fl = 1.0 + C.w * (0.65 * n1 + 0.35 * n2);
      }
      vec2 d = vb - L.xy;
      d.y *= S.x;
      float r = length(d) / L.z;
      float halo = exp(-r * r * 2.4);
      float core = exp(-r * r * 26.0) * S.y;
      float I = L.w * fl * (halo + core);
      col += C.rgb * I;
      lit += I;
    }

    // ── Haze — a band of slow air, warmer where the light reaches ──
    if (uHaze.w > 0.5) {
      float band = smoothstep(uHaze.x - 20.0, uHaze.x + 30.0, vb.y)
                 * (1.0 - smoothstep(uHaze.y - 30.0, uHaze.y + 20.0, vb.y));
      float drift = uReduced < 0.5 ? uTime * 0.03 : 0.0;
      float h = fbm(vb * 0.018 + vec2(drift, drift * 0.4));
      h = smoothstep(0.35, 0.82, h);
      col += uHazeColor * h * band * uHaze.z * (0.35 + lit * 1.6);
    }

    // ── Dust motes — soft dots, only bright where the CPU found light ──
    for (int i = 0; i < MAX_MOTES; i++) {
      if (i >= uMoteCount) break;
      vec4 M = uMotes[i];
      if (M.w <= 0.001) continue;
      float md = length(vb - M.xy) / M.z;
      col += uMoteColor * M.w * exp(-md * md * 3.0);
    }

    // ── Exhale — the world blooms for a breath when a phrase completes ──
    col *= 1.0 + uExhale * 0.35;

    // ── Grain — lives in the dark, fades where the light is ──
    float gt = uReduced < 0.5 ? floor(uTime * 24.0) * 13.7 : 0.0;
    float g = (hash21(px + gt) - 0.5) * uGrain * (1.0 - clamp(lit * 1.5, 0.0, 1.0));
    col += max(g, 0.0);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Same falloff as the shader's halo, on the CPU, for mote brightness. */
function lightAt(x: number, y: number, lights: GlowLight[]): number {
  let sum = 0;
  for (const L of lights) {
    if (L.intensity <= 0.001) continue;
    const dx = x - L.x;
    const dy = (y - L.y) * (L.yScale ?? 1);
    const r = Math.hypot(dx, dy) / L.radius;
    sum += L.intensity * Math.exp(-r * r * 2.4);
  }
  return sum;
}

function hash(i: number, salt: number): number {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export default function GlowCanvas({ manifest }: { manifest: SceneManifest }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
    } catch {
      console.info("[glow] WebGL unavailable; layer off");
      canvas.style.display = "none";
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 1);

    const reduced = prefersReducedMotion();

    const uniforms = {
      uRes: { value: new Vector2(1, 1) },
      uView: { value: new Vector3(1, 0, 0) },
      uTime: { value: 0 },
      uExhale: { value: 0 },
      uReduced: { value: reduced ? 1 : 0 },
      uLightCount: { value: 0 },
      uLights: { value: Array.from({ length: MAX_LIGHTS }, () => new Vector4()) },
      uLightColor: { value: Array.from({ length: MAX_LIGHTS }, () => new Vector4()) },
      uLightShape: { value: Array.from({ length: MAX_LIGHTS }, () => new Vector4(1, 0, 0, 0)) },
      uHaze: { value: new Vector4(0, 0, 0, 0) },
      uHazeColor: { value: new Vector3(1, 1, 1) },
      uMoteCount: { value: 0 },
      uMotes: { value: Array.from({ length: MAX_MOTES }, () => new Vector4()) },
      uMoteColor: { value: new Vector3(1, 1, 1) },
      uGrain: { value: manifest.grain },
    };

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new PlaneGeometry(2, 2);
    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });
    scene.add(new Mesh(geometry, material));

    // viewBox → device px for preserveAspectRatio="xMidYMid slice".
    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      const dw = w * dpr;
      const dh = h * dpr;
      uniforms.uRes.value.set(dw, dh);
      const scale = Math.max(dw / VIEW_W, dh / VIEW_H);
      uniforms.uView.value.set(scale, (dw - VIEW_W * scale) / 2, (dh - VIEW_H * scale) / 2);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    // Mote seeds: base position within the region, phase, speed.
    const moteSeed = Array.from({ length: MAX_MOTES }, (_, i) => ({
      u: hash(i, 1), v: hash(i, 2), ph: hash(i, 3) * Math.PI * 2, sp: 0.6 + hash(i, 4) * 0.8,
    }));

    let raf = 0;
    let running = true;
    let disabled = false;
    const start = performance.now();
    let last = start;
    let frames = 0;
    let probeAccum = 0;
    let wasCompleting = false;
    let exhaleAt = -Infinity;
    let lastReducedRender = 0;

    const tick = (now: number) => {
      if (!running || disabled) return;
      raf = requestAnimationFrame(tick);

      const dt = now - last;
      last = now;

      // FPS probe after warm-up: bail out on hardware that can't hold it.
      frames++;
      if (frames > PROBE_WARMUP && frames <= PROBE_WARMUP + PROBE_FRAMES) {
        probeAccum += dt;
        if (frames === PROBE_WARMUP + PROBE_FRAMES && probeAccum / PROBE_FRAMES > PROBE_MAX_MS) {
          disabled = true;
          canvas.style.display = "none";
          console.info(`[glow] average frame ${(probeAccum / PROBE_FRAMES).toFixed(1)}ms; layer off`);
          return;
        }
      }

      // Reduced motion: nothing animates, so ~4 fps is plenty.
      if (reduced && now - lastReducedRender < 250) return;
      lastReducedRender = now;

      const state = useGameStore.getState();
      const p = state.levelProgress();
      const t = (now - start) / 1000;

      if (state.completing && !wasCompleting) exhaleAt = now;
      wasCompleting = state.completing;
      const ex = (now - exhaleAt) / 420;
      uniforms.uExhale.value = ex >= 0 && ex < 1 ? Math.sin(ex * Math.PI) : 0;

      const lights = manifest.lights(p);
      const n = Math.min(lights.length, MAX_LIGHTS);
      uniforms.uLightCount.value = n;
      for (let i = 0; i < n; i++) {
        const L = lights[i];
        uniforms.uLights.value[i].set(L.x, L.y, L.radius, L.intensity);
        uniforms.uLightColor.value[i].set(L.color[0], L.color[1], L.color[2], L.flicker);
        uniforms.uLightShape.value[i].set(L.yScale ?? 1, L.core ?? 0, 0, 0);
      }

      const haze = manifest.haze?.(p) ?? null;
      if (haze) {
        uniforms.uHaze.value.set(haze.top, haze.bottom, haze.density, 1);
        uniforms.uHazeColor.value.set(haze.color[0], haze.color[1], haze.color[2]);
      } else {
        uniforms.uHaze.value.w = 0;
      }

      const motes = manifest.motes?.(p) ?? null;
      if (motes) {
        const m = Math.min(motes.count, MAX_MOTES);
        uniforms.uMoteCount.value = m;
        uniforms.uMoteColor.value.set(motes.color[0], motes.color[1], motes.color[2]);
        const tt = reduced ? 0 : t * motes.speed;
        for (let i = 0; i < m; i++) {
          const s = moteSeed[i];
          // Slow rise with a lazy sideways wander; wraps within the region.
          const rise = ((s.v * motes.height - tt * 2.2 * s.sp) % motes.height + motes.height) % motes.height;
          const x = motes.x + s.u * motes.width + Math.sin(tt * 0.35 * s.sp + s.ph) * 5;
          const y = motes.y + rise;
          const twinkle = 0.55 + 0.45 * Math.sin(tt * 1.7 * s.sp + s.ph * 2.1);
          const b = Math.min(1, lightAt(x, y, lights) * 2.4) * twinkle * motes.alpha * 0.9;
          uniforms.uMotes.value[i].set(x, y, motes.size, b);
        }
      } else {
        uniforms.uMoteCount.value = 0;
      }

      uniforms.uTime.value = t;
      renderer.render(scene, camera);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running && !disabled) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [manifest]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-glow-canvas
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    />
  );
}
