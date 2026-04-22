import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore, loadSave } from "./store";
import { LEVELS } from "./levels";

const SAVE_KEY = "inkwood-save";

function resetStore() {
  useGameStore.setState({
    screen: "intro",
    lvl: 0,
    promptIdx: 0,
    typed: "",
    completing: false,
  });
}

describe("typeChar", () => {
  beforeEach(() => {
    resetStore();
  });

  it("accepts a correct single keystroke", () => {
    const target = useGameStore.getState().target();
    expect(target.length).toBeGreaterThan(0);
    useGameStore.getState().typeChar(target[0]);
    expect(useGameStore.getState().typed).toBe(target[0]);
  });

  it("rejects an incorrect keystroke silently", () => {
    const target = useGameStore.getState().target();
    const wrong = target[0] === "x" ? "y" : "x";
    useGameStore.getState().typeChar(wrong);
    expect(useGameStore.getState().typed).toBe("");
  });

  it("accepts a matching paste of many chars at once", () => {
    const target = useGameStore.getState().target();
    const pasted = target.slice(0, 3);
    useGameStore.getState().typeChar(pasted);
    expect(useGameStore.getState().typed).toBe(pasted);
  });

  it("accepts only the matching prefix of a partial paste", () => {
    const target = useGameStore.getState().target();
    const good = target.slice(0, 2);
    const bad = good + (target[2] === "Z" ? "Q" : "Z") + "extra";
    useGameStore.getState().typeChar(bad);
    expect(useGameStore.getState().typed).toBe(good);
  });

  it("rejects input longer than target with mismatched tail", () => {
    const target = useGameStore.getState().target();
    const tooLong = target + "xxx";
    useGameStore.getState().typeChar(tooLong);
    // Every target char matches so we accept the whole target prefix,
    // but the trailing x's are dropped.
    expect(useGameStore.getState().typed).toBe(target);
  });

  it("allows backspace to shorten typed", () => {
    const target = useGameStore.getState().target();
    useGameStore.setState({ typed: target.slice(0, 3) });
    useGameStore.getState().typeChar(target.slice(0, 1));
    expect(useGameStore.getState().typed).toBe(target.slice(0, 1));
  });

  it("ignores input while completing", () => {
    useGameStore.setState({ completing: true, typed: "" });
    const target = useGameStore.getState().target();
    useGameStore.getState().typeChar(target[0]);
    expect(useGameStore.getState().typed).toBe("");
  });

  it("ignores no-op with same-length value", () => {
    const target = useGameStore.getState().target();
    useGameStore.setState({ typed: target.slice(0, 2) });
    useGameStore.getState().typeChar(target.slice(0, 2));
    expect(useGameStore.getState().typed).toBe(target.slice(0, 2));
  });
});

describe("derived state", () => {
  beforeEach(resetStore);

  it("isComplete true only when typed === target", () => {
    const target = useGameStore.getState().target();
    expect(useGameStore.getState().isComplete()).toBe(false);
    useGameStore.setState({ typed: target });
    expect(useGameStore.getState().isComplete()).toBe(true);
  });

  it("levelProgress reflects prompt index + typed fraction", () => {
    const total = useGameStore.getState().totalPrompts();
    const target = useGameStore.getState().target();
    useGameStore.setState({ promptIdx: 0, typed: target.slice(0, Math.floor(target.length / 2)) });
    const progress = useGameStore.getState().levelProgress();
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1 / total);
  });
});

describe("loadSave validation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function rawSave(value: string) {
    localStorage.setItem(SAVE_KEY, value);
  }

  it("returns null when no save exists", () => {
    expect(loadSave()).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    rawSave("not-json");
    expect(loadSave()).toBeNull();
  });

  it("returns null when top-level is not an object", () => {
    rawSave(JSON.stringify(42));
    expect(loadSave()).toBeNull();
    rawSave(JSON.stringify(null));
    expect(loadSave()).toBeNull();
    rawSave(JSON.stringify("hello"));
    expect(loadSave()).toBeNull();
  });

  it("rejects out-of-range lvl", () => {
    rawSave(JSON.stringify({ lvl: 999, promptIdx: 0 }));
    expect(loadSave()).toBeNull();
    rawSave(JSON.stringify({ lvl: -1, promptIdx: 0 }));
    expect(loadSave()).toBeNull();
  });

  it("rejects out-of-range promptIdx", () => {
    const lvl = 0;
    const tooBig = LEVELS[lvl].prompts.length + 5;
    rawSave(JSON.stringify({ lvl, promptIdx: tooBig }));
    expect(loadSave()).toBeNull();
    rawSave(JSON.stringify({ lvl, promptIdx: -1 }));
    expect(loadSave()).toBeNull();
  });

  it("rejects non-integer fields", () => {
    rawSave(JSON.stringify({ lvl: 1.5, promptIdx: 0 }));
    expect(loadSave()).toBeNull();
    rawSave(JSON.stringify({ lvl: "1", promptIdx: 0 }));
    expect(loadSave()).toBeNull();
    rawSave(JSON.stringify({ lvl: 1, promptIdx: null }));
    expect(loadSave()).toBeNull();
  });

  it("accepts a valid save", () => {
    rawSave(JSON.stringify({ lvl: 1, promptIdx: 0 }));
    expect(loadSave()).toEqual({ lvl: 1, promptIdx: 0 });
  });
});
