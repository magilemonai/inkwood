import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Waking World — light manifest.
 * Three phrases: earth (0–0.33: hills green, the cottage window lights,
 * the garden blooms), sky (0.33–0.66: stars, moon, spirit wisps), unity
 * (0.66–1: the Great Tree rises, ley lines connect every place, dawn).
 * The Glow gives each callback its own small light and lets the ley
 * nodes glow as the network completes. The 21-connection graph itself
 * is the SVG's and is untouched here.
 */

const WINDOW: RGB = [1.0, 0.62, 0.25];
const GARDEN: RGB = [0.45, 0.82, 0.45];
const MOON: RGB = [0.80, 0.82, 1.0];
const STARS: RGB = [0.56, 0.56, 0.97];
const HEART: RGB = [1.0, 0.86, 0.52];
const WELL: RGB = [0.35, 0.78, 0.78];
const BRIDGE: RGB = [0.55, 0.75, 0.45];
const STONES: RGB = [0.55, 0.68, 0.85];
const DAWN: RGB = [1.0, 0.80, 0.55];

const world: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const earthP = sub(p, 0, 0.33);
    const skyP = sub(p, 0.33, 0.33);
    const unityP = sub(p, 0.66, 0.34);
    const dawnP = sub(p, 0.72, 0.28);
    return [
      // Earth: the cottage window on the hillside, the garden in the foreground.
      { x: 312, y: 112, radius: 13, intensity: 0.26 * earthP, color: WINDOW, flicker: 0.10, core: 0.6 },
      { x: 45, y: 172, radius: 24, intensity: 0.12 * earthP, color: GARDEN, flicker: 0 },
      // Sky: the moon, and the constellation cluster.
      { x: 337, y: 40, radius: 48, intensity: 0.18 * skyP, color: MOON, flicker: 0, core: 0.3 },
      { x: 280, y: 55, radius: 30, intensity: 0.08 * skyP, color: STARS, flicker: 0.1 },
      // Unity: the Great Tree's heart, and the ley nodes as the web completes.
      { x: 200, y: 42, radius: 46, intensity: 0.20 * unityP, color: HEART, flicker: 0.04, core: 0.4 },
      { x: 95, y: 128, radius: 11, intensity: 0.20 * sub(unityP, 0.3, 0.2), color: WELL, flicker: 0.06, core: 0.5 },
      { x: 165, y: 126, radius: 11, intensity: 0.18 * sub(unityP, 0.35, 0.2), color: BRIDGE, flicker: 0.06, core: 0.5 },
      { x: 350, y: 165, radius: 11, intensity: 0.20 * sub(unityP, 0.4, 0.2), color: STONES, flicker: 0.06, core: 0.5 },
      // Dawn — the valley floor lifts a little, warm and low. Kept under
      // the whole-frame ceiling so the sky keeps its depth.
      { x: 200, y: 165, radius: 200, intensity: 0.035 * dawnP, color: DAWN, flicker: 0, yScale: 2.6 },
    ];
  },
  // A thin valley mist between the hills.
  haze: (p) => ({
    top: 130,
    bottom: 185,
    density: 0.028 * (0.3 + 0.7 * sub(p, 0, 0.5)),
    color: [0.62, 0.72, 0.66],
  }),
  // Spirit motes rising over the valley once the sky wakes.
  motes: (p) => {
    const m = sub(p, 0.4, 0.4);
    if (m <= 0) return null;
    return {
      x: 40, y: 60, width: 320, height: 110,
      count: 16, size: 1.0, color: [1.0, 0.9, 0.65], speed: 0.5, alpha: 0.8 * m,
    };
  },
};

export default world;
