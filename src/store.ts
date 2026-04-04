import { create } from "zustand";
import { LEVELS } from "./levels";
import type { Screen } from "./types";

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
  restart: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: "title",
  lvl: 0,
  promptIdx: 0,
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
    const { completing } = get();
    const target = get().target();
    if (completing) return;
    if (value.length <= target.length) {
      set({ typed: value });
    }
  },

  startCompletion: () => set({ completing: true }),

  advancePrompt: () => {
    const { promptIdx, lvl } = get();
    const total = get().totalPrompts();
    if (promptIdx + 1 < total) {
      set({ promptIdx: promptIdx + 1, typed: "", completing: false });
    } else if (lvl + 1 < LEVELS.length) {
      set({ screen: "levelWin" });
    } else {
      set({ screen: "gameWin" });
    }
  },

  advanceLevel: () => {
    const { lvl } = get();
    set({
      lvl: lvl + 1,
      promptIdx: 0,
      typed: "",
      completing: false,
      screen: "playing",
    });
  },

  restart: () =>
    set({
      lvl: 0,
      promptIdx: 0,
      typed: "",
      completing: false,
      screen: "title",
    }),
}));
