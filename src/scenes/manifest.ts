/// <reference types="vite/client" />
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
 * are screen-blend strengths — 0.35 on a dark wall reads as a candle's
 * halo; 0.05 over the whole frame reads as a room warming. Lessons from
 * the Cottage: keep whole-frame lights at or below 0.06 and haze density
 * at or below 0.05, or the dark corners go milky and the light stops
 * meaning anything.
 *
 * One file per scene in ./manifests/<sceneKey>.ts, default-exporting a
 * SceneManifest. Auto-registered by filename, so parallel scene work
 * never touches a shared file. Scenes without a manifest get no layer.
 */

import type { SceneKey } from "../types";

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
  /** Vertical squash: 1 = round, 3 = flat pool on a floor. Values below
   *  1 stretch the light vertically (a column of water, a beam). */
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
  /** Up to 24. */
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
  /** Up to 12 lights. */
  lights: (p: number) => GlowLight[];
  haze?: (p: number) => GlowHaze | null;
  motes?: (p: number) => GlowMotes | null;
  /** Film grain strength 0–0.1. */
  grain: number;
}

const modules = import.meta.glob<{ default: SceneManifest }>("./manifests/*.ts", { eager: true });

export const SCENE_MANIFESTS: Partial<Record<SceneKey, SceneManifest>> = {};
for (const [path, mod] of Object.entries(modules)) {
  const key = path.replace(/^\.\/manifests\//, "").replace(/\.ts$/, "") as SceneKey;
  SCENE_MANIFESTS[key] = mod.default;
}
