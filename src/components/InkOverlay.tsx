import { useEffect, useRef } from "react";
import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import { subscribeInk, inkFocusFor, isWordEndAt } from "../ink";

/**
 * Full-viewport canvas that draws the ink motes: each accepted
 * keystroke lifts a glowing mote off its glyph in the prompt box and
 * arcs it into the scene, landing at the phrase's focus point with a
 * soft ripple. The overlay spans the whole viewport so the ink can
 * cross the boundary between the typing UI and the world — that
 * crossing is the point.
 *
 * All animation is imperative (rAF over a plain mote array); the rAF
 * loop runs only while motes or ripples are alive, so idle cost is
 * zero. Word-end letters release a brighter mote, timed with the
 * music's low bloom.
 *
 * Reduced motion: no travel — a soft pulse appears directly at the
 * landing point instead.
 */

interface Mote {
  x0: number; y0: number;   // launch (glyph center)
  cx: number; cy: number;   // bezier control
  x1: number; y1: number;   // landing (scene focus)
  born: number;
  duration: number;
  size: number;
  color: string;
  big: boolean;
}

interface Ripple {
  x: number; y: number;
  born: number;
  color: string;
  big: boolean;
}

const VIEW_W = 400;
const VIEW_H = 250;
const MAX_MOTES = 24;

/** viewBox → screen for `preserveAspectRatio="xMidYMid slice"`: the
 *  SVG scales to cover its container, centered, overflow cropped. */
function viewBoxToScreen(fx: number, fy: number, rect: DOMRect): [number, number] {
  const scale = Math.max(rect.width / VIEW_W, rect.height / VIEW_H);
  const offX = rect.left + (rect.width - VIEW_W * scale) / 2;
  const offY = rect.top + (rect.height - VIEW_H * scale) / 2;
  return [offX + fx * scale, offY + fy * scale];
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function InkOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motes: Mote[] = [];
    const ripples: Ripple[] = [];
    let raf = 0;
    let running = false;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        const t = Math.min(1, (now - m.born) / m.duration);
        // easeInOutQuad — a breath out, a settle in
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const u = 1 - e;
        const x = u * u * m.x0 + 2 * u * e * m.cx + e * e * m.x1;
        const y = u * u * m.y0 + 2 * u * e * m.cy + e * e * m.y1;
        // fade in over the first 12%, hold, hand off to the ripple
        const alpha = t < 0.12 ? t / 0.12 : t > 0.85 ? (1 - t) / 0.15 : 1;

        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        ctx.shadowColor = m.color;
        ctx.shadowBlur = m.big ? 14 : 8;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(x, y, m.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (t >= 1) {
          motes.splice(i, 1);
          ripples.push({ x: m.x1, y: m.y1, born: now, color: m.color, big: m.big });
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const t = Math.min(1, (now - r.born) / 450);
        const radius = 2 + t * (r.big ? 16 : 10);
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.5;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.big ? 1.6 : 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (t >= 1) ripples.splice(i, 1);
      }

      if (motes.length || ripples.length) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const unsubscribe = subscribeInk(({ charIndex }) => {
      const state = useGameStore.getState();
      const level = LEVELS[state.lvl];
      const target = state.target();

      const glyph = document.querySelector(
        `[data-prompt-box] [data-char-idx="${charIndex}"]`,
      );
      const sceneEl = document.querySelector("[data-scene-container]");
      if (!sceneEl) return;

      const [fx, fy] = inkFocusFor(level.scene, state.promptIdx);
      const [x1, y1] = viewBoxToScreen(fx, fy, sceneEl.getBoundingClientRect());
      const big = isWordEndAt(target, charIndex);
      const now = performance.now();

      if (prefersReducedMotion() || !glyph) {
        // No travel — pulse at the landing point.
        ripples.push({ x: x1, y: y1, born: now, color: level.accent, big });
        wake();
        return;
      }

      const g = glyph.getBoundingClientRect();
      const x0 = g.left + g.width / 2;
      const y0 = g.top + g.height / 2;
      // Control point: above the midpoint, biased toward the landing
      // side, so the mote lifts off the letter before diving in.
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const cx = (x0 + x1) / 2 + (x1 - x0) * 0.12;
      const cy = Math.min(y0, y1) - dist * 0.18 - 24;

      if (motes.length >= MAX_MOTES) motes.shift();
      // Scale mote size gently with viewport width so desktop reads as
      // clearly as a phone held close.
      const sizeScale = Math.max(1, Math.min(1.6, window.innerWidth / 900));
      motes.push({
        x0, y0, cx, cy, x1, y1,
        born: now,
        duration: 620 + Math.random() * 240,
        size: (big ? 3.4 : 2.2) * sizeScale,
        color: level.accent,
        big,
      });
      wake();
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 40,
      }}
    />
  );
}
