import { describe, it, expect } from "vitest";
import { LEVELS_V1 as LEVELS } from "../levels";
import { LEVELS_V2, ACT_LABELS_V2, JOURNAL_PAGES_V2 } from "../levels2";

/**
 * Inkwood 2's level table must stay shape-compatible with v1: the store,
 * the scene renderer, the ink focus map, the outro, and screenshot.mjs
 * all assume ten levels with the same scene keys in the same order.
 * (In vitest there is no window, so `LEVELS` here is the v1 table.)
 */
describe("levels2 (Inkwood 2 story)", () => {
  it("keeps ten levels with the same scenes, accents, and backgrounds as v1", () => {
    expect(LEVELS_V2).toHaveLength(LEVELS.length);
    LEVELS_V2.forEach((lvl, i) => {
      expect(lvl.scene).toBe(LEVELS[i].scene);
      expect(lvl.accent).toBe(LEVELS[i].accent);
      expect(lvl.bg).toBe(LEVELS[i].bg);
      // screenshot.mjs finds a level by its title in the dev panel.
      expect(lvl.title).toBe(LEVELS[i].title);
    });
  });

  it("keeps the same phrase count per level as v1 (ink focus points are per phrase)", () => {
    LEVELS_V2.forEach((lvl, i) => {
      expect(lvl.prompts).toHaveLength(LEVELS[i].prompts.length);
    });
  });

  it("keeps every prompt at or under 34 characters (the Sanctum lesson)", () => {
    for (const lvl of LEVELS_V2) {
      for (const prompt of lvl.prompts) expect(prompt.length).toBeLessThanOrEqual(34);
      for (const slot of lvl.promptPool ?? []) {
        for (const alt of slot) expect(alt.length).toBeLessThanOrEqual(34);
      }
    }
  });

  it("includes the canonical phrase in every pool slot", () => {
    for (const lvl of LEVELS_V2) {
      if (!lvl.promptPool) continue;
      expect(lvl.promptPool).toHaveLength(lvl.prompts.length);
      lvl.promptPool.forEach((slot, i) => {
        expect(slot).toContain(lvl.prompts[i]);
      });
    }
  });

  it("keeps the journal voice to one sentence of flavor per level", () => {
    for (const lvl of LEVELS_V2) {
      // One terminal period (semicolons and colons allowed inside).
      const sentences = lvl.flavor.split(/[.!?](?:\s|$)/).filter((s) => s.trim().length > 0);
      expect(sentences.length, lvl.flavor).toBe(1);
      expect(lvl.flavor.length).toBeLessThanOrEqual(80);
    }
  });

  it("has four act labels and a journal page for each act boundary", () => {
    expect(ACT_LABELS_V2).toHaveLength(4);
    expect(Object.keys(JOURNAL_PAGES_V2).map(Number).sort()).toEqual([2, 5, 8]);
    for (const page of Object.values(JOURNAL_PAGES_V2)) {
      expect(page.length).toBeLessThanOrEqual(140);
    }
  });

  it("ends on the incantation the outro answers", () => {
    const last = LEVELS_V2[LEVELS_V2.length - 1];
    expect(last.prompts[last.prompts.length - 1]).toBe("the forest remembers");
  });
});
