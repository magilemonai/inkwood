import { describe, it, expect } from "vitest";
import { currentSeason, SEASON_PARTICLES, SEASON_BOUNDS } from "../seasons";
import { LEVELS } from "../levels";
import type { Season } from "../seasons";

describe("currentSeason", () => {
  it("maps months to northern-hemisphere seasons", () => {
    const cases: [string, Season][] = [
      ["2026-01-15", "winter"],
      ["2026-02-28", "winter"],
      ["2026-03-01", "spring"],
      ["2026-05-31", "spring"],
      ["2026-06-01", "summer"],
      ["2026-07-02", "summer"],
      ["2026-09-15", "autumn"],
      ["2026-11-30", "autumn"],
      ["2026-12-25", "winter"],
    ];
    for (const [date, season] of cases) {
      expect(currentSeason(new Date(date + "T12:00:00")), date).toBe(season);
    }
  });
});

describe("SEASON_PARTICLES", () => {
  it("defines all four seasons with sane, quiet densities", () => {
    for (const spec of Object.values(SEASON_PARTICLES)) {
      expect(spec.colors.length).toBeGreaterThan(0);
      expect(spec.count).toBeGreaterThan(0);
      expect(spec.count).toBeLessThanOrEqual(30); // meditative, never a blizzard
      expect(spec.opacity).toBeLessThanOrEqual(0.6); // atmosphere, not spectacle
    }
  });

  it("falls downward in autumn/winter and rises in spring/summer", () => {
    expect(SEASON_PARTICLES.autumn.driftY).toBeGreaterThan(0);
    expect(SEASON_PARTICLES.winter.driftY).toBeGreaterThan(0);
    expect(SEASON_PARTICLES.spring.driftY).toBeLessThan(0);
    expect(SEASON_PARTICLES.summer.driftY).toBeLessThan(0);
  });
});

describe("SEASON_BOUNDS", () => {
  it("covers every scene key, keeping interiors weather-free", () => {
    for (const level of LEVELS) {
      expect(SEASON_BOUNDS[level.scene]).not.toBeUndefined();
    }
    expect(SEASON_BOUNDS.cottage).toBeNull();
    expect(SEASON_BOUNDS.library).toBeNull();
  });

  it("keeps weather inside the viewBox sky", () => {
    for (const bounds of Object.values(SEASON_BOUNDS)) {
      if (!bounds) continue;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(400);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(170);
    }
  });
});
