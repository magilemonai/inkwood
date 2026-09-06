import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Sleeping Garden — light manifest.
 *
 * One source: the rising sun at (320, y) where y tracks the scene's own
 * `sunY = 194 - 136 * p`. Everything else is that sun arriving somewhere —
 * the horizon band it lights from below, the sun-facing flank of the
 * canopy, the warm floor of the flower bed. The only cool light in the
 * scene is the green-gold running out along the roots in phrase one,
 * which is the player's word, not the sun's.
 *
 * Cottage tuning law observed: whole-frame lights stay at or below 0.06,
 * local halos sit at 0.30–0.40 with radius 35–50, haze density stays at
 * or below 0.05. The top corners of this frame have no light within
 * reach of them at any progress, which is what keeps the dawn a dawn.
 */

const SUN: RGB = [1.0, 0.83, 0.52];
const DAWN: RGB = [1.0, 0.62, 0.34];
const ROSE: RGB = [0.94, 0.56, 0.46];
const LEAF: RGB = [0.72, 0.96, 0.55];
const SAP: RGB = [0.56, 0.94, 0.50];
const POLLEN: RGB = [1.0, 0.94, 0.66];

const SUN_X = 320;
const sunY = (p: number) => 194 - 136 * p;

const garden: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const sunIn = sub(p, 0.04, 0.5);      // the disc clearing the hills
    const roots = sub(p, 0.03, 0.34);     // phrase 1: light runs the roots
    const canopy = sub(p, 0.1, 0.42);     // phrase 1: foliage fills in
    const bed = sub(p, 0.5, 0.42);        // phrase 2: the bed opens
    const y = sunY(p);
    return [
      // The disc itself — tight and hot, the one thing in frame that is
      // actually a light source. Held under a candle's local strength so
      // the sky behind it keeps its colour.
      { x: SUN_X, y, radius: 44, intensity: 0.34 * sunIn, color: SUN, flicker: 0, core: 0.55 },
      // The dawn band along the horizon: flat, wide, and weak. This is the
      // scene's only whole-frame light and it stays under the 0.06 law.
      { x: 300, y: 150, radius: 175, intensity: 0.055 * sunIn, color: DAWN, flicker: 0, yScale: 3.4 },
      // A second, rosier stain further left so the band isn't a symmetric
      // bulge under the sun — the sky reads as weather, not as a lamp.
      { x: 150, y: 146, radius: 120, intensity: 0.03 * sub(p, 0.25, 0.5), color: ROSE, flicker: 0, yScale: 4 },
      // The canopy's sun-facing flank catching first light. Sits over
      // clumps C and D, low enough that the shaded left mass stays dark.
      { x: 196, y: 60, radius: 48, intensity: 0.10 * canopy, color: SUN, flicker: 0.03 },
      // Light finding its way through the crown to the ground beneath it.
      { x: 150, y: 176, radius: 54, intensity: 0.035 * sub(p, 0.3, 0.5), color: SUN, flicker: 0.04, yScale: 3.2 },
      // ── Phrase one: the player's word running out along the roots.
      // Three small green-gold sources arriving as each head reaches its
      // tip, so the ground lights in the same order the strokes draw.
      { x: 62, y: 194, radius: 24, intensity: 0.20 * sub(p, 0.12, 0.2), color: SAP, flicker: 0.06, yScale: 2.4, core: 0.3 },
      { x: 182, y: 192, radius: 24, intensity: 0.20 * sub(p, 0.2, 0.2), color: SAP, flicker: 0.06, yScale: 2.4, core: 0.3 },
      { x: 122, y: 190, radius: 30, intensity: 0.16 * roots, color: LEAF, flicker: 0.05, yScale: 2.6 },
      // ── Phrase two: the bed warms as the flowers open. A flat pool, not
      // a halo, so it reads as ground light rather than a floating orb.
      { x: 300, y: 176, radius: 96, intensity: 0.10 * bed, color: SUN, flicker: 0.03, yScale: 3.2 },
      { x: 356, y: 158, radius: 34, intensity: 0.13 * sub(p, 0.68, 0.3), color: POLLEN, flicker: 0.05 },
    ];
  },
  // Morning air pooled low, over the hills and under the crown. It only
  // shows where the light already is (the shader multiplies by `lit`), so
  // the pre-dawn frame stays clean.
  haze: (p) => ({
    top: 122,
    bottom: 176,
    density: 0.032 * (0.2 + 0.8 * sub(p, 0.12, 0.6)),
    color: [0.94, 0.7, 0.54],
  }),
  // Pollen in the sunbeam — the band between the crown and the bed, on
  // the sun's side of the frame.
  motes: (p) => {
    const m = sub(p, 0.42, 0.35);
    if (m <= 0) return null;
    return {
      x: 168, y: 92, width: 216, height: 84,
      count: 20, size: 1.0, color: [1.0, 0.93, 0.7], speed: 0.9, alpha: m,
    };
  },
};

export default garden;
