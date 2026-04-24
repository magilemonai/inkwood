import { describe, it, expect } from "vitest";
import { sub } from "../scenes/util";
import { getActIndex, ACT_RANGES, LEVELS } from "../levels";

describe("sub() — clamp progress into a sub-range", () => {
  it("returns 0 before the start", () => {
    expect(sub(0, 0.3, 0.2)).toBe(0);
    expect(sub(0.29, 0.3, 0.2)).toBe(0);
  });

  it("returns 1 after the end", () => {
    expect(sub(0.6, 0.3, 0.2)).toBe(1);
    expect(sub(1, 0.3, 0.2)).toBe(1);
  });

  it("interpolates linearly inside the range", () => {
    expect(sub(0.4, 0.3, 0.2)).toBeCloseTo(0.5, 5);
    expect(sub(0.35, 0.3, 0.2)).toBeCloseTo(0.25, 5);
  });
});

describe("getActIndex", () => {
  it("matches the declared act ranges", () => {
    for (let lvl = 0; lvl < LEVELS.length; lvl++) {
      const actIdx = getActIndex(lvl);
      const [a, b] = ACT_RANGES[actIdx];
      expect(lvl).toBeGreaterThanOrEqual(a);
      expect(lvl).toBeLessThanOrEqual(b);
    }
  });

  it("returns a valid act for every level index", () => {
    for (let lvl = 0; lvl < LEVELS.length; lvl++) {
      expect(getActIndex(lvl)).toBeGreaterThanOrEqual(0);
      expect(getActIndex(lvl)).toBeLessThan(ACT_RANGES.length);
    }
  });
});

describe("LEVELS shape", () => {
  it("has 10 levels", () => {
    expect(LEVELS.length).toBe(10);
  });

  it("every level has non-empty prompts", () => {
    for (const level of LEVELS) {
      expect(level.prompts.length).toBeGreaterThan(0);
      for (const p of level.prompts) {
        expect(typeof p).toBe("string");
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });
});
