/**
 * Inkwood 2 — the edition switch.
 *
 * Inkwood 2 is the game (director's ruling 2026-09-06): the redrawn
 * scenes, the rewritten story, the light layer, the typing feel, the
 * tween. Everyone's first experience is the new one. The first edition
 * ("Classic", April 2026) stays playable as a comparison: after a player
 * has finished the game once, the Wander screen offers a toggle between
 * the two, a way to see how far the hands that made it have come.
 *
 * Resolution order, read once per page load (the level table and the
 * scene map are chosen at module init, so switching means a reload):
 *   `?classic` → Classic     `?v2` → Inkwood 2
 *   localStorage inkwood-v2 = "0" | "1"
 *   default: Inkwood 2
 */

import { trackGateActive } from "./analytics";

const V2_KEY = "inkwood-v2";
const RETURN_KEY = "inkwood-return";
const DEFAULT_ENABLED = true;

const enabled: boolean = (() => {
  if (typeof window === "undefined") return DEFAULT_ENABLED;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("classic")) return false;
    if (params.has("v2")) return true;
    const stored = localStorage.getItem(V2_KEY);
    if (stored !== null) return stored === "1";
  } catch { /* ignore */ }
  return DEFAULT_ENABLED;
})();

// Classic is the opt-in now; count those sessions.
if (!enabled) trackGateActive("classic");

export function isV2Enabled(): boolean {
  return enabled;
}

/** Persists the choice; takes effect on the next page load. */
export function setV2Enabled(on: boolean) {
  try { localStorage.setItem(V2_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

/**
 * Switch editions and reload into the Wander screen, so the player lands
 * back on the chapter select in the other edition rather than on the
 * title. The store reads and clears the return marker at boot.
 */
export function switchEdition(on: boolean) {
  setV2Enabled(on);
  try { sessionStorage.setItem(RETURN_KEY, "wander"); } catch { /* ignore */ }
  window.location.reload();
}

/** Read-and-clear the boot marker set by switchEdition. */
export function consumeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    if (v) sessionStorage.removeItem(RETURN_KEY);
    return v;
  } catch {
    return null;
  }
}
