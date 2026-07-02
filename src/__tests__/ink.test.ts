import { describe, it, expect } from "vitest";
import { INK_FOCUS, inkFocusFor, isWordEndAt } from "../ink";
import { LEVELS } from "../levels";

describe("INK_FOCUS", () => {
  it("covers every scene with one landing point per canonical phrase", () => {
    for (const level of LEVELS) {
      const focus = INK_FOCUS[level.scene];
      expect(focus, `missing focus list for ${level.scene}`).toBeDefined();
      expect(focus.length).toBeGreaterThanOrEqual(level.prompts.length);
    }
  });

  it("keeps every landing point inside the viewBox and above the typing overlay", () => {
    for (const points of Object.values(INK_FOCUS)) {
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(400);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(170);
      }
    }
  });

  it("clamps promptIdx overflow to the last landing point", () => {
    expect(inkFocusFor("garden", 99)).toEqual(INK_FOCUS.garden[INK_FOCUS.garden.length - 1]);
  });
});

describe("isWordEndAt", () => {
  const phrase = "wake now, sleeping roots";
  it("marks the last letter of each word, skipping trailing punctuation", () => {
    const ends = phrase
      .split("")
      .map((_, i) => (isWordEndAt(phrase, i) ? i : -1))
      .filter((i) => i >= 0)
      .map((i) => phrase[i]);
    // "wake" → e, "now," → w (the comma is silent), "sleeping" → g, "roots" → s
    expect(ends).toEqual(["e", "w", "g", "s"]);
  });

  it("never marks spaces or punctuation", () => {
    expect(isWordEndAt(phrase, phrase.indexOf(","))).toBe(false);
    expect(isWordEndAt(phrase, phrase.indexOf(" "))).toBe(false);
  });
});
