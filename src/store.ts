import { create } from "zustand";
import { LEVELS, ACT_RANGES, samplePrompts, shouldShufflePrompts } from "./levels";
import { consumeReturnTo } from "./v2";
import type { Screen } from "./types";

// ── localStorage persistence ──
const SAVE_KEY = "inkwood-save";
const COMPLETED_KEY = "inkwood-completed";

interface SaveData {
  lvl: number;
  promptIdx: number;
  activePrompts?: string[]; // v2+ — phrases chosen from pool for this run
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (typeof data.lvl === "number" && data.lvl >= 0 && data.lvl < LEVELS.length) {
      return data;
    }
  } catch { /* ignore corrupt saves */ }
  return null;
}

function writeSave(lvl: number, promptIdx: number, activePrompts: string[]) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ lvl, promptIdx, activePrompts }));
  } catch { /* storage full or blocked */ }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* ignore */ }
}

/** Check if completing this level ends an act */
function isActBoundary(lvl: number): boolean {
  return ACT_RANGES.some(([, end]) => lvl === end) && lvl + 1 < LEVELS.length;
}

// ── Determine initial screen ──
const saved = loadSave();
// Switching editions reloads the page with a marker saying where the
// player was; land them back there. Screens that need a completed game
// fall back to the intro if there isn't one.
const marker = consumeReturnTo();
const returnToWander = marker?.screen === "wander" && loadCompleted();
const returnToOutro = marker?.screen === "outro" && loadCompleted();
const returnToPlaying = marker?.screen === "playing";
const initialScreen: Screen = returnToWander
  ? "wander"
  : returnToOutro
    ? "outro"
    : returnToPlaying
      ? "playing"
      : saved && saved.lvl > 0
        ? "playing"
        : "intro";
const clampLvl = (n: number) => Math.max(0, Math.min(LEVELS.length - 1, n));
const initialLvl = returnToPlaying ? clampLvl(marker?.lvl ?? saved?.lvl ?? 0) : (saved?.lvl ?? 0);
const initialPromptIdx = returnToPlaying ? (marker?.promptIdx ?? 0) : (saved?.promptIdx ?? 0);
// If the save has active prompts from a previous session, honor them so
// mid-level reload doesn't swap the phrase out from under the player.
// Otherwise sample fresh.
const initialActivePrompts: string[] = saved?.activePrompts
  && Array.isArray(saved.activePrompts)
  && saved.activePrompts.length === LEVELS[initialLvl].prompts.length
  ? saved.activePrompts
  : samplePrompts(initialLvl, shouldShufflePrompts());

interface GameState {
  screen: Screen;
  lvl: number;
  promptIdx: number;
  typed: string;
  completing: boolean;
  /** Phrases chosen from each slot's pool at level entry. */
  activePrompts: string[];
  /** Set once the player has completed the game at least once. Unlocks
   *  Wander mode and surfaces the chapter-select affordance. Persists
   *  across sessions. */
  hasCompleted: boolean;
  /** True while the player is in free-play Wander mode. Completing a
   *  level in this mode returns to the wander screen rather than
   *  advancing through the sequential flow. */
  isWandering: boolean;

  // Derived helpers
  level: () => typeof LEVELS[number];
  target: () => string;
  totalPrompts: () => number;
  levelProgress: () => number;
  isComplete: () => boolean;

  // Actions
  setScreen: (screen: Screen) => void;
  typeChar: (value: string) => void;
  startCompletion: () => void;
  advancePrompt: () => void;
  advanceLevel: () => void;
  startGame: () => void;
  restart: () => void;
  jumpToLevel: (lvl: number) => void;
  enterWander: () => void;
  wanderToLevel: (lvl: number) => void;
}

function loadCompleted(): boolean {
  try { return localStorage.getItem(COMPLETED_KEY) === "1"; } catch { return false; }
}

function writeCompleted() {
  try { localStorage.setItem(COMPLETED_KEY, "1"); } catch { /* ignore */ }
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: initialScreen,
  lvl: initialLvl,
  promptIdx: initialPromptIdx,
  typed: "",
  completing: false,
  activePrompts: initialActivePrompts,
  hasCompleted: loadCompleted(),
  isWandering: returnToWander,

  level: () => LEVELS[get().lvl],
  target: () => {
    const { activePrompts, promptIdx } = get();
    return activePrompts[promptIdx] ?? "";
  },
  totalPrompts: () => get().activePrompts.length,
  levelProgress: () => {
    const { promptIdx, typed } = get();
    const target = get().target();
    const total = get().totalPrompts();
    if (target.length === 0) return 0;
    const promptProgress = typed.length / target.length;
    return (promptIdx + promptProgress) / total;
  },
  isComplete: () => {
    const target = get().target();
    return target.length > 0 && get().typed === target;
  },

  setScreen: (screen) => set({ screen }),

  typeChar: (value) => {
    const { typed, completing } = get();
    const target = get().target();
    if (completing) return;
    // Backspace / shortening — always allowed so players can correct.
    if (value.length < typed.length) {
      set({ typed: value });
      return;
    }
    // Forward motion — only accept if the new character matches the target.
    // Wrong keystrokes are dropped silently; the scene doesn't advance.
    if (value.length > typed.length && value.length <= target.length) {
      const nextChar = value[value.length - 1];
      const expected = target[typed.length];
      if (nextChar === expected) {
        set({ typed: value });
      }
    }
  },

  startCompletion: () => set({ completing: true }),

  advancePrompt: () => {
    const { promptIdx, lvl, activePrompts, isWandering } = get();
    const total = activePrompts.length;

    if (promptIdx + 1 < total) {
      const nextIdx = promptIdx + 1;
      set({ promptIdx: nextIdx, typed: "", completing: false });
      if (!isWandering) writeSave(lvl, nextIdx, activePrompts);
    } else if (isWandering) {
      // Wander mode: a completed level returns to the chapter select
      // without touching the sequential save or advancing the story.
      set({ screen: "wander", typed: "", completing: false });
    } else if (lvl + 1 < LEVELS.length) {
      if (isActBoundary(lvl)) {
        set({ screen: "actTransition" });
      } else {
        set({ screen: "levelWin" });
      }
    } else {
      clearSave();
      writeCompleted();
      set({ screen: "outro", hasCompleted: true });
    }
  },

  advanceLevel: () => {
    const { lvl } = get();
    const nextLvl = lvl + 1;
    const fresh = samplePrompts(nextLvl, shouldShufflePrompts());
    set({
      lvl: nextLvl,
      promptIdx: 0,
      typed: "",
      completing: false,
      screen: "playing",
      activePrompts: fresh,
    });
    writeSave(nextLvl, 0, fresh);
  },

  startGame: () => {
    const fresh = samplePrompts(0, shouldShufflePrompts());
    set({
      lvl: 0,
      promptIdx: 0,
      typed: "",
      completing: false,
      screen: "playing",
      activePrompts: fresh,
      isWandering: false,
    });
    writeSave(0, 0, fresh);
  },

  restart: () => {
    const fresh = samplePrompts(0, shouldShufflePrompts());
    clearSave();
    set({
      lvl: 0,
      promptIdx: 0,
      typed: "",
      completing: false,
      screen: "intro",
      activePrompts: fresh,
      isWandering: false,
    });
  },

  jumpToLevel: (lvl: number) => {
    if (lvl >= 0 && lvl < LEVELS.length) {
      const fresh = samplePrompts(lvl, shouldShufflePrompts());
      set({
        lvl,
        promptIdx: 0,
        typed: "",
        completing: false,
        screen: "playing",
        activePrompts: fresh,
        isWandering: false,
      });
      writeSave(lvl, 0, fresh);
    }
  },

  /** Enter the free-play chapter-select screen. Does not touch the
   *  sequential save — a mid-game player can wander and return later. */
  enterWander: () => {
    set({ screen: "wander", isWandering: true, typed: "", completing: false });
  },

  /** Jump into a specific chapter from the wander screen. Unlike
   *  jumpToLevel, this preserves isWandering so level-end returns to
   *  the chapter select. */
  wanderToLevel: (lvl: number) => {
    if (lvl >= 0 && lvl < LEVELS.length) {
      const fresh = samplePrompts(lvl, shouldShufflePrompts());
      set({
        lvl,
        promptIdx: 0,
        typed: "",
        completing: false,
        screen: "playing",
        activePrompts: fresh,
        isWandering: true,
      });
    }
  },
}));
