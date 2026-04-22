import { create } from "zustand";
import { LEVELS, ACT_RANGES } from "./levels";
import type { Screen } from "./types";

// ── localStorage persistence ──
const SAVE_KEY = "inkwood-save";

interface SaveData {
  lvl: number;
  promptIdx: number;
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const { lvl, promptIdx } = data as { lvl?: unknown; promptIdx?: unknown };
    if (!Number.isInteger(lvl) || !Number.isInteger(promptIdx)) return null;
    const l = lvl as number;
    const p = promptIdx as number;
    if (l < 0 || l >= LEVELS.length) return null;
    if (p < 0 || p >= LEVELS[l].prompts.length) return null;
    return { lvl: l, promptIdx: p };
  } catch { /* ignore corrupt saves */ }
  return null;
}

function writeSave(lvl: number, promptIdx: number) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ lvl, promptIdx }));
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
const initialScreen: Screen = saved && saved.lvl > 0 ? "playing" : "intro";
const initialLvl = saved?.lvl ?? 0;
const initialPromptIdx = saved?.promptIdx ?? 0;

interface GameState {
  screen: Screen;
  lvl: number;
  promptIdx: number;
  typed: string;
  completing: boolean;

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
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: initialScreen,
  lvl: initialLvl,
  promptIdx: initialPromptIdx,
  typed: "",
  completing: false,

  level: () => LEVELS[get().lvl],
  target: () => {
    const { lvl, promptIdx } = get();
    return LEVELS[lvl].prompts[promptIdx] ?? "";
  },
  totalPrompts: () => LEVELS[get().lvl].prompts.length,
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
    if (value.length === typed.length) return;
    // Forward motion — may be one keystroke or a paste of many chars.
    // Walk the new chars against the target and accept the longest
    // prefix that matches. Anything beyond a mismatch (or past the
    // target length) is dropped silently.
    const maxCheck = Math.min(value.length, target.length);
    let accepted = typed.length;
    for (let i = typed.length; i < maxCheck; i++) {
      if (value[i] !== target[i]) break;
      accepted = i + 1;
    }
    if (accepted > typed.length) {
      set({ typed: target.slice(0, accepted) });
    }
  },

  startCompletion: () => set({ completing: true }),

  advancePrompt: () => {
    const { promptIdx, lvl } = get();
    const total = get().totalPrompts();
    if (promptIdx + 1 < total) {
      const nextIdx = promptIdx + 1;
      set({ promptIdx: nextIdx, typed: "", completing: false });
      writeSave(lvl, nextIdx);
    } else if (lvl + 1 < LEVELS.length) {
      if (isActBoundary(lvl)) {
        set({ screen: "actTransition" });
      } else {
        set({ screen: "levelWin" });
      }
    } else {
      clearSave();
      set({ screen: "outro" });
    }
  },

  advanceLevel: () => {
    const { lvl } = get();
    const nextLvl = lvl + 1;
    set({
      lvl: nextLvl,
      promptIdx: 0,
      typed: "",
      completing: false,
      screen: "playing",
    });
    writeSave(nextLvl, 0);
  },

  startGame: () => {
    set({
      lvl: 0,
      promptIdx: 0,
      typed: "",
      completing: false,
      screen: "playing",
    });
    writeSave(0, 0);
  },

  restart: () => {
    clearSave();
    set({
      lvl: 0,
      promptIdx: 0,
      typed: "",
      completing: false,
      screen: "intro",
    });
  },

  jumpToLevel: (lvl: number) => {
    if (lvl >= 0 && lvl < LEVELS.length) {
      set({
        lvl,
        promptIdx: 0,
        typed: "",
        completing: false,
        screen: "playing",
      });
      writeSave(lvl, 0);
    }
  },
}));
