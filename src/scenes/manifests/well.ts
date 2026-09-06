import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Dry Well — light manifest.
 *
 * The whole scene is lit by one thing: the water the player calls up.
 * Timings mirror scenes/v2/well.tsx exactly so the light rises with the
 * column rather than trailing it.
 *
 * Cottage tuning law applies: local halos 0.3–0.4 at radius 35–50,
 * whole-frame lift at or below 0.06, haze at or below 0.05. The shaft
 * is a tall narrow source, so its column light uses yScale well below 1
 * (0.42 stretches the halo ~2.4x vertically) — that is what keeps the
 * light inside the stone throat instead of blooming across the earth.
 */

const WATER: RGB = [0.40, 0.80, 0.80];
const RUNE: RGB = [0.44, 0.86, 0.82];
const SPRING: RGB = [0.30, 0.66, 0.70];
const AIR: RGB = [0.50, 0.66, 0.72];

const FLOOR = 200;
const TOP_FULL = 103;

/** Same six runes as the scene, lowest first. */
const RUNES = [
  { x: 169, y: 178 },
  { x: 231, y: 162 },
  { x: 169, y: 146 },
  { x: 231, y: 131 },
  { x: 169, y: 118 },
  { x: 231, y: 107 },
];

const well: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const spring = sub(p, 0.03, 0.20);
    const rise = Math.pow(sub(p, 0.14, 0.86), 0.8);
    const waterTop = FLOOR - rise * (FLOOR - TOP_FULL);
    const song = sub(p, 0.52, 0.48);

    const lights = [
      // The aquifer answering first, bedded in the rock. It stays lit —
      // it is the source — but the seep into the throat fades back as
      // the column takes over, so the eye follows the water upward.
      {
        x: 200, y: 214, radius: 96,
        intensity: 0.16 * spring,
        color: SPRING, flicker: 0.05, yScale: 2.6,
      },
      {
        x: 200, y: 201, radius: 40,
        intensity: 0.26 * spring * (1 - 0.55 * rise),
        color: SPRING, flicker: 0.08, yScale: 1.8,
      },
      // The column itself — narrow horizontally, stretched down the shaft.
      {
        x: 200, y: (waterTop + FLOOR) / 2, radius: 24,
        intensity: 0.30 * rise,
        color: WATER, flicker: 0.05, yScale: 0.42,
      },
      // The surface: the brightest thing in the frame, and a flat one.
      {
        x: 200, y: waterTop, radius: 40,
        intensity: 0.32 * rise,
        color: WATER, flicker: 0.06, yScale: 2.4, core: 0.45,
      },
      // Phrase two: light escaping the mouth onto the ring stones and
      // the turf. Kept small — the well glows, the field does not.
      {
        x: 200, y: 94, radius: 58,
        intensity: 0.14 * song,
        color: WATER, flicker: 0.04, yScale: 1.5,
      },
      // The one light that touches everything. Stays under the law.
      {
        x: 200, y: 130, radius: 190,
        intensity: 0.05 * rise,
        color: AIR, flicker: 0.02,
      },
    ];

    // Runes surface course by course as the water reaches them.
    for (const r of RUNES) {
      const lit = Math.max(0, Math.min(1, (r.y - waterTop) / 9));
      lights.push({
        x: r.x, y: r.y, radius: 14,
        intensity: 0.32 * lit,
        color: RUNE, flicker: 0.09, core: 0.55, yScale: 1,
      });
    }

    return lights;
  },
  // A cool band of damp air across the cut, thickest where the mouth is.
  // Air, not fog: it only shows where the water light already reaches.
  haze: (p) => ({
    top: 44,
    bottom: 132,
    density: 0.042 * (0.3 + 0.7 * sub(p, 0.2, 0.6)),
    color: [0.52, 0.70, 0.74],
  }),
  // Spray and song lifting up the shaft during phrase two.
  motes: (p) => {
    const m = sub(p, 0.4, 0.4);
    if (m <= 0) return null;
    return {
      x: 168, y: 96, width: 64, height: 96,
      count: 18, size: 0.9, color: [0.72, 0.95, 0.92], speed: 1.15, alpha: m * 0.9,
    };
  },
};

export default well;
