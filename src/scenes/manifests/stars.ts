import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Night Sky — light manifest.
 * Mirrors StarScene's timing: moon rises 0.05–0.45, milky way 0.2–0.6,
 * constellations draw 0.65–0.9, horizon haze 0.1–0.4, treetop moonlight
 * builds 0.5–1.0. Stars are drawn by the SVG; the Glow gives the moon a
 * real halo, lets the constellation anchors twinkle, and puts a little
 * air on the horizon.
 */

const MOON: RGB = [0.80, 0.82, 1.0];
const STARLIGHT: RGB = [0.72, 0.72, 1.0];
const MILKY: RGB = [0.56, 0.56, 0.97];

// Constellation anchor stars from StarScene.STARS (indices 4, 8, 16, 10, 12, 7).
const ANCHORS: [number, number][] = [[95, 45], [140, 60], [220, 68], [270, 55], [325, 38], [355, 50]];

const stars: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const moonP = sub(p, 0.05, 0.4);
    const moonY = 80 - moonP * 35;
    const milkyP = sub(p, 0.2, 0.4);
    const constP = sub(p, 0.65, 0.25);
    const treeGlow = sub(p, 0.5, 0.5);
    return [
      // The moon: a tight bright halo and a wide soft aura.
      { x: 320, y: moonY, radius: 46, intensity: 0.24 * moonP, color: MOON, flicker: 0, core: 0.35 },
      { x: 320, y: moonY, radius: 130, intensity: 0.05 * moonP, color: MOON, flicker: 0 },
      // The milky way band — a faint violet lift across the upper sky.
      { x: 200, y: 88, radius: 165, intensity: 0.04 * milkyP, color: MILKY, flicker: 0, yScale: 2.6 },
      // Constellation anchors twinkle as the lines draw in.
      ...ANCHORS.map(([x, y], i) => ({
        x, y, radius: 11,
        intensity: 0.26 * sub(p, 0.65 + i * 0.03, 0.2) * constP,
        color: STARLIGHT, flicker: 0.14, core: 0.5,
      })),
      // Moonlight on the treetops nearest the moon.
      { x: 320, y: 200, radius: 95, intensity: 0.05 * treeGlow, color: [0.6, 0.6, 0.95], flicker: 0, yScale: 2.6 },
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
