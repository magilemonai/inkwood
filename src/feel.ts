/**
 * The Feel — every keystroke a visible act.
 *
 * Letters ignite as they're accepted, the cursor is a breathing drop of
 * ink under the next glyph, a finished word settles and draws its own
 * underline, a wrong key shivers, and a completed phrase exhales into
 * the 1.5s breath. All of it is CSS keyed on data attributes that
 * PlayingScreen already renders, so it costs no extra React work.
 *
 * PROTOTYPE GATE: off by default. Enable with `?feel`, the F2 dev-panel
 * toggle, or localStorage inkwood-feel=1.
 */

import { trackGateActive } from "./analytics";

const FEEL_KEY = "inkwood-feel";
const DEFAULT_ENABLED = false;

let enabled: boolean = (() => {
  if (typeof window === "undefined") return DEFAULT_ENABLED;
  try {
    if (new URLSearchParams(window.location.search).has("feel")) return true;
    const stored = localStorage.getItem(FEEL_KEY);
    if (stored !== null) return stored === "1";
  } catch { /* ignore */ }
  return DEFAULT_ENABLED;
})();

if (enabled) trackGateActive("feel");

export function isFeelEnabled(): boolean {
  return enabled;
}

export function setFeelEnabled(on: boolean) {
  enabled = on;
  if (on) trackGateActive("feel");
  try { localStorage.setItem(FEEL_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}
