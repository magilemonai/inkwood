/**
 * Scene manifests — what each scene declares about its own light.
 *
 * The Glow layer (components/GlowCanvas.tsx) reads these every frame and
 * paints light, haze, dust, and grain over the SVG. Everything is in
 * viewBox coordinates (0 0 400 250) so it lines up with the art on any
 * screen shape. Values are functions of progress so the light grows with
 * the incantation exactly as the scene does.
 *
 * Director-tunable: positions, radii, colors, intensities. Intensities
 * are screen-blend strengths — 0.3 on a dark wall reads as a candle's
 * halo; 0.1 over the whole frame reads as a room warming.
 *
 * Only scenes listed here get a glow layer. The rest render nothing.
 */

import type { SceneKey } from "../types";
import { sub } from "./util";

export type RGB = [number, number, number];

export interface GlowLight {
  x: number;
  y: number;
  /** Halo radius in viewBox units. */
  radius: number;
  /** Screen-blend strength at the center, 0–1. */
  intensity: number;
  color: RGB;
  /** Flicker depth 0–0.3. 0 = steady. */
  flicker: number;
  /** Vertical squash: 1 = round, 3 = flat pool on a floor. */
  yScale?: number;
  /** Bright core strength 0–1 (small hot spot at the source). */
  core?: number;
}

export interface GlowHaze {
  /** Band in viewBox y where haze lives. */
  top: number;
  bottom: number;
  /** 0–0.3. */
  density: number;
  color: RGB;
}

export interface GlowMotes {
  /** Spawn region in viewBox coords. */
  x: number;
  y: number;
  width: number;
  height: number;
  count: number;
  /** Mote radius in viewBox units. */
  size: number;
  color: RGB;
  /** Drift speed multiplier. */
  speed: number;
  /** Overall visibility 0–1. */
  alpha: number;
}

export interface SceneManifest {
  lights: (p: number) => GlowLight[];
  haze?: (p: number) => GlowHaze | null;
  motes?: (p: number) => GlowMotes | null;
  /** Film grain strength 0–0.1. */
  grain: number;
}

const FLAME: RGB = [1.0, 0.74, 0.40];
const AMBER: RGB = [1.0, 0.66, 0.32];
const WINDOW_AMBER: RGB = [1.0, 0.58, 0.22];
const EYE: RGB = [1.0, 0.78, 0.35];

export const SCENE_MANIFESTS: Partial<Record<SceneKey, SceneManifest>> = {
  cottage: {
    grain: 0.045,
    lights: (p) => {
      // Mirrors CottageScene's timing so light arrives with each flame.
      const c1 = sub(p, 0.06, 0.18);
      const c2 = sub(p, 0.24, 0.18);
      const c3 = sub(p, 0.42, 0.18);
      const windowWarm = sub(p, 0.05, 0.55);
      const room = sub(p, 0.5, 0.5);
      const cat = sub(p, 0.58, 0.2);
      const pools = (c1 + c2 + c3) / 3;
      return [
        // Candle flames on the shelf — tight halo on the wall behind, hot
        // core at the wick. Tighter and brighter than the first pass so the
        // corners stay dark and the light means something.
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
  },
};
