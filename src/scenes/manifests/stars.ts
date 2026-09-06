import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Night Sky — light manifest.
 *
 * Mirrors the scene's timing: moon rises 0.05–0.45, milky way 0.15–0.5 and
 * blooms again on phrase 2, horizon haze 0.1–0.4, treetop moonlight builds
 * 0.4–0.8. Stars are drawn by the SVG; the Glow gives the moon a real
 * halo, sets a light on each constellation's brightest star as its figure
 * is named, and puts a little air on the horizon.
 *
 * ANCHORS are the four figures' brightest stars (scenes/v2/stars.tsx):
 * Betelgeuse and Rigel for Orion, Schedar for Cassiopeia, Vega for Lyra,
 * Deneb for Cygnus. The manifest only receives progress, so each anchor
 * is gated on where its name falls in the canonical phrase-1 window
 * ("Orion Lyra Cygnus Cassiopeia", 28 chars over p 0–0.5). The player can
 * type the names in any order — the SVG figure obeys the actual words;
 * this layer is a soft wash arriving on the canonical schedule, and every
 * anchor is fully lit by the time phrase 1 ends either way.
 */

const MOON: RGB = [0.80, 0.82, 1.0];
const STARLIGHT: RGB = [0.72, 0.72, 1.0];
const BETEL: RGB = [1.0, 0.82, 0.62];
const MILKY: RGB = [0.56, 0.56, 0.97];

/** [x, y, radius, phrase-1 start, colour] — the four figures' anchors. */
const ANCHORS: [number, number, number, number, RGB][] = [
  [50, 88, 13, 0.09, BETEL],       // Betelgeuse — Orion, named first
  [108, 148, 12, 0.09, STARLIGHT], // Rigel — Orion's other bright foot
  [194, 70, 13, 0.18, STARLIGHT],  // Vega — Lyra
  [278, 24, 12, 0.30, STARLIGHT],  // Deneb — Cygnus
  [120, 50, 12, 0.46, STARLIGHT],  // Schedar — Cassiopeia
];

const stars: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const moonP = sub(p, 0.05, 0.4);
    const moonY = 80 - moonP * 35;
    const milkyP = sub(p, 0.15, 0.35);
    // Phrase 2: "burn again with ancient fire" — the sky ignites.
    // Same window as the scene so light and art arrive together.
    const blaze = sub(p, 0.5, 0.45);
    const treeGlow = sub(p, 0.4, 0.4);
    return [
      // The moon: a tight bright halo and a wide soft aura.
      { x: 320, y: moonY, radius: 46, intensity: 0.24 * moonP, color: MOON, flicker: 0, core: 0.35 },
      { x: 320, y: moonY, radius: 130, intensity: 0.05 * moonP, color: MOON, flicker: 0 },
      // The milky way band — a faint violet lift that blooms on phrase 2.
      { x: 200, y: 88, radius: 165, intensity: (0.018 + 0.028 * blaze) * milkyP, color: MILKY, flicker: 0, yScale: 2.6 },
      // Each figure's brightest star lights as its name is written, then
      // burns harder through the ignition.
      ...ANCHORS.map(([x, y, radius, start, color]) => {
        const lit = sub(p, start, 0.12);
        return {
          x, y, radius,
          intensity: (0.24 + 0.12 * blaze) * lit,
          color, flicker: 0.12, core: 0.5,
        };
      }),
      // Moonlight on the treetops nearest the moon.
      { x: 320, y: 200, radius: 95, intensity: 0.05 * treeGlow, color: [0.6, 0.6, 0.95] as RGB, flicker: 0, yScale: 2.6 },
    ];
  },
  // Horizon haze: the band between sky and treeline.
  haze: (p) => ({
    top: 150,
    bottom: 225,
    density: 0.035 * sub(p, 0.1, 0.3),
    color: [0.36, 0.42, 0.72],
  }),
  // Cosmic dust — visible only near the moon and the milky way.
  motes: (p) => {
    const m = sub(p, 0.2, 0.4);
    if (m <= 0) return null;
    return {
      x: 0, y: 10, width: 400, height: 120,
      count: 18, size: 0.8, color: [0.85, 0.85, 1.0], speed: 0.4, alpha: 0.7 * m,
    };
  },
};

export default stars;
