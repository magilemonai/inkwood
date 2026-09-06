/**
 * Inkwood's two editions.
 *
 * Inkwood Classic (April 2026) and Inkwood 2 (September 2026: the redrawn
 * scenes, the rewritten story, the light layer, the typing feel, the
 * tween) are both first-class. The title screen offers a Begin for each,
 * and a pinned toggle on every screen switches between them at any point
 * (director's ruling 2026-09-06), keeping the player's place.
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
const SAVE_KEY = "inkwood-save";
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

if (!enabled) trackGateActive("classic");

export function isV2Enabled(): boolean {
  return enabled;
}

/** Persists the choice; takes effect on the next page load. */
export function setV2Enabled(on: boolean) {
  try { localStorage.setItem(V2_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

/** Where to land after the reload that switches editions. */
export interface ReturnMarker {
  screen: "intro" | "playing" | "outro" | "wander";
  /** For "playing": the level and phrase to resume at. */
  lvl?: number;
  promptIdx?: number;
  /** For "playing": start a fresh game at level 0 (the title-screen Begin). */
  fresh?: boolean;
}

/**
 * Switch editions and reload to the given place. For "playing", the save
 * is rewritten with only the level and phrase index so the store samples
 * that edition's own phrasing for the level (the two editions' phrases
 * differ), and the player keeps their place in the story.
 */
export function switchEdition(on: boolean, marker: ReturnMarker) {
  setV2Enabled(on);
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify(marker));
    if (marker.screen === "playing") {
      if (marker.fresh) localStorage.removeItem(SAVE_KEY);
      else localStorage.setItem(SAVE_KEY, JSON.stringify({ lvl: marker.lvl ?? 0, promptIdx: marker.promptIdx ?? 0 }));
    }
  } catch { /* ignore */ }
  // A `?v2` or `?classic` deep link would outrank the stored choice on
  // the next load, so strip those and keep everything else (dev, canonical…).
  const url = new URL(window.location.href);
  url.searchParams.delete("v2");
  url.searchParams.delete("classic");
  window.location.replace(url.toString());
}

/** Read-and-clear the boot marker set by switchEdition. */
export function consumeReturnTo(): ReturnMarker | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(RETURN_KEY);
    const m = JSON.parse(raw) as ReturnMarker;
    return m && typeof m.screen === "string" ? m : null;
  } catch {
    return null;
  }
}
