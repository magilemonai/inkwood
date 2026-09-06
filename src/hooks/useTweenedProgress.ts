import { useEffect, useRef, useState } from "react";
import { setDisplayProgress } from "../displayProgress";

/**
 * Ease the displayed level progress toward the store's target so every
 * keystroke moves the world continuously.
 *
 * The scenes are pure functions of progress, and the store only changes
 * progress when a key lands, so without this the world snaps from one
 * state to the next and sits still between letters: a slow typist sees
 * snap, pause, snap; a fast typist sees a flipbook at their own cadence.
 * With it, each accepted letter starts a short ease-out toward the new
 * target (a new keystroke mid-tween simply retargets from wherever the
 * display is), so the frames flow at any typing speed. The 1.5s breath
 * after a phrase is long enough for the last tween to land.
 *
 * Cost: the displayed value is quantized to 0.005, so a typical keystroke
 * (2–4% of level progress) passes through at most a handful of distinct
 * scene renders. Snaps (no tween) on a level change, when disabled, and
 * under prefers-reduced-motion.
 */

const STEP = 0.005;
const MIN_MS = 180;
const MAX_MS = 620;
const MS_PER_UNIT = 3600; // a 3% keystroke ≈ 290ms, a 10% jump ≈ 540ms

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTweenedProgress(target: number, enabled: boolean, snapKey: unknown): number {
  const active = enabled && !prefersReducedMotion();
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const rafRef = useRef(0);
  const keyRef = useRef(snapKey);

  useEffect(() => {
    if (!active) {
      shownRef.current = target;
      setShown(target);
      setDisplayProgress(null);
      return;
    }
    // A new level: show its state immediately rather than winding down
    // from the previous scene's progress.
    if (keyRef.current !== snapKey) {
      keyRef.current = snapKey;
      cancelAnimationFrame(rafRef.current);
      shownRef.current = target;
      setShown(target);
      setDisplayProgress(target);
      return;
    }
    const from = shownRef.current;
    const to = target;
    if (from === to) {
      setDisplayProgress(to);
      return;
    }
    const dur = Math.max(MIN_MS, Math.min(MAX_MS, Math.abs(to - from) * MS_PER_UNIT + 80));
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic: quick to move, soft to land
      const v = t >= 1 ? to : from + (to - from) * e;
      shownRef.current = v;
      setDisplayProgress(v);
      const q = Math.round(v / STEP) * STEP;
      setShown((prev) => (prev === q ? prev : q));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active, snapKey]);

  // Release the display when the playing screen goes away.
  useEffect(() => () => setDisplayProgress(null), []);

  return active ? shown : target;
}
