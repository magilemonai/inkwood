/**
 * Music of Typing — controller.
 *
 * Bridges the pure melody planner (melody.ts) to the audio engine and
 * owns the enable gate.
 *
 * PROTOTYPE GATE: off by default. Enable with `?music` in the URL, the
 * F2 dev panel toggle, or localStorage inkwood-music=1. When disabled,
 * typing falls back to the classic soft click and rejections stay
 * silent — the shipped v1 behavior, untouched. Once the director signs
 * off, flip DEFAULT_ENABLED.
 */

import { planMelody, type MelodyPlan } from "./melody";
import { playMelodyNote, playRejectThud, playResolutionPad, playTypeClick } from "./audio";

const MUSIC_KEY = "inkwood-music";
const DEFAULT_ENABLED = false;

let enabled: boolean = (() => {
  if (typeof window === "undefined") return DEFAULT_ENABLED;
  try {
    if (new URLSearchParams(window.location.search).has("music")) return true;
    const stored = localStorage.getItem(MUSIC_KEY);
    if (stored !== null) return stored === "1";
  } catch { /* ignore */ }
  return DEFAULT_ENABLED;
})();

export function isMusicEnabled(): boolean {
  return enabled;
}

export function setMusicEnabled(on: boolean) {
  enabled = on;
  try { localStorage.setItem(MUSIC_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

// Cache the current phrase's plan — recomputed only when the phrase
// (or act) changes, so per-keystroke work is a single array lookup.
let plan: MelodyPlan | null = null;
let planKey = "";

function ensurePlan(phrase: string, actIndex: number): MelodyPlan {
  const key = `${actIndex}::${phrase}`;
  if (!plan || planKey !== key) {
    plan = planMelody(phrase, actIndex);
    planKey = key;
  }
  return plan;
}

/** An accepted keystroke: play this character's note in the phrase's
 *  melody. Spaces and punctuation stay silent — they are the breath. */
export function soundKeystroke(phrase: string, actIndex: number, charIndex: number) {
  if (!enabled) {
    playTypeClick();
    return;
  }
  const note = ensurePlan(phrase, actIndex).notes[charIndex];
  if (!note || note.freq === null) return;
  playMelodyNote(note.freq, {
    velocity: note.isWordEnd ? 1.15 : 0.9,
    bloomFreq: note.bloomFreq,
  });
}

/** A rejected keystroke: felted thud. Classic mode keeps rejections
 *  silent (visual flash only), matching shipped v1 behavior. */
export function soundRejection() {
  if (!enabled) return;
  playRejectThud();
}

/** Phrase complete — resolve to the tonic chord, ringing through the
 *  1.5s breathing pause. */
export function soundResolution(phrase: string, actIndex: number) {
  if (!enabled) return;
  playResolutionPad(ensurePlan(phrase, actIndex).resolution);
}
