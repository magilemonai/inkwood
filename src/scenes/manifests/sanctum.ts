import type { SceneManifest, RGB } from "../manifest";
import { sub } from "../util";

/**
 * The Moonlit Sanctum — light manifest.
 *
 * Two sources and nothing else: the moon overhead, and the five spirits
 * once they take their seats. Everything mirrors scenes/v2/sanctum.tsx's
 * own `sub()` timings so the light arrives on the same beat as the art.
 *
 * The scene is a night clearing, so the tuning law matters more here
 * than anywhere: the ring of trees has to stay black. The only
 * whole-frame light is the 0.045 night lift; the moon and the spirits
 * are tight local halos.
 */

/** Moonlight: cool, faintly blue, never white. */
const MOON: RGB = [0.80, 0.86, 1.0];
/** The pool on the clearing floor — the same light, a shade warmer for
 *  having bounced off leaf litter. */
const POOL: RGB = [0.72, 0.80, 0.96];
/** The spirits keep the level accent (#d0b870). */
const SPIRIT: RGB = [0.82, 0.72, 0.44];

/** Seats, mirrored from the RING geometry in the scene. Kept literal so
 *  the director can nudge one light without recomputing an ellipse. */
const SEATS = [
  { x: 84.7, y: 155.4, scale: 1.09, delay: 0.560 },
  { x: 132.9, y: 138.3, scale: 0.85, delay: 0.636 },
  { x: 204.2, y: 133.0, scale: 0.78, delay: 0.712 },
  { x: 273.9, y: 139.6, scale: 0.87, delay: 0.788 },
  { x: 317.4, y: 157.6, scale: 1.12, delay: 0.864 },
];

const sanctum: SceneManifest = {
  grain: 0.04,
  lights: (p) => {
    const moonUp = sub(p, 0.02, 0.3);
    const unveil = sub(p, 0.04, 0.26);
    const pour = sub(p, 0.2, 0.3);

    // The veil holds the moon back even after the disc is drawn, so the
    // halo tracks the unveiling rather than the disc's own opacity.
    const moonLit = moonUp * (0.35 + 0.65 * unveil);

    return [
      // The moon. Tight and bright: a hard little source high in frame.
      {
        x: 202, y: 36, radius: 46,
        intensity: 0.34 * moonLit,
        color: MOON, flicker: 0, core: 0.7,
      },
      // Silver on the clearing floor — one flat pool, spreading with the
      // pour. Low intensity over a wide radius, the Cottage floor rule.
      {
        x: 200, y: 162, radius: 112,
        intensity: 0.085 * pour,
        color: POOL, flicker: 0.03, yScale: 3.0,
      },
      // Where the middle beam actually lands. Matches BEAMS[1] in the
      // scene, so the shader's bright spot sits on the SVG's.
      {
        x: 204, y: 156, radius: 42,
        intensity: 0.13 * pour,
        color: POOL, flicker: 0.04, yScale: 2.4,
      },
      // Night lift. The one light that touches the whole frame, so it
      // stays under 0.06 or the treeline goes grey.
      {
        x: 200, y: 96, radius: 200,
        intensity: 0.045 * moonUp,
        color: MOON, flicker: 0.02,
      },
      // Five spirits, each arriving with its figure. Warm against all
      // that silver, which is the whole point of the accent. The y is
      // the figure's heart: it sits on the stone (stone height 6.8, at
      // 0.98) and its heart is 55% up a 30-unit body, all scaled by the
      // seat's depth.
      ...SEATS.map((s) => {
        const arrive = sub(p, s.delay, 0.1);
        return {
          x: s.x,
          y: s.y - 23.2 * s.scale,
          radius: 21 * s.scale,
          intensity: 0.3 * arrive,
          color: SPIRIT,
          flicker: 0.06,
          core: 0.45,
        };
      }),
    ];
  },
  // The air in the beams, between the canopy gap and the floor. Thin on
  // purpose — this is a clear cold night, not a fog.
  haze: (p) => {
    const beam = sub(p, 0.16, 0.28);
    if (beam <= 0) return null;
    return {
      top: 34,
      bottom: 176,
      density: 0.038 * beam,
      color: [0.62, 0.71, 0.9],
    };
  },
  // Dust and pollen drifting up through the beams, over the clearing.
  // Only visible where the moonlight actually reaches, which is exactly
  // the region the beams cover.
  motes: (p) => {
    const m = sub(p, 0.24, 0.34);
    if (m <= 0) return null;
    return {
      x: 118, y: 58, width: 168, height: 106,
      count: 22, size: 0.95,
      color: [0.86, 0.9, 1.0],
      speed: 0.8,
      alpha: m * 0.9,
    };
  },
};

export default sanctum;
