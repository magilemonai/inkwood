import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Spirit Stones — light manifest.
 * Phrase 1 raises the stones (0–0.5, staggered by STONES[i].delay);
 * phrase 2 lights the runes, draws the ley lines (0.5–0.8), manifests
 * the ritual circle (0.65+), and shimmers the aurora (0.7+). The Glow
 * lets each carved rune spill light onto its stone and puts cold mist
 * at the ring's feet.
 */

const RUNE: RGB = [0.60, 0.76, 1.0];
const CIRCLE: RGB = [0.50, 0.66, 0.92];
const AURORA: RGB = [0.42, 0.82, 0.72];

// Rune centers: stone x, and y + 0.39·h from StonesScene.STONES.
const RUNES: [number, number][] = [
  [200, 108], [138, 119], [262, 118], [88, 141], [312, 139], [62, 172], [338, 169],
];

const stones: SceneManifest = {
  grain: 0.035,
  lights: (p) => {
    const circleP = sub(p, 0.65, 0.2);
    const auroraP = sub(p, 0.7, 0.3);
    return [
      // Each carved rune spills a little light onto its stone face.
      ...RUNES.map(([x, y], i) => ({
        x, y, radius: 13,
        intensity: 0.28 * sub(p, 0.5 + i * 0.03, 0.15),
        color: RUNE, flicker: 0.08, core: 0.6,
      })),
      // The ritual circle — a thin cold pool on the ground between the stones.
      // Kept low: first pass at 0.08 washed the whole middle of the frame.
      { x: 200, y: 160, radius: 100, intensity: 0.04 * circleP, color: CIRCLE, flicker: 0.04, yScale: 4 },
      // Aurora — a faint slow-breathing band high in the sky, not a wash.
      { x: 200, y: 18, radius: 110, intensity: 0.025 * auroraP, color: AURORA, flicker: 0.06, yScale: 3 },
    ];
  },
  // A low skin of mist at the ring's feet only. The sky stays navy.
  haze: (p) => ({
    top: 168,
    bottom: 205,
    density: 0.02 * (0.3 + 0.7 * sub(p, 0.3, 0.5)),
    color: [0.45, 0.55, 0.72],
  }),
  // Spirit wisps drifting among the stones, lit by the runes.
  motes: (p) => {
    const m = sub(p, 0.6, 0.3);
    if (m <= 0) return null;
    return {
      x: 60, y: 90, width: 280, height: 90,
      count: 14, size: 1.0, color: [0.76, 0.86, 1.0], speed: 0.5, alpha: 0.8 * m,
    };
  },
};

export default stones;
