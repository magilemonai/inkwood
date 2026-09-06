/**
 * The Glow — light and air over the hand-drawn scenes.
 *
 * A WebGL layer (three.js, lazy-loaded) sits over the SVG with a screen
 * blend and paints what the flat fills can't: light that falls off from
 * declared sources and flickers, haze that drifts, dust that shows only
 * where the light is, and a whisper of film grain in the dark. The SVG
 * art is untouched; scenes declare their light in scenes/manifest.ts.
 *
 * PROTOTYPE GATE: off by default. Enable with `?glow`, the F2 dev-panel
 * toggle, or localStorage inkwood-glow=1. The three.js chunk loads only
 * when the gate is on, so the live game's first paint is unchanged.
 */

import { trackGateActive } from "./analytics";

const GLOW_KEY = "inkwood-glow";
const DEFAULT_ENABLED = false;

let enabled: boolean = (() => {
  if (typeof window === "undefined") return DEFAULT_ENABLED;
  try {
    if (new URLSearchParams(window.location.search).has("glow")) return true;
    const stored = localStorage.getItem(GLOW_KEY);
    if (stored !== null) return stored === "1";
  } catch { /* ignore */ }
  return DEFAULT_ENABLED;
})();

if (enabled) trackGateActive("glow");

export function isGlowEnabled(): boolean {
  return enabled;
}

export function setGlowEnabled(on: boolean) {
  enabled = on;
  if (on) trackGateActive("glow");
  try { localStorage.setItem(GLOW_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}
