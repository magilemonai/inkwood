/**
 * Living Seasons — the forest matches the player's real calendar.
 *
 * A quiet particle layer drifts over outdoor scenes, keyed to the
 * player's actual season: spring pollen rising, summer fireflies,
 * autumn leaf-fall, winter snow-hush. Same spirit as the daily prompt
 * rotation — the world is alive on the calendar, so replays feel new
 * across the year.
 *
 * PROTOTYPE GATE: off by default. Enable with `?seasons` (current
 * season), `?season=winter|spring|summer|autumn` (forced, for taste
 * testing), the F2 dev-panel toggle, or localStorage inkwood-seasons=1.
 *
 * Interior scenes (cottage, library) opt out — snow indoors would
 * break the fiction. The well only weathers above ground.
 */

import type { SceneKey } from "./types";

export type Season = "spring" | "summer" | "autumn" | "winter";

const SEASONS_KEY = "inkwood-seasons";
const DEFAULT_ENABLED = false;

/** Northern-hemisphere month mapping. */
export function currentSeason(date: Date = new Date()): Season {
  const m = date.getMonth(); // 0-11
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

const VALID_SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

function readGate(): { enabled: boolean; override: Season | null } {
  if (typeof window === "undefined") return { enabled: DEFAULT_ENABLED, override: null };
  try {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("season");
    if (forced && VALID_SEASONS.includes(forced as Season)) {
      return { enabled: true, override: forced as Season };
    }
    if (params.has("seasons")) return { enabled: true, override: null };
    const stored = localStorage.getItem(SEASONS_KEY);
    if (stored !== null) return { enabled: stored === "1", override: null };
  } catch { /* ignore */ }
  return { enabled: DEFAULT_ENABLED, override: null };
}

let gate = readGate();

export function isSeasonsEnabled(): boolean {
  return gate.enabled;
}

export function setSeasonsEnabled(on: boolean) {
  gate = { ...gate, enabled: on };
  try { localStorage.setItem(SEASONS_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

/** The season to render right now, or null when the layer is off. */
export function activeSeason(): Season | null {
  if (!gate.enabled) return null;
  return gate.override ?? currentSeason();
}

// ── Per-season particle character ──

export interface SeasonParticleSpec {
  colors: string[];
  count: number;
  sizeRange: [number, number];
  speedRange: [number, number];
  driftX: number;
  driftY: number;
  lifeRange: [number, number];
  opacity: number;
}

export const SEASON_PARTICLES: Record<Season, SeasonParticleSpec> = {
  spring: {
    // Pollen and seed-fluff rising on warm air.
    colors: ["#d8e8a0", "#c0d890", "#e8e0b0"],
    count: 14, sizeRange: [0.6, 1.3], speedRange: [2, 4],
    driftX: 2, driftY: -6, lifeRange: [6, 10], opacity: 0.4,
  },
  summer: {
    // Fireflies — few, slow, warm. The blink comes from the fade cycle.
    colors: ["#e8d878", "#d8c860", "#f0e090"],
    count: 9, sizeRange: [0.9, 1.7], speedRange: [1, 3],
    driftX: 0, driftY: -3, lifeRange: [3, 7], opacity: 0.55,
  },
  autumn: {
    // Leaf-fall with a sideways wind lean.
    colors: ["#c88a3a", "#b06a2a", "#d8a04a"],
    count: 13, sizeRange: [1.0, 2.0], speedRange: [3, 6],
    driftX: 5, driftY: 9, lifeRange: [5, 9], opacity: 0.5,
  },
  winter: {
    // Snow-hush — the densest layer, the gentlest fall.
    colors: ["#e8f0f8", "#c8d8e8", "#ffffff"],
    count: 26, sizeRange: [0.7, 1.6], speedRange: [2, 5],
    driftX: 1, driftY: 7, lifeRange: [6, 12], opacity: 0.5,
  },
};

/** Where weather may fall, per scene, in viewBox coords. Null = the
 *  scene is interior and takes no weather at all. */
export const SEASON_BOUNDS: Record<SceneKey, { x: number; y: number; width: number; height: number } | null> = {
  garden: { x: 0, y: 0, width: 400, height: 145 },
  cottage: null, // indoors
  stars: { x: 0, y: 0, width: 400, height: 145 },
  well: { x: 0, y: 0, width: 400, height: 85 }, // above ground only
  bridge: { x: 0, y: 0, width: 400, height: 145 },
  library: null, // cavern
  stones: { x: 0, y: 0, width: 400, height: 145 },
  sanctum: { x: 0, y: 0, width: 400, height: 145 },
  tree: { x: 0, y: 0, width: 400, height: 145 },
  world: { x: 0, y: 0, width: 400, height: 145 },
};
