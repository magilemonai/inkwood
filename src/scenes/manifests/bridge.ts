import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Forgotten Bridge — light manifest.
 *
 * Mirrors scenes/v2/bridge.tsx timing so light arrives with the
 * incantation: the keystone flashes green as it locks (phrase 1), then
 * five hanging lanterns come up warm one at a time and a spirit walks
 * the deck left to right (phrase 2).
 *
 * The chasm gets the densest, coolest haze in the game — it is the one
 * place in Inkwood where the air itself is the subject. It still obeys
 * the Cottage tuning law (density at or below 0.05); the difference is
 * that the band is deep and cold rather than a thin warm shelf, and the
 * gorge behind the arch is dark enough to carry it without going milky.
 */

const LANTERN: RGB = [1.0, 0.72, 0.36];
const MOON: RGB = [0.68, 0.79, 1.0];
const RIVER: RGB = [0.55, 0.82, 0.9];
const SPIRIT: RGB = [0.55, 0.88, 0.5];

/** Deck near-edge parabola, shared with the scene. */
const deckNearY = (x: number) => {
  const t = (x - 200) / 94;
  return 82 + t * t * 15.8;
};
const deckFarY = (x: number) => deckNearY(x) - 7.2;

const LANTERN_X = [136, 168, 200, 232, 264];

const bridge: SceneManifest = {
  grain: 0.042,
  lights: (p) => {
    // Phrase 1 — the keystone lock. One brief green flash at the crown,
    // windowed on p so it is fully gone by the time the deck lands.
    const keyFlash = Math.max(0, 1 - Math.abs(p - 0.425) / 0.055);

    // Phrase 2 — lanterns, then the walk.
    const lit = LANTERN_X.map((_, i) => sub(p, 0.52 + i * 0.05, 0.07));
    const pooled = lit.reduce((a, b) => a + b, 0) / lit.length;
    const walk = sub(p, 0.6, 0.33);
    const walkX = 118 + walk * 168;

    const out = [
      // The moon: the cool key light. Whole-frame, so kept well under 0.06.
      { x: 332, y: 31, radius: 165, intensity: 0.036, color: MOON, flicker: 0 },
      // Its disc — a small hot spot so the crescent actually shines.
      { x: 332, y: 31, radius: 9, intensity: 0.2 + p * 0.06, color: MOON, flicker: 0, core: 0.7 },
      // Five hanging lanterns. Local halos, tight, warm, breathing.
      ...LANTERN_X.map((x, i) => ({
        x: x - 5.2,
        y: deckFarY(x) - 9.4,
        radius: 34,
        intensity: 0.35 * lit[i],
        color: LANTERN,
        flicker: 0.15 + i * 0.012,
        core: 0.6,
      })),
      // Their shared spill along the roadbed — a flat pool on the deck.
      { x: 200, y: 82, radius: 96, intensity: 0.065 * pooled, color: LANTERN, flicker: 0.07, yScale: 3.4 },
      // The river running away from us at the floor of the gorge. A tall,
      // narrow column rather than a pool, because it recedes.
      { x: 196, y: 204, radius: 44, intensity: 0.05 * (0.35 + 0.65 * p), color: RIVER, flicker: 0.05, yScale: 1.3 },
    ];

    // The keystone's green flash — present only while it is locking.
    if (keyFlash > 0.01) {
      out.push({ x: 200, y: 90.7, radius: 44, intensity: 0.42 * keyFlash, color: SPIRIT, flicker: 0.05, core: 0.75 });
    }
    // The spirit crossing: one soft light walking the deck left to right.
    if (walk > 0 && walk < 1) {
      out.push({
        x: walkX,
        y: deckNearY(walkX) - 3.4,
        radius: 26,
        intensity: 0.2 * Math.min(1, (1 - walk) * 5),
        color: SPIRIT,
        flicker: 0.08,
        core: 0.35,
      });
    }
    return out;
  },

  // The chasm's air. Deep, cool, and the densest band in the game — it
  // sits over the dark gorge walls, so it reads as depth rather than fog.
  haze: (p) => ({
    top: 100,
    bottom: 205,
    density: 0.05 * (0.72 + 0.28 * p),
    color: [0.56, 0.7, 0.86],
  }),

  // Fine spray hanging in the gorge, visible only where the light finds it.
  motes: (p) => ({
    x: 120,
    y: 104,
    width: 160,
    height: 80,
    count: 22,
    size: 1.0,
    color: [0.82, 0.9, 1.0],
    speed: 0.7,
    alpha: 0.45 + 0.35 * p,
  }),
};

export default bridge;
