import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Whispering Library — light manifest.
 *
 * Mirrors v2/library.tsx timing so the light arrives with the words.
 * The room has exactly one lamp: the open tome. Everything else is an
 * answer to it — the braid where the three voice-threads meet at the
 * vault, the crystals that catch the chorus, the pool the lectern
 * stands in. The frame corners get nothing on purpose; a cavern that
 * is lit everywhere is a room, not a library in the dark.
 *
 * Director-tunable: positions, radii, intensities. Cottage law applies —
 * whole-frame lights at or below 0.06, local halos 0.3–0.4 at radius
 * 35–50, haze density at or below 0.05.
 */

const GOLD: RGB = [1.0, 0.80, 0.48];
const PAGE: RGB = [1.0, 0.88, 0.66];
const VIOLET: RGB = [0.70, 0.52, 0.96];
const COLD: RGB = [0.60, 0.72, 1.0];

const ease = (t: number) => t * t * (3 - 2 * t);

const library: SceneManifest = {
  grain: 0.045,
  lights: (p) => {
    const openP = ease(sub(p, 0.03, 0.40));   // the tome opens
    const pageP = sub(p, 0.12, 0.36);         // the spread takes light
    const voiceP = ease(sub(p, 0.50, 0.34));  // threads climb and braid
    const chorusP = sub(p, 0.58, 0.42);       // crystals answer
    const rayTop = 118 - 84 * voiceP;
    // The nearest risen book throws light of its own; its timing
    // matches FLIGHTS[0] in the scene.
    const rise0 = ease(sub(p, 0.52, 0.20));

    // Eight lights at the climax, never more. The shader costs one
    // falloff per light per pixel, and a light whose intensity has
    // reached zero is skipped entirely — so the cold shaft is written
    // to go fully out rather than linger at a hundredth, and the
    // crystals and risen books are sampled rather than enumerated.
    // Twelve active lights here put the FPS probe over its cutoff and
    // turned the whole layer off, which costs far more than any of the
    // lights that were cut.
    return [
      // The cold thread through the crack in the vault. It is the whole
      // light of the dormant room, and it loses to the tome.
      { x: 200, y: 52, radius: 54, intensity: 0.11 * Math.max(0, 1 - 1.25 * pageP), color: COLD, flicker: 0.02, yScale: 0.45 },

      // THE TOME — the room's one lamp. Hot core at the spread, halo on
      // the apse behind it.
      { x: 200, y: 124, radius: 46, intensity: 0.34 * pageP + 0.10 * voiceP, color: PAGE, flicker: 0.05, core: 0.55 },
      { x: 200, y: 118, radius: 82, intensity: 0.13 * pageP + 0.07 * voiceP, color: GOLD, flicker: 0.03 },
      // Its pool on the flagstones at the lectern's foot.
      { x: 200, y: 160, radius: 74, intensity: 0.085 * pageP, color: GOLD, flicker: 0.04, yScale: 3.0 },

      // Where the three voices braid into one, under the vault.
      { x: 200, y: rayTop + 4, radius: 34, intensity: 0.24 * voiceP, color: PAGE, flicker: 0.06, core: 0.35 },

      // Ceiling crystals answering the chorus — one wide light per side
      // rather than one per cluster.
      { x: 96, y: 38, radius: 36, intensity: 0.16 * chorusP, color: VIOLET, flicker: 0.14 },
      { x: 302, y: 36, radius: 34, intensity: 0.15 * chorusP, color: VIOLET, flicker: 0.12 },

      // The nearest risen book, carrying its own light into the hall.
      { x: 108, y: 62, radius: 19, intensity: 0.20 * rise0, color: GOLD, flicker: 0.08, core: 0.3 },

      // The hall itself lifting as the chorus fills it. Kept under the
      // Cottage ceiling — this is the one light that touches everything.
      { x: 200, y: 122, radius: 210, intensity: 0.052 * voiceP + 0.020 * openP, color: GOLD, flicker: 0.03 },
    ];
  },

  // Cavern air under the vault, thickest where the threads pass through.
  haze: (p) => ({
    top: 6,
    bottom: 104,
    density: 0.042 * (0.30 + 0.70 * sub(p, 0.18, 0.62)),
    color: [0.78, 0.64, 0.52],
  }),

  // Dust standing in the tome's light and in the rising threads.
  motes: (p) => {
    const m = sub(p, 0.22, 0.42);
    if (m <= 0) return null;
    return {
      x: 132, y: 26, width: 136, height: 112,
      count: 22, size: 1.0, color: [1.0, 0.86, 0.62], speed: 0.9, alpha: m,
    };
  },
};

export default library;
