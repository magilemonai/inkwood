import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Waking World — light manifest for the redrawn finale.
 *
 * Three phrases, three arrivals of light:
 *   earth (0–0.33)  the cottage window, the library's cavern mouth, the
 *                   well's water, the bridge lanterns, the garden.
 *   sky   (0.33–0.66) the moon, the named constellation, the sanctum's
 *                   pool taking the moonlight.
 *   unity (0.66–1)  the Great Tree's heart, the standing stones, and —
 *                   on the last incantation — the dawn.
 *
 * Every light sits exactly where the redrawn art puts its source, and
 * every one arrives on the same `sub()` schedule the scene uses, so the
 * light and the drawing land together. The 21-connection ley graph is
 * the SVG's own and is untouched here; the node halos are drawn in the
 * scene, not lit from this file.
 *
 * Tuning law (from the Cottage): whole-frame lights at or below 0.06,
 * local halos 0.3–0.4 at radius 35–50, haze at or below 0.05. The dawn
 * band here is 0.045 across the whole valley and the valley mist 0.028 —
 * any more and the dark corners go milky and the light stops meaning
 * anything.
 */

/** Matches the scene's own dev-only ending switch, so the night variant
 *  gets no dawn light either. Read once at module init. */
const NIGHT_ENDING: boolean = (() => {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("worldvariant") === "night";
  } catch {
    return false;
  }
})();

const WINDOW: RGB = [1.0, 0.66, 0.28];
const CAVERN: RGB = [1.0, 0.74, 0.38];
const LANTERN: RGB = [1.0, 0.78, 0.42];
const GARDEN: RGB = [0.46, 0.82, 0.46];
const WELL: RGB = [0.36, 0.84, 0.80];
const MOON: RGB = [0.80, 0.84, 1.0];
const STARS: RGB = [0.62, 0.66, 1.0];
const POOL: RGB = [0.74, 0.82, 0.92];
const HEART: RGB = [1.0, 0.82, 0.46];
const STONES: RGB = [0.60, 0.74, 0.90];
const DAWN: RGB = [1.0, 0.78, 0.52];

const world: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const earthP = sub(p, 0, 0.33);
    const skyP = sub(p, 0.33, 0.33);
    const unityP = sub(p, 0.66, 0.34);
    const dawn = NIGHT_ENDING ? 0 : sub(p, 0.74, 0.26);

    // Mirrors the scene's callback schedule exactly.
    const cotLit = sub(earthP, 0.14, 0.34);
    const wellP = sub(earthP, 0.3, 0.34);
    const bridgeP = sub(earthP, 0.46, 0.34);
    const libP = sub(earthP, 0.58, 0.4);
    const gdnP = sub(earthP, 0.0, 0.42);
    const moonP = sub(skyP, 0.04, 0.5);
    const constP = sub(skyP, 0.16, 0.5);
    const sanctumP = sub(skyP, 0.3, 0.45);
    const heartP = sub(unityP, 0.44, 0.34);
    const runeP = sub(unityP, 0.34, 0.36);

    return [
      // ── EARTH ──
      // The cottage window on the right-hand hill: a small hot source,
      // the one warm thing in the valley until the heart wakes.
      { x: 311.5, y: 112.5, radius: 16, intensity: 0.34 * cotLit * (1 - dawn * 0.35), color: WINDOW, flicker: 0.10, core: 0.65 },
      // The library's cavern mouth, far out on the left ridge.
      { x: 30, y: 105, radius: 13, intensity: 0.22 * libP * (1 - dawn * 0.3), color: CAVERN, flicker: 0.08, core: 0.45 },
      // Water back in the well.
      { x: 95, y: 128, radius: 12, intensity: 0.26 * wellP, color: WELL, flicker: 0.06, core: 0.5 },
      // Three lanterns on the bridge parapet, read as one soft source.
      { x: 170, y: 111, radius: 22, intensity: 0.18 * bridgeP, color: LANTERN, flicker: 0.09, core: 0.3 },
      // The garden crowning itself in the near meadow — broad and low,
      // never a hot spot.
      { x: 45, y: 166, radius: 26, intensity: 0.09 * gdnP, color: GARDEN, flicker: 0 },

      // ── SKY ──
      { x: 354, y: 26, radius: 44, intensity: 0.17 * moonP * (1 - dawn * 0.74), color: MOON, flicker: 0, core: 0.3 },
      { x: 280, y: 55, radius: 30, intensity: 0.09 * constP * (1 - dawn * 0.62), color: STARS, flicker: 0.09 },
      // Moonlight lying flat on the sanctum's pool.
      { x: 252, y: 131, radius: 20, intensity: 0.14 * sanctumP, color: POOL, flicker: 0, yScale: 2.6 },

      // ── UNITY ──
      // The heart of the Great Tree. The brightest thing in the game,
      // and still only a halo — the SVG owns the hot core.
      { x: 200, y: 99, radius: 46, intensity: 0.30 * heartP, color: HEART, flicker: 0.04, core: 0.45 },
      // The standing stones lighting their marks.
      { x: 350, y: 170, radius: 22, intensity: 0.16 * runeP, color: STONES, flicker: 0.05 },

      // ── THE DAWN ──
      // One low, wide, whole-frame light behind the ridge, held under
      // the ceiling so the top of the sky keeps its depth.
      { x: 200, y: 108, radius: 210, intensity: 0.045 * dawn, color: DAWN, flicker: 0, yScale: 2.2 },
    ];
  },

  // Thin mist in the valley, thickening a little as the world wakes.
  haze: (p) => ({
    top: 112,
    bottom: 178,
    density: 0.028 * (0.35 + 0.65 * sub(p, 0, 0.5)),
    color: [0.62, 0.72, 0.70],
  }),

  // Spirit motes over the valley from the sky phrase on.
  motes: (p) => {
    const m = sub(p, 0.4, 0.35);
    if (m <= 0) return null;
    return {
      x: 30, y: 70, width: 340, height: 105,
      count: 14, size: 1.0, color: [1.0, 0.9, 0.66], speed: 0.45, alpha: 0.75 * m,
    };
  },
};

export default world;
