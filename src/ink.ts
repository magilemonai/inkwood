/**
 * The Ink — data + gate + event bus.
 *
 * When the player types, the letter they just wrote releases a mote of
 * luminous ink that arcs from the prompt box up into the scene, landing
 * where the awakening is happening. The written word is the ink source —
 * the one anchor visible on every platform (no cursor concept needed,
 * which is what makes this work on mobile).
 *
 * PROTOTYPE GATE: off by default. Enable with `?ink`, the F2 dev-panel
 * toggle, or localStorage inkwood-ink=1.
 *
 * INK_FOCUS maps each scene to one landing point per phrase, in the
 * scene's viewBox coordinates (0 0 400 250). These are director-tunable:
 * the point should be where that phrase's transformation visibly begins.
 */

import type { SceneKey } from "./types";

const INK_KEY = "inkwood-ink";
const DEFAULT_ENABLED = false;

let enabled: boolean = (() => {
  if (typeof window === "undefined") return DEFAULT_ENABLED;
  try {
    if (new URLSearchParams(window.location.search).has("ink")) return true;
    const stored = localStorage.getItem(INK_KEY);
    if (stored !== null) return stored === "1";
  } catch { /* ignore */ }
  return DEFAULT_ENABLED;
})();

export function isInkEnabled(): boolean {
  return enabled;
}

export function setInkEnabled(on: boolean) {
  enabled = on;
  try { localStorage.setItem(INK_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

/** Landing point per phrase, [x, y] in viewBox space (400×250).
 *  Ordered by promptIdx; phrases beyond the list reuse the last entry. */
export const INK_FOCUS: Record<SceneKey, [number, number][]> = {
  garden: [[120, 165], [210, 150]],   // roots at the trunk base → the flower beds
  cottage: [[262, 85], [200, 100]],   // the shelf candles → the heart of the room
  stars: [[200, 55], [280, 45]],      // the constellation field → toward the moon
  well: [[200, 150], [200, 60]],      // the underground water → the well mouth
  bridge: [[200, 70], [200, 55]],     // the assembling arch → the lantern row
  library: [[200, 120], [200, 78]],   // the opening tome → the rising voice rays
  stones: [[200, 112], [200, 140]],   // the standing ring → the ley lines below
  sanctum: [[200, 130], [200, 120]],  // the moonlit clearing → the spirit circle
  tree: [[200, 158], [200, 42], [200, 100]], // roots → canopy → the heart
  world: [[70, 135], [260, 105], [200, 82]], // garden+hearth → stars+spirits → the tree
};

export function inkFocusFor(scene: SceneKey, promptIdx: number): [number, number] {
  const list = INK_FOCUS[scene];
  return list[Math.min(promptIdx, list.length - 1)] ?? [200, 100];
}

/** Is the character at index i the last letter of a word? (Trailing
 *  punctuation like the comma in "now," doesn't count as the word.) */
const SOUNDING = /[a-z0-9]/i;
export function isWordEndAt(text: string, i: number): boolean {
  if (!SOUNDING.test(text[i] ?? "")) return false;
  return i + 1 >= text.length || !SOUNDING.test(text[i + 1]);
}

// ── Mote event bus (module-level, one overlay listener) ──

export interface InkEmit {
  /** Index of the just-accepted character in the target phrase. */
  charIndex: number;
}

type InkListener = (e: InkEmit) => void;
const listeners = new Set<InkListener>();

export function subscribeInk(fn: InkListener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Fire on every accepted forward keystroke. No-op when the gate is
 *  off or nothing is listening. */
export function emitInk(e: InkEmit) {
  if (!enabled) return;
  listeners.forEach((fn) => fn(e));
}
