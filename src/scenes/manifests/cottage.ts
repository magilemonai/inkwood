import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Dark Cottage — light manifest.
 * Mirrors CottageScene's timing so light arrives with each flame.
 */

const FLAME: RGB = [1.0, 0.74, 0.40];
const AMBER: RGB = [1.0, 0.66, 0.32];
const WINDOW_AMBER: RGB = [1.0, 0.58, 0.22];
const EYE: RGB = [1.0, 0.78, 0.35];

const cottage: SceneManifest = {
  grain: 0.045,
  lights: (p) => {
    const c1 = sub(p, 0.06, 0.18);
    const c2 = sub(p, 0.24, 0.18);
    const c3 = sub(p, 0.42, 0.18);
    const windowWarm = sub(p, 0.05, 0.55);
    const room = sub(p, 0.5, 0.5);
    const cat = sub(p, 0.58, 0.2);
    const script = sub(p, 0.86, 0.12);
    const pools = (c1 + c2 + c3) / 3;
    return [
      // The open journal between the first two candles — the handwriting
      // wakes to gold on phrase 2 (Inkwood 2 art; harmless on v1).
      { x: 237, y: 107, radius: 12, intensity: 0.22 * script, color: [1.0, 0.84, 0.52], flicker: 0.03, core: 0.5 },
      // Candle flames on the shelf — tight halo on the wall behind, hot
      // core at the wick. Tight and bright so the corners stay dark and
      // the light means something.
      { x: 210, y: 84, radius: 38, intensity: 0.36 * c1, color: FLAME, flicker: 0.16, core: 0.6 },
      { x: 262, y: 80, radius: 40, intensity: 0.38 * c2, color: FLAME, flicker: 0.14, core: 0.6 },
      { x: 318, y: 86, radius: 38, intensity: 0.36 * c3, color: FLAME, flicker: 0.17, core: 0.6 },
      // Candlelight reaching the floorboards — one flat shared pool.
      { x: 264, y: 197, radius: 90, intensity: 0.09 * pools, color: FLAME, flicker: 0.10, yScale: 3.2 },
      // The window — steady warmth pouring in, and its pool on the floor.
      { x: 95, y: 80, radius: 66, intensity: 0.18 * windowWarm, color: WINDOW_AMBER, flicker: 0 },
      { x: 95, y: 200, radius: 44, intensity: 0.07 * windowWarm, color: WINDOW_AMBER, flicker: 0, yScale: 3 },
      // "fill every room with warmth" — the room lifts a little, breathing
      // slowly. Kept low: this is the one light that touches everything.
      { x: 240, y: 150, radius: 190, intensity: 0.055 * room, color: AMBER, flicker: 0.03 },
      // The cat's open eye catches the candlelight.
      { x: 124, y: 110, radius: 4.5, intensity: 0.35 * cat, color: EYE, flicker: 0.05, core: 0.8 },
    ];
  },
  // A thin band of warm air above the shelf, most visible where the
  // candlelight reaches it. Low density on purpose: air, not fog.
  haze: (p) => ({
    top: 18,
    bottom: 118,
    density: 0.045 * (0.25 + 0.75 * sub(p, 0.2, 0.6)),
    color: [0.80, 0.64, 0.44],
  }),
  motes: (p) => {
    const m = sub(p, 0.3, 0.4);
    if (m <= 0) return null;
    return {
      x: 150, y: 28, width: 200, height: 100,
      count: 22, size: 1.05, color: [1.0, 0.88, 0.62], speed: 1, alpha: m,
    };
  },
};

export default cottage;
