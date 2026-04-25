import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store";
import { LEVELS, samplePrompts } from "../levels";

/** Reset the store to a known state, seeding activePrompts from canonical
 *  prompts (shuffle off) so tests are deterministic. */
function resetStore(lvl: number = 0, promptIdx: number = 0) {
  useGameStore.setState({
    screen: "intro",
    lvl,
    promptIdx,
    typed: "",
    completing: false,
    activePrompts: samplePrompts(lvl, false),
    breaths: 0,
  });
}

describe("typeChar — the input gate", () => {
  beforeEach(() => {
    resetStore();
    useGameStore.setState({ screen: "playing" });
  });

  it("accepts correct forward keystrokes", () => {
    const target = useGameStore.getState().target();
    useGameStore.getState().typeChar(target.slice(0, 1));
    expect(useGameStore.getState().typed).toBe(target.slice(0, 1));
    useGameStore.getState().typeChar(target.slice(0, 2));
    expect(useGameStore.getState().typed).toBe(target.slice(0, 2));
  });

  it("drops wrong forward keystrokes silently", () => {
    const target = useGameStore.getState().target();
    useGameStore.getState().typeChar(target[0] + "X"); // wrong second char
    expect(useGameStore.getState().typed).toBe(""); // never advanced past 0
  });

  it("allows backspace at any point", () => {
    const target = useGameStore.getState().target();
    // typeChar accepts one forward char at a time, mirroring an input event.
    for (let i = 1; i <= 3; i++) useGameStore.getState().typeChar(target.slice(0, i));
    expect(useGameStore.getState().typed.length).toBe(3);
    useGameStore.getState().typeChar(target.slice(0, 1));
    expect(useGameStore.getState().typed.length).toBe(1);
  });

  it("refuses input while completing", () => {
    const target = useGameStore.getState().target();
    useGameStore.setState({ typed: target, completing: true });
    useGameStore.getState().typeChar(target + "extra");
    expect(useGameStore.getState().typed).toBe(target);
  });

  it("does not advance past target length", () => {
    const target = useGameStore.getState().target();
    useGameStore.setState({ typed: target });
    useGameStore.getState().typeChar(target + "x");
    expect(useGameStore.getState().typed).toBe(target);
  });
});

describe("levelProgress", () => {
  beforeEach(() => resetStore());

  it("is 0 at start of a level", () => {
    expect(useGameStore.getState().levelProgress()).toBe(0);
  });

  it("reaches ~1 at the end of the last prompt", () => {
    const s = useGameStore.getState();
    const total = s.totalPrompts();
    useGameStore.setState({
      promptIdx: total - 1,
      typed: s.activePrompts[total - 1],
    });
    expect(useGameStore.getState().levelProgress()).toBeCloseTo(1, 5);
  });

  it("interpolates partial progress within a prompt", () => {
    const t = useGameStore.getState().target();
    useGameStore.setState({ typed: t.slice(0, Math.floor(t.length / 2)) });
    const p = useGameStore.getState().levelProgress();
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });
});

describe("advancePrompt", () => {
  beforeEach(() => {
    resetStore();
    useGameStore.setState({ screen: "playing" });
  });

  it("goes to next prompt within a level", () => {
    useGameStore.setState({ typed: useGameStore.getState().activePrompts[0] });
    useGameStore.getState().advancePrompt();
    expect(useGameStore.getState().promptIdx).toBe(1);
    expect(useGameStore.getState().typed).toBe("");
  });

  it("increments breath count each phrase", () => {
    const before = useGameStore.getState().breaths;
    useGameStore.setState({ typed: useGameStore.getState().activePrompts[0] });
    useGameStore.getState().advancePrompt();
    expect(useGameStore.getState().breaths).toBe(before + 1);
  });

  it("transitions to levelWin between levels inside an act", () => {
    const lvl = 1; // Cottage — middle of Act I, not an act boundary
    resetStore(lvl, LEVELS[lvl].prompts.length - 1);
    useGameStore.setState({ screen: "playing" });
    useGameStore.getState().advancePrompt();
    expect(useGameStore.getState().screen).toBe("levelWin");
  });

  it("transitions to actTransition at an act boundary", () => {
    const lvl = 2; // Stars — end of Act I
    resetStore(lvl, LEVELS[lvl].prompts.length - 1);
    useGameStore.setState({ screen: "playing" });
    useGameStore.getState().advancePrompt();
    expect(useGameStore.getState().screen).toBe("actTransition");
  });

  it("transitions to outro on final level completion", () => {
    const lvl = LEVELS.length - 1;
    resetStore(lvl, LEVELS[lvl].prompts.length - 1);
    useGameStore.setState({ screen: "playing" });
    useGameStore.getState().advancePrompt();
    expect(useGameStore.getState().screen).toBe("outro");
  });
});

describe("jumpToLevel", () => {
  beforeEach(() => resetStore());

  it("jumps to a valid level and resets prompt index", () => {
    useGameStore.getState().jumpToLevel(5);
    expect(useGameStore.getState().lvl).toBe(5);
    expect(useGameStore.getState().promptIdx).toBe(0);
    expect(useGameStore.getState().typed).toBe("");
  });

  it("picks fresh active prompts on jump", () => {
    useGameStore.getState().jumpToLevel(6);
    const fresh = useGameStore.getState().activePrompts;
    expect(fresh.length).toBe(LEVELS[6].prompts.length);
    // Each chosen phrase must be present in its slot's pool (or canonical).
    const pool = LEVELS[6].promptPool ?? [LEVELS[6].prompts];
    fresh.forEach((phrase, i) => {
      const slot = pool[i] ?? [LEVELS[6].prompts[i]];
      expect(slot).toContain(phrase);
    });
  });

  it("ignores out-of-range levels", () => {
    useGameStore.setState({ lvl: 3 });
    useGameStore.getState().jumpToLevel(99);
    expect(useGameStore.getState().lvl).toBe(3);
    useGameStore.getState().jumpToLevel(-1);
    expect(useGameStore.getState().lvl).toBe(3);
  });
});

describe("samplePrompts — prompt pool sampling", () => {
  it("returns canonical when shuffle is off", () => {
    for (let lvl = 0; lvl < LEVELS.length; lvl++) {
      expect(samplePrompts(lvl, false)).toEqual(LEVELS[lvl].prompts);
    }
  });

  it("returns one phrase per slot with shuffle on", () => {
    for (let lvl = 0; lvl < LEVELS.length; lvl++) {
      const sampled = samplePrompts(lvl, true);
      expect(sampled.length).toBe(LEVELS[lvl].prompts.length);
      const pool = LEVELS[lvl].promptPool ?? [LEVELS[lvl].prompts];
      sampled.forEach((phrase, i) => {
        const slot = pool[i] ?? [LEVELS[lvl].prompts[i]];
        expect(slot).toContain(phrase);
      });
    }
  });
});
