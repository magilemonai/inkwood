/**
 * Inkwood 2 — the master gate.
 *
 * One switch for the whole second elevation so the director can test the
 * candidate future of the game on the live site while players keep the
 * shipped v1.5 experience. When on:
 *   - the Glow (light layer) and the Feel (typing feel) are on,
 *   - levels.ts serves the rewritten story and phrases (levels2.ts),
 *   - SceneRenderer picks redrawn scenes from scenes/v2/ where they exist,
 *   - act cards become journal pages, the outro gains its second line.
 *
 * PROTOTYPE GATE: off by default. Enable with `?v2`, the F2 dev-panel
 * toggle, or localStorage inkwood-v2=1. Read once at module init: the
 * level table is chosen per page load.
 */

import { trackGateActive } from "./analytics";

const V2_KEY = "inkwood-v2";
const DEFAULT_ENABLED = false;

const enabled: boolean = (() => {
  if (typeof window === "undefined") return DEFAULT_ENABLED;
  try {
    if (new URLSearchParams(window.location.search).has("v2")) return true;
    const stored = localStorage.getItem(V2_KEY);
    if (stored !== null) return stored === "1";
  } catch { /* ignore */ }
  return DEFAULT_ENABLED;
})();

if (enabled) trackGateActive("v2");

export function isV2Enabled(): boolean {
  return enabled;
}

/** Persists the choice; takes effect on the next page load (the level
 *  table and scene map are chosen at module init). */
export function setV2Enabled(on: boolean) {
  if (on) trackGateActive("v2");
  try { localStorage.setItem(V2_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}
