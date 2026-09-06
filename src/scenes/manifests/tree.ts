import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Great Tree — light manifest.
 *
 * Mirrors the scene's own three phases so the light arrives with each
 * incantation:
 *   roots   (p 0.02–0.33) → green-gold tip lights out along the roots
 *   canopy  (p 0.34–0.66) → a cool sky light on the crown, leaf motes
 *   heart   (p 0.67–1.00) → the hollow burns; a warm, low bleed over
 *                           the whole frame and a pool on the soil
 *
 * The heart is the only warm source in the scene by design — the sky
 * and the treeline stay cold so the fire in the trunk means something.
 * Everything obeys the Cottage tuning law: whole-frame lights ≤ 0.06,
 * local halos 0.3–0.4, haze density ≤ 0.05.
 */

const HEART: RGB = [1.0, 0.72, 0.36];
const HEART_DEEP: RGB = [1.0, 0.62, 0.26];
const LEY: RGB = [0.72, 0.92, 0.58];
const SKY: RGB = [0.58, 0.78, 0.80];

const tree: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const roots = sub(p, 0.004, 0.325);
    const canopy = sub(p, 0.334, 0.326);
    const heart = sub(p, 0.67, 0.33);

    // The light wakes in the soil under the buttress first, then runs
    // out. Mirrors the scene's own `wake`.
    const wake = sub(roots, 0, 0.11);

    // Tip lights arrive as their filament lands — the scene's own
    // per-root schedule (ROOT_GROW delay + duration).
    const TIP_END = [0.98, 0.529, 0.772, 0.3, 0.99, 0.646, 0.878, 0.4];
    const tip = (i: number) => sub(roots, TIP_END[i] - 0.16, 0.16);

    return [
      // The heart in the hollow — the hot spot of the whole game.
      { x: 199, y: 138, radius: 44, intensity: 0.4 * heart, color: HEART, flicker: 0.07, core: 0.7 },
      // Its bleed into the air around the trunk. The one light that
      // touches everything, so it stays under the whole-frame cap.
      { x: 199, y: 132, radius: 175, intensity: 0.055 * heart, color: HEART_DEEP, flicker: 0.03 },
      // The pool it throws down onto the soil and the buttress roots.
      { x: 199, y: 182, radius: 88, intensity: 0.065 * heart, color: HEART, flicker: 0.05, yScale: 3.2 },
      // Root tips. Kept tight and low — the corners of the frame have
      // to stay dark or the ley light stops meaning anything.
      { x: 82, y: 182, radius: 22, intensity: 0.17 * tip(3), color: LEY, flicker: 0.09 },
      { x: 56, y: 195, radius: 24, intensity: 0.13 * tip(1), color: LEY, flicker: 0.11 },
      { x: 318, y: 182, radius: 22, intensity: 0.17 * tip(7), color: LEY, flicker: 0.09 },
      { x: 344, y: 196, radius: 24, intensity: 0.13 * tip(5), color: LEY, flicker: 0.11 },
      // The wake in the soil under the buttress: the first light of the
      // phrase, up before any root has reached anywhere.
      { x: 200, y: 183, radius: 38, intensity: 0.16 * wake * (1 - 0.4 * roots), color: LEY, flicker: 0.06, yScale: 2.4 },
      // A faint seam of light along the root run itself, so phrase one
      // reads even where the filaments are thin.
      { x: 199, y: 174, radius: 140, intensity: 0.035 * roots, color: LEY, flicker: 0.04, yScale: 4.5 },
      // Cold sky on the crown once the canopy is up there to catch it.
      { x: 200, y: 18, radius: 130, intensity: 0.05 * canopy, color: SKY, flicker: 0 },
    ];
  },
  // Mist over the forest floor: cold, thin, and only where the light
  // reaches it. Air, not fog.
  haze: (p) => ({
    top: 148,
    bottom: 200,
    density: 0.032 * (0.4 + 0.6 * sub(p, 0.05, 0.5)),
    color: [0.58, 0.74, 0.72],
  }),
  // Glints drifting in the leaves — they only show where the canopy is.
  motes: (p) => {
    const m = sub(p, 0.45, 0.45);
    if (m <= 0) return null;
    return {
      x: 40, y: 0, width: 320, height: 76,
      count: 22, size: 0.95, color: [0.94, 0.92, 0.72], speed: 0.7, alpha: m * 0.85,
    };
  },
};

export default tree;
